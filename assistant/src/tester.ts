/**
 * The RasQberry tester programme (context rasqberry/tester): sign-in with a shared passphrase and
 * a self-chosen tester ID, and the only ways anything is written — by the tester's own clicks in
 * the widget, never by the model:
 *
 *   POST /tester/me       {tester}                          → {preferences, missions}
 *   POST /tester/prefs    {tester, preferences}             → 204
 *   POST /tester/status   {tester, mission_id, state}       → 204
 *   POST /tester/finding  {tester, finding}                 → {id}
 *   (all with the header X-Tester-Pass, from a rasqberry site origin)
 *
 * Triage, for the RasQberry-Two session (Authorization: Bearer TESTER_EXPORT_TOKEN, no Origin needed):
 *   GET  /tester/export?since=<ISO date>&status=new|triaged → {testers, mission_status, findings}
 *   POST /tester/triage   {finding_id, issue_url}           → 204
 */
import type { Env } from './env';
import { utcDay } from './guard';

export const TESTER_CONTEXT = 'rasqberry/tester';
export const TESTER_RETENTION_DAYS = 90;
const TESTER_SITE = 'rasqberry';
const MISSION_STATES = ['suggested', 'started', 'done', 'skipped'] as const;
const KINDS = ['bug', 'docs', 'confusing', 'idea', 'praise'] as const;
const SEVERITIES = ['blocker', 'major', 'minor'] as const;

type Json = Record<string, unknown>;
const reply = (status: number, body: unknown, cors: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors } });

/** A tester's name or ID: 3–30 letters, digits, space, _ . - (so never an e-mail address). Lower-cased as key. */
export function testerId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim().replace(/\s+/g, ' ');
  return /^[A-Za-z0-9 _.-]{3,30}$/.test(s) ? s.toLowerCase() : null;
}

export const missionId = (raw: unknown): string | null =>
  typeof raw === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(raw) ? raw : null;

const clip = (v: unknown, max: number): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().replace(/[\u0000-\u0008\u000b-\u001f]/g, ' ').slice(0, max) : null;

/** Preferences from the widget's form: up to 20 keys; booleans, short strings or short lists of strings. */
export function cleanPreferences(raw: unknown): Json | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const out: Json = {};
  for (const [k, v] of Object.entries(raw as Json).slice(0, 20)) {
    if (!/^[a-z][a-z0-9_-]{0,29}$/.test(k)) continue;
    if (typeof v === 'boolean') out[k] = v;
    else if (typeof v === 'string' && clip(v, 80)) out[k] = clip(v, 80);
    else if (Array.isArray(v)) out[k] = v.map((x) => clip(x, 40)).filter(Boolean).slice(0, 10);
  }
  return out;
}

/** A finding from the draft card the tester saved. */
export function cleanFinding(raw: unknown): Json | null {
  const f = raw as Json | null;
  if (!f || typeof f !== 'object' || Array.isArray(f)) return null;
  const kind = (KINDS as readonly unknown[]).includes(f.kind) ? f.kind : null;
  const title = clip(f.title, 200);
  if (!kind || !title) return null;
  const severity = (SEVERITIES as readonly unknown[]).includes(f.severity) ? f.severity : null;
  const ids = Array.isArray(f.message_ids) ? f.message_ids.filter((x) => typeof x === 'string' && /^[0-9a-f-]{36}$/.test(x)).slice(0, 20) : [];
  return {
    kind, title, severity: kind === 'praise' || kind === 'idea' ? null : severity,
    mission_id: missionId(f.mission_id),
    expected: clip(f.expected, 2000), actual: clip(f.actual, 2000), steps: clip(f.steps, 2000),
    image_version: typeof f.image_version === 'string' && /^[\w.+-]{1,60}$/.test(f.image_version) ? f.image_version : null,
    pi_model: f.pi_model === 'pi4' || f.pi_model === 'pi5' ? f.pi_model : null,
    message_ids: ids,
  };
}

async function sha256(s: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
}

