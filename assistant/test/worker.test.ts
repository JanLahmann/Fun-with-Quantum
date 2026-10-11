import { describe, expect, it } from 'vitest';
import { handle, purge, cleanHistory, type Deps } from '../src/index';
import { addressKey } from '../src/guard';
import { sseEvents } from '../src/anthropic';
import { coinGame } from '../src/contexts/coin-game';
import { chunked, claudeStream, fakeClaude, makeCtx, makeEnv } from './fakes';

const ORIGIN = 'https://fun-with-quantum.org';
const T0 = Date.UTC(2026, 9, 10, 12, 0, 0);
const STATE = {
  game: 'quantum-coin-game', chapter: 2, starter: 'computer', you: 'B',
  lastRound: { moves: ['?', 'X', '?'], outcome: 'heads', winner: 'A', youWin: false },
  score: { you: 0, computer: 3, rounds: 3 }, lastAction: 'round-finished', facts: { pHeads: 1 },
};
const ask = (over: Record<string, unknown> = {}) => ({ site: 'fwq', context: 'coin-game', locale: 'de', question: 'Warum habe ich verloren?', state: STATE, ...over });

function req(path: string, body?: unknown, headers: Record<string, string> = {}, method = 'POST') {
  return new Request(`https://fwq-assistant.example.workers.dev${path}`, {
    method,
    headers: { Origin: ORIGIN, 'CF-Connecting-IP': '203.0.113.7', 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function setup(claude = fakeClaude(() => new Response(chunked(claudeStream(['Der Computer ', 'hat zweimal ', 'gezogen.'])), { status: 200 })), envOver = {}) {
  const { env, db, rl } = makeEnv(envOver);
  let n = 0;
  const deps: Deps = { now: () => T0, fetch: claude.fetch, uuid: () => `00000000-0000-4000-8000-00000000000${n++}` };
  const run = async (r: Request) => {
    const { ctx, settle } = makeCtx();
    const res = await handle(r, env, ctx, deps);
    const events: { event: string; data: any }[] = [];
    if (res.headers.get('Content-Type')?.startsWith('text/event-stream')) {
      for await (const e of sseEvents(res.body!)) events.push({ event: e.event, data: JSON.parse(e.data) });
    }
    await settle();
    return { res, events };
  };
  return { env, db, rl, claude, run };
}

describe('guards', () => {
  it('rejects requests without or with a foreign Origin', async () => {
    const { run, claude } = setup();
    expect((await run(req('/chat', ask(), { Origin: '' }))).res.status).toBe(403);
    expect((await run(req('/chat', ask(), { Origin: 'https://evil.example' }))).res.status).toBe(403);
    expect(claude.calls).toHaveLength(0);
  });

  it('answers the CORS preflight for our origins', async () => {
    const { run } = setup();
    const { res } = await run(req('/chat', undefined, {}, 'OPTIONS'));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
  });

  it.each([
    ['unknown context', ask({ context: 'nope' })],
    ['inherited key as context', ask({ site: 'constructor', context: '' })],
    ['empty question', ask({ question: '   ' })],
    ['question too long', ask({ question: 'x'.repeat(1001) })],
    ['state of another game', ask({ state: { ...STATE, game: 'ghz' } })],
    ['history not alternating', ask({ history: [{ role: 'assistant', content: 'hi' }] })],
    ['history ending with a question', ask({ history: [{ role: 'user', content: 'a' }] })],
    ['not JSON', 'nope{'],
    ['body too large', ask({ question: 'ok', pad: 'x'.repeat(40_000) })],
  ])('400 for %s', async (_name, body) => {
    const { run, claude } = setup();
    expect((await run(req('/chat', body))).res.status).toBe(400);
    expect(claude.calls).toHaveLength(0);
  });

  it('429 when the burst limiter says no', async () => {
    const { run, rl } = setup();
    rl.allow = false;
    expect((await run(req('/chat', ask()))).res.status).toBe(429);
  });

  it('per-visitor daily limit → 429, global daily limit → 503', async () => {
    const v = setup(undefined, { DAILY_VISITOR_LIMIT: '2' });
    for (let i = 0; i < 2; i++) expect((await v.run(req('/chat', ask()))).res.status).toBe(200);
    expect((await v.run(req('/chat', ask()))).res.status).toBe(429);
    expect((await v.run(req('/chat', ask(), { 'CF-Connecting-IP': '198.51.100.1' }))).res.status).toBe(200);

    const g = setup(undefined, { DAILY_GLOBAL_LIMIT: '1' });
    expect((await g.run(req('/chat', ask()))).res.status).toBe(200);
    const { res } = await g.run(req('/chat', ask(), { 'CF-Connecting-IP': '198.51.100.1' }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'busy' });
  });

  it('a visitor over their own limit, or sending bad requests, never eats the global budget', async () => {
    const { run, db } = setup(undefined, { DAILY_VISITOR_LIMIT: '1' });
    for (let i = 0; i < 5; i++) await run(req('/chat', ask()));
    for (let i = 0; i < 5; i++) await run(req('/chat', ask({ question: '' })));
    expect(db.rows("SELECT n FROM quota WHERE key = '*'")).toEqual([{ n: 1 }]);
  });

  it('counts an IPv6 /64 as one visitor', async () => {
    const { run } = setup(undefined, { DAILY_VISITOR_LIMIT: '1' });
    expect((await run(req('/chat', ask(), { 'CF-Connecting-IP': '2001:db8:1:2::1' }))).res.status).toBe(200);
    expect((await run(req('/chat', ask(), { 'CF-Connecting-IP': '2001:db8:1:2:ffff::9' }))).res.status).toBe(429);
    expect((await run(req('/chat', ask(), { 'CF-Connecting-IP': '2001:db8:1:3::1' }))).res.status).toBe(200);
    expect(addressKey('2001:0db8:0001:0002:0000:0000:0000:0001')).toBe('2001:db8:1:2::/64');
    expect(addressKey('::1')).toBe('0:0:0:0::/64');
    expect(addressKey('203.0.113.7')).toBe('203.0.113.7');
  });

  it('rejects an oversized body from Content-Length alone', async () => {
    const { run } = setup();
    expect((await run(req('/chat', ask(), { 'Content-Length': '999999' }))).res.status).toBe(400);
  });

  it('never stores an IP address', async () => {
    const { run, db } = setup();
    await run(req('/chat', ask()));
    const dump = JSON.stringify([db.rows('SELECT * FROM messages'), db.rows('SELECT * FROM quota')]);
    expect(dump).not.toContain('203.0.113.7');
  });
});

describe('chat', () => {
  it('calls Claude with the cached system prompt, the state and the question, and streams the answer', async () => {
    const { run, claude, db } = setup();
    const { res, events } = await run(req('/chat', ask()));
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);

    const [call] = claude.calls;
    expect(call.url).toBe('https://api.anthropic.com/v1/messages');
    expect((call.init.headers as Record<string, string>)['x-api-key']).toBe('test-key');
    expect(call.body).toMatchObject({ model: 'claude-sonnet-5-5', max_tokens: 600, stream: true });
    expect(call.body.system.at(-1).cache_control).toEqual({ type: 'ephemeral' });
    expect(call.body.system.at(-1).text).toBe(coinGame.knowledge);
    expect(call.body.messages).toHaveLength(1);
    const user = call.body.messages[0].content as string;
    expect(user).toContain('<page_language>de</page_language>');
    expect(user).toContain('"moves":["?","X","?"]');
    expect(user).toContain('<question>Warum habe ich verloren?</question>');

    expect(events.filter((e) => e.event === 'delta').map((e) => e.data.t).join('')).toBe('Der Computer hat zweimal gezogen.');
    expect(events.at(-1)).toEqual({ event: 'done', data: { id: '00000000-0000-4000-8000-000000000000', stop: 'end_turn' } });

    const [row] = db.rows('SELECT * FROM messages');
    expect(row).toMatchObject({
      site: 'fwq', context: 'coin-game', locale: 'de', question: 'Warum habe ich verloren?',
      answer: 'Der Computer hat zweimal gezogen.', model: 'claude-sonnet-5-5', stop_reason: 'end_turn', error: null,
      in_tok: 120, out_tok: 42, cache_read_tok: 2048, cache_write_tok: 0, history_turns: 0,
    });
    expect(JSON.parse(row.state_json as string)).toEqual(STATE);
  });

  it('keeps the system prompt identical across requests (cacheable prefix)', async () => {
    const { run, claude } = setup();
    await run(req('/chat', ask()));
    await run(req('/chat', ask({ locale: 'en', question: 'Why?', state: { ...STATE, chapter: 4 } })));
    expect(claude.calls[0].body.system).toEqual(claude.calls[1].body.system);
  });

  it('sends the last MAX_HISTORY_TURNS question/answer pairs, never more than 10', async () => {
    const history = Array.from({ length: 24 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `m${i}` }));
    const five = setup();
    await five.run(req('/chat', ask({ history })));
    const msgs = five.claude.calls[0].body.messages;
    expect(msgs).toHaveLength(11);
    expect(msgs[0]).toEqual({ role: 'user', content: 'm14' });
    expect(five.db.rows('SELECT history_turns FROM messages')[0].history_turns).toBe(5);

    const many = setup(undefined, { MAX_HISTORY_TURNS: '50' });
    await many.run(req('/chat', ask({ history })));
    expect(many.claude.calls[0].body.messages).toHaveLength(21);
  });

  it('502 and a logged error when Claude refuses the call', async () => {
    const { run, db } = setup(fakeClaude(() => new Response('{"type":"error"}', { status: 529 })));
    const { res } = await run(req('/chat', ask()));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'upstream' });
    expect(db.rows('SELECT error, answer FROM messages')).toEqual([{ error: 'http 529', answer: '' }]);
  });

  it('502 with CORS headers when the network call itself fails', async () => {
    const { run, db } = setup({ fetch: (async () => { throw new Error('connect ECONNREFUSED'); }) as unknown as typeof fetch, calls: [] });
    const { res } = await run(req('/chat', ask()));
    expect(res.status).toBe(502);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(db.rows('SELECT error FROM messages')).toEqual([{ error: 'fetch: connect ECONNREFUSED' }]);
  });

  it('a stream that ends without message_stop counts as an error, not an answer', async () => {
    const { run, db } = setup(fakeClaude(() => new Response(chunked(claudeStream(['Halb'], { truncate: true })))));
    const { events } = await run(req('/chat', ask()));
    expect(events.at(-1)).toEqual({ event: 'error', data: { error: 'upstream' } });
    expect(db.rows('SELECT error, answer FROM messages')).toEqual([{ error: 'truncated', answer: 'Halb' }]);
  });

  it('cancels the Claude stream when the player goes away', async () => {
    const probe: { cancelled?: boolean } = {};
    const { env } = makeEnv();
    const claude = fakeClaude(() => new Response(chunked(claudeStream(['a', 'b', 'c', 'd']), 5, probe)));
    const { ctx, settle } = makeCtx();
    const res = await handle(req('/chat', ask()), env, ctx, { now: () => T0, fetch: claude.fetch, uuid: () => '00000000-0000-4000-8000-000000000000' });
    const reader = res.body!.getReader();
    await reader.read();
    await reader.cancel();
    await settle();
    expect(probe.cancelled).toBe(true);
  });

  it('an error mid-stream ends with an error event and is logged with the partial answer', async () => {
    const { run, db } = setup(fakeClaude(() => new Response(chunked(claudeStream(['Teil'], { error: true })))));
    const { events } = await run(req('/chat', ask()));
    expect(events.at(-1)).toEqual({ event: 'error', data: { error: 'upstream' } });
    expect(db.rows('SELECT error, answer FROM messages')).toEqual([{ error: 'overloaded_error', answer: 'Teil' }]);
  });
});

