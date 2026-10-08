/**
 * A tiny exact state-vector simulator for a handful of qubits — enough for the GHZ game (3), the
 * magic square (4), 3-SAT (up to 6) and the CHSH game (2, with Ry rotations). Qubit 0 is the least significant bit of a basis index, as in Qiskit.
 *
 * Deterministic except where a caller passes a random source (sample), so it is unit-testable.
 */

export type Gate1 = 'h' | 'x' | 'y' | 'z' | 's' | 'sdg';
export type Gate2 = 'cx' | 'cz' | 'swap';
/**
 * One circuit step. For cx, `a` is the control and `b` the target. `ry` turns by `t` radians about
 * the y axis, as Qiskit's RYGate: [[cos t/2, −sin t/2], [sin t/2, cos t/2]].
 */
export type Op = { g: Gate1; q: number } | { g: 'ry'; q: number; t: number } | { g: Gate2; a: number; b: number };

export interface State {
  n: number;
  re: Float64Array;
  im: Float64Array;
}

export function zero(n: number): State {
  const re = new Float64Array(1 << n), im = new Float64Array(1 << n);
  re[0] = 1;
  return { n, re, im };
}

const R = Math.SQRT1_2;

function apply1(s: State, g: Gate1 | 'ry', q: number, t = 0) {
  const bit = 1 << q;
  const c = Math.cos(t / 2), sn = Math.sin(t / 2);
  for (let i = 0; i < s.re.length; i++) {
    if (i & bit) continue;
    const j = i | bit;
    const ar = s.re[i], ai = s.im[i], br = s.re[j], bi = s.im[j];
    switch (g) {
      case 'h': s.re[i] = R * (ar + br); s.im[i] = R * (ai + bi); s.re[j] = R * (ar - br); s.im[j] = R * (ai - bi); break;
      case 'x': s.re[i] = br; s.im[i] = bi; s.re[j] = ar; s.im[j] = ai; break;
      case 'y': s.re[i] = bi; s.im[i] = -br; s.re[j] = -ai; s.im[j] = ar; break; // [[0,−i],[i,0]]
      case 'z': s.re[j] = -br; s.im[j] = -bi; break;
      case 's': s.re[j] = -bi; s.im[j] = br; break; // ·i
      case 'sdg': s.re[j] = bi; s.im[j] = -br; break; // ·(−i)
      case 'ry': s.re[i] = c * ar - sn * br; s.im[i] = c * ai - sn * bi; s.re[j] = sn * ar + c * br; s.im[j] = sn * ai + c * bi; break;
    }
  }
}

function apply2(s: State, g: Gate2, a: number, b: number) {
  const A = 1 << a, B = 1 << b;
  for (let i = 0; i < s.re.length; i++) {
    switch (g) {
      case 'cz':
        if (i & A && i & B) { s.re[i] = -s.re[i]; s.im[i] = -s.im[i]; }
        break;
      case 'cx': // swap the amplitudes of |…1…0…⟩ and |…1…1…⟩ (control a set), once per pair
        if (i & A && !(i & B)) swapAmp(s, i, i | B);
        break;
      case 'swap': // swap |a=1,b=0⟩ with |a=0,b=1⟩
        if (i & A && !(i & B)) swapAmp(s, i, (i & ~A) | B);
        break;
    }
  }
}

function swapAmp(s: State, i: number, j: number) {
  const r = s.re[i], m = s.im[i];
  s.re[i] = s.re[j]; s.im[i] = s.im[j];
  s.re[j] = r; s.im[j] = m;
}

export function apply(s: State, op: Op): State {
  const t: State = { n: s.n, re: s.re.slice(), im: s.im.slice() };
  if ('q' in op) apply1(t, op.g, op.q, op.g === 'ry' ? op.t : 0);
  else apply2(t, op.g, op.a, op.b);
  return t;
}

export function run(n: number, ops: readonly Op[]): State {
  return ops.reduce(apply, zero(n));
}

/** Probability of each basis index. */
export function probabilities(s: State): number[] {
  return Array.from(s.re, (r, i) => r * r + s.im[i] * s.im[i]);
}

/** One measurement of all qubits: a basis index drawn with its probability. */
export function sample(s: State, rng: () => number = Math.random): number {
  const p = probabilities(s);
  let u = rng();
  for (let i = 0; i < p.length; i++) {
    u -= p[i];
    if (u < 0) return i;
  }
  return p.length - 1 - [...p].reverse().findIndex((x) => x > 0); // rounding: the last possible outcome
}

/** The bits of a basis index, qubit 0 first. */
export function bitsOf(index: number, n: number): number[] {
  return Array.from({ length: n }, (_, q) => (index >> q) & 1);
}

/** Bit string as Qiskit prints it: highest qubit first, e.g. qubits [1,0,0] → "001". */
export function label(index: number, n: number): string {
  return bitsOf(index, n).reverse().join('');
}
