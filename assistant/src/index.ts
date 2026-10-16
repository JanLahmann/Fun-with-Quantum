/**
 * fwq-assistant — the runtime assistant behind the chat widget on fun-with-quantum.org and
 * rasqberry.org (later doQumentation). Each site has its own origins, budgets and contexts.
 *
 *   POST /chat      {site, context, locale, level, question, state, history} → SSE: delta… then done|error
 *   POST /feedback  {id, vote: 1 | -1}                                 → 204
 *   /tester/*       the RasQberry tester programme (see tester.ts)
 *   /attest/challenge, /attest, /token   native apps (App Attest, see app-auth.ts); their /chat
 *                   comes without Origin, with the app's token header
 *   /chat with X-Eval-Pass (no Origin): the eval runner, which asks app contexts like an app
 *                   (budget key key:eval, its own 200 a day per site, outside the visitors' budget);
 *                   fails closed without APP_EVAL_PASS
 *
 * Guards: Origin allow-list per site, burst + daily limits, size limits, per-context state validation.
 * Every answer is logged to D1 (no IP, no cookie) and deleted after RETENTION_DAYS.
 */
import { callClaude, relay, type ChatMessage } from './anthropic';
import { CONTEXTS, contextFor } from './contexts';
import { intVar, type Env } from './env';
import { checkDaily, checkOrigin, corsHeaders, siteConfig, visitorKey } from './guard';
import { isLevel, systemPrompt, userMessage } from './prompt';
import { APPS, appRoute, purgeApps, tokenKey } from './app-auth';
import { checkTesterDaily, purgeTester, sameSecret, signedIn, testerRoute, testerState, triageRoute } from './tester';

/** The answer when the API refuses a question (it then sends no text), in the page language. */
const REFUSED: Record<string, string> = {
  en: 'I can’t help with that. Feel free to ask me something else.',
  de: 'Dabei kann ich nicht helfen. Frag mich gern etwas anderes.',
  ja: 'その質問にはお手伝いできません。ほかのことなら気軽に聞いてください。',
  es: 'No puedo ayudarte con eso. Pregúntame otra cosa si quieres.',
  uk: 'З цим я не можу допомогти. Запитай мене про щось інше.',
  it: 'Non posso aiutarti con questo. Chiedimi pure qualcos’altro.',
  fr: 'Je ne peux pas t’aider avec ça. N’hésite pas à me poser une autre question.',
  nl: 'Daar kan ik niet mee helpen. Vraag me gerust iets anders.',
};
export const refusedText = (locale: string) => REFUSED[locale.slice(0, 2)] ?? REFUSED.en;

/** Key- or token-like strings (32+ letters, digits, - or _) never reach the log, e.g. a pasted IBM Quantum API key. */
export const scrubKeys = (s: string) => s.replace(/[A-Za-z0-9_-]{32,}/g, '[removed]');

const MAX_BODY = 32_000;
const MAX_QUESTION = 1_000;
const MAX_HISTORY_MESSAGE = 4_000;
const HISTORY_CAP = 10;

export interface Deps {
  now: () => number;
  fetch: typeof fetch;
  uuid: () => string;
  /** Tests only: a test root instead of Apple's App Attestation Root CA. */
  attestRoot?: string;
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
  // Triage is server to server (no Origin): its own Bearer token instead.
  if (url.pathname === '/tester/export' || url.pathname === '/tester/triage') return triageRoute(url.pathname, req, env);
  // Native apps: no Origin; App Attest, then a token header per app.
  if (['/attest/challenge', '/attest', '/token'].includes(url.pathname)) {
    // Only native apps, which send no Origin: a web page can't make visitors' browsers write challenges.
    if (req.headers.get('Origin')) return json(403, { error: 'origin' });
    if (req.method !== 'POST') return json(405, { error: 'method' });
    const now = deps.now();
    const visitor = await visitorKey(req, env, now);
    if (!(await env.RL.limit({ key: `attest:${visitor}` })).success) return json(429, { error: 'rate' });
    return appRoute(url.pathname, await readJson(req), env, now, visitor, deps.attestRoot);
  }
  // The eval runner: app contexts without a device, behind its own pass.
  if (!req.headers.get('Origin') && req.headers.has('X-Eval-Pass') && req.method === 'POST' && url.pathname === '/chat') {
    if (!(await sameSecret(req.headers.get('X-Eval-Pass'), env.APP_EVAL_PASS))) return json(401, { error: 'eval' });
    return chat(req, env, ctx, deps, {}, { keyId: 'eval' });
  }
  const appSite = !req.headers.get('Origin') ? Object.keys(APPS).find((s) => req.headers.get(APPS[s].header)) : undefined;
  if (appSite && req.method === 'POST' && (url.pathname === '/chat' || url.pathname === '/feedback')) {
    const keyId = await tokenKey(env, appSite, req.headers.get(APPS[appSite].header), deps.now());
    if (!keyId) return json(401, { error: 'token' });
    return url.pathname === '/chat' ? chat(req, env, ctx, deps, {}, { site: appSite, keyId }) : feedback(req, env, deps, {});
  }
  const origin = checkOrigin(req, env);
  if (!origin) return json(403, { error: 'origin' });
  const cors = corsHeaders(origin);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'method' }, cors);
  if (url.pathname === '/chat') return chat(req, env, ctx, deps, cors);
  if (url.pathname === '/feedback') return feedback(req, env, deps, cors);
  if (url.pathname.startsWith('/tester/')) {
    const now = deps.now();
    if (!(await env.RL.limit({ key: `tester:${await visitorKey(req, env, now)}` })).success) return json(429, { error: 'rate' }, cors);
    return testerRoute(url.pathname, req, await readJson(req), env, now, deps.uuid, cors);
  }
  return json(404, { error: 'not_found' }, cors);
}

