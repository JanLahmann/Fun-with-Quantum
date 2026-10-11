/**
 * fwq-assistant — the runtime assistant behind the chat widget on fun-with-quantum.org and
 * rasqberry.org (later doQumentation). Each site has its own origins, budgets and contexts.
 *
 *   POST /chat      {site, context, locale, level, question, state, history} → SSE: delta… then done|error
 *   POST /feedback  {id, vote: 1 | -1}                                 → 204
 *
 * Guards: Origin allow-list per site, burst + daily limits, size limits, per-context state validation.
 * Every answer is logged to D1 (no IP, no cookie) and deleted after RETENTION_DAYS.
 */
import { callClaude, relay, type ChatMessage } from './anthropic';
import { contextFor } from './contexts';
import { intVar, type Env } from './env';
import { checkDaily, checkOrigin, corsHeaders, siteConfig, visitorKey } from './guard';
import { isLevel, systemPrompt, userMessage } from './prompt';

const MAX_BODY = 32_000;
const MAX_QUESTION = 1_000;
const MAX_HISTORY_MESSAGE = 4_000;
const HISTORY_CAP = 10;

export interface Deps {
  now: () => number;
  fetch: typeof fetch;
  uuid: () => string;
}

const defaultDeps: Deps = { now: () => Date.now(), fetch: (...a) => fetch(...a), uuid: () => crypto.randomUUID() };

function json(status: number, body: unknown, cors: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors } });
}

async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  if (Number(req.headers.get('Content-Length') ?? 0) > MAX_BODY) return null;
  const text = await req.text();
  if (text.length > MAX_BODY) return null;
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

/** Earlier question/answer pairs: alternating user/assistant, starting with user, last `turns` pairs. */
export function cleanHistory(raw: unknown, turns: number): ChatMessage[] | null {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) return null;
  const msgs: ChatMessage[] = [];
  for (const [i, m] of raw.entries()) {
    const want = i % 2 === 0 ? 'user' : 'assistant';
    if (!m || typeof m !== 'object' || m.role !== want || typeof m.content !== 'string') return null;
    const content = m.content.trim().slice(0, MAX_HISTORY_MESSAGE);
    if (!content) return null;
    msgs.push({ role: want, content });
  }
  if (msgs.length % 2) return null; // must end with an answer
  return msgs.slice(-2 * Math.min(turns, HISTORY_CAP));
}

export async function handle(req: Request, env: Env, ctx: ExecutionContext, deps: Deps = defaultDeps): Promise<Response> {
  const url = new URL(req.url);
  const origin = checkOrigin(req, env);
  if (!origin) return json(403, { error: 'origin' });
  const cors = corsHeaders(origin);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'method' }, cors);
  if (url.pathname === '/chat') return chat(req, env, ctx, deps, cors);
  if (url.pathname === '/feedback') return feedback(req, env, deps, cors);
  return json(404, { error: 'not_found' }, cors);
}

