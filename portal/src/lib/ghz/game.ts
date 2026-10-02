/**
 * The GHZ game — the logic, same rules as GHZ-Game.ipynb.
 *
 * Three players (Alice, Bob, You) are each asked for the COLOR (red/blue) or the SHAPE
 * (star/rectangle) of an object. The four questions: color-color-color, color-shape-shape,
 * shape-color-shape, shape-shape-color. The team wins
 *   - color-color-color: if an EVEN number of players say red,
 *   - otherwise: if an ODD number of players say red or star.
 * Classically at most 3 of the 4 questions can be won (75%). Sharing a GHZ state
 * (|000⟩ + |111⟩)/√2 and measuring X for color, Y for shape, the team wins every round:
 * result 1 = red / star, 0 = blue / rectangle.
 */
import { bitsOf, probabilities, run, sample, type Op } from '../qsim';
import type { Step } from '../games/circuit';

export type Ask = 'C' | 'S'; // color or shape
export type Question = readonly [Ask, Ask, Ask];
export const QUESTIONS: readonly Question[] = [['C', 'C', 'C'], ['C', 'S', 'S'], ['S', 'C', 'S'], ['S', 'S', 'C']];

/** A player's object: color 1 = red (0 = blue), shape 1 = star (0 = rectangle). */
export interface Thing { color: 0 | 1; shape: 0 | 1 }
export const THINGS: readonly Thing[] = [
  { color: 1, shape: 1 }, { color: 1, shape: 0 }, { color: 0, shape: 1 }, { color: 0, shape: 0 },
];

export const isAllColor = (q: Question) => q.every((a) => a === 'C');

/** Does this answer (one bit per player: 1 = red/star) win question q? */
export function wins(q: Question, bits: readonly number[]): boolean {
  const ones = bits.reduce((a, b) => a + b, 0);
  return isAllColor(q) ? ones % 2 === 0 : ones % 2 === 1;
}

export function classicalAnswer(team: readonly Thing[], q: Question): number[] {
  return q.map((a, i) => (a === 'C' ? team[i].color : team[i].shape));
}

/** How many of the four questions a classical team (one object each) wins. */
export function classicalScore(team: readonly Thing[]): number {
  return QUESTIONS.filter((q) => wins(q, classicalAnswer(team, q))).length;
}

/** Try all 4³ = 64 classical teams: the best wins 3 of the 4 questions. */
export function bestClassical(): { tried: number; best: number } {
  let tried = 0, best = 0;
  for (const a of THINGS) for (const b of THINGS) for (const c of THINGS) {
    tried++;
    best = Math.max(best, classicalScore([a, b, c]));
  }
  return { tried, best };
}

/* ------------------------------------------------------------------ quantum */

export const GHZ: Op[] = [{ g: 'h', q: 0 }, { g: 'cx', a: 0, b: 1 }, { g: 'cx', a: 0, b: 2 }];

/** Color → measure X (H, then measure); shape → measure Y (S†, H, then measure). */
export function playerOps(a: Ask, q: number): Op[] {
  return a === 'C' ? [{ g: 'h', q }] : [{ g: 'sdg', q }, { g: 'h', q }];
}

export function gameOps(q: Question): Op[] {
  return [...GHZ, ...q.flatMap((a, i) => playerOps(a, i))];
}

export const TONES = ['alice', 'bob', 'you'] as const;

export function gameSteps(q: Question): Step[] {
  return [
    ...GHZ.map((o) => ({ ...o, tone: 'prep' })),
    { g: 'barrier' },
    ...q.flatMap((a, i) => playerOps(a, i).map((o) => ({ ...o, tone: TONES[i] }))),
    { g: 'measure' },
  ];
}

export interface Round { question: Question; bits: number[]; win: boolean }

export function playQuantum(q: Question, rng: () => number = Math.random): Round {
  const bits = bitsOf(sample(run(3, gameOps(q)), rng), 3);
  return { question: q, bits, win: wins(q, bits) };
}

/** Exact probability of each answer (bits of Alice, Bob, You) for a question. */
export function outcomeProbabilities(q: Question): { bits: number[]; p: number }[] {
  return probabilities(run(3, gameOps(q))).map((p, i) => ({ bits: bitsOf(i, 3), p }));
}

export function quantumWinProbability(q: Question): number {
  return outcomeProbabilities(q).reduce((s, o) => s + (wins(q, o.bits) ? o.p : 0), 0);
}

export const randomQuestion = (rng: () => number = Math.random): Question => QUESTIONS[Math.floor(rng() * 4)];
