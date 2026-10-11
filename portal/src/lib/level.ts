/**
 * The player's explanation level: kids, normal or math. One choice for the whole site, kept in
 * the browser (per-viewer convenience; the page works without it) and settable with ?level=…
 * in the address, e.g. in a link a teacher hands out. Used by the explainer for now.
 */
export const LEVELS = ['kids', 'normal', 'math'] as const;
export type Level = (typeof LEVELS)[number];
export const isLevel = (x: unknown): x is Level => typeof x === 'string' && (LEVELS as readonly string[]).includes(x);

const KEY = 'fwq-level';

export function getLevel(): Level {
  try {
    const fromUrl = new URLSearchParams(location.search).get('level');
    if (isLevel(fromUrl)) return fromUrl;
    const saved = localStorage.getItem(KEY);
    if (isLevel(saved)) return saved;
  } catch { /* no storage: default */ }
  return 'normal';
}

export function setLevel(level: Level): void {
  try { localStorage.setItem(KEY, level); } catch { /* best effort */ }
}
