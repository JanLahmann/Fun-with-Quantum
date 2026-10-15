/**
 * Native app clients: App Attest once per install, then short-lived signed tokens on /chat.
 *
 *   POST /attest/challenge {site}                                   → {challenge, expires}
 *   POST /attest   {site, keyId, attestation, challenge, bundleId}  → {token, expires} | 401 {error: "attest"}
 *   POST /token    {site, keyId, assertion, challenge}              → {token, expires} | 401 {error: "attest"}
 *   POST /chat     with header <app.header>: <token>                (no Origin; 401 {error: "token"} → refresh)
 *
 * clientDataHash (what the app signs) = SHA-256 of the challenge bytes. Tokens: keyId.expiry.HMAC,
 * valid an hour; the key must still be registered (so a key can be revoked by deleting its row).
 */
import { b64, b64url, verifyAssertion, verifyAttestation, type AppConfig, type AttestEnv } from './attest';
import type { Env } from './env';

export interface App extends AppConfig { header: string; contexts: string[] }

/** The apps per site (CleanJibe: Jan, 2026-10-15). */
export const APPS: Record<string, App> = {
  cleanjibe: {
    teamId: '685X8YLYSB',
    bundles: { 'de.lahmann.wingfoil': ['production'], 'de.lahmann.wingfoil.dev': ['production', 'development'] },
    header: 'X-CleanJibe-Token',
    contexts: ['help', 'session'],
  },
};

const CHALLENGE_MS = 5 * 60_000;
const TOKEN_MS = 60 * 60_000;
export const KEY_RETENTION_DAYS = 30;

const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function hmac(env: Env, data: string): Promise<string> {
  const enc = new TextEncoder();
  const secret = await crypto.subtle.digest('SHA-256', enc.encode(`fwq-app-token|${env.ANTHROPIC_API_KEY}`));
  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data))));
}

async function issue(env: Env, site: string, keyId: string, now: number) {
  const exp = now + TOKEN_MS;
  const k = b64url(b64(keyId));
  return { token: `${k}.${exp}.${await hmac(env, `${site}|${k}|${exp}`)}`, expires: new Date(exp).toISOString() };
}

/** The attested key behind a valid token, or null. */
export async function tokenKey(env: Env, site: string, token: string | null, now: number): Promise<string | null> {
  const m = token ? /^([\w-]{43})\.(\d{13})\.([\w-]{43})$/.exec(token) : null;
  if (!m || Number(m[2]) < now) return null;
  const want = await hmac(env, `${site}|${m[1]}|${m[2]}`);
  let diff = want.length ^ m[3].length;
  for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ m[3].charCodeAt(i);
  if (diff) return null;
  const keyId = btoa(String.fromCharCode(...b64(m[1])));
  const row = await env.DB.prepare('UPDATE attest_keys SET last_used = ? WHERE key_id = ? AND site = ? RETURNING key_id').bind(now, keyId, site).first();
  return row ? keyId : null;
}

/** Takes a challenge once; false if unknown, used or expired. */
async function takeChallenge(env: Env, site: string, c: unknown, now: number): Promise<Uint8Array | null> {
  if (typeof c !== 'string' || !/^[\w-]{43}$/.test(c)) return null;
  const row = await env.DB.prepare('DELETE FROM attest_challenges WHERE challenge = ? AND site = ? AND expires >= ? RETURNING challenge').bind(c, site, now).first();
  return row ? b64(c) : null;
}

const keyIdOk = (k: unknown): k is string => typeof k === 'string' && /^[A-Za-z0-9+/]{43}=$/.test(k);

export async function appRoute(path: string, body: Record<string, unknown> | null, env: Env, now: number, root?: string): Promise<Response> {
  const site = typeof body?.site === 'string' && Object.hasOwn(APPS, body.site) ? body.site : null;
  if (!site) return reply(400, { error: 'bad_request' });
  const app = APPS[site];
  if (path === '/attest/challenge') {
    const c = b64url(crypto.getRandomValues(new Uint8Array(32)));
    await env.DB.prepare('INSERT INTO attest_challenges (challenge, site, expires) VALUES (?, ?, ?)').bind(c, site, now + CHALLENGE_MS).run();
    return reply(200, { challenge: c, expires: new Date(now + CHALLENGE_MS).toISOString() });
  }
  if (path === '/attest') {
    const { keyId, attestation, bundleId } = body!;
    if (!keyIdOk(keyId) || typeof attestation !== 'string' || attestation.length > 20_000 || typeof bundleId !== 'string') return reply(400, { error: 'bad_request' });
    const challenge = await takeChallenge(env, site, body!.challenge, now);
    const ok = challenge && (await verifyAttestation({ keyId, attestation, challenge, bundleId }, app, now, root));
    if (!ok) return reply(401, { error: 'attest' });
    await env.DB.prepare(
      `INSERT INTO attest_keys (key_id, site, bundle_id, env, public_key, counter, created, last_used) VALUES (?, ?, ?, ?, ?, 0, ?, ?)
       ON CONFLICT (key_id) DO NOTHING`,
    ).bind(keyId, site, bundleId, ok.env as AttestEnv, btoa(String.fromCharCode(...ok.spki)), now, now).run();
    return reply(200, await issue(env, site, keyId, now));
  }
  if (path === '/token') {
    const { keyId, assertion } = body!;
    if (!keyIdOk(keyId) || typeof assertion !== 'string' || assertion.length > 4_000) return reply(400, { error: 'bad_request' });
    const challenge = await takeChallenge(env, site, body!.challenge, now);
    const row = await env.DB.prepare('SELECT bundle_id, public_key, counter FROM attest_keys WHERE key_id = ? AND site = ?').bind(keyId, site)
      .first<{ bundle_id: string; public_key: string; counter: number }>();
    const counter = challenge && row
      ? await verifyAssertion({ assertion, challenge, bundleId: row.bundle_id, spki: b64(row.public_key), counter: row.counter }, app)
      : null;
    if (counter == null) return reply(401, { error: 'attest' });
    // Only move the counter forward (two refreshes at once can't both win).
    const moved = await env.DB.prepare('UPDATE attest_keys SET counter = ?, last_used = ? WHERE key_id = ? AND counter < ? RETURNING key_id').bind(counter, now, keyId, counter).first();
    return moved ? reply(200, await issue(env, site, keyId, now)) : reply(401, { error: 'attest' });
  }
  return reply(404, { error: 'not_found' });
}

/** Daily clean-up: used-up challenges, and app keys unused for KEY_RETENTION_DAYS. */
export function purgeApps(env: Env, now: number) {
  return [
    env.DB.prepare('DELETE FROM attest_challenges WHERE expires < ?').bind(now),
    env.DB.prepare('DELETE FROM attest_keys WHERE last_used < ?').bind(now - KEY_RETENTION_DAYS * 86_400_000),
  ];
}