async function chat(req: Request, env: Env, ctx: ExecutionContext, deps: Deps, cors: Record<string, string>,
  app?: { site?: string; keyId: string }): Promise<Response> {
  const now = deps.now();
  // An attested app counts per app key (the device); a web visitor per daily IP pseudonym.
  const visitor = app ? `key:${app.keyId}` : await visitorKey(req, env, now);
  if (!(await env.RL.limit({ key: `chat:${visitor}` })).success) return json(429, { error: 'rate' }, cors);

  const body = await readJson(req);
  const site = siteConfig(env, body?.site);
  if (body && site && !app && !site.origins.includes(req.headers.get('Origin')!)) return json(403, { error: 'origin' }, cors);
  // An app token holds for its own site; the eval pass for any app site.
  if (body && app && ((app.site && body.site !== app.site) || !Object.hasOwn(APPS, body.site as string) || !APPS[body.site as string].contexts.includes(body.context as string))) return json(403, { error: 'origin' });
  const context = site && contextFor(body!.site, body!.context);
  if (context?.appOnly && !app) return json(403, { error: 'origin' }, cors);
  const question = typeof body?.question === 'string' ? body.question.trim() : '';
  const locale = typeof body?.locale === 'string' && /^[a-z]{2}(-[A-Za-z]{2,4})?$/.test(body.locale) ? body.locale : 'en';
  const level = !context?.levels ? null : typeof body?.level === 'string' && isLevel(body.level) ? body.level : 'normal';
  const state = context ? context.state(body!.state) : null;
  const history = cleanHistory(body?.history, intVar(env.MAX_HISTORY_TURNS, 5));
  if (!body || !context || !state || !history || !question || question.length > MAX_QUESTION) {
    return json(400, { error: 'bad_request' }, cors);
  }
  // Tester context: signed-in testers only, budgets per tester; the helper sees their preferences and missions.
  let tester: string | null = null;
  let pageState = state;
  if (context.tester) {
    tester = await signedIn(req, env, body.tester);
    if (!tester) return json(401, { error: 'tester_auth' }, cors);
    const daily = await checkTesterDaily(env, tester, context.tester, now);
    if (daily !== 'ok') return daily === 'global' ? json(503, { error: 'busy' }, cors) : json(429, { error: 'rate' }, cors);
    pageState = { ...state, tester: await testerState(env, tester, now, (state.device as Record<string, unknown> | undefined)?.version) };
  } else {
    const daily = await checkDaily(env, body.site as string, visitor, now);
    if (daily !== 'ok') return daily === 'global' ? json(503, { error: 'busy' }, cors) : json(429, { error: 'rate' }, cors);
  }

  const model = context.model ?? env.MODEL;
  const messages: ChatMessage[] = [...history, { role: 'user', content: userMessage(locale, level, pageState, question, context.stateTag) }];
  const id = deps.uuid();
  const log = (answer: string, extra: Partial<Record<string, string | number | null>>) =>
    env.DB.prepare(
      `INSERT INTO messages (id, ts, site, context, locale, level, question, state_json, history_turns, answer, model,
         stop_reason, error, in_tok, out_tok, cache_read_tok, cache_write_tok, latency_ms, tester)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id, now, body.site as string, body.context as string, locale, level, scrubKeys(question), JSON.stringify(pageState), history.length / 2, answer, model,
      extra.stop_reason ?? null, extra.error ?? null, extra.in_tok ?? null, extra.out_tok ?? null,
      extra.cache_read_tok ?? null, extra.cache_write_tok ?? null, deps.now() - now, tester,
    ).run();

  let upstream: Response;
  try {
    upstream = await callClaude(
      { apiKey: env.ANTHROPIC_API_KEY, model, maxTokens: intVar(env.MAX_TOKENS, 4000), system: systemPrompt(context), messages },
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
    // A refusal by the API comes without any text: say so briefly instead of an empty bubble.
    if (!r.error && !r.text && r.stopReason === 'refusal') await send('delta', { t: refusedText(locale) }).catch(() => {});
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

/**
 * Daily clean-up: logs older than their context's retention (RETENTION_DAYS unless the context
 * sets its own), the tester tables, quota counters older than yesterday.
 */
export async function purge(env: Env, now: number): Promise<void> {
  const days = intVar(env.RETENTION_DAYS, 30);
  const yesterday = new Date(now - 86_400_000).toISOString().slice(0, 10);
  const own = Object.entries(CONTEXTS).filter(([, c]) => c.retentionDays);
  const where = (cutoff: number, key?: string) => key
    ? { sql: "ts < ? AND site || '/' || context = ?", args: [cutoff, key] }
    : { sql: `ts < ?${own.map(() => " AND site || '/' || context != ?").join('')}`, args: [cutoff, ...own.map(([k]) => k)] };
  const scopes = [where(now - days * 86_400_000), ...own.map(([k, c]) => where(now - c.retentionDays! * 86_400_000, k))];
  await env.DB.batch([
    ...scopes.flatMap((w) => [
      env.DB.prepare(`DELETE FROM feedback WHERE message_id IN (SELECT id FROM messages WHERE ${w.sql})`).bind(...w.args),
      env.DB.prepare(`DELETE FROM messages WHERE ${w.sql}`).bind(...w.args),
    ]),
    ...purgeTester(env, now),
    ...purgeApps(env, now),
    env.DB.prepare('DELETE FROM quota WHERE day < ?').bind(yesterday),
  ]);
}

export default {
  fetch: (req, env, ctx) => handle(req, env, ctx),
  scheduled: async (_event, env) => purge(env, Date.now()),
} satisfies ExportedHandler<Env>;
