import type { Context } from './types';
import { KNOWLEDGE } from './coin-game.knowledge';

const GATES = new Set(['I', 'X', 'H', 'Z', 'S', '?']);
const isInt = (v: unknown, lo: number, hi: number): v is number => Number.isInteger(v) && (v as number) >= lo && (v as number) <= hi;
const oneOf = <T extends string>(v: unknown, values: readonly T[]): v is T => typeof v === 'string' && (values as readonly string[]).includes(v);
const gates = (v: unknown, max: number): string[] | null =>
  Array.isArray(v) && v.length <= max && v.every((g) => typeof g === 'string' && GATES.has(g)) ? (v as string[]) : null;

/** Rounds of the current chapter the widget may send (oldest first). */
export const ROUND_LOG = 10;

function score(v: unknown): Record<string, number> | null {
  const sc = v as Record<string, unknown> | null | undefined;
  return sc && typeof sc === 'object' && isInt(sc.you, 0, 1e5) && isInt(sc.computer, 0, 1e5) && isInt(sc.rounds, 0, 1e5)
    ? { you: sc.you, computer: sc.computer, rounds: sc.rounds }
    : null;
}

function round(v: unknown): Record<string, unknown> | null {
  const x = v as Record<string, unknown> | null | undefined;
  if (!x || typeof x !== 'object') return null;
  const moves = gates(x.moves, 3);
  if (!moves || moves.length !== 3 || !oneOf(x.you, ['A', 'B'] as const) || !oneOf(x.outcome, ['heads', 'tails'] as const)
    || !oneOf(x.winner, ['A', 'B'] as const) || typeof x.youWin !== 'boolean') return null;
  return { ...(isInt(x.n, 1, 1e5) ? { n: x.n } : {}), you: x.you, moves, outcome: x.outcome, winner: x.winner, youWin: x.youWin };
}

/**
 * The Quantum Coin Game's live state, as the widget sends it. Only what the player can see:
 * in chapter 2 the quantum computer's moves arrive as '?' and stay hidden.
 * Unknown fields are dropped; a missing or malformed optional field is simply left out.
 */
function state(raw: unknown): Record<string, unknown> | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (r.game !== 'quantum-coin-game' || !isInt(r.chapter, 1, 6)) return null;
  const out: Record<string, unknown> = { game: r.game, chapter: r.chapter };
  if (oneOf(r.starter, ['computer', 'you'] as const)) out.starter = r.starter;
  if (oneOf(r.you, ['A', 'B'] as const)) out.you = r.you;
  const lr = r.lastRound as Record<string, unknown> | null | undefined;
  if (lr && typeof lr === 'object') {
    const moves = gates(lr.moves, 3);
    if (moves && moves.length === 3 && oneOf(lr.outcome, ['heads', 'tails'] as const) && oneOf(lr.winner, ['A', 'B'] as const) && typeof lr.youWin === 'boolean') {
      out.lastRound = { moves, outcome: lr.outcome, winner: lr.winner, youWin: lr.youWin };
    }
  }
  if (Array.isArray(r.rounds)) {
    const rounds = r.rounds.slice(-ROUND_LOG).map(round).filter((x) => x !== null);
    if (rounds.length) out.rounds = rounds;
  }
  const sc = score(r.score);
  if (sc) out.score = sc;
  const os = r.otherScores as Record<string, unknown> | undefined;
  if (os && typeof os === 'object') {
    const others: Record<string, unknown> = {};
    for (const ch of ['1', '2', '3', '4', '5', '6']) {
      const v = Object.hasOwn(os, ch) ? score(os[ch]) : null;
      if (v && Number(ch) !== r.chapter) others[ch] = v;
    }
    if (Object.keys(others).length) out.otherScores = others;
  }
  const sandbox = gates(r.sandbox, 8);
  if (sandbox && !sandbox.includes('?')) out.sandbox = sandbox;
  if (typeof r.lastAction === 'string' && /^[a-z0-9-]{1,40}$/.test(r.lastAction)) out.lastAction = r.lastAction;
  const f = r.facts as Record<string, unknown> | undefined;
  if (f && typeof f === 'object') {
    const facts: Record<string, unknown> = {};
    if (typeof f.pHeads === 'number' && f.pHeads >= 0 && f.pHeads <= 1) facts.pHeads = f.pHeads;
    if (oneOf(f.stateLabel, ['|0⟩', '|1⟩', '|+⟩', '|−⟩'] as const)) facts.stateLabel = f.stateLabel;
    if (Object.keys(facts).length) out.facts = facts;
  }
  return out;
}

export const coinGame: Context = {
  role:
    'You are the explainer built into the Quantum Coin Game on fun-with-quantum.org. Players ask you about ' +
    'the round they just played, the rules, and the quantum physics behind the game.',
  scope:
    'Stay on topic: this game, quantum computing and the physics behind it. For anything else, say kindly that you ' +
    'can only help with the game and quantum computing, and offer a related question.',
  levels: true,
  knowledge: KNOWLEDGE,
  state,
};