describe('feedback', () => {
  it('stores a vote for a logged answer; a second vote replaces it', async () => {
    const { run, db } = setup();
    const { events } = await run(req('/chat', ask()));
    const id = events.at(-1)!.data.id;
    expect((await run(req('/feedback', { id, vote: 1 }))).res.status).toBe(204);
    expect((await run(req('/feedback', { id, vote: -1 }))).res.status).toBe(204);
    expect(db.rows('SELECT message_id, vote FROM feedback')).toEqual([{ message_id: id, vote: -1 }]);
  });

  it('404 for an unknown id, 400 for a bad vote', async () => {
    const { run } = setup();
    expect((await run(req('/feedback', { id: '00000000-0000-4000-8000-000000000999', vote: 1 }))).res.status).toBe(404);
    expect((await run(req('/feedback', { id: '00000000-0000-4000-8000-000000000999', vote: 2 }))).res.status).toBe(400);
  });
});

describe('retention', () => {
  it('deletes logs older than RETENTION_DAYS and old quota counters', async () => {
    const { env, db } = makeEnv();
    const day = 86_400_000;
    const insert = (id: string, ts: number) =>
      db.db.prepare(`INSERT INTO messages (id, ts, site, context, locale, question, state_json, history_turns, answer, model)
        VALUES (?, ?, 'fwq', 'coin-game', 'en', 'q', '{}', 0, 'a', 'm')`).run(id, ts);
    insert('old', T0 - 31 * day);
    insert('new', T0 - 29 * day);
    db.db.prepare('INSERT INTO feedback VALUES (?, ?, 1)').run('old', T0 - 31 * day);
    db.db.prepare("INSERT INTO quota VALUES ('2026-10-08', '*', 5), ('2026-10-09', '*', 5), ('2026-10-10', '*', 5)").run();
    await purge(env, T0);
    expect(db.rows('SELECT id FROM messages')).toEqual([{ id: 'new' }]);
    expect(db.rows('SELECT * FROM feedback')).toEqual([]);
    expect(db.rows('SELECT day FROM quota ORDER BY day')).toEqual([{ day: '2026-10-09' }, { day: '2026-10-10' }]);
  });
});

