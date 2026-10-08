/**
 * The CHSH game — the logic, same as CHSH-Game.ipynb.
 *
 * Alice gets a random bit x, Bob a random bit y; without talking, they answer bits a and b. They
 * win if a ⊕ b = x · y: the same answer unless both got 1, then different answers.
 * (Clauser, Horne, Shimony, Holt 1969; studied as a nonlocal game by Cleve, Høyer, Toner, Watrous 2004.)
 *
 * Quantum strategy: a Bell pair (|00⟩ + |11⟩)/√2 — Alice holds qubit 0, Bob qubit 1. Each player
 * measures along a direction on the Bloch circle (the x–z plane), given as an angle in degrees from
 * +z toward +x: turn the qubit back by that angle (Ry(−φ)), then measure. Result 0 means "along the
 * direction", 1 "opposite". Best angles: Alice 0° and 90°, Bob 45° and −45° (IBM Quantum Learning
 * writes half these angles, the angle of the state vector: 0, π/4, ±π/8).
 */
import { bitsOf, probabilities, run, sample, type Op } from '../qsim';
import type { Step } from '../games/circuit';

export type Bit = 0 | 1;
export const BITS: readonly Bit[] = [0, 1];
/** The four questions (x, y). */
export const QUESTIONS: readonly (readonly [Bit, Bit])[] = [[0, 0], [0, 1], [1, 0], [1, 1]];

/** The rule: a ⊕ b = x · y. */
export const wins = (x: Bit, y: Bit, a: Bit, b: Bit) => (a ^ b) === (x & y);

/* ------------------------------------------------------------------ classical */

/** A classical strategy: Alice's answer to x = 0 and x = 1, Bob's to y = 0 and y = 1. */
export interface Strategy { alice: readonly [Bit, Bit]; bob: readonly [Bit, Bit] }

export function classicalWins(s: Strategy): number {
  return QUESTIONS.filter(([x, y]) => wins(x, y, s.alice[x], s.bob[y])).length;
}

/** All 2⁴ = 16 classical strategies and how many of the four questions each wins. */
export function allStrategies(): { strategy: Strategy; wins: number }[] {
  const out: { strategy: Strategy; wins: number }[] = [];
  for (const a0 of BITS) for (const a1 of BITS) for (const b0 of BITS) for (const b1 of BITS) {
    const strategy: Strategy = { alice: [a0, a1], bob: [b0, b1] };
    out.push({ strategy, wins: classicalWins(strategy) });
  }
  return out;
}

/** The simplest best strategy: both always answer 0 — wins every question but x = y = 1. */
export const ALWAYS_ZERO: Strategy = { alice: [0, 0], bob: [0, 0] };

/* ------------------------------------------------------------------ quantum */

/** Measurement directions in degrees: Alice's for x = 0, 1 and Bob's for y = 0, 1. */
export interface Angles { alice: readonly [number, number]; bob: readonly [number, number] }
export const BEST_ANGLES: Angles = { alice: [0, 90], bob: [45, -45] };

const rad = (deg: number) => (deg * Math.PI) / 180;
const BELL: Op[] = [{ g: 'h', q: 0 }, { g: 'cx', a: 0, b: 1 }];

/** Bell pair, then each player turns back by their angle; measuring follows. */
export function gameOps(alpha: number, beta: number): Op[] {
  return [...BELL, { g: 'ry', q: 0, t: rad(-alpha) }, { g: 'ry', q: 1, t: rad(-beta) }];
}

/** The game circuit for drawing: Bell pair | Alice's and Bob's turns | measurements. */
export function gameSteps(alpha: number, beta: number): Step[] {
  const [h, cx, ra, rb] = gameOps(alpha, beta);
  return [{ ...h, tone: 'prep' }, { ...cx, tone: 'prep' }, { g: 'barrier' }, { ...ra, tone: 'alice' }, { ...rb, tone: 'bob' }, { g: 'measure' }];
}

/** Exact probabilities of the answers (a, b) = 00, 10, 01, 11 — index a + 2b, Qiskit order. */
export function answerProbabilities(alpha: number, beta: number): number[] {
  return probabilities(run(2, gameOps(alpha, beta)));
}

/** Probability that Alice and Bob give the same answer: cos²(Δ/2), Δ the angle between their directions. */
export const sameFormula = (alpha: number, beta: number) => Math.cos(rad(alpha - beta) / 2) ** 2;

/** Exact win probability of question (x, y), from the simulated circuit. */
export function winProbability(x: Bit, y: Bit, angles: Angles = BEST_ANGLES): number {
  const p = answerProbabilities(angles.alice[x], angles.bob[y]);
  const same = Math.min(1, p[0] + p[3]); // rounding can give 1.0000000000000002, and 1 − same < 0 would print as −0.0%
  return x & y ? 1 - same : same;
}

/** Average over the four questions (each asked with probability 1/4). */
export function totalWin(angles: Angles = BEST_ANGLES): number {
  return QUESTIONS.reduce((s, [x, y]) => s + winProbability(x, y, angles), 0) / 4;
}

/** Correlation E = P(same) − P(different) = cos Δ. */
export const correlation = (alpha: number, beta: number) => Math.cos(rad(alpha - beta));

/** S = E₀₀ + E₀₁ + E₁₀ − E₁₁; the win rate is 1/2 + S/8. Classical |S| ≤ 2, quantum ≤ 2√2. */
export function chshS(angles: Angles = BEST_ANGLES): number {
  const E = (x: Bit, y: Bit) => correlation(angles.alice[x], angles.bob[y]);
  return E(0, 0) + E(0, 1) + E(1, 0) - E(1, 1);
}

/** The quantum limit: cos²(π/8) = 1/2 + √2/4 ≈ 85.36% (Tsirelson 1980). */
export const TSIRELSON_WIN = 0.5 + Math.SQRT2 / 4;

export interface Round { x: Bit; y: Bit; a: Bit; b: Bit; win: boolean }

export function playQuantum(x: Bit, y: Bit, angles: Angles = BEST_ANGLES, rng: () => number = Math.random): Round {
  const [a, b] = bitsOf(sample(run(2, gameOps(angles.alice[x], angles.bob[y])), rng), 2) as Bit[];
  return { x, y, a, b, win: wins(x, y, a, b) };
}

export function playClassical(s: Strategy, x: Bit, y: Bit): Round {
  const a = s.alice[x], b = s.bob[y];
  return { x, y, a, b, win: wins(x, y, a, b) };
}

export const randomBit = (rng: () => number = Math.random): Bit => (rng() < 0.5 ? 0 : 1);