async function chat(req: Request, env: Env, ctx: ExecutionContext, deps: Deps, cors: Record<string, string>): Promise<Response> {
  const now = deps.now();
  const visitor = await visitorKey(req, env, now);
  if (!(await env.RL.limit({ key: `chat:${visitor}` })).success) return json(429, { error: 'rate' }, cors);

  const body = await readJson(req);
  const site = siteConfig(env, body?.site);
  if (body && site && !site.origins.includes(req.headers.get('Origin')!)) return json(403, { error: 'origin' }, cors);
  const context = site && contextFor(body!.site, body!.context);
  const question = typeof body?.question === 'string' ? body.question.trim() : '';
  const locale = typeof body?.locale === 'string' && /^[a-z]{2}(-[A-Za-z]{2,4})?$/.test(body.locale) ? body.locale : 'en';
  const level = !context?.levels ? null : typeof body?.level === 'string' && isLevel(body.level) ? body.level : 'normal';
  const state = context ? context.state(body!.state) : null;
  const history = cleanHistory(body?.history, intVar(env.MAX_HISTORY_TURNS, 5));
  if (!body || !context || !state || !history || !question || question.length > MAX_QUESTION) {
    return json(400, { error: 'bad_request' }, cors);
  }
  const daily = await checkDaily(env, body.site as string, visitor, now);
  if (daily !== 'ok') return daily === 'global' ? json(503, { error: 'busy' }, cors) : json(429, { error: 'rate' }, cors);

  const model = env.MODEL;
  const messages: ChatMessage[] = [...history, { role: 'user', content: userMessage(locale, level, state, question, context.stateTag) }];
  const id = deps.uuid();
  const log = (answer: string, extra: Partial<Record<string, string | number | null>>) =>
    env.DB.prepare(
      `INSERT INTO messages (id, ts, site, context, locale, level, question, state_json, history_turns, answer, model,
         stop_reason, error, in_tok, out_tok, cache_read_tok, cache_write_tok, latency_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id, now, body.site as string, body.context as string, locale, level, question, JSON.stringify(state), history.length / 2, answer, model,
      extra.stop_reason ?? null, extra.error ?? null, extra.in_tok ?? null, extra.out_tok ?? null,
      extra.cache_read_tok ?? null, extra.cache_write_tok ?? null, deps.now() - now,
    ).run();

  let upstream: Response;
  try {
    upstream = await callClaude(
      { apiKey: env.ANTHROPIC_API_KEY, model, maxTokens: intVar(env.MAX_TOKENS, 1500), system: systemPrompt(context), messages },
      deps.fetch,
    );
  } catch (e) {
    ctx.waitUntil(log('', { error: `fetch: ${e instanceof Error ? e.message : String(e)}`.slice(0, 200) }).catch(() => {}));
    return json(502, { error: 'upstream' }, cors);
  }
  if (!upstream.ok || !upstream.body) {
    await upstream.body?.cancel().catch(() => {});
    ctx.waitUntil(log('', { error: `http ${upstream.status}` }).catch(() => {}));
    return json(502, { error: 'upstream' }, cors);
  }

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const enc = new TextEncoder();
  const send = (event: string, data: unknown) => writer.write(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
  ctx.waitUntil((async () => {
    const r = await relay(upstream.body!, send);
    // Log first, then say `done`: a thumbs vote right after the answer must find its row.
    await log(r.text, {
      stop_reason: r.stopReason, error: r.error, in_tok: r.inTok, out_tok: r.outTok,
      cache_read_tok: r.cacheReadTok, cache_write_tok: r.cacheWriteTok,
    }).catch(() => {});
    await (r.error ? send('error', { error: 'upstream' }) : send('done', { id, stop: r.stopReason })).catch(() => {});
    await writer.close().catch(() => {});
  })());
  return new Response(readable, {
    headers: { ...cors, 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

async function feedback(req: Request, env: Env, deps: Deps, cors: Record<string, string>): Promise<Response> {
  const now = deps.now();
  if (!(await env.RL.limit({ key: `vote:${await visitorKey(req, env, now)}` })).success) return json(429, { error: 'rate' }, cors);
  const body = await readJson(req);
  const id = body?.id, vote = body?.vote;
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id) || (vote !== 1 && vote !== -1)) return json(400, { error: 'bad_request' }, cors);
  const res = await env.DB.prepare(
    `INSERT INTO feedback (message_id, ts, vote) SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM messages WHERE id = ?)
     ON CONFLICT (message_id) DO UPDATE SET ts = excluded.ts, vote = excluded.vote`,
  ).bind(id, now, vote, id).run();
  return res.meta.changes ? new Response(null, { status: 204, headers: cors }) : json(404, { error: 'unknown_id' }, cors);
}

/** Daily clean-up: logs older than RETENTION_DAYS, quota counters older than yesterday. */
export async function purge(env: Env, now: number): Promise<void> {
  const cutoff = now - intVar(env.RETENTION_DAYS, 30) * 86_400_000;
  const yesterday = new Date(now - 86_400_000).toISOString().slice(0, 10);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM feedback WHERE message_id IN (SELECT id FROM messages WHERE ts < ?)').bind(cutoff),
    env.DB.prepare('DELETE FROM messages WHERE ts < ?').bind(cutoff),
    env.DB.prepare('DELETE FROM quota WHERE day < ?').bind(yesterday),
  ]);
}

export default {
  fetch: (req, env, ctx) => handle(req, env, ctx),
  scheduled: async (_event, env) => purge(env, Date.now()),
} satisfies ExportedHandler<Env>;
