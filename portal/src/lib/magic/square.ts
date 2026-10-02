/**
 * The Mermin–Peres magic square game — the logic, same as Mermin-Peres-Game.ipynb.
 *
 * Convention of Bravyi, Gosset, König, Tomamichel (arXiv:1904.01502, §II.A): Alice is told a
 * column and answers it with an ODD number of 1s, Bob is told a row and answers it with an EVEN
 * number of 1s; they win if they agree on the square where the two cross. Columns and rows are
 * numbered 1–3 (the paper writes 01, 10, 11).
 *
 * Quantum strategy: two Bell pairs — Alice holds qubits 0 and 1, Bob 2 and 3; pairs (0,2), (1,3).
 * Each measures the first two observables of their column/row with the gates U / V below; the
 * third answer follows from the parity rule.
 */
import { bitsOf, probabilities, run, sample, type Op } from '../qsim';
import type { Step } from '../games/circuit';

export type Idx = 1 | 2 | 3;
export const IDX: readonly Idx[] = [1, 2, 3];

/** The square of observables, [row][column]; "X⊗Z" = X on the player's first qubit, Z on the second. */
export const OBSERVABLES: readonly (readonly string[])[] = [
  ['X⊗I', 'I⊗X', 'X⊗X'],
  ['I⊗Z', 'Z⊗I', 'Z⊗Z'],
  ['−X⊗Z', '−Z⊗X', 'Y⊗Y'],
];

/** 3×3 grid of bits, [row][column]. */
export type Grid = number[][];

/** Which rules a filled square breaks: columns need an odd, rows an even number of 1s. */
export function checkSquare(g: Grid): { cols: boolean[]; rows: boolean[] } {
  return {
    cols: [0, 1, 2].map((c) => (g[0][c] + g[1][c] + g[2][c]) % 2 === 1),
    rows: [0, 1, 2].map((r) => (g[r][0] + g[r][1] + g[r][2]) % 2 === 0),
  };
}

/* ------------------------------------------------------------------ classical */

/** Answers Alice may give for a column (odd number of 1s) and Bob for a row (even). */
export const COLUMN_ANSWERS: readonly number[][] = allTriples().filter((t) => sum(t) % 2 === 1);
export const ROW_ANSWERS: readonly number[][] = allTriples().filter((t) => sum(t) % 2 === 0);

/** A classical strategy: Alice's answer for each column, Bob's for each row (indices 0–2). */
export interface Strategy {
  alice: readonly (readonly number[])[]; // alice[c][r]: Alice's bit in row r of column c
  bob: readonly (readonly number[])[]; // bob[r][c]
}

export function classicalWins(s: Strategy): number {
  let w = 0;
  for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) if (s.alice[c][r] === s.bob[r][c]) w++;
  return w;
}

/** Try all 4⁶ = 4096 classical strategies: the best wins 8 of the 9 questions. */
export function bestClassical(): { tried: number; best: number } {
  let tried = 0, best = 0;
  for (const a0 of COLUMN_ANSWERS) for (const a1 of COLUMN_ANSWERS) for (const a2 of COLUMN_ANSWERS)
    for (const b0 of ROW_ANSWERS) for (const b1 of ROW_ANSWERS) for (const b2 of ROW_ANSWERS) {
      tried++;
      best = Math.max(best, classicalWins({ alice: [a0, a1, a2], bob: [b0, b1, b2] }));
    }
  return { tried, best };
}

/**
 * One of the best classical strategies, shown in the game: Bob reads his rows off this square,
 * Alice her columns — except in column 3, where the square has an even number of 1s and she
 * changes the bottom square to obey her rule. They disagree only in row 3, column 3.
 */
export const BEST_SQUARE: Grid = [[1, 1, 0], [1, 0, 1], [1, 0, 1]];
export const BEST_STRATEGY: Strategy = {
  bob: BEST_SQUARE.map((row) => [...row]),
  alice: [[1, 1, 1], [1, 0, 0], [0, 1, 0]],
};

