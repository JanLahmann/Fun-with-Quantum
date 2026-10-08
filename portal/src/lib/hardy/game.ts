/**
 * Hardy's paradox — the logic, same as Hardys-Paradox.ipynb (L. Hardy, PRL 68, 2981 (1992) and
 * PRL 71, 1665 (1993); the two-qubit version follows an earlier chapter of the Qiskit Textbook, the car
 * story the first version of Hardys-Paradox.ipynb, 2020).
 *
 * Two cars leave a factory; far apart, an inspector checks each car's color or its engine.
 * Car 1 is qubit 0, car 2 is qubit 1. Color = measure Z: 0 red, 1 blue. Engine = measure along an
 * arrow at angle φ on the Bloch circle (Ry(−φ), then measure): 0 gasoline, 1 diesel. φ = 90° is X.
 *
 * Three facts (each forbidden outcome has probability 0):
 *   1  color · color:   never both red
 *   2  engine · color:  if car 1 is diesel, car 2 is red   (never diesel + blue)
 *   3  color · engine:  if car 2 is diesel, car 1 is red   (never blue + diesel)
 * Classical logic then forbids "both diesel" — which quantum mechanics still produces:
 * 1/12 at φ = 90°, at most (5√5 − 11)/2 ≈ 9.02% at cos²(φ/2) = (√5 − 1)/2, φ ≈ 76.35°.
 */
import { bitsOf, probabilities, run, sample, type Op } from '../qsim';
import type { Step } from '../games/circuit';

export type Bit = 0 | 1;
/** What an inspector checks: 0 = color, 1 = engine. */
export type Check = 0 | 1;
export const CHECKS: readonly (readonly [Check, Check])[] = [[0, 0], [0, 1], [1, 0], [1, 1]];
export const RED = 0, BLUE = 1, GASOLINE = 0, DIESEL = 1;

/** The forbidden outcome of each check pair (car 1, car 2), or null for engine · engine. */
export function forbidden(c1: Check, c2: Check): readonly [Bit, Bit] | null {
  if (!c1 && !c2) return [RED, RED]; // fact 1
  if (c1 && !c2) return [DIESEL, BLUE]; // fact 2
  if (!c1 && c2) return [BLUE, DIESEL]; // fact 3
  return null;
}
export const bothDiesel = (c1: Check, c2: Check, r1: Bit, r2: Bit) => !!(c1 && c2) && r1 === DIESEL && r2 === DIESEL;
export const breaksFact = (c1: Check, c2: Check, r1: Bit, r2: Bit) => {
  const f = forbidden(c1, c2);
  return !!f && f[0] === r1 && f[1] === r2;
};

/* ------------------------------------------------------------------ classical */

/** A hidden spec sheet per car: its color and its engine. */
export interface Card { color: Bit; engine: Bit }
export interface Cards { car1: Card; car2: Card }

export const answer = (card: Card, c: Check): Bit => (c ? card.engine : card.color);

/** Does this pair of cards keep all three facts, whatever the inspectors check? */
export function keepsFacts(k: Cards): boolean {
  return CHECKS.every(([c1, c2]) => !breaksFact(c1, c2, answer(k.car1, c1), answer(k.car2, c2)));
}

/** All 4 × 4 = 16 pairs of cards: which keep the facts, and which make both cars diesel. */
export function allCards(): { cards: Cards; keeps: boolean; bothDiesel: boolean }[] {
  const out: { cards: Cards; keeps: boolean; bothDiesel: boolean }[] = [];
  for (const c1 of [0, 1] as Bit[]) for (const e1 of [0, 1] as Bit[]) for (const c2 of [0, 1] as Bit[]) for (const e2 of [0, 1] as Bit[]) {
    const cards: Cards = { car1: { color: c1, engine: e1 }, car2: { color: c2, engine: e2 } };
    out.push({ cards, keeps: keepsFacts(cards), bothDiesel: e1 === DIESEL && e2 === DIESEL });
  }
  return out;
}

