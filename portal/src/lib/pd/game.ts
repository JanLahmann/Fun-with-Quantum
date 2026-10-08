/**
 * The quantum prisoner's dilemma — the logic, same as Prisoners-Dilemma.ipynb.
 * J. Eisert, M. Wilkens, M. Lewenstein, PRL 83, 3077 (1999); the catch: S. C. Benjamin,
 * P. M. Hayden, PRL 87, 069801 (2001).
 *
 * You are Alice (qubit 0), the computer is Bob (qubit 1). |0⟩ = C (cooperate), |1⟩ = D (defect).
 * Points (Alice, Bob): CC 3,3 · CD 0,5 · DC 5,0 · DD 1,1.
 * Quantum version: J = exp(i·π/4·D⊗D) = RYY(π/2) entangles, each player applies a move
 * U(θ, φ, α) = [[e^{iφ}cos(θ/2), e^{iα}sin(θ/2)], [−e^{−iα}sin(θ/2), e^{−iφ}cos(θ/2)]],
 * then J† and measurement. EWL use α = 0 (two parameters): C = U(0,0), D = U(π,0), Q = U(0,π/2).
 * As gates: U = Rz(−φ−α)·Ry(−θ)·Rz(−φ+α) — the circuit applies Rz(−φ+α) first.
 */
import { bitsOf, probabilities, run, sample, type Op } from '../qsim';
import type { Step } from '../games/circuit';

export type Bit = 0 | 1;
/** A move in degrees: θ ∈ [0, 180], φ ∈ [0, 90] for EWL's set; α = 0 there, any angle in the full set. */
export interface Move { theta: number; phi: number; alpha?: number }

export const C: Move = { theta: 0, phi: 0 };
export const D: Move = { theta: 180, phi: 0 };
export const Q: Move = { theta: 0, phi: 90 };
/** Benjamin and Hayden's counter to Q: iσx = U(π, ·, π/2). */
export const COUNTER_Q: Move = { theta: 180, phi: 0, alpha: 90 };
export const NAMED = { C, D, Q } as const;

/** Points for (Alice's move, Bob's move): index a + 2b with 0 = C, 1 = D (Qiskit order). */
export const ALICE_POINTS = [3, 5, 0, 1]; // CC, DC (Alice D), CD (Bob D), DD
export const BOB_POINTS = [3, 0, 5, 1];
export const points = (a: Bit, b: Bit) => [ALICE_POINTS[a + 2 * b], BOB_POINTS[a + 2 * b]] as const;

/* ------------------------------------------------------------------ classical */

/** Classically defecting dominates: whatever Bob does, D pays Alice more. */
export function bestClassicalReply(b: Bit): Bit {
  return points(1, b)[0] > points(0, b)[0] ? 1 : 0;
}

/* ------------------------------------------------------------------ quantum */

const rad = (deg: number) => (deg * Math.PI) / 180;

function moveOps(m: Move, q: number): Op[] {
  const t = rad(m.theta), p = rad(m.phi), a = rad(m.alpha ?? 0);
  return [{ g: 'rz', q, t: -p + a }, { g: 'ry', q, t: -t }, { g: 'rz', q, t: -p - a }];
}

export function gameOps(alice: Move, bob: Move): Op[] {
  return [{ g: 'ryy', a: 0, b: 1, t: Math.PI / 2 }, ...moveOps(alice, 0), ...moveOps(bob, 1), { g: 'ryy', a: 0, b: 1, t: -Math.PI / 2 }];
}

export function gameSteps(alice: Move, bob: Move): Step[] {
  return [
    { g: 'box', label: 'J', from: 0, to: 1, tone: 'prep' },
    ...moveOps(alice, 0).map((o) => ({ ...o, tone: 'alice' })),
    ...moveOps(bob, 1).map((o) => ({ ...o, tone: 'bob' })),
    { g: 'box', label: 'J†', from: 0, to: 1, tone: 'prep' },
    { g: 'measure' },
  ];
}

/** Exact probabilities of CC, DC, CD, DD (index a + 2b: Alice's bit a, Bob's bit b). */
export function outcomes(alice: Move, bob: Move): number[] {
  return probabilities(run(2, gameOps(alice, bob)));
}

/** Expected points (Alice, Bob). */
export function payoffs(alice: Move, bob: Move): [number, number] {
  const p = outcomes(alice, bob);
  return [p.reduce((s, x, i) => s + x * ALICE_POINTS[i], 0), p.reduce((s, x, i) => s + x * BOB_POINTS[i], 0)];
}

export interface Round { a: Bit; b: Bit; alice: number; bob: number }

export function playRound(alice: Move, bob: Move, rng: () => number = Math.random): Round {
  const [a, b] = bitsOf(sample(run(2, gameOps(alice, bob)), rng), 2) as Bit[];
  const [pa, pb] = points(a, b);
  return { a, b, alice: pa, bob: pb };
}

/** Alice's expected points over EWL's set, θ step 10°, φ step 5° — the payoff landscape. */
export function landscape(bob: Move): { thetas: number[]; phis: number[]; pts: number[][] } {
  const thetas = Array.from({ length: 19 }, (_, i) => i * 10), phis = Array.from({ length: 19 }, (_, i) => i * 5);
  return { thetas, phis, pts: phis.map((phi) => thetas.map((theta) => payoffs({ theta, phi }, bob)[0])) };
}

const wrap = (x: number) => ((x % 360) + 360) % 360;

/**
 * Alice's counter to any move of Bob among ALL one-qubit moves (three angles), in closed form:
 * U(180° − θ, α + 90°, φ + 180°) against U(θ, φ, α) earns her 5 and Bob 0 (Benjamin and Hayden:
 * every move has a counter). Against Q it is −iσx — the same move as iσx up to a global phase.
 */
export function counterMove(bob: Move): { move: Move; points: number } {
  const move = { theta: 180 - bob.theta, phi: wrap((bob.alpha ?? 0) + 90), alpha: wrap(bob.phi + 180) };
  return { move, points: payoffs(move, bob)[0] };
}

/** The four "orthogonal quaternion" moves I, iσx, iσy, iσz: played at random, every reply earns 2.25. */
export const QUATERNIONS: readonly Move[] = [
  { theta: 0, phi: 0, alpha: 0 }, // I
  { theta: 180, phi: 0, alpha: 90 }, // iσx
  { theta: 180, phi: 0, alpha: 0 }, // iσy = U(π, 0) = D
  { theta: 0, phi: 90, alpha: 0 }, // iσz = Q
];
export const MIXED_PAYOFF = (3 + 0 + 5 + 1) / 4;

export const randomMove = (rng: () => number = Math.random): Move =>
  ({ theta: Math.round(rng() * 180), phi: Math.floor(rng() * 360), alpha: Math.floor(rng() * 360) });