describe('helpers', () => {
  it('cleanHistory trims to whole pairs', () => {
    const h = [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }, { role: 'user', content: 'c' }, { role: 'assistant', content: 'd' }];
    expect(cleanHistory(h, 1)).toEqual(h.slice(2));
    expect(cleanHistory(undefined, 5)).toEqual([]);
    expect(cleanHistory([{ role: 'user', content: ' ' }, { role: 'assistant', content: 'b' }], 5)).toBeNull();
  });

  it('sseEvents copes with CRLF and chunk boundaries anywhere', async () => {
    const text = 'event: a\r\ndata: {"x":1}\r\n\r\nevent: b\ndata: {"y":"ü"}\n\n';
    const out = [];
    for await (const e of sseEvents(chunked(text, 3))) out.push(e);
    expect(out).toEqual([{ event: 'a', data: '{"x":1}' }, { event: 'b', data: '{"y":"ü"}' }]);
  });
});

describe('coin-game state', () => {
  it('keeps known fields, drops unknown ones', () => {
    expect(coinGame.state({ ...STATE, secretMoves: ['H', 'X', 'H'], extra: 1 })).toEqual(STATE);
  });
  it('rejects a foreign game or chapter, drops malformed optional parts', () => {
    expect(coinGame.state({ game: 'quantum-coin-game', chapter: 7 })).toBeNull();
    expect(coinGame.state(null)).toBeNull();
    expect(coinGame.state({ game: 'quantum-coin-game', chapter: 5, sandbox: ['H', 'Q'], lastRound: { moves: ['X'] }, facts: { pHeads: 2 } }))
      .toEqual({ game: 'quantum-coin-game', chapter: 5 });
    expect(coinGame.state({ game: 'quantum-coin-game', chapter: 5, sandbox: ['H', 'X', 'H'] }))
      .toEqual({ game: 'quantum-coin-game', chapter: 5, sandbox: ['H', 'X', 'H'] });
  });
});

describe('coin-game round log', () => {
  const r = (youWin: boolean) => ({ n: 1, you: 'A', moves: ['I', 'X', 'I'], outcome: youWin ? 'heads' : 'tails', winner: youWin ? 'A' : 'B', youWin });
  it('keeps the last 10 well-formed rounds and other chapters\' scores', () => {
    const rounds = [...Array.from({ length: 12 }, (_, i) => r(i % 2 === 0)), { you: 'A', moves: ['Q'] }];
    const out = coinGame.state({ game: 'quantum-coin-game', chapter: 4, rounds, otherScores: { 1: { you: 2, computer: 1, rounds: 3 }, 4: { you: 0, computer: 0, rounds: 1 }, x: 1 } })!;
    expect(out.rounds).toHaveLength(9); // last 10 sent, the malformed one dropped
    expect(out.otherScores).toEqual({ 1: { you: 2, computer: 1, rounds: 3 } });
    expect((out.rounds as Record<string, unknown>[])[0].n).toBe(1);
    expect(coinGame.state({ game: 'quantum-coin-game', chapter: 2, rounds: [{ ...r(true), n: 0 }] })!.rounds).toEqual([{ ...r(true), n: undefined }].map(({ n, ...x }) => x));
  });
});