/** Compares two secrets in constant time (both hashed first, so their lengths don't leak either). */
export async function sameSecret(given: string | null, expected: string | undefined): Promise<boolean> {
  if (!given || !expected) return false;
  const [a, b] = await Promise.all([sha256(given), sha256(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** The signed-in tester's key, or null when the passphrase is wrong or no passphrase is set (fails closed). */
export async function signedIn(req: Request, env: Env, rawId: unknown): Promise<string | null> {
  const id = testerId(rawId);
  if (!id || !(await sameSecret(req.headers.get('X-Tester-Pass'), env.TESTER_PASSPHRASE))) return null;
  return id;
}

/** Daily budgets per tester and for all testers together; only requests within the tester's own count globally. */
export async function checkTesterDaily(env: Env, id: string, limits: { daily_tester: number; daily_global: number }, now: number) {
  const day = utcDay(now);
  const bump = async (key: string) =>
    (await env.DB.prepare('INSERT INTO quota (day, key, n) VALUES (?, ?, 1) ON CONFLICT (day, key) DO UPDATE SET n = n + 1 RETURNING n')
      .bind(day, key).first<{ n: number }>())?.n ?? 0;
  if ((await bump(`${TESTER_CONTEXT}:${id}`)) > limits.daily_tester) return 'tester';
  if ((await bump(`${TESTER_CONTEXT}:*`)) > limits.daily_global) return 'global';
  return 'ok';
}

/** Records that the tester was here, and returns what the helper may know about them. */
export async function profile(env: Env, id: string, now: number): Promise<{ preferences: Json; missions: Record<string, string> }> {
  await env.DB.prepare(
    `INSERT INTO testers (id, first_seen, last_seen) VALUES (?, ?, ?) ON CONFLICT (id) DO UPDATE SET last_seen = excluded.last_seen`,
  ).bind(id, now, now).run();
  const t = await env.DB.prepare('SELECT preferences FROM testers WHERE id = ?').bind(id).first<{ preferences: string }>();
  const rows = (await env.DB.prepare('SELECT mission_id, state FROM mission_status WHERE tester = ? ORDER BY ts').bind(id).all<{ mission_id: string; state: string }>()).results;
  return { preferences: JSON.parse(t?.preferences ?? '{}'), missions: Object.fromEntries(rows.map((r) => [r.mission_id, r.state])) };
}

/** POST /tester/* from the widget. `body` is already parsed; the origin is already checked. */
export async function testerRoute(path: string, req: Request, body: Json | null, env: Env, now: number, uuid: () => string, cors: Record<string, string>): Promise<Response> {
  if (!body || body.site !== TESTER_SITE) return reply(400, { error: 'bad_request' }, cors);
  if (!env.SITES[TESTER_SITE]?.origins.includes(req.headers.get('Origin')!)) return reply(403, { error: 'origin' }, cors);
  const id = await signedIn(req, env, body.tester);
  if (!id) return reply(401, { error: 'tester_auth' }, cors);
  const done = new Response(null, { status: 204, headers: cors });

  if (path === '/tester/me') return reply(200, await profile(env, id, now), cors);

  await profile(env, id, now);
  if (path === '/tester/prefs') {
    const prefs = cleanPreferences(body.preferences);
    if (!prefs) return reply(400, { error: 'bad_request' }, cors);
    await env.DB.prepare('UPDATE testers SET preferences = ? WHERE id = ?').bind(JSON.stringify(prefs), id).run();
    return done;
  }
  if (path === '/tester/status') {
    const mission = missionId(body.mission_id);
    const state = (MISSION_STATES as readonly unknown[]).includes(body.state) ? (body.state as string) : null;
    if (!mission || !state) return reply(400, { error: 'bad_request' }, cors);
    await env.DB.prepare(
      `INSERT INTO mission_status (tester, mission_id, state, ts) VALUES (?, ?, ?, ?)
       ON CONFLICT (tester, mission_id) DO UPDATE SET state = excluded.state, ts = excluded.ts`,
    ).bind(id, mission, state, now).run();
    return done;
  }
  if (path === '/tester/finding') {
    const f = cleanFinding(body.finding);
    if (!f) return reply(400, { error: 'bad_request' }, cors);
    const prefs = await env.DB.prepare('SELECT preferences FROM testers WHERE id = ?').bind(id).first<{ preferences: string }>();
    const fid = uuid();
    await env.DB.prepare(
      `INSERT INTO findings (id, ts, tester, mission_id, image_version, pi_model, hardware, kind, severity, title, expected, actual, steps, message_ids)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(fid, now, id, f.mission_id, f.image_version, f.pi_model, prefs?.preferences ?? '{}', f.kind, f.severity, f.title,
      f.expected, f.actual, f.steps, JSON.stringify(f.message_ids)).run();
    return reply(200, { id: fid }, cors);
  }
  return reply(404, { error: 'not_found' }, cors);
}

/** GET /tester/export and POST /tester/triage: server to server, Bearer TESTER_EXPORT_TOKEN. */
export async function triageRoute(path: string, req: Request, env: Env): Promise<Response> {
  const auth = req.headers.get('Authorization');
  if (!(await sameSecret(auth?.startsWith('Bearer ') ? auth.slice(7) : null, env.TESTER_EXPORT_TOKEN))) return reply(401, { error: 'auth' });
  const url = new URL(req.url);
  if (path === '/tester/export' && req.method === 'GET') {
    const sinceRaw = url.searchParams.get('since');
    const since = sinceRaw ? Date.parse(sinceRaw) : 0;
    const status = url.searchParams.get('status');
    if (Number.isNaN(since) || (status && status !== 'new' && status !== 'triaged')) return reply(400, { error: 'bad_request' });
    const all = async <T>(sql: string, ...args: unknown[]) => (await env.DB.prepare(sql).bind(...args).all<T>()).results;
    const findings = (await all<Json>(
      `SELECT * FROM findings WHERE ts >= ? ${status ? 'AND status = ?' : ''} ORDER BY ts`, ...(status ? [since, status] : [since]),
    )).map((f) => ({ ...f, ts: new Date(f.ts as number).toISOString(), hardware: JSON.parse(f.hardware as string), message_ids: JSON.parse(f.message_ids as string) }));
    const testers = (await all<Json>('SELECT * FROM testers ORDER BY id')).map((t) => ({
      ...t, preferences: JSON.parse(t.preferences as string),
      first_seen: new Date(t.first_seen as number).toISOString(), last_seen: new Date(t.last_seen as number).toISOString(),
    }));
    const missionStatus = (await all<Json>('SELECT * FROM mission_status ORDER BY ts')).map((m) => ({ ...m, ts: new Date(m.ts as number).toISOString() }));
    return reply(200, { exported: new Date().toISOString(), since: new Date(since).toISOString(), testers, mission_status: missionStatus, findings });
  }
  if (path === '/tester/triage' && req.method === 'POST') {
    let body: Json | null = null;
    try { body = await req.json(); } catch { /* bad JSON */ }
    const fid = typeof body?.finding_id === 'string' && /^[0-9a-f-]{36}$/.test(body.finding_id) ? body.finding_id : null;
    const issue = typeof body?.issue_url === 'string' && /^https:\/\/github\.com\/JanLahmann\/RasQberry-Two\/issues\/\d+$/.test(body.issue_url) ? body.issue_url : null;
    if (!fid || !issue) return reply(400, { error: 'bad_request' });
    const r = await env.DB.prepare("UPDATE findings SET status = 'triaged', issue_url = ? WHERE id = ?").bind(issue, fid).run();
    return r.meta.changes ? new Response(null, { status: 204 }) : reply(404, { error: 'unknown_id' });
  }
  return reply(404, { error: 'not_found' });
}

/** Daily clean-up of the tester tables (the context's messages are purged with the other logs). */
export function purgeTester(env: Env, now: number) {
  const cutoff = now - TESTER_RETENTION_DAYS * 86_400_000;
  return [
    env.DB.prepare('DELETE FROM findings WHERE ts < ?').bind(cutoff),
    env.DB.prepare('DELETE FROM mission_status WHERE ts < ?').bind(cutoff),
    env.DB.prepare('DELETE FROM mission_status WHERE tester IN (SELECT id FROM testers WHERE last_seen < ?)').bind(cutoff),
    env.DB.prepare('DELETE FROM findings WHERE tester IN (SELECT id FROM testers WHERE last_seen < ?)').bind(cutoff),
    env.DB.prepare('DELETE FROM testers WHERE last_seen < ?').bind(cutoff),
  ];
}
