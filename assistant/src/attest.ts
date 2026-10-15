/**
 * Apple App Attest for native app clients (CleanJibe's iPhone app), verified in the Worker with
 * WebCrypto and two small parsers (CBOR, DER) — no dependencies.
 *
 * Attestation (once per app install), after Apple's "Validating apps that connect to your server":
 *  1. x5c = [credCert, intermediate] chains to Apple's App Attestation Root CA (pinned below);
 *  2. nonce = SHA-256(authData ‖ SHA-256(challenge)) equals the credCert extension 1.2.840.113635.100.8.2;
 *  3. keyId = SHA-256(credCert's public key point);
 *  4. authData: rpIdHash = SHA-256("<TeamID>.<bundleId>"), counter 0, AAGUID appattest/appattestdevelop,
 *     credentialId = keyId.
 * Assertion (each token refresh): the stored key signs SHA-256(authenticatorData ‖ SHA-256(challenge)),
 * rpIdHash matches, the counter rises.
 */

/** Apple App Attestation Root CA, from https://www.apple.com/certificateauthority/Apple_App_Attestation_Root_CA.pem
 *  (SHA-256 fingerprint 1C:B9:82:3B:A2:8B:A6:AD:2D:33:A0:06:94:1D:E2:AE:4F:51:3E:F1:D4:E8:31:B9:F7:E0:FA:7B:62:42:C9:32). */
export const APPLE_APP_ATTEST_ROOT = 'MIICITCCAaegAwIBAgIQC/O+DvHN0uD7jG5yH2IXmDAKBggqhkjOPQQDAzBSMSYwJAYDVQQDDB1BcHBsZSBBcHAgQXR0ZXN0YXRpb24gUm9vdCBDQTETMBEGA1UECgwKQXBwbGUgSW5jLjETMBEGA1UECAwKQ2FsaWZvcm5pYTAeFw0yMDAzMTgxODMyNTNaFw00NTAzMTUwMDAwMDBaMFIxJjAkBgNVBAMMHUFwcGxlIEFwcCBBdHRlc3RhdGlvbiBSb290IENBMRMwEQYDVQQKDApBcHBsZSBJbmMuMRMwEQYDVQQIDApDYWxpZm9ybmlhMHYwEAYHKoZIzj0CAQYFK4EEACIDYgAERTHhmLW07ATaFQIEVwTtT4dyctdhNbJhFs/Ii2FdCgAHGbpphY3+d8qjuDngIN3WVhQUBHAoMeQ/cLiP1sOUtgjqK9auYen1mMEvRq9Sk3Jm5X8U62H+xTD3FE9TgS41o0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBSskRBTM72+aEH/pwyp5frq5eWKoTAOBgNVHQ8BAf8EBAMCAQYwCgYIKoZIzj0EAwMDaAAwZQIwQgFGnByvsiVbpTKwSga0kP0e8EeDS4+sQmTvb7vn53O5+FRXgeLhpJ06ysC5PrOyAjEAp5U4xDgEgllF7En3VcE3iexZZtKeYnpqtijVoyFraWVIyd/dganmrduC1bmTBGwD';

export type AttestEnv = 'production' | 'development';
export interface AppConfig { teamId: string; bundles: Record<string, AttestEnv[]> }

const enc = new TextEncoder();
export const b64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
export const b64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const sha256 = async (...parts: Uint8Array[]) => new Uint8Array(await crypto.subtle.digest('SHA-256', concat(...parts)));
export function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let i = 0;
  for (const p of parts) { out.set(p, i); i += p.length; }
  return out;
}
export const equal = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((x, i) => x === b[i]);

// --- CBOR (the subset App Attest uses: unsigned ints, byte and text strings, arrays, maps) ---
export function cbor(bytes: Uint8Array): unknown {
  let i = 0;
  const len = (info: number): number => {
    if (info < 24) return info;
    const n = info === 24 ? 1 : info === 25 ? 2 : info === 26 ? 4 : info === 27 ? 8 : 0;
    if (!n || i + n > bytes.length) throw new Error('cbor: length');
    let v = 0;
    for (let k = 0; k < n; k++) v = v * 256 + bytes[i++];
    return v;
  };
  const item = (depth: number): unknown => {
    if (depth > 16 || i >= bytes.length) throw new Error('cbor: depth');
    const b = bytes[i++], major = b >> 5, n = len(b & 31);
    if (major === 0) return n;
    if (major === 1) return -1 - n;
    if (major === 2 || major === 3) {
      if (i + n > bytes.length) throw new Error('cbor: short');
      const s = bytes.slice(i, i + n); i += n;
      return major === 2 ? s : new TextDecoder().decode(s);
    }
    if (major === 4) return Array.from({ length: n }, () => item(depth + 1));
    if (major === 5) {
      const m = new Map<unknown, unknown>();
      for (let k = 0; k < n; k++) m.set(item(depth + 1), item(depth + 1));
      return m;
    }
    throw new Error('cbor: type');
  };
  const v = item(0);
  if (i !== bytes.length) throw new Error('cbor: trailing');
  return v;
}

