/**
 * Keeps only what a JSON Schema (the subset CleanJibe's session-state schema uses) allows: unknown
 * keys and values of the wrong type, enum, pattern, length or range are dropped; arrays are cut to
 * maxItems; an object that loses a required field is dropped as a whole.
 */
type Schema = Record<string, any>;
const DROP = Symbol('drop');

const typeOk = (v: unknown, t: string) =>
  t === 'null' ? v === null : t === 'integer' ? Number.isInteger(v) : t === 'number' ? typeof v === 'number' && Number.isFinite(v)
    : t === 'array' ? Array.isArray(v) : t === 'object' ? !!v && typeof v === 'object' && !Array.isArray(v) : typeof v === t;

function clean(v: unknown, s: Schema): unknown {
  if ('const' in s) return v === s.const ? v : DROP;
  if (s.enum) return s.enum.includes(v) ? v : DROP;
  const types: string[] | undefined = s.type === undefined ? undefined : Array.isArray(s.type) ? s.type : [s.type];
  if (types && !types.some((t) => typeOk(v, t))) return DROP;
  if (v === null) return v;
  if (typeof v === 'string') {
    if (s.maxLength !== undefined && v.length > s.maxLength) return DROP;
    if (s.pattern && !new RegExp(s.pattern).test(v)) return DROP;
    return v;
  }
  if (typeof v === 'number') {
    if ((s.minimum !== undefined && v < s.minimum) || (s.maximum !== undefined && v > s.maximum)) return DROP;
    return v;
  }
  if (Array.isArray(v)) {
    const out = v.slice(0, s.maxItems ?? v.length).map((x) => (s.items ? clean(x, s.items) : DROP)).filter((x) => x !== DROP);
    return out;
  }
  if (typeOk(v, 'object')) {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      if (!s.properties || !Object.hasOwn(s.properties, k)) continue; // additionalProperties: false throughout
      const c = clean(x, s.properties[k]);
      if (c !== DROP) out[k] = c;
    }
    return (s.required ?? []).every((k: string) => k in out) ? out : DROP;
  }
  return typeof v === 'boolean' ? v : DROP;
}

export function cleanBySchema(v: unknown, s: Schema): unknown | null {
  const c = clean(v, s);
  return c === DROP ? null : c;
}
