/**
 * A single qubit, exactly — the "quantum coin".
 *
 * The state is α|0⟩ + β|1⟩ with complex α, β. Heads is |0⟩, tails is |1⟩ (as in the notebook).
 * Every gate here is a 2×2 unitary; the same gate is also a rotation of the Bloch sphere, which is
 * what the 3D coin shows: the coin's face normal IS the Bloch vector.
 *
 * No dependencies, no randomness except where a caller passes one in (measure), so the whole
 * module is deterministic and unit-testable.
 */

export interface Complex {
  re: number;
  im: number;
}

export const c = (re: number, im = 0): Complex => ({ re, im });
const add = (a: Complex, b: Complex): Complex => c(a.re + b.re, a.im + b.im);
const mul = (a: Complex, b: Complex): Complex => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const abs2 = (a: Complex): number => a.re * a.re + a.im * a.im;
const conj = (a: Complex): Complex => c(a.re, -a.im);

/** [α, β] — amplitude of |0⟩ (heads) and |1⟩ (tails). */
export type State = readonly [Complex, Complex];

export const HEADS: State = [c(1), c(0)];
export const TAILS: State = [c(0), c(1)];

/** The coin moves. I/X are the classical ones (leave / turn); H, Z, S only exist in the quantum world. */
export type GateName = 'I' | 'X' | 'H' | 'Z' | 'S';

type Matrix = readonly [readonly [Complex, Complex], readonly [Complex, Complex]];

const R = Math.SQRT1_2;
export const GATES: Record<GateName, Matrix> = {
  I: [[c(1), c(0)], [c(0), c(1)]],
  X: [[c(0), c(1)], [c(1), c(0)]],
  H: [[c(R), c(R)], [c(R), c(-R)]],
  Z: [[c(1), c(0)], [c(0), c(-1)]],
  S: [[c(1), c(0)], [c(0), c(0, 1)]],
};

/**
 * Each gate as a Bloch-sphere rotation: axis (unit vector in Bloch x, y, z) and angle in radians.
 * Gates equal their rotation up to a global phase, which no measurement can see.
 * I is "no rotation" — the UI gives it a small wobble so a played move is still visible.
 */
export const GATE_ROTATIONS: Record<GateName, { axis: Vec3; angle: number }> = {
  I: { axis: [0, 0, 1], angle: 0 },
  X: { axis: [1, 0, 0], angle: Math.PI },
  H: { axis: [R, 0, R], angle: Math.PI },
  Z: { axis: [0, 0, 1], angle: Math.PI },
  S: { axis: [0, 0, 1], angle: Math.PI / 2 },
};

export function apply(gate: GateName, s: State): State {
  const m = GATES[gate];
  return [add(mul(m[0][0], s[0]), mul(m[0][1], s[1])), add(mul(m[1][0], s[0]), mul(m[1][1], s[1]))];
}

export function run(gates: readonly GateName[], start: State = HEADS): State {
  return gates.reduce((s, g) => apply(g, s), start);
}

/** Probability that measuring shows heads (|0⟩). */
export function pHeads(s: State): number {
  const p = abs2(s[0]) / (abs2(s[0]) + abs2(s[1]));
  return clean(p);
}

export type Vec3 = readonly [number, number, number];

/** Bloch vector (x, y, z): z = +1 heads, z = −1 tails, x = ±1 the two "coin on its edge" states |±⟩. */
export function bloch(s: State): Vec3 {
  const [a, b] = s;
  const ab = mul(conj(a), b); // ⟨α|β⟩-ish cross term: x = 2 Re(α*β), y = 2 Im(α*β)
  return [clean(2 * ab.re), clean(2 * ab.im), clean(abs2(a) - abs2(b))];
}

/** Collapse the coin: heads with probability pHeads. `rand` is injectable for tests. */
export function measure(s: State, rand: () => number = Math.random): 'heads' | 'tails' {
  return rand() < pHeads(s) ? 'heads' : 'tails';
}

/** Readable name of the four states the coin game can reach, or null for anything else. */
export function stateLabel(s: State): '|0⟩' | '|1⟩' | '|+⟩' | '|−⟩' | null {
  const [x, , z] = bloch(s);
  if (z === 1) return '|0⟩';
  if (z === -1) return '|1⟩';
  if (x === 1) return '|+⟩';
  if (x === -1) return '|−⟩';
  return null;
}

/** Round away float dust (1e-16) so equality checks and percentages are stable. */
function clean(v: number): number {
  const r = Math.round(v * 1e9) / 1e9;
  return Object.is(r, -0) ? 0 : r;
}