// --- DER ---
interface Tlv { tag: number; start: number; body: number; end: number }
function tlv(b: Uint8Array, i: number, end = b.length): Tlv {
  if (i + 2 > end) throw new Error('der: short');
  const tag = b[i];
  let len = b[i + 1], body = i + 2;
  if (len & 0x80) {
    const n = len & 0x7f;
    if (n < 1 || n > 3) throw new Error('der: length');
    len = 0;
    for (let k = 0; k < n; k++) len = len * 256 + b[body++];
  }
  if (body + len > end) throw new Error('der: overrun');
  return { tag, start: i, body, end: body + len };
}
function kids(b: Uint8Array, t: Tlv): Tlv[] {
  const out: Tlv[] = [];
  for (let i = t.body; i < t.end;) { const c = tlv(b, i, t.end); out.push(c); i = c.end; }
  return out;
}
const bytesOf = (b: Uint8Array, t: Tlv) => b.slice(t.start, t.end);
const bodyOf = (b: Uint8Array, t: Tlv) => b.slice(t.body, t.end);

export function oid(s: string): Uint8Array {
  const p = s.split('.').map(Number);
  const out = [40 * p[0] + p[1]];
  for (const v of p.slice(2)) {
    const stack = [v & 0x7f];
    for (let x = Math.floor(v / 128); x > 0; x = Math.floor(x / 128)) stack.unshift((x & 0x7f) | 0x80);
    out.push(...stack);
  }
  return Uint8Array.from(out);
}
const OID = {
  ecdsaSha256: oid('1.2.840.10045.4.3.2'), ecdsaSha384: oid('1.2.840.10045.4.3.3'),
  p256: oid('1.2.840.10045.3.1.7'), p384: oid('1.3.132.0.34'), nonce: oid('1.2.840.113635.100.8.2'),
};

export interface Cert { tbs: Uint8Array; sigAlg: Uint8Array; sig: Uint8Array; issuer: Uint8Array; subject: Uint8Array;
  notBefore: number; notAfter: number; spki: Uint8Array; curve: 'P-256' | 'P-384' | null; point: Uint8Array; ext: Map<string, Uint8Array> }

function time(b: Uint8Array, t: Tlv): number {
  const s = new TextDecoder().decode(bodyOf(b, t));
  const m = t.tag === 0x17 ? /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/.exec(s) : /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/.exec(s);
  if (!m) throw new Error('der: time');
  const y = t.tag === 0x17 ? (Number(m[1]) < 50 ? 2000 : 1900) + Number(m[1]) : Number(m[1]);
  return Date.UTC(y, Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6]));
}

export function parseCert(b: Uint8Array): Cert {
  const top = tlv(b, 0);
  if (top.end !== b.length) throw new Error('der: trailing');
  const [tbsT, algT, sigT] = kids(b, top);
  const f = kids(b, tbsT);
  const o = f[0].tag === 0xa0 ? 1 : 0; // [0] version
  const [, , issuerT, validityT, subjectT, spkiT] = f.slice(o);
  const [nb, na] = kids(b, validityT);
  const [spkiAlgT, keyT] = kids(b, spkiT);
  const spkiAlg = kids(b, spkiAlgT);
  const curveOid = spkiAlg[1] ? bodyOf(b, spkiAlg[1]) : new Uint8Array();
  const ext = new Map<string, Uint8Array>();
  const extWrap = f.find((x) => x.tag === 0xa3);
  if (extWrap) {
    for (const e of kids(b, kids(b, extWrap)[0])) {
      const parts = kids(b, e);
      ext.set(Array.from(bodyOf(b, parts[0])).join('.'), bodyOf(b, parts[parts.length - 1]));
    }
  }
  const sigBits = bodyOf(b, sigT);
  return {
    tbs: bytesOf(b, tbsT), sigAlg: bodyOf(b, kids(b, algT)[0]), sig: sigBits.slice(1),
    issuer: bytesOf(b, issuerT), subject: bytesOf(b, subjectT), notBefore: time(b, nb), notAfter: time(b, na),
    spki: bytesOf(b, spkiT), curve: equal(curveOid, OID.p256) ? 'P-256' : equal(curveOid, OID.p384) ? 'P-384' : null,
    point: bodyOf(b, keyT).slice(1), ext,
  };
}
const extKey = (o: Uint8Array) => Array.from(o).join('.');

/** DER ECDSA signature → the raw r‖s WebCrypto wants. */
export function rawSig(der: Uint8Array, size: number): Uint8Array {
  const t = tlv(der, 0);
  const [r, s] = kids(der, t).map((x) => bodyOf(der, x));
  const fit = (v: Uint8Array) => { const x = v.slice(Math.max(0, v.length - size)); return concat(new Uint8Array(size - x.length), x); };
  return concat(fit(r), fit(s));
}

