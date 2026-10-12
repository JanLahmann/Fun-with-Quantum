/**
 * Texts of the redesigned coin game (v2): one short caption per step, the longer "Why?" behind a
 * toggle. The "Why?" texts, glossary, gate effects, state names and chapter 3's formulas come
 * from the v1 catalogue (../i18n), so they stay translated in every language.
 *
 * Conventions on top of v1's (keep HTML tags, `[words](#term)`, kets and gate letters):
 *  - `{h:words}` / `{t:words}` paint words in the heads / tails color.
 *  - Captions: one idea, about 15 words at most.
 */
import type { GateName } from '../qubit';

export interface MessagesV2 {
  ui: {
    chapters: readonly [string, string, string, string, string, string];
    why: string;
    /** The goal chip next to the circuit, e.g. "{t:Tails} = you win". */
    goal: (side: string) => string;
    headsShort: string;
    tailsShort: string;
    tally: (you: number, computer: number) => string;
    guess: string;
    guessRight: string;
    guessWrong: string;
    guesses: (right: number, total: number) => string;
    replay: string;
    replayMoves: string;
    whatIf: string;
    compareFirst: string;
    compareOther: string;
    compareSame: string;
    compareDiff: string;
    back: string;
    next: string;
    yourBox: (move: string) => string;
  };
  round: {
    startsHeads: string;
    intoBox: string;
    computerMoves: string;
    computerAgain: string;
    yourMove: string;
    youStart: string;
    yourLast: string;
    lifting: string;
    flipIt: string;
    leaveIt: string;
    playAgain: string;
    youWin: (side: string) => string;
    computerWins: (side: string) => string;
  };
  ch1: { replayDiff: string; replayDiffMoves: string; next: string };
  ch2: {
    intro: string;
    introYouFirst: string;
    lossLines: readonly string[];
    impossible: string;
    youStartWin: string;
    youStartLoss: (side: string) => string;
    replaySame: string;
    replayYouFirst: string;
    peek: string;
    peekYouFirst: string;
    swapToYou: string;
    swapToComputer: string;
  };
  /** Chapter 3: the round step by step; your box can be changed at any time. */
  ch3: {
    steps: { start: string; h1: string; flip: string; leave: string; h2: string };
    flipInstead: string;
    leaveInstead: string;
    tapHint: string;
    next: string;
  };
  ch4: {
    intro: string;
    hint: string;
    first: string;
    intoBox: string;
    last: string;
    moveFlip: string;
    moveLeave: string;
    moveH: string;
    sureWin: string;
    luckyWin: (computerFlipped: boolean) => string;
    loss: (computerFlipped: boolean) => string;
    next: string;
  };
  ch5: {
    start: string;
    tapHint: string;
    inspect: (k: number, gate: GateName) => string;
    /** Label of a sandbox box: what tapping it shows. */
    inspectTap: (k: number, gate: GateName) => string;
    look: string;
    lookMany: string;
    undo: string;
    reset: string;
    notebook: string;
    backToHeads: string;
    undone: string;
    many: (heads: number, tails: number, expHeads: number, expTails: number) => string;
    measured: (side: string) => string;
    played: (gate: GateName, name: string) => string;
  };
  /** Chapter 6 reuses v1's derivation (ch6 of ../i18n) and adds the step captions. */
  ch6: { steps: { start: string; h1: string; flip: string; leave: string; h2: string } };
}
