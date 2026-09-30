// Shared helpers for the Fun with Quantum family renderers.
import { readFileSync } from 'node:fs';

export function loadManifest(path) {
  const m = JSON.parse(readFileSync(path, 'utf8'));
  if (m.version !== 1 || !Array.isArray(m.members) || !m.brand?.name) {
    throw new Error(`Unexpected manifest shape in ${path}`);
  }
  return m;
}

/** Footer links for a given member: every visible member except itself, brand home first. */
export function footerLinks(manifest, selfId) {
  return manifest.members.filter((x) => x.footer && x.id !== selfId);
}

/** Short site name used as the prefix of every Umami event ("<label>: <what happened>"). */
export function eventLabel(manifest, id) {
  const x = manifest.members.find((mm) => mm.id === id);
  return x?.label ?? x?.name ?? id;
}

/** Umami event name for a click on a family-footer link on site `selfId`. */
export function footerEvent(manifest, selfId) {
  return `${eventLabel(manifest, selfId)}: family footer click`;
}
