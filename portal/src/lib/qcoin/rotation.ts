/**
 * 3D orientation of the coin. The coin's orientation is a rotation R of the Bloch sphere: every
 * gate multiplies R by the gate's rotation, so the coin's face normal always equals the Bloch
 * vector of the qubit (heads up = |0⟩, tails up = |1⟩, standing facing you = |+⟩, standing
 * showing its back = |−⟩).
 *
 * Plain 3×3 row-major matrices; `toCss` turns a Bloch-frame orientation into a CSS matrix3d.
 */
import type { Vec3 } from './qubit';

export type Mat3 = readonly [number, number, number, number, number, number, number, number, number];

export const IDENTITY: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export function mul(a: Mat3, b: Mat3): Mat3 {
  const r = new Array(9).fill(0) as number[];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      for (let k = 0; k < 3; k++) r[i * 3 + j] += a[i * 3 + k] * b[k * 3 + j];
  return r as unknown as Mat3;
}

export function apply(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ];
}

/** Rotation by `angle` (rad) about the unit `axis` — Rodrigues' formula, right-hand rule. */
export function axisAngle(axis: Vec3, angle: number): Mat3 {
  const [x, y, z] = normalize(axis);
  const co = Math.cos(angle), si = Math.sin(angle), t = 1 - co;
  return [
    t * x * x + co, t * x * y - si * z, t * x * z + si * y,
    t * x * y + si * z, t * y * y + co, t * y * z - si * x,
    t * x * z - si * y, t * y * z + si * x, t * z * z + co,
  ];
}

export function normalize(v: Vec3): Vec3 {
  const n = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / n, v[1] / n, v[2] / n];
}

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** The coin's face normal in the Bloch frame for orientation R (coin starts heads-up: normal +z). */
export function normalOf(r: Mat3): Vec3 {
  return apply(r, [0, 0, 1]);
}

/**
 * Smallest rotation that turns the coin's normal from where it points now to `target` —
 * used for the measurement "fall" (coin on its edge tips over to heads or tails).
 */
export function tipTo(r: Mat3, target: Vec3): { axis: Vec3; angle: number } {
  const n = normalize(normalOf(r));
  const t = normalize(target);
  const d = Math.max(-1, Math.min(1, dot(n, t)));
  const angle = Math.acos(d);
  let axis = cross(n, t);
  if (Math.hypot(...axis) < 1e-9) axis = [1, 0, 0]; // already there, or exactly opposite: any perpendicular axis
  return { axis: normalize(axis), angle };
}

/**
 * Bloch frame → CSS frame. CSS: x right, y down, z toward the viewer — a LEFT-handed frame on
 * screen (y points down). Bloch z (heads) = up = CSS −y, Bloch x (|+⟩) = toward the viewer = CSS +z,
 * and for a right-handed Bloch sphere Bloch y must then point to the viewer's right = CSS +x
 * (the textbook picture: x out of the page, y right, z up). Because the screen frame is
 * left-handed this matrix has det −1, and so does COIN_LOCAL below; their product keeps the coin
 * texture unmirrored. Columns are the images of Bloch x, y, z.
 */
const BLOCH_TO_CSS: Mat3 = [
  0, 1, 0,
  0, 0, -1,
  1, 0, 0,
];

/**
 * The coin element's local frame (CSS-style: x right, y down, z = front-face normal) expressed in
 * the Bloch frame for the starting orientation (heads up). The glyph's "up" points toward the
 * viewer, so that after H — the coin standing on its edge, the picture everyone remembers — the Q
 * reads upright and unmirrored (H maps Bloch x to z and y to −y). Lying flat the glyph is upside
 * down, but foreshortened.
 * local z → Bloch +z (normal up), local y (glyph's "down") → Bloch −x, local x → Bloch −y.
 */
const COIN_LOCAL: Mat3 = [
  0, -1, 0,
  -1, 0, 0,
  0, 0, 1,
];

/** Camera looks down at the table from `elevationDeg` above the horizon. */
function camera(elevationDeg: number): Mat3 {
  // rotate the world about CSS x so the table tilts toward the viewer
  return axisAngle([1, 0, 0], (-elevationDeg * Math.PI) / 180);
}

/**
 * A Bloch-frame vector as seen by the same camera as the coin, in CSS view space
 * (x right, y down, z toward the viewer) — used to draw the Bloch sphere next to the coin so both
 * are seen from the same angle.
 */
export function toView(v: Vec3, elevationDeg = 22): Vec3 {
  return apply(mul(camera(elevationDeg), BLOCH_TO_CSS), v);
}

/**
 * The Bloch sphere's own drawing angle: the textbook view, turned so the x axis (|+⟩) points to
 * the lower left instead of straight at the viewer — from the coin's head-on camera |±⟩ would
 * collapse onto the centre. It is the same vector as the coin's normal, just seen from the side.
 */
export function toSphereView(v: Vec3, azimuthDeg = -32, elevationDeg = 18): Vec3 {
  return apply(mul(camera(elevationDeg), mul(BLOCH_TO_CSS, axisAngle([0, 0, 1], (azimuthDeg * Math.PI) / 180))), v);
}

/** CSS `matrix3d(...)` for the coin element, given its Bloch-frame orientation. */
export function toCss(r: Mat3, elevationDeg = 22): string {
  const m = mul(camera(elevationDeg), mul(BLOCH_TO_CSS, mul(r, COIN_LOCAL)));
  // matrix3d is column-major
  const f = (v: number) => (Math.abs(v) < 1e-9 ? 0 : +v.toFixed(6));
  return `matrix3d(${f(m[0])},${f(m[3])},${f(m[6])},0,${f(m[1])},${f(m[4])},${f(m[7])},0,${f(m[2])},${f(m[5])},${f(m[8])},0,0,0,0,1)`;
}

/**
 * How far the coin's center must rise so its lowest rim point rests on the table: a coin lying
 * flat sits at 0, a coin on its edge stands at `radius`. Returned as a CSS translate3d in view space.
 */
export function lift(r: Mat3, radius: number, elevationDeg = 22): { css: string; height: number } {
  const n = normalOf(r);
  const height = radius * Math.sqrt(Math.max(0, 1 - n[2] * n[2])); // n[2] = Bloch z = world up
  const v = apply(camera(elevationDeg), [0, -height, 0]); // world up is CSS −y
  const f = (x: number) => +x.toFixed(3);
  return { css: `translate3d(${f(v[0])}px,${f(v[1])}px,${f(v[2])}px)`, height };
}

/** How much light the visible face catches (0..1) — a cheap Lambert term for a light above-front. */
export function shade(r: Mat3, elevationDeg = 22): number {
  const n = apply(mul(camera(elevationDeg), BLOCH_TO_CSS), normalOf(r)); // normal in view space
  const light = normalize([-0.3, -0.8, 0.6]); // up-left-front
  const towardViewer = n[2] >= 0 ? n : ([-n[0], -n[1], -n[2]] as Vec3); // whichever face we see
  return Math.max(0, dot(towardViewer, light));
}