/* ------------------------------------------------------------------ quantum */

const BELL: Op[] = [{ g: 'h', q: 0 }, { g: 'cx', a: 0, b: 2 }, { g: 'h', q: 1 }, { g: 'cx', a: 1, b: 3 }];

/** Alice's gates U for a column, on her qubits a (first) and b (second). */
export function aliceOps(col: Idx, a = 0, b = 1): Op[] {
  switch (col) {
    case 1: return [{ g: 'h', q: a }]; // U = H⊗I         → X⊗I, I⊗Z
    case 2: return [{ g: 'swap', a, b }, { g: 'h', q: a }]; // U = (H⊗I)·SWAP  → I⊗X, Z⊗I
    case 3: return [{ g: 'cx', a, b }, { g: 'h', q: a }]; // U = (H⊗I)·CNOT  → X⊗X, Z⊗Z
  }
}

/** Bob's gates V for a row, on his qubits a (first) and b (second). */
export function bobOps(row: Idx, a = 2, b = 3): Op[] {
  switch (row) {
    case 1: return [{ g: 'h', q: a }, { g: 'h', q: b }]; // V = H⊗H          → X⊗I, I⊗X
    case 2: return [{ g: 'swap', a, b }]; // V = SWAP         → I⊗Z, Z⊗I
    case 3: return [{ g: 'z', q: a }, { g: 'z', q: b }, { g: 'cz', a, b }, { g: 'h', q: a }, { g: 'h', q: b }]; // V = (H⊗H)·CZ·(Z⊗Z) → −X⊗Z, −Z⊗X
  }
}

export function gameOps(col: Idx, row: Idx): Op[] {
  return [...BELL, ...aliceOps(col), ...bobOps(row)];
}

/** The game circuit for drawing: Bell pairs | Alice's and Bob's gates | measurements. */
export function gameSteps(col: Idx, row: Idx): Step[] {
  return [
    ...BELL.map((o) => ({ ...o, tone: 'prep' })),
    { g: 'barrier' },
    ...aliceOps(col).map((o) => ({ ...o, tone: 'alice' })),
    ...bobOps(row).map((o) => ({ ...o, tone: 'bob' })),
    { g: 'measure' },
  ];
}

/** Alice's column and Bob's row (3 bits each) from the four measured bits (qubits 0–3). */
export function answers(bits: readonly number[]): { alice: number[]; bob: number[] } {
  const [a1, a2, b1, b2] = bits;
  return { alice: [a1, a2, a1 ^ a2 ^ 1], bob: [b1, b2, b1 ^ b2] };
}

export interface Round { col: Idx; row: Idx; alice: number[]; bob: number[]; win: boolean }

export function playQuantum(col: Idx, row: Idx, rng: () => number = Math.random): Round {
  const { alice, bob } = answers(bitsOf(sample(run(4, gameOps(col, row)), rng), 4));
  return { col, row, alice, bob, win: alice[row - 1] === bob[col - 1] };
}

export function playClassical(s: Strategy, col: Idx, row: Idx): Round {
  const alice = [...s.alice[col - 1]], bob = [...s.bob[row - 1]];
  return { col, row, alice, bob, win: alice[row - 1] === bob[col - 1] };
}

/** Exact probability that the quantum team wins this question (it is 1 for all nine). */
export function quantumWinProbability(col: Idx, row: Idx): number {
  return probabilities(run(4, gameOps(col, row))).reduce((p, pi, i) => {
    const { alice, bob } = answers(bitsOf(i, 4));
    return p + (alice[row - 1] === bob[col - 1] ? pi : 0);
  }, 0);
}

export const randomIdx = (rng: () => number = Math.random): Idx => (1 + Math.floor(rng() * 3)) as Idx;

function allTriples(): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < 8; i++) out.push([(i >> 2) & 1, (i >> 1) & 1, i & 1]);
  return out;
}
function sum(t: readonly number[]) { return t.reduce((a, b) => a + b, 0); }
