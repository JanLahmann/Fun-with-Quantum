/**
 * The coin game from Quantum-Coin-Game.ipynb, as pure logic.
 *
 * The coin starts heads. Player A moves, then B, then A again; nobody sees the coin until the
 * end. Heads → A wins, tails → B wins. Classically it's a fair 50:50 game. With "quantum power"
 * (the H gate) A wins every single time: H puts the coin on its edge, B's flip can't change a
 * coin that is heads and tails at once, and the second H lays it back down — heads.
 */
import { HEADS, measure, pHeads, run, type GateName, type State } from './qubit';

export type Player = 'A' | 'B';
export type Outcome = 'heads' | 'tails';

/** Which moves each side may use in a chapter. */
export const CLASSICAL_MOVES: readonly GateName[] = ['I', 'X'];
export const QUANTUM_MOVES: readonly GateName[] = ['I', 'X', 'H'];

export interface Round {
  a1: GateName;
  b: GateName;
  a2: GateName;
}

export interface RoundResult {
  moves: readonly [GateName, GateName, GateName];
  /** The state after each move: [after A1, after B, after A2]. */
  states: readonly [State, State, State];
  pHeads: number;
  outcome: Outcome;
  winner: Player;
}

export const winnerOf = (o: Outcome): Player => (o === 'heads' ? 'A' : 'B');

export function play(round: Round, rand: () => number = Math.random): RoundResult {
  const moves = [round.a1, round.b, round.a2] as const;
  const s1 = run([moves[0]], HEADS);
  const s2 = run([moves[1]], s1);
  const s3 = run([moves[2]], s2);
  const outcome = measure(s3, rand);
  return { moves, states: [s1, s2, s3], pHeads: pHeads(s3), outcome, winner: winnerOf(outcome) };
}

/** A strategy picks a move for a turn (0 = A's first, 1 = B's, 2 = A's second). */
export type Strategy = (turn: 0 | 1 | 2, rand: () => number) => GateName;

/** Flip or don't, fifty-fifty — the best a classical player can do. */
export const randomClassical: Strategy = (_turn, rand) => (rand() < 0.5 ? 'I' : 'X');

/** The quantum computer's secret: H on both of its moves. */
export const quantumA: Strategy = () => 'H';

/**
 * A quantum computer that only gets the middle move (because you started): its best is H — and
 * that's worth nothing. Without a move before *and* after yours there is no interference to steer.
 */
export const quantumB: Strategy = () => 'H';

/**
 * Exact win probability for A over every B move, for a fixed pair of A moves — used to prove in
 * tests (and show in the "look inside" chapter) that H…H wins against every B.
 */
export function aWinProbability(a1: GateName, b: GateName, a2: GateName): number {
  return pHeads(run([a1, b, a2], HEADS));
}

/** Does this pair of A moves win with certainty, whatever B does with classical moves? */
export function isWinningStrategyForA(a1: GateName, a2: GateName): boolean {
  return CLASSICAL_MOVES.every((b) => aWinProbability(a1, b, a2) === 1);
}

/** Scoreboard kept per chapter. */
export interface Score {
  you: number;
  computer: number;
  rounds: number;
}

export const emptyScore = (): Score => ({ you: 0, computer: 0, rounds: 0 });

export function tally(score: Score, youAre: Player, winner: Player): Score {
  return {
    you: score.you + (winner === youAre ? 1 : 0),
    computer: score.computer + (winner === youAre ? 0 : 1),
    rounds: score.rounds + 1,
  };
}
