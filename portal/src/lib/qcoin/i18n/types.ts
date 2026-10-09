/**
 * The Quantum Coin Game's message catalogue. Every locale file exports a `Messages` object, so a
 * missing or extra entry is a type error (`npm run check`).
 *
 * Conventions for translators:
 *  - Strings may contain a little HTML (<strong>, <em>, <b>); keep the tags.
 *  - `[words](#term)` makes "words" a clickable explanation of a glossary term — translate the
 *    words, keep `#term` exactly (it must be a key of `glossary`).
 *  - Keep |0⟩ |1⟩ |+⟩ |−⟩, gate letters (I, X, H, Z, S) and the formulas as they are.
 */
import type { GateName } from '../qubit';

export type TermKey =
  | 'qubit' | 'superposition' | 'measurement' | 'bloch' | 'ket' | 'gate'
  | 'hadamard' | 'xgate' | 'zgate' | 'sgate' | 'igate'
  | 'interference' | 'phase' | 'circuit' | 'algorithms' | 'math';

export interface GlossaryEntry {
  title: string;
  /** 2–5 short sentences; may use [words](#term) links. */
  body: string;
}

export interface Messages {
  /** BCP-47 tag, e.g. "en", "de". */
  lang: string;
  /** Native language name for the language switcher, e.g. "Deutsch". */
  langName: string;

  page: { title: string; description: string; kicker: string; heading: string; lead: string; notebook: string; notebookLink: string; notebookWait: string; preview: string };

  ui: {
    chapters: readonly [string, string, string, string, string, string];
    chaptersLabel: string;
    heads: string;
    tails: string;
    probsLabel: string;
    coinInBox: string;
    hiddenInBox: string;
    whoStarts: string;
    theComputer: string;
    you: string;
    blochCaption: string;
    explain: string;
    explainTitle: string;
    allTerms: string;
    close: string;
    learnMoreIbm: string;
    learnMoreDoq: string;
    noscript: string;
    circuitLabel: string;
    coin: string;
    look: string;
    whoYou: string;
    whoComputer: string;
    score: (you: number, computer: number, rounds: number) => string;
  };

  states: { zero: string; one: string; plus: string; minus: string; other: (x: string, y: string, z: string) => string };

  gates: {
    /** Short button labels in the sandbox. */
    name: Record<GateName, string>;
    /** What each gate does on the Bloch sphere (shown while it plays). */
    fx: Record<GateName, string>;
  };

  round: {
    startsHeads: string;
    intoBox: string;
    lifting: string;
    onEdge: string;
    flipIt: string;
    leaveIt: string;
    yourMoveB: string;
    youStartA: string;
    yourLastA: string;
    computerFirst: string;
    computerLast: string;
    computerMiddle: string;
    playAgain: string;
  };

  ch1: {
    title: string;
    rulesComputerFirst: string;
    rulesYouFirst: string;
    winComputerFirst: string;
    winYouFirst: string;
    intro: (rules: string, win: string) => string;
    youWin: (side: string) => string;
    computerWins: (side: string) => string;
    next: string;
  };

  ch2: {
    title: string;
    introComputerFirst: (rules: string, win: string) => string;
    introYouFirst: (win: string) => string;
    lossLines: readonly string[];
    impossible: string;
    youStartWin: string;
    youStartLoss: (side: string) => string;
    peekComputerFirst: string;
    peekYouFirst: string;
    swapToYou: string;
    swapToComputer: string;
  };

  ch3: {
    title: string;
    intro: string;
    start: string;
    nextComputer: string;
    afterH: string;
    mathH: string;
    nextFlip: string;
    nextLeave: string;
    afterFlip: string;
    afterLeave: string;
    mathFlip: string;
    mathLeave: string;
    nextComputer2: string;
    afterH2: string;
    mathH2: string;
    tryLeave: string;
    tryFlip: string;
    next: string;
  };

  ch4: {
    title: string;
    intro: string;
    moveFlip: string;
    moveLeave: string;
    moveH: string;
    first: string;
    firstHint: string;
    intoBox: string;
    last: string;
    sureWin: string;
    luckyWin: (computerFlipped: boolean) => string;
    loss: (computerFlipped: boolean) => string;
    next: string;
  };

  ch5: {
    title: string;
    intro: string;
    addGate: string;
    measure: string;
    measureMany: string;
    undo: string;
    reset: string;
    notebook: string;
    backToHeads: string;
    undone: string;
    many: (heads: number, tails: number, expHeads: number, expTails: number) => string;
    measured: (side: string) => string;
    played: (gate: GateName, name: string) => string;
  };

  /** Chapter 6: the notebook's derivation — why H, your move, H always ends on heads. */
  ch6: {
    title: string;
    intro: string;
    caseLeave: string;
    caseFlip: string;
    conclusion: string;
    leave: string;
    flip: string;
    pick: string;
    done: string;
  };

  glossary: Record<TermKey, GlossaryEntry>;
}
