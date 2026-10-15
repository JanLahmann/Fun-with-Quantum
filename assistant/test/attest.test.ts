import { beforeAll, describe, expect, it } from 'vitest';
import { cbor, verifyAssertion, verifyAttestation, type AppConfig } from '../src/attest';
import { cborEncode, makeAttestation, makeCa } from './appattest-fixture';

const APP: AppConfig = { teamId: 'TEAM123456', bundles: { 'de.example.app': ['production'], 'de.example.app.dev': ['production', 'development'] } };
// Now, at each check: the test certificates are made during the run.
const NOW_ = () => Date.now();
const challenge = crypto.getRandomValues(new Uint8Array(32));
let ca: ReturnType<typeof makeCa>;
beforeAll(() => { ca = makeCa(); });

describe('cbor', () => {
  it('decodes what App Attest sends, and rejects trailing bytes', () => {
    const m = cbor(cborEncode({ fmt: 'x', n: [1, 300, 70000], b: Uint8Array.of(1, 2) })) as Map<string, unknown>;
    expect(m.get('fmt')).toBe('x');
    expect(m.get('n')).toEqual([1, 300, 70000]);
    expect(() => cbor(Uint8Array.of(0x01, 0x02))).toThrow();
  });
});

describe('App Attest', () => {
  it('accepts a valid attestation, then assertions with a rising counter', async () => {
    const a = await makeAttestation(ca, { teamId: APP.teamId, bundleId: 'de.example.app', challenge });
    const ok = await verifyAttestation({ keyId: a.keyId, attestation: a.attestation, challenge, bundleId: 'de.example.app' }, APP, NOW_(), ca.rootB64);
    expect(ok?.env).toBe('production');
    const c2 = crypto.getRandomValues(new Uint8Array(32));
    expect(await verifyAssertion({ assertion: await a.assert(c2, 1), challenge: c2, bundleId: 'de.example.app', spki: ok!.spki, counter: 0 }, APP)).toBe(1);
    // replayed or lower counter, wrong challenge, other bundle: refused
    expect(await verifyAssertion({ assertion: await a.assert(c2, 1), challenge: c2, bundleId: 'de.example.app', spki: ok!.spki, counter: 1 }, APP)).toBeNull();
    expect(await verifyAssertion({ assertion: await a.assert(c2, 2), challenge, bundleId: 'de.example.app', spki: ok!.spki, counter: 1 }, APP)).toBeNull();
    expect(await verifyAssertion({ assertion: await a.assert(c2, 2, 'de.example.app.dev'), challenge: c2, bundleId: 'de.example.app', spki: ok!.spki, counter: 1 }, APP)).toBeNull();
  });

  it('refuses: Apple root instead of the test root, wrong challenge, bad nonce, wrong bundle or team, dev key for a release bundle', async () => {
    const a = await makeAttestation(ca, { teamId: APP.teamId, bundleId: 'de.example.app', challenge });
    const base = { keyId: a.keyId, attestation: a.attestation, challenge, bundleId: 'de.example.app' };
    expect(await verifyAttestation(base, APP, NOW_())).toBeNull(); // pinned Apple root: our test chain doesn't reach it
    expect(await verifyAttestation({ ...base, challenge: new Uint8Array(32) }, APP, NOW_(), ca.rootB64)).toBeNull();
    expect(await verifyAttestation({ ...base, bundleId: 'de.example.app.dev' }, APP, NOW_(), ca.rootB64)).toBeNull();
    expect(await verifyAttestation(base, { ...APP, teamId: 'OTHERTEAM1' }, NOW_(), ca.rootB64)).toBeNull();
    expect(await verifyAttestation({ ...base, keyId: btoa('x'.repeat(32)) }, APP, NOW_(), ca.rootB64)).toBeNull();
    expect(await verifyAttestation(base, APP, NOW_() + 40 * 86_400_000, ca.rootB64)).toBeNull(); // credential certificate expired
    const bad = await makeAttestation(ca, { teamId: APP.teamId, bundleId: 'de.example.app', challenge, badNonce: true });
    expect(await verifyAttestation({ ...base, keyId: bad.keyId, attestation: bad.attestation }, APP, NOW_(), ca.rootB64)).toBeNull();
    const dev = await makeAttestation(ca, { teamId: APP.teamId, bundleId: 'de.example.app', challenge, env: 'development' });
    expect(await verifyAttestation({ ...base, keyId: dev.keyId, attestation: dev.attestation }, APP, NOW_(), ca.rootB64)).toBeNull();
    const devOk = await makeAttestation(ca, { teamId: APP.teamId, bundleId: 'de.example.app.dev', challenge, env: 'development' });
    expect((await verifyAttestation({ keyId: devOk.keyId, attestation: devOk.attestation, challenge, bundleId: 'de.example.app.dev' }, APP, NOW_(), ca.rootB64))?.env).toBe('development');
    const counted = await makeAttestation(ca, { teamId: APP.teamId, bundleId: 'de.example.app', challenge, counter: 1 });
    expect(await verifyAttestation({ ...base, keyId: counted.keyId, attestation: counted.attestation }, APP, NOW_(), ca.rootB64)).toBeNull();
    expect(await verifyAttestation({ ...base, attestation: 'not-cbor' }, APP, NOW_(), ca.rootB64)).toBeNull();
  });
});
