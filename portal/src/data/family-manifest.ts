/**
 * Fun with Quantum family manifest (build time only).
 *
 * Source of truth: /family/family.json in this repo — the portal reads it straight from disk,
 * so the footer can never lag behind the roster. Other member sites fetch the same file from
 * https://raw.githubusercontent.com/JanLahmann/Fun-with-Quantum/master/family/family.json
 * (with a vendored fallback) and get rebuilt via repository_dispatch when it changes.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface FamilyMember {
  id: string;
  name: string;
  url: string;
  short?: string;
  repo?: string;
  door?: 'home' | 'play' | 'build' | 'learn';
  tagline?: string;
  footer: boolean;
  note?: string;
}
export interface FamilyManifest {
  version: number;
  updated: string;
  brand: {
    name: string;
    id: string;
    url: string;
    footer_lead: string;
    tagline: { s: string; m: string; l: string };
    credit: string;
    credit_url: string;
  };
  members: FamilyMember[];
}

export const SELF_ID = 'fun-with-quantum';

/** The build runs with cwd = portal/ (locally and in withastro/action); tolerate the repo root too. */
function manifestPath(): string {
  const candidates = ['../family/family.json', 'family/family.json'].map((p) => resolve(process.cwd(), p));
  const hit = candidates.find((p) => existsSync(p));
  if (!hit) throw new Error(`family/family.json not found (looked in: ${candidates.join(', ')})`);
  return hit;
}

let cached: FamilyManifest | undefined;

export function loadFamily(): FamilyManifest {
  if (cached) return cached;
  const m = JSON.parse(readFileSync(manifestPath(), 'utf8')) as FamilyManifest;
  if (m.version !== 1 || !Array.isArray(m.members) || typeof m.brand?.name !== 'string') {
    throw new Error(`family/family.json: unexpected manifest shape`);
  }
  cached = m;
  return m;
}

/** Every visible member except this site, in manifest order. */
export function footerLinks(m: FamilyManifest, selfId = SELF_ID): FamilyMember[] {
  return m.members.filter((x) => x.footer && x.id !== selfId);
}
