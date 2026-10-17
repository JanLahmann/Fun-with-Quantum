import { describe, expect, it } from 'vitest';
import { handle, type Deps } from '../src/index';
import { IdeaFilter, splitIdea } from '../src/ideas';
import { cleanjibeHelp } from '../src/contexts/cleanjibe/help';
import { systemPrompt } from '../src/prompt';
import { sseEvents } from '../src/anthropic';
import { chunked, claudeStream, fakeClaude, makeCtx, makeEnv } from './fakes';

const T0 = Date.UTC(2026, 9, 17, 12, 0, 0);
const STATE = { surface: 'ios', channel: 'beta', appVersion: '1.0.1', build: 138 };

function setup(parts: string[]) {
  const claude = fakeClaude(() => new Response(chunked(claudeStream(parts)), { status: 200 }));
  const { env, db } = makeEnv({ IDEAS_EXPORT_TOKEN: 'ideas-token' });
  let n = 0;
  const deps: Deps = { now: () => T0, fetch: claude.fetch, uuid: () => `00000000-0000-4000-8000-${String(n++).padStart(12, '0')}` };
  const run = async (r: Request) => {
    const { ctx, settle } = makeCtx();
    const res = await handle(r, env, ctx, deps);
    let text = '';
    if (res.headers.get('Content-Type')?.startsWith('text/event-stream')) {
      for await (const { event, data } of sseEvents(res.body!)) if (event === 'delta') text += JSON.parse(data).t;
    }
    await settle();
    return { res, text };
  };
  const chat = (question: string) => new Request('https://w.example/chat', {
    method: 'POST', headers: { Origin: 'https://cleanjibe.org', 'CF-Connecting-IP': '198.51.100.4', 'Content-Type': 'application/json' },
    body: JSON.stringify({ site: 'cleanjibe', context: 'help', locale: 'de', question, state: STATE }),
  });
  const admin = (path: string, init: RequestInit = {}, token = 'ideas-token') =>
    new Request(`https://w.example${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
  return { run, chat, admin, db };
}

describe('ideas', () => {
  it('the help desk invites ideas; other sites do not get the rule', () => {
    expect(systemPrompt(cleanjibeHelp)[0].text).toContain('[[idea:');
  });

  it('hides the idea line from the rider, logs the answer without it and keeps the idea', async () => {
    const { run, chat, db } = setup(['Danke, gute Idee! Ich habe sie ans Team weitergegeben.\n[', '[id', 'ea: Show wind direction on the ', 'turn page.]]']);
    const { text } = await run(chat('Könnt ihr die Windrichtung auf der Wendeseite zeigen?'));
    expect(text).toBe('Danke, gute Idee! Ich habe sie ans Team weitergegeben.');
    expect(db.rows('SELECT answer FROM messages')[0].answer).toBe(text);
    expect(db.rows('SELECT * FROM ideas')).toMatchObject([{
      summary: 'Show wind direction on the turn page.', words: 'Könnt ihr die Windrichtung auf der Wendeseite zeigen?',
      channel: 'beta', surface: 'ios', app_version: '1.0.1', build: 138, locale: 'de', status: 'new',
    }]);
  });

  it('an answer without an idea streams unchanged, a lone [ included', async () => {
    const { run, chat, db } = setup(['CPH sind [', 'saubere] Wenden pro Stunde.']);
    expect((await run(chat('Was heißt CPH?'))).text).toBe('CPH sind [saubere] Wenden pro Stunde.');
    expect(db.rows('SELECT * FROM ideas')).toEqual([]);
  });

  it('exports and marks behind the token only', async () => {
    const { run, chat, admin } = setup(['Thanks!\n[[idea: Tack detection on the watch.]]']);
    await run(chat('Please add tacks to the watch'));
    expect((await run(admin('/ideas/export', {}, 'wrong'))).res.status).toBe(401);
    const out = await (await run(admin('/ideas/export?status=new&site=cleanjibe'))).res.json() as { ideas: { id: string; summary: string }[] };
    expect(out.ideas.map((i) => i.summary)).toEqual(['Tack detection on the watch.']);
    const id = out.ideas[0].id;
    expect((await run(admin('/ideas/mark', { method: 'POST', body: JSON.stringify({ id, status: 'read' }) }))).res.status).toBe(204);
    const left = await (await run(admin('/ideas/export?status=new'))).res.json() as { ideas: unknown[] };
    expect(left.ideas).toEqual([]);
  });

  it('splits and filters edge cases', async () => {
    expect(splitIdea('a\n[[idea: x <b>]]')).toEqual({ answer: 'a', idea: 'x  b' });
    expect(splitIdea('no idea')).toEqual({ answer: 'no idea', idea: null });
    let out = '';
    const f = new IdeaFilter(async (t) => { out += t; });
    for (const p of ['ok [[', 'id']) await f.push(p);
    await f.flush();
    expect(out).toBe('ok [[id');
  });
});
