/**
 * The mission picker of the tester helper. The Worker, not the model, decides which missions fit a
 * tester: their hardware covers the mission's needs, they haven't finished, skipped or started it,
 * and it is testable now; missions fewest testers have tried come first, then the tester's
 * interests, then the group order of tester-missions.json.
 */
import { LATEST_IMAGES, MISSION_GROUPS, MISSIONS, NEEDS_KEYS } from './tester.generated';

export interface Mission { id: string; group: string; title: string; goal: string; needs: string[]; maturity?: string; status?: string }
type Prefs = Record<string, unknown>;

const BY_ID = new Map((MISSIONS as Mission[]).map((m) => [m.id, m]));
export const isMission = (id: string) => BY_ID.has(id);
const groupTitle = (id: string) => MISSION_GROUPS.find((g) => g.id === id)?.title ?? id;
const groupOrder = (id: string) => MISSION_GROUPS.findIndex((g) => g.id === id);

/** Interests in the setup form → mission groups (fwq is the older name of play). */
const INTEREST_GROUPS: Record<string, string[]> = { core: ['core', 'user', 'advanced'], games: ['play', 'fwq'], leds: ['led'], coding: ['learn', 'advanced'], big: ['big'] };

/**
 * Does the tester's setup cover this need? The image is one choice (ab | single); a touchscreen is
 * a screen; internet is the default unless the tester ticked "offline system", and an IBM Quantum
 * account needs the internet too. An SD card of 32 GB or more is the default unless the tester ticked
 * "SD card smaller than 32 GB"; a development image means the tester chose the development stream.
 */
export function hasNeed(prefs: Prefs, need: string): boolean {
  const online = prefs.offline !== true;
  if (need === 'internet') return online;
  if (need === 'ibm-account') return online && prefs['ibm-account'] === true;
  if (need === 'ab-image') return prefs.image === 'ab';
  if (need === 'single-image') return prefs.image === 'single';
  if (need === 'display') return prefs.display === true || prefs.touchscreen === true;
  if (need === 'big-card') return prefs['small-card'] !== true;
  if (need === 'dev-image') return prefs.version === 'dev';
  return prefs[need] === true;
}

export const fits = (m: Mission, prefs: Prefs) => m.status !== 'coming' && m.needs.every((n) => hasNeed(prefs, n));

/** The next missions for this tester, best first. */
export function suggest(prefs: Prefs, states: Record<string, string>, triedBy: Record<string, number>, n = 3) {
  const interests = Array.isArray(prefs.interests) ? prefs.interests.flatMap((i) => INTEREST_GROUPS[String(i)] ?? []) : [];
  const order = (MISSIONS as Mission[]).map((m, i) => [m, i] as const)
    .filter(([m]) => fits(m, prefs) && !['started', 'done', 'skipped'].includes(states[m.id]))
    .sort(([a, ia], [b, ib]) =>
      (triedBy[a.id] ?? 0) - (triedBy[b.id] ?? 0)
      || Number(interests.includes(b.group)) - Number(interests.includes(a.group))
      || groupOrder(a.group) - groupOrder(b.group) || ia - ib);
  return order.slice(0, n).map(([m]) => ({
    id: m.id, title: m.title, goal: m.goal, group: groupTitle(m.group),
    needs: m.needs.map((k) => (NEEDS_KEYS as Record<string, string>)[k] ?? k),
    beta: m.maturity === 'beta', tried_by: triedBy[m.id] ?? 0,
  }));
}

/** Per group: missions done of those that fit the tester (only groups with any that fit). */
export function progress(prefs: Prefs, states: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const g of MISSION_GROUPS) {
    const fit = (MISSIONS as Mission[]).filter((m) => m.group === g.id && fits(m, prefs));
    if (!fit.length) continue;
    const done = fit.filter((m) => states[m.id] === 'done').length;
    out[g.title] = done === fit.length ? `all ${fit.length} done` : `${done} of ${fit.length} done`;
  }
  return out;
}

/** Missions the tester started but hasn't finished. */
export const started = (states: Record<string, string>) =>
  Object.entries(states).filter(([id, s]) => s === 'started' && BY_ID.has(id)).map(([id]) => ({ id, title: BY_ID.get(id)!.title }));

/** What the widget needs to draw mission cards (not the ones that are coming). */
export const catalogue = () => (MISSIONS as Mission[]).filter((m) => m.status !== 'coming').map(({ id, title, goal, group, maturity }) => ({ id, title, goal, group: groupTitle(group), beta: maturity === 'beta' }));

/** The image stream and build time of a release tag: beta-2026-10-10-053754, development-2026-10-15-094105. */
export function imageTag(tag: unknown): { stream: 'beta' | 'dev'; stamp: string } | null {
  const m = typeof tag === 'string' ? /^(beta|development)-(\d{4}-\d{2}-\d{2}-\d{6})$/.exec(tag) : null;
  return m ? { stream: m[1] === 'beta' ? 'beta' : 'dev', stamp: m[2] } : null;
}

/**
 * Testers must run the newest beta or development image. Uses the tester's choice in "My setup"
 * and, on a Pi, the image the Pi reports; an image older than the newest of its stream (or
 * "older or not sure") means: update first.
 */
export function versionCheck(prefs: Prefs, deviceVersion: unknown, latest: { beta: string | null; dev: string | null } = LATEST_IMAGES) {
  const dev = imageTag(deviceVersion);
  const chosen = prefs.version === 'beta' || prefs.version === 'dev' || prefs.version === 'older' ? prefs.version : null;
  const stream = dev?.stream ?? (chosen === 'beta' || chosen === 'dev' ? chosen : null);
  const newest = stream ? latest[stream] : null;
  let update: string | null = null;
  if (dev && newest && dev.stamp < (imageTag(newest)?.stamp ?? '')) update = `this Pi runs ${deviceVersion as string}, the newest ${stream} image is ${newest}`;
  else if (!dev && chosen === 'older') update = 'the tester chose "older or not sure" in My setup';
  else if (!dev && !chosen) update = 'the tester has not said which version they run (My setup)';
  return { chosen, device: typeof deviceVersion === 'string' ? deviceVersion : null, newest_beta: latest.beta, newest_dev: latest.dev, update_needed: update !== null, reason: update };
}
