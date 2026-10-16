import { describe, expect, it } from 'vitest';
import { handle, type Deps } from '../src/index';
import { appState } from '../src/contexts/cleanjibe/state';
import { cleanjibeHelp } from '../src/contexts/cleanjibe/help';
import { systemPrompt } from '../src/prompt';
import { sseEvents } from '../src/anthropic';
import { chunked, claudeStream, fakeClaude, makeCtx, makeEnv } from './fakes';

const CJ = 'https://cleanjibe.org';
const T0 = Date.UTC(2026, 9, 15, 12, 0, 0);
const STATE = { surface: 'web', channel: 'beta', appVersion: '1.0.1', build: 133, engineVersion: '0.29.0', units: { speed: 'kn', distance: 'km' } };
const ask = (over: Record<string, unknown> = {}) => ({ site: 'cleanjibe', context: 'help', locale: 'de', question: 'Was heißt CPH?', state: STATE, ...over });

function setup() {
  const claude = fakeClaude(() => new Response(chunked(claudeStream(['CPH ', 'heißt …'])), { status: 200 }));
  const { env, db } = makeEnv();
  let n = 0;
  const deps: Deps = { now: () => T0, fetch: claude.fetch, uuid: () => `00000000-0000-4000-8000-${String(n++).padStart(12, '0')}` };
  const run = async (r: Request) => {
    const { ctx, settle } = makeCtx();
    const res = await handle(r, env, ctx, deps);
    if (res.headers.get('Content-Type')?.startsWith('text/event-stream')) for await (const _ of sseEvents(res.body!)) { /* drain */ }
    await settle();
    return res;
  };
  const req = (body: unknown, origin = CJ) => new Request('https://w.example/chat', {
    method: 'POST', headers: { Origin: origin, 'CF-Connecting-IP': '198.51.100.4', 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return { run, req, claude, db };
}

describe('cleanjibe site', () => {
  it('answers cleanjibe.org (and localhost:8000) with the help context and the app state', async () => {
    const { run, req, claude } = setup();
    expect((await run(req(ask()))).status).toBe(200);
    expect((await run(req(ask(), 'http://localhost:8000'))).status).toBe(200);
    const body = claude.calls[0].body;
    expect(body.model).toBe('claude-sonnet-5-5');
    expect(body.messages.at(-1).content).toContain(`<app_state>${JSON.stringify(STATE)}</app_state>`);
    expect(body.system[0].text).toContain('help desk of CleanJibe');
  });

  it('refuses other origins, and other sites on cleanjibe.org', async () => {
    const { run, req } = setup();
    expect((await run(req(ask(), 'https://fun-with-quantum.org'))).status).toBe(403);
    expect((await run(req({ ...ask(), site: 'fwq', context: 'coin-game' }))).status).toBe(403);
  });

  it('20 questions per visitor per day', async () => {
    const { run, req } = setup();
    for (let i = 0; i < 20; i++) expect((await run(req(ask()))).status).toBe(200);
    expect((await run(req(ask()))).status).toBe(429);
  });

  it('is the CleanJibe help desk, not Ket, and names no model or vendor', () => {
    const head = systemPrompt(cleanjibeHelp)[0].text;
    expect(head).toContain('You are the CleanJibe help desk.');
    expect(head).not.toContain('Ket');
    expect(head).toContain('Answer in the language the user\'s question is written in');
  });

  it('keeps known app facts, drops the rest', () => {
    expect(appState({ ...STATE, spot: 'Kiel', units: { speed: 'furlongs', distance: 'nm' }, build: 1.5 }))
      .toEqual({ surface: 'web', channel: 'beta', appVersion: '1.0.1', engineVersion: '0.29.0', units: { distance: 'nm' } });
    expect(appState([1])).toBeNull();
    expect(appState(undefined)).toEqual({});
  });
});
