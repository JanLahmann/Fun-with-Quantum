/**
 * Pure parts of the v2 coin game's flow, unit-tested: the states a step-by-step round passes
 * through, and the "what if" replay, which keeps the computer's moves and changes only yours.
 */
import { HEADS, apply, pHeads, type GateName, type State } from '../qubit';
import type { Player } from '../game';

/** The state before any move and after each move: `gates.length + 1` states. */
export function stepStates(gates: readonly GateName[], start: State = HEADS): State[] {
  const out: State[] = [start];
  for (const g of gates) out.push(apply(g, out[out.length - 1]));
  return out;
}

/**
 * The three moves of a round from the seats: `you` is player A (moves 1 and 3) or B (move 2).
 * `yours` are your moves in order (two as A, one as B), `computer` the computer's (one as A's
 * opponent, two as B's).
 */
export function roundMoves(you: Player, yours: readonly GateName[], computer: readonly GateName[]): GateName[] {
  return you === 'A' ? [yours[0], computer[0], yours[1]] : [computer[0], yours[0], computer[1]];
}

/** Chance of heads at the end of a round. */
export const roundPHeads = (moves: readonly GateName[]) => pHeads(stepStates(moves)[moves.length]);
