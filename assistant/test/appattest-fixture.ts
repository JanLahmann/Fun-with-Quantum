/**
 * Test App Attest objects: a P-384 root and intermediate and a P-256 credential certificate made
 * with openssl (with the nonce extension), and a CBOR encoder — so the Worker's checks run on
 * real certificates and signatures. The root is a test root, never Apple's.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { concat } from '../src/attest';

const enc = new TextEncoder();
const sha = async (...p: Uint8Array[]) => new Uint8Array(await crypto.subtle.digest('SHA-256', concat(...p)));
const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join(':');
const b64 = (b: Uint8Array) => Buffer.from(b).toString('base64');
const derOf = (pem: string) => new Uint8Array(Buffer.from(pem.replace(/-----[^-]+-----|\s/g, ''), 'base64'));

/** CBOR for maps with string keys, byte strings, text, arrays and small ints. */
export function cborEncode(v: unknown): Uint8Array {
  const head = (major: number, n: number) => n < 24 ? Uint8Array.of((major << 5) | n)
    : n < 256 ? Uint8Array.of((major << 5) | 24, n) : n < 65536 ? Uint8Array.of((major << 5) | 25, n >> 8, n & 255)
    : Uint8Array.of((major << 5) | 26, n >>> 24, (n >> 16) & 255, (n >> 8) & 255, n & 255);
  if (typeof v === 'number') return head(0, v);
  if (typeof v === 'string') { const s = enc.encode(v); return concat(head(3, s.length), s); }
  if (v instanceof Uint8Array) return concat(head(2, v.length), v);
  if (Array.isArray(v)) return concat(head(4, v.length), ...v.map(cborEncode));
  const e = Object.entries(v as Record<string, unknown>);
  return concat(head(5, e.length), ...e.flatMap(([k, x]) => [cborEncode(k), cborEncode(x)]));
}

const run = (dir: string, ...args: string[]) => execFileSync('openssl', args, { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] });

/** A CA pair (root, intermediate) shared by the tests. */
export function makeCa() {
  const dir = mkdtempSync(join(tmpdir(), 'appattest-'));
  writeFileSync(join(dir, 'ca.ext'), 'basicConstraints=critical,CA:true\nkeyUsage=critical,keyCertSign,cRLSign\n');
  run(dir, 'ecparam', '-name', 'secp384r1', '-genkey', '-noout', '-out', 'root.key');
  run(dir, 'req', '-new', '-x509', '-key', 'root.key', '-sha384', '-days', '3650', '-subj', '/CN=Test App Attestation Root CA', '-out', 'root.pem');
  run(dir, 'ecparam', '-name', 'secp384r1', '-genkey', '-noout', '-out', 'int.key');
  run(dir, 'req', '-new', '-key', 'int.key', '-subj', '/CN=Test App Attestation CA 1', '-out', 'int.csr');
  run(dir, 'x509', '-req', '-in', 'int.csr', '-CA', 'root.pem', '-CAkey', 'root.key', '-CAcreateserial', '-sha384', '-days', '3650', '-extfile', 'ca.ext', '-out', 'int.pem');
  const pem = (f: string) => readFileSync(join(dir, f), 'utf8');
  return { dir, rootB64: b64(derOf(pem('root.pem'))), intDer: derOf(pem('int.pem')) };
}

export const AAGUID = { production: concat(enc.encode('appattest'), new Uint8Array(7)), development: enc.encode('appattestdevelop') };

/** A fresh app key with its attestation for `challenge`, and a signer for later assertions. */
export async function makeAttestation(ca: ReturnType<typeof makeCa>, o: {
  teamId: string; bundleId: string; challenge: Uint8Array; env?: 'production' | 'development'; badNonce?: boolean; counter?: number;
}) {
  const { dir } = ca;
  const tag = Math.random().toString(36).slice(2, 8);
  run(dir, 'ecparam', '-name', 'prime256v1', '-genkey', '-noout', '-out', `leaf-${tag}.key`);
  run(dir, 'pkcs8', '-topk8', '-nocrypt', '-in', `leaf-${tag}.key`, '-out', `leaf-${tag}.p8`);
  run(dir, 'ec', '-in', `leaf-${tag}.key`, '-pubout', '-out', `leaf-${tag}.pub`);
  const spki = derOf(readFileSync(join(dir, `leaf-${tag}.pub`), 'utf8'));
  const point = spki.slice(spki.length - 65);
  const keyId = await sha(point);
  const rpIdHash = await sha(enc.encode(`${o.teamId}.${o.bundleId}`));
  const authData = concat(rpIdHash, Uint8Array.of(0x40), Uint8Array.of(0, 0, 0, o.counter ?? 0), AAGUID[o.env ?? 'production'],
    Uint8Array.of(0, 32), keyId, cborEncode({ 1: 2 } as never));
  const nonce = await sha(authData, await sha(o.challenge));
  if (o.badNonce) nonce[0] ^= 1;
  writeFileSync(join(dir, `leaf-${tag}.ext`), `1.2.840.113635.100.8.2=DER:${hex(concat(Uint8Array.of(0x30, 0x24, 0xa1, 0x22, 0x04, 0x20), nonce))}\n`);
  run(dir, 'req', '-new', '-key', `leaf-${tag}.key`, '-subj', `/CN=key-${tag}`, '-out', `leaf-${tag}.csr`);
  run(dir, 'x509', '-req', '-in', `leaf-${tag}.csr`, '-CA', 'int.pem', '-CAkey', 'int.key', '-CAcreateserial', '-sha256', '-days', '30', '-extfile', `leaf-${tag}.ext`, '-out', `leaf-${tag}.pem`);
  const leafDer = derOf(readFileSync(join(dir, `leaf-${tag}.pem`), 'utf8'));
  const attestation = cborEncode({ fmt: 'apple-appattest', attStmt: { x5c: [leafDer, ca.intDer], receipt: new Uint8Array(0) }, authData });
  const priv = await crypto.subtle.importKey('pkcs8', derOf(readFileSync(join(dir, `leaf-${tag}.p8`), 'utf8')), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  /** An assertion for `challenge` with `counter` (WebCrypto signs raw r‖s; Apple sends DER). */
  const assert = async (challenge: Uint8Array, counter: number, bundleId = o.bundleId) => {
    const auth = concat(await sha(enc.encode(`${o.teamId}.${bundleId}`)), Uint8Array.of(0x40), Uint8Array.of(counter >>> 24, (counter >> 16) & 255, (counter >> 8) & 255, counter & 255));
    const raw = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, priv, await sha(auth, await sha(challenge))));
    const int = (x: Uint8Array) => { let i = 0; while (i < x.length - 1 && x[i] === 0) i++; const y = x.slice(i); return y[0] & 0x80 ? concat(Uint8Array.of(0), y) : y; };
    const r = int(raw.slice(0, 32)), s = int(raw.slice(32));
    const der = concat(Uint8Array.of(0x30, r.length + s.length + 4, 0x02, r.length), r, Uint8Array.of(0x02, s.length), s);
    return b64(cborEncode({ signature: der, authenticatorData: auth }));
  };
  return { keyId: b64(keyId), attestation: b64(attestation), assert };
}