async function verifySig(issuer: Cert, data: Uint8Array, derSig: Uint8Array, alg: Uint8Array): Promise<boolean> {
  const hash = equal(alg, OID.ecdsaSha256) ? 'SHA-256' : equal(alg, OID.ecdsaSha384) ? 'SHA-384' : null;
  if (!hash || !issuer.curve) return false;
  const key = await crypto.subtle.importKey('spki', issuer.spki, { name: 'ECDSA', namedCurve: issuer.curve }, false, ['verify']);
  return crypto.subtle.verify({ name: 'ECDSA', hash }, key, rawSig(derSig, issuer.curve === 'P-256' ? 32 : 48), data);
}

/** child is signed by parent, names chain, and both are valid now. */
async function signedBy(child: Cert, parent: Cert, now: number): Promise<boolean> {
  return equal(child.issuer, parent.subject) && now >= child.notBefore && now <= child.notAfter
    && now >= parent.notBefore && now <= parent.notAfter && verifySig(parent, child.tbs, child.sig, child.sigAlg);
}

interface AuthData { rpIdHash: Uint8Array; counter: number; aaguid?: Uint8Array; credId?: Uint8Array }
function authData(a: Uint8Array, attested: boolean): AuthData {
  if (a.length < 37) throw new Error('authData: short');
  const out: AuthData = { rpIdHash: a.slice(0, 32), counter: new DataView(a.buffer, a.byteOffset + 33, 4).getUint32(0) };
  if (attested) {
    if (a.length < 55) throw new Error('authData: short');
    out.aaguid = a.slice(37, 53);
    const n = (a[53] << 8) | a[54];
    out.credId = a.slice(55, 55 + n);
  }
  return out;
}
const AAGUID: Record<AttestEnv, Uint8Array> = {
  production: concat(enc.encode('appattest'), new Uint8Array(7)),
  development: enc.encode('appattestdevelop'),
};

/** Checks an attestation object; returns the key to store, or null. */
export async function verifyAttestation(
  o: { keyId: string; attestation: string; challenge: Uint8Array; bundleId: string }, app: AppConfig, now: number, rootB64 = APPLE_APP_ATTEST_ROOT,
): Promise<{ spki: Uint8Array; env: AttestEnv } | null> {
  try {
    const envs = Object.hasOwn(app.bundles, o.bundleId) ? app.bundles[o.bundleId] : null;
    if (!envs) return null;
    const obj = cbor(b64(o.attestation)) as Map<string, unknown>;
    const stmt = obj.get('attStmt') as Map<string, unknown>;
    const x5c = stmt?.get('x5c') as Uint8Array[];
    const auth = obj.get('authData') as Uint8Array;
    if (obj.get('fmt') !== 'apple-appattest' || !Array.isArray(x5c) || x5c.length !== 2 || !(auth instanceof Uint8Array)) return null;
    const [leaf, inter] = x5c.map(parseCert);
    const root = parseCert(b64(rootB64));
    if (!(await signedBy(inter, root, now)) || !(await signedBy(leaf, inter, now))) return null;
    const nonce = await sha256(auth, await sha256(o.challenge));
    const ext = leaf.ext.get(extKey(OID.nonce));
    // SEQUENCE { [1] EXPLICIT OCTET STRING (32) nonce }
    if (!ext || !equal(ext, concat(Uint8Array.from([0x30, 0x24, 0xa1, 0x22, 0x04, 0x20]), nonce))) return null;
    const keyId = b64(o.keyId);
    if (leaf.curve !== 'P-256' || !equal(await sha256(leaf.point), keyId)) return null;
    const ad = authData(auth, true);
    const env = (Object.keys(AAGUID) as AttestEnv[]).find((e) => equal(ad.aaguid!, AAGUID[e]));
    if (!env || !envs.includes(env)) return null;
    if (!equal(ad.rpIdHash, await sha256(enc.encode(`${app.teamId}.${o.bundleId}`))) || ad.counter !== 0 || !equal(ad.credId!, keyId)) return null;
    return { spki: leaf.spki, env };
  } catch {
    return null;
  }
}

/** Checks an assertion with the stored key; returns the new counter, or null. */
export async function verifyAssertion(
  o: { assertion: string; challenge: Uint8Array; bundleId: string; spki: Uint8Array; counter: number }, app: AppConfig,
): Promise<number | null> {
  try {
    const obj = cbor(b64(o.assertion)) as Map<string, unknown>;
    const sig = obj.get('signature') as Uint8Array, auth = obj.get('authenticatorData') as Uint8Array;
    if (!(sig instanceof Uint8Array) || !(auth instanceof Uint8Array)) return null;
    const ad = authData(auth, false);
    if (!equal(ad.rpIdHash, await sha256(enc.encode(`${app.teamId}.${o.bundleId}`))) || ad.counter <= o.counter) return null;
    const nonce = await sha256(auth, await sha256(o.challenge));
    const key = await crypto.subtle.importKey('spki', o.spki, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    return (await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, rawSig(sig, 32), nonce)) ? ad.counter : null;
  } catch {
    return null;
  }
}
