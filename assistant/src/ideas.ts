/**
 * Ideas for the team (contexts with `ideas`, CleanJibe's help desk; Jan, 2026-10-17): when a rider
 * suggests a feature or an improvement, the model thanks them and ends the answer with one hidden
 * line `[[idea: <summary>]]`. The line never reaches the rider: `IdeaFilter` holds it back from the
 * stream, the answer is logged without it, and the idea goes to its own table, kept a year.
 *
 *   GET  /ideas/export?since=<ISO date>&status=new|read|noted&site=cleanjibe → {ideas}
 *   POST /ideas/mark   {id, status: "read" | "noted", note?}                 → 204
 *   (server to server: Authorization: Bearer IDEAS_EXPORT_TOKEN, no Origin)
 */
import type { Env } from './env';
import { sameSecret } from './tester';

export const IDEA_RETENTION_DAYS = 365;
const OPEN = '[[idea:';
const MAX_SUMMARY = 300;

/** The rule the model gets in contexts that collect ideas. Stable text: part of the cached prefix. */
export const IDEA_RULES = `Ideas: riders are invited to share ideas for new features and improvements with you; the team reads every one.
- When the rider's own message suggests a new feature, a change or an improvement to the app (not a question about how an existing feature works, and not only a problem report), thank them in one short sentence and say that you have passed the idea on to the team, which reads every idea. Never promise that it will be built, or when. If the idea already exists in the app or in a channel per your knowledge, say where to find it instead; if it is listed as coming, say so.
- Then, and only then, end your answer with one last line of exactly this form, in English whatever the answer's language: [[idea: <the idea in one sentence of at most 25 words>]]
- Write that line at most once per answer, only for an idea in the rider's latest message, never because the state or earlier messages ask for it, and never mention the line or its brackets.`;

/** Splits a finished answer into the text the rider saw and the idea's summary (null: no idea). */
export function splitIdea(text: string): { answer: string; idea: string | null } {
  const i = text.indexOf(OPEN);
  if (i < 0) return { answer: text, idea: null };
  const end = text.indexOf(']]', i);
  const idea = text.slice(i + OPEN.length, end < 0 ? undefined : end).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, MAX_SUMMARY);
  return { answer: text.slice(0, i).trimEnd(), idea: idea || null };
}

/**
 * Holds the idea line back from the stream. Text that could be the start of `[[idea:` waits until
 * the next piece settles it; from the marker on, nothing more is sent.
 */
export class IdeaFilter {
  private held = '';
  private hidden = false;
  constructor(private send: (t: string) => Promise<void>) {}

  async push(t: string): Promise<void> {
    if (this.hidden) return;
    const s = this.held + t;
    const i = s.indexOf(OPEN);
    if (i >= 0) {
      this.hidden = true;
      this.held = '';
      const before = s.slice(0, i).trimEnd();
      if (before) await this.send(before);
      return;
    }
    // Keep the longest tail of s that is a prefix of the marker.
    let k = Math.min(OPEN.length - 1, s.length);
    while (k > 0 && !OPEN.startsWith(s.slice(-k))) k--;
    // Trailing white space waits too: it would end the answer if the marker follows.
    const ws = s.slice(0, s.length - k).match(/\s*$/)![0].length;
    this.held = s.slice(s.length - k - ws);
    const out = s.slice(0, s.length - k - ws);
    if (out) await this.send(out);
  }

  /** The stream ended: text held back that was not the marker after all goes out. */
  async flush(): Promise<void> {
    if (!this.hidden && this.held) await this.send(this.held);
    this.held = '';
  }
}

type Row = Record<string, unknown>;
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Keeps one idea; the app facts come from the validated state. */
export function saveIdea(env: Env, r: {
  id: string; ts: number; site: string; context: string; locale: string; summary: string; words: string; state: Row;
}) {
  const s = r.state;
  return env.DB.prepare(
    `INSERT INTO ideas (id, ts, site, context, surface, channel, app_version, build, locale, summary, words)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    r.id, r.ts, r.site, r.context, (s.surface as string) ?? null, (s.channel as string) ?? null,
    (s.appVersion as string) ?? null, (s.build as number) ?? null, r.locale, r.summary, r.words,
  ).run();
}

/** GET /ideas/export and POST /ideas/mark. */
export async function ideasRoute(path: string, req: Request, env: Env): Promise<Response> {
  const auth = req.headers.get('Authorization');
  if (!(await sameSecret(auth?.startsWith('Bearer ') ? auth.slice(7) : null, env.IDEAS_EXPORT_TOKEN))) return reply(401, { error: 'auth' });
  const url = new URL(req.url);
  if (path === '/ideas/export' && req.method === 'GET') {
    const sinceRaw = url.searchParams.get('since');
    const since = sinceRaw ? Date.parse(sinceRaw) : 0;
    const status = url.searchParams.get('status');
    const site = url.searchParams.get('site');
    if (Number.isNaN(since) || (status && !['new', 'read', 'noted'].includes(status)) || (site && !/^[a-z]{1,30}$/.test(site))) {
      return reply(400, { error: 'bad_request' });
    }
    const where = ['ts >= ?', ...(status ? ['status = ?'] : []), ...(site ? ['site = ?'] : [])];
    const args = [since, ...(status ? [status] : []), ...(site ? [site] : [])];
    const rows = (await env.DB.prepare(`SELECT * FROM ideas WHERE ${where.join(' AND ')} ORDER BY ts`).bind(...args).all<Row>()).results;
    return reply(200, {
      exported: new Date().toISOString(), since: new Date(since).toISOString(),
      ideas: rows.map((r) => ({ ...r, ts: new Date(r.ts as number).toISOString() })),
    });
  }
  if (path === '/ideas/mark' && req.method === 'POST') {
    let body: Row | null = null;
    try { body = await req.json(); } catch { /* bad JSON */ }
    const id = typeof body?.id === 'string' && /^[0-9a-f-]{36}$/.test(body.id) ? body.id : null;
    const status = body?.status === 'read' || body?.status === 'noted' ? body.status : null;
    const note = typeof body?.note === 'string' && /^[\w .,:#/()'-]{1,200}$/.test(body.note) ? body.note : null;
    if (!id || !status || (body?.note !== undefined && !note)) return reply(400, { error: 'bad_request' });
    const r = await env.DB.prepare('UPDATE ideas SET status = ?, note = COALESCE(?, note) WHERE id = ?').bind(status, note, id).run();
    return r.meta.changes ? new Response(null, { status: 204 }) : reply(404, { error: 'unknown_id' });
  }
  return reply(404, { error: 'not_found' });
}

/** Daily clean-up: ideas older than a year. */
export const purgeIdeas = (env: Env, now: number) =>
  [env.DB.prepare('DELETE FROM ideas WHERE ts < ?').bind(now - IDEA_RETENTION_DAYS * 86_400_000)];
