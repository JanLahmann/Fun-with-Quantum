/**
 * CleanJibe's app facts sent with every question (both contexts): which app, channel and version,
 * and the rider's units. Unknown or malformed fields are dropped.
 */
export function appState(raw: unknown): Record<string, unknown> | null {
  const s = (raw ?? {}) as Record<string, unknown>;
  if (typeof s !== 'object' || Array.isArray(s)) return null;
  const out: Record<string, unknown> = {};
  if (s.surface === 'ios' || s.surface === 'web') out.surface = s.surface;
  if (s.channel === 'release' || s.channel === 'beta' || s.channel === 'dev') out.channel = s.channel;
  if (typeof s.appVersion === 'string' && /^\d{1,3}(\.\d{1,3}){1,2}$/.test(s.appVersion)) out.appVersion = s.appVersion;
  if (Number.isInteger(s.build) && (s.build as number) > 0 && (s.build as number) < 1e6) out.build = s.build;
  if (typeof s.engineVersion === 'string' && /^\d{1,3}(\.\d{1,3}){1,2}$/.test(s.engineVersion)) out.engineVersion = s.engineVersion;
  const u = s.units as Record<string, unknown> | undefined;
  if (u && typeof u === 'object') {
    const units: Record<string, string> = {};
    if (['kn', 'kmh', 'mph', 'ms'].includes(u.speed as string)) units.speed = u.speed as string;
    if (['km', 'mi', 'nm'].includes(u.distance as string)) units.distance = u.distance as string;
    if (Object.keys(units).length) out.units = units;
  }
  return out;
}
