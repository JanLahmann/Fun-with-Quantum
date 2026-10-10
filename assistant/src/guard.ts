import { intVar, type Env } from './env';

export const allowedOrigins = (env: Env) => env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);

/** The request's Origin when it is one of ours, else null (no Origin header counts as foreign). */
export function checkOrigin(req: Request, env: Env): string | null {
  const origin = req.headers.get('Origin');
  return origin && allowedOrigins(env).includes(origin) ? origin : null;
}

export function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export const utcDay = (now: number) => new Date(now).toISOString().slice(0, 10);

/**
 * The part of an address that names one visitor: an IPv4 address, or the /64 prefix of an IPv6
 * address (one connection usually owns a whole /64, so the full address would be trivial to vary).
 */
export function addressKey(ip: string): string {
  if (!ip.includes(':')) return ip;
  const [head, tail = ''] = ip.split('::');
  const h = head ? head.split(':') : [];
  const t = tail ? tail.split(':') : [];
  const full = ip.includes('::') ? [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t] : h;
  return full.slice(0, 4).map((x) => (parseInt(x, 16) || 0).toString(16)).join(':') + '::/64';
}

/**
 * A per-day pseudonym for the visitor: HMAC-SHA-256 of (day, address) under a key derived from
 * the Worker's secret. Without that secret the pseudonym can't be traced back to an address,
 * and it changes every day. It is stored only in the quota table, never with a message.
 */
export async function visitorKey(req: Request, env: Env, now: number): Promise<string> {
  const ip = addressKey(req.headers.get('CF-Connecting-IP') ?? 'unknown');
  const enc = new TextEncoder();
  const secret = await crypto.subtle.digest('SHA-256', enc.encode(`fwq-visitor|${env.ANTHROPIC_API_KEY}`));
  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`${utcDay(now)}|${ip}`)));
  return Array.from(mac.slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
}

const BUMP = 'INSERT INTO quota (day, key, n) VALUES (?, ?, 1) ON CONFLICT (day, key) DO UPDATE SET n = n + 1 RETURNING n';

async function bump(env: Env, day: string, key: string): Promise<number> {
  const row = await env.DB.prepare(BUMP).bind(day, key).first<{ n: number }>();
  return row?.n ?? 0;
}

/**
 * Daily counters, checked after the burst limiter and after the request proved valid: first the
 * visitor's own count; only requests within it count towards the global limit, so one visitor
 * can never use up everyone's budget.
 */
export async function checkDaily(env: Env, key: string, now: number): Promise<'ok' | 'visitor' | 'global'> {
  const day = utcDay(now);
  if ((await bump(env, day, key)) > intVar(env.DAILY_VISITOR_LIMIT, 50)) return 'visitor';
  if ((await bump(env, day, '*')) > intVar(env.DAILY_GLOBAL_LIMIT, 2000)) return 'global';
  return 'ok';
}
