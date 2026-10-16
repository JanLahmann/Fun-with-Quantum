import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { handle, purge, type Deps } from '../src/index';
import { b64 } from '../src/attest';
import { sessionState, MAX_STATE } from '../src/contexts/cleanjibe/session';
import { sseEvents } from '../src/anthropic';
import { chunked, claudeStream, fakeClaude, makeCtx, makeEnv } from './fakes';
import { makeAttestation, makeCa } from './appattest-fixture';

const TEAM = '685X8YLYSB';
const example = (f: string) => JSON.parse(readFileSync(fileURLToPath(new URL(`./cleanjibe-example-session-${f}.json`, import.meta.url).href), 'utf8'));
let ca: ReturnType<typeof makeCa>;
beforeAll(() => { ca = makeCa(); });

function setup(envOver: Record<string, unknown> = {}) {
  const claude = fakeClaude(() => new Response(chunked(claudeStream(['Die 14:26 ', 'war ein Touchdown.'])), { status: 200 }));
  const { env, db } = makeEnv(envOver);
  // A running clock (the test certificates are made during the test), shifted by at(): later days.
  let shift = 0, n = 0;
  const deps: Deps = { now: () => Date.now() + shift, fetch: claude.fetch, uuid: () => `00000000-0000-4000-8000-${String(n++).padStart(12, '0')}`, attestRoot: ca.rootB64 };
  const run = async (path: string, body: unknown, headers: Record<string, string> = {}) => {
    const { ctx, settle } = makeCtx();
    const res = await handle(new Request(`https://w.example${path}`, {
      method: 'POST', headers: { 'CF-Connecting-IP': '198.51.100.9', 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
    }), env, ctx, deps);
    if (res.headers.get('Content-Type')?.startsWith('text/event-stream')) for await (const _ of sseEvents(res.body!)) { /* drain */ }
    await settle();
    return res;
  };
  return { run, claude, db, env, later: (ms: number) => { shift += ms; }, now: () => Date.now() + shift };
}

async function attested(s: ReturnType<typeof setup>, bundleId = 'de.lahmann.wingfoil') {
  const { challenge } = await (await s.run('/attest/challenge', { site: 'cleanjibe' })).json() as any;
  const a = await makeAttestation(ca, { teamId: TEAM, bundleId, challenge: b64(challenge) });
  const res = await s.run('/attest', { site: 'cleanjibe', keyId: a.keyId, attestation: a.attestation, challenge, bundleId });
  return { a, res, body: await res.json() as any };
}

const STATE = example('watch-app');
const ask = (over: Record<string, unknown> = {}) => ({ site: 'cleanjibe', context: 'session', locale: 'de', question: 'Warum war 14:26 ein Touchdown?', state: STATE, ...over });

describe('App Attest flow (CleanJibe iPhone app)', () => {
  it('attest → token → /chat with the session state, no Origin', async () => {
    const s = setup();
    const { body } = await attested(s);
    expect(body.token).toMatch(/^[\w-]{43}\.\d{13}\.[\w-]{43}$/);
    const res = await s.run('/chat', ask(), { 'X-CleanJibe-Token': body.token });
    expect(res.status).toBe(200);
    const msg = s.claude.calls[0].body.messages.at(-1).content as string;
    expect(msg).toContain('"turnList"');
    expect(s.claude.calls[0].body.system[0].text).toContain('one of their sessions');
    expect(s.db.rows('SELECT site, context FROM messages')).toEqual([{ site: 'cleanjibe', context: 'session' }]);
  });

  it('refuses: no or forged token, expired token, the session context from the web, other sites with an app token', async () => {
    const s = setup();
    const { body } = await attested(s);
    expect((await s.run('/chat', ask(), { 'X-CleanJibe-Token': body.token.slice(0, -2) + 'AA' })).status).toBe(401);
    expect((await s.run('/chat', ask())).status).toBe(403); // no Origin, no token
    expect((await s.run('/chat', ask(), { Origin: 'https://cleanjibe.org' })).status).toBe(403); // session is app-only
    expect((await s.run('/chat', { ...ask(), site: 'fwq', context: 'coin-game' }, { 'X-CleanJibe-Token': body.token })).status).toBe(403);
    s.later(61 * 60_000);
    expect((await s.run('/chat', ask(), { 'X-CleanJibe-Token': body.token })).status).toBe(401);
  });

  it('a challenge works once; a wrong bundle or a replayed attestation is refused', async () => {
    const s = setup();
    const { challenge } = await (await s.run('/attest/challenge', { site: 'cleanjibe' })).json() as any;
    const a = await makeAttestation(ca, { teamId: TEAM, bundleId: 'de.lahmann.wingfoil', challenge: b64(challenge) });
    const req = { site: 'cleanjibe', keyId: a.keyId, attestation: a.attestation, challenge, bundleId: 'de.lahmann.wingfoil' };
    expect((await s.run('/attest', { ...req, bundleId: 'de.lahmann.wingfoil.dev' })).status).toBe(401);
    expect((await s.run('/attest', req)).status).toBe(401); // the challenge was used up by the failed try
    expect((await s.run('/attest', { site: 'nope' })).status).toBe(400);
  });

  it('attest routes refuse browsers (an Origin), and at most 5 new keys per address per day', async () => {
    const s = setup();
    expect((await s.run('/attest/challenge', { site: 'cleanjibe' }, { Origin: 'https://evil.example' })).status).toBe(403);
    for (let i = 0; i < 5; i++) expect((await attested(s)).res.status).toBe(200);
    expect((await attested(s)).res.status).toBe(429);
  });

  it('refreshes the token with an assertion; a replayed counter is refused', async () => {
    const s = setup();
    const { a } = await attested(s);
    const fresh = async () => ((await (await s.run('/attest/challenge', { site: 'cleanjibe' })).json()) as any).challenge as string;
    const c1 = await fresh();
    const r1 = await s.run('/token', { site: 'cleanjibe', keyId: a.keyId, assertion: await a.assert(b64(c1), 1), challenge: c1 });
    expect(r1.status).toBe(200);
    expect((await s.run('/chat', ask({ context: 'help', state: { surface: 'ios', channel: 'beta', appVersion: '1.0.1', engineVersion: '0.29.0', units: { speed: 'kn', distance: 'km' } } }), { 'X-CleanJibe-Token': ((await r1.json()) as any).token })).status).toBe(200);
    const c2 = await fresh();
    expect((await s.run('/token', { site: 'cleanjibe', keyId: a.keyId, assertion: await a.assert(b64(c2), 1), challenge: c2 })).status).toBe(401);
  });

  it('20 questions per device per day; app keys are deleted 30 days after their last use', async () => {
    const s = setup();
    const { body } = await attested(s);
    for (let i = 0; i < 20; i++) expect((await s.run('/chat', ask(), { 'X-CleanJibe-Token': body.token })).status).toBe(200);
    expect((await s.run('/chat', ask(), { 'X-CleanJibe-Token': body.token })).status).toBe(429);
    await purge(s.env, s.now() + 31 * 86_400_000);
    expect(s.db.rows('SELECT * FROM attest_keys')).toEqual([]);
  });
});

describe('session state', () => {
  it('keeps both example states (numbers only), drops what the schema does not allow', () => {
    for (const f of ['watch-app', 'garmin-native']) {
      const e = example(f);
      expect(sessionState(e)).toEqual(e);
    }
    const s = sessionState({ ...STATE, spot: 'Kiel', session: { ...STATE.session, lat: 54.3, turnList: [{ clock: '14:26:12', kind: 'jibe', outcome: 'touchdown', rider: 'X' }] } }) as any;
    expect(s.spot).toBeUndefined();
    expect(s.session.lat).toBeUndefined();
    expect(s.session.turnList).toEqual([{ clock: '14:26:12', kind: 'jibe', outcome: 'touchdown' }]);
    expect(sessionState({ ...STATE, session: { date: 'yesterday' } })).toBeNull();
    expect(sessionState({ ...STATE, session: undefined })).toBeNull();
  });

  it('shortens the turn list to stay under 12 KB', () => {
    const turn = { clock: '14:26:12', kind: 'jibe', side: 'port', outcome: 'touchdown', entryKn: 18.2, minKn: 9.1, heldPct: 50, reason: 'offFoil', tip: 'x'.repeat(160) };
    const s = sessionState({ ...STATE, session: { ...STATE.session, turnList: Array(80).fill(turn) } }) as any;
    expect(JSON.stringify(s).length).toBeLessThanOrEqual(MAX_STATE);
    expect(s.session.turnList.length).toBeLessThan(80);
  });

  it('the eval pass asks app contexts without a device; fails closed; never from a browser', async () => {
    const pass = 'eval-pass-for-tests';
    const s = setup({ APP_EVAL_PASS: pass });
    expect((await s.run('/chat', ask(), { 'X-Eval-Pass': pass })).status).toBe(200);
    expect((await s.run('/chat', ask({ context: 'help' }), { 'X-Eval-Pass': pass })).status).toBe(200);
    expect((await s.run('/chat', ask(), { 'X-Eval-Pass': 'wrong' })).status).toBe(401);
    expect((await s.run('/chat', { ...ask(), site: 'fwq', context: 'coin-game' }, { 'X-Eval-Pass': pass })).status).toBe(403);
    expect((await s.run('/chat', ask({ site: '__proto__' }), { 'X-Eval-Pass': pass })).status).toBe(403);
    expect((await s.run('/chat', ask(), { 'X-Eval-Pass': pass, Origin: 'https://cleanjibe.org' })).status).toBe(403); // session is app-only
    expect(s.db.rows("SELECT key FROM quota WHERE key LIKE 'cleanjibe:key:%'")).toEqual([{ key: 'cleanjibe:key:eval' }]);
    const unset = setup();
    expect((await unset.run('/chat', ask(), { 'X-Eval-Pass': '' })).status).toBe(401);
    expect((await unset.run('/chat', ask(), { 'X-Eval-Pass': 'anything' })).status).toBe(401);
  });
});