/* ------------------------------------------------------------------ quantum */

const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * The state that keeps all three facts for engine angle φ (0°–180°), on |car 1, car 2⟩:
 * a·|red, blue⟩ + a·|blue, red⟩ + c·|blue, blue⟩, a = cos(φ/2)/√(1 + cos²(φ/2)), c = sin(φ/2)/√(1 + cos²(φ/2)).
 */
export function amplitudes(phi: number): { a: number; c: number } {
  const k = Math.cos(rad(phi) / 2), s = Math.sin(rad(phi) / 2), n = Math.sqrt(1 + k * k);
  return { a: k / n, c: s / n };
}

/**
 * The factory circuit: Ry(β) on car 1 (red with amplitude a), X on car 2, then — if car 1 is
 * blue — turn car 2 by −δ, so it ends up a·|red⟩ + c·|blue⟩ (normalized).
 */
export function factoryOps(phi = 90): Op[] {
  const { a, c } = amplitudes(phi);
  const beta = 2 * Math.acos(a), delta = 2 * Math.atan2(a, c);
  return [{ g: 'ry', q: 0, t: beta }, { g: 'x', q: 1 }, { g: 'cry', a: 0, b: 1, t: -delta }];
}

/** Factory, then each inspector's check: nothing for color, Ry(−φ) for the engine. */
export function checkOps(c1: Check, c2: Check, phi = 90): Op[] {
  const ops = factoryOps(phi);
  if (c1) ops.push({ g: 'ry', q: 0, t: rad(-phi) });
  if (c2) ops.push({ g: 'ry', q: 1, t: rad(-phi) });
  return ops;
}

export function checkSteps(c1: Check, c2: Check, phi = 90): Step[] {
  const f = factoryOps(phi);
  const steps: Step[] = [...f.map((o) => ({ ...o, tone: 'prep' })), { g: 'barrier' }];
  if (c1) steps.push({ g: 'ry', q: 0, t: rad(-phi), tone: 'alice' });
  if (c2) steps.push({ g: 'ry', q: 1, t: rad(-phi), tone: 'bob' });
  steps.push({ g: 'measure' });
  return steps;
}

/** Exact probabilities of (car 1, car 2) results 00, 10, 01, 11 — index r1 + 2·r2, Qiskit order. */
export function outcomeProbabilities(c1: Check, c2: Check, phi = 90): number[] {
  return probabilities(run(2, checkOps(c1, c2, phi)));
}

/** Probability of the forbidden outcome (0 for facts 1–3) or, for engine · engine, of both diesel. */
export function eventProbability(c1: Check, c2: Check, phi = 90): number {
  const p = outcomeProbabilities(c1, c2, phi);
  const f = forbidden(c1, c2) ?? [DIESEL, DIESEL];
  return p[f[0] + 2 * f[1]];
}

/** The closed form: P(both diesel) = u²(1 − u)/(1 + u), u = cos²(φ/2). */
export function bothDieselFormula(phi: number): number {
  const u = Math.cos(rad(phi) / 2) ** 2;
  return (u * u * (1 - u)) / (1 + u);
}

/** The best engine angle: cos²(φ/2) = (√5 − 1)/2 — φ ≈ 76.35°. */
export const BEST_PHI = (2 * Math.acos(Math.sqrt((Math.sqrt(5) - 1) / 2)) * 180) / Math.PI;
/** Hardy's maximum for two qubits: (5√5 − 11)/2 ≈ 9.02%. */
export const HARDY_MAX = (5 * Math.sqrt(5) - 11) / 2;

export interface Round { c1: Check; c2: Check; r1: Bit; r2: Bit }

export function inspect(c1: Check, c2: Check, phi = 90, rng: () => number = Math.random): Round {
  const [r1, r2] = bitsOf(sample(run(2, checkOps(c1, c2, phi)), rng), 2) as Bit[];
  return { c1, c2, r1, r2 };
}

export const randomCheck = (rng: () => number = Math.random): Check => (rng() < 0.5 ? 0 : 1);
