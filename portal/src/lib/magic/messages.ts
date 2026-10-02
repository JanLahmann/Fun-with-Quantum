/**
 * Texts of the browser magic square game (English for now). Conventions as in the coin game's
 * catalogue: a little HTML is fine, `[words](#term)` opens an explanation (src/lib/games/glossary.ts).
 * Translations: copy this object per language, as for src/lib/qcoin/i18n.
 */
import type { Idx } from './square';

export const UI = {
  chapters: ['Find a magic square', 'The best classical team', 'The quantum team', 'How it works'],
  chaptersLabel: 'Chapters',
  explain: 'Explain',
  explainTitle: 'Explanations',
  allTerms: '← all terms',
  close: 'Close',
  learnMoreIbm: 'Learn more on IBM Quantum Learning ↗',
  learnMoreDoq: 'Run it in doQumentation ↗',
  noscript: 'The browser version needs JavaScript — the notebook works without it.',
  column: (c: Idx) => `column ${c}`,
  row: (r: Idx) => `row ${r}`,
  aliceGets: 'Alice gets a <b>column</b> — odd number of 1s',
  bobGets: 'Bob gets a <b>row</b> — even number of 1s',
  qubits: ['Alice 1', 'Alice 2', 'Bob 1', 'Bob 2'],
  circuitTitle: 'The game circuit',
};

export const PAGE = {
  title: 'Mermin–Peres Magic Square — preview | Fun with Quantum',
  description: 'Play the magic square game in your browser: no classical team can win every round — a quantum team with two entangled pairs of qubits always does.',
  kicker: 'Play · Contextuality · preview',
  heading: 'Mermin–Peres Magic Square',
  lead: 'Fill in a 3×3 square that mathematics forbids — with entangled qubits, Alice and Bob win every round.',
  notebook: 'The same game as a Jupyter notebook, in real Qiskit code:',
  notebookLink: 'open the notebook ↗',
};

const bits = (b: readonly number[]) => `<b>${b.join(' ')}</b>`;
const result = (win: boolean) => (win ? '<span class="win">Win!</span>' : '<span class="lose">Lost.</span>');
const pct = (won: number, n: number) => `${((100 * won) / n).toFixed(1)}%`;

export const RULES = `<p>Alice and Bob are contestants on a quiz show. They may agree on a strategy beforehand — then they are put into <b>separate rooms</b> and cannot talk any more.</p>
<p><b>Alice</b> is told a <b>column</b> and fills its three squares with 0s and 1s: an <b>odd</b> number of 1s. <b>Bob</b> is told a <b>row</b> and fills it with an <b>even</b> number of 1s. They <b>win</b> if they put the same number into the square where the column and the row cross.</p>`;

export const CH1 = {
  title: 'Find a magic square',
  intro: `${RULES}<p>The easiest strategy: agree on one complete square that follows both rules, and each reads off their part. <b>Click the squares to find one.</b></p>`,
  start: 'Every column needs an odd number of 1s, every row an even number.',
  count: (k: number) => (k === 5 ? `<strong>5 of 6 rules</strong> — one more! Whatever you change, though, another one breaks…` : `${k} of 6 rules obeyed.`),
  why: 'Why can’t I get all six?',
  proof: `<p><b>There is no magic square.</b> Count all the 1s in the square in two ways:</p>
<p>• <b>Column by column:</b> each column has an odd number of 1s, and odd + odd + odd is <b>odd</b>.<br>• <b>Row by row:</b> each row has an even number of 1s, and even + even + even is <b>even</b>.</p>
<p>The same number can’t be odd and even at once ([parity](#parity)). So every square breaks a rule — in fact always 1, 3 or 5 of them — and for some question Alice and Bob will disagree.</p>`,
  proofSaid: 'No square obeys all six rules — not yours, not anybody’s.',
  next: 'Next: the best classical team →',
};

export const CH2 = {
  title: 'The best classical team',
  intro: `<p>Alice and Bob can still prepare well. They agree on the square on the left. Every row has an even number of 1s — but column 3 has an even number too. So in column 3 Alice changes the bottom square to 0, as her rule demands. That is the only square where she and Bob disagree.</p>
<p><b>Click a column and a row</b> to ask a question — or let the quiz master pick.</p>`,
  aliceDiffers: 'Alice: 0',
  ask: 'Quiz master asks',
  many: 'Play 1000 rounds',
  all: 'Try all classical strategies',
  next: 'Next: the quantum team →',
  manyResult: (won: number, n: number) => `Classical team: <b>${won} of ${n}</b> rounds won (${pct(won, n)}). On average 8 of 9 questions = 88.9%.`,
  allResult: (tried: number, best: number) => `The computer tried all <b>${tried}</b> [classical strategies](#classical): the best win <b>${best} of the 9</b> questions (88.9%). None wins all nine.`,
  score: (won: number, n: number) => `Classical team: ${won} of ${n} rounds won`,
};

export const CH3 = {
  title: 'The quantum team',
  intro: `<p>Now Alice and Bob share two [entangled](#entanglement) pairs of [qubits](#qubit) — two [Bell pairs](#bell). Alice takes one qubit of each pair, Bob the other two; then they walk into their rooms.</p>
<p>Asked a column or a row, each runs a small [circuit](#circuit) on their two qubits, [measures](#measurement) two bits and gets the third from their rule. <b>Click a column and a row</b> — or let the quiz master pick.</p>`,
  again: 'The answers change every round — they are random — but Alice and Bob always agree.',
  ask: 'Quiz master asks',
  many: 'Play 1000 rounds',
  next: 'Next: how does it work? →',
  manyResult: (won: number, n: number) => `Quantum team: <b>${won} of ${n}</b> rounds won (${pct(won, n)}). The best classical team: 88.9%.`,
  score: (won: number, n: number) => `Quantum team: ${won} of ${n} rounds won`,
};

export const round = (col: Idx, row: Idx, alice: readonly number[], bob: readonly number[], win: boolean) =>
  `Alice, column ${col}: ${bits(alice)} · Bob, row ${row}: ${bits(bob)}<br>Shared square: Alice ${alice[row - 1]}, Bob ${bob[col - 1]}. ${result(win)}`;

export const pickHint = (col: Idx | null, row: Idx | null) =>
  col && !row ? `Alice gets column ${col} — now click a row for Bob.` : row && !col ? `Bob gets row ${row} — now click a column for Alice.` : '';

const PRODUCTS: Record<string, string> = {
  c1: '(X⊗I)·(I⊗Z)·(−X⊗Z) = −I⊗I',
  c2: '(I⊗X)·(Z⊗I)·(−Z⊗X) = −I⊗I',
  c3: '(X⊗X)·(Z⊗Z)·(Y⊗Y) = −I⊗I',
  r1: '(X⊗I)·(I⊗X)·(X⊗X) = +I⊗I',
  r2: '(I⊗Z)·(Z⊗I)·(Z⊗Z) = +I⊗I',
  r3: '(−X⊗Z)·(−Z⊗X)·(Y⊗Y) = +I⊗I',
};

export const CH4 = {
  title: 'How it works',
  sections: ['The square of measurements', 'Why the proof fails', 'Why they agree', 'How to measure X⊗Z', 'What it means'],
  texts: [
    `<p>Instead of a square of numbers, Alice and Bob agree on a square of [measurements](#pauli) of their two qubits (left). Each gives +1 or −1, written 0 or 1. "X⊗Z" means X on the first qubit and Z on the second ([⊗](#tensor)).</p>
<p>• The three measurements of each <b>column</b> [commute](#commute) — Alice can make all three — and their results multiply to −1: an <b>odd</b> number of 1s.<br>• The three of each <b>row</b> commute too and multiply to +1: an <b>even</b> number.<br>• Where column and row cross, Alice and Bob measure the <b>same</b> thing on [entangled](#entanglement) qubits — so they get the same result.</p>
<p>Click a column or row label to multiply it out, or a square to see who measures it, and how.</p>`,
    `<p>Our proof multiplied all nine answers twice: column by column (−1) and row by row (+1). For numbers the order of multiplying doesn’t matter. For quantum measurements it does: <b>X·Z = −Z·X</b> — they don’t [commute](#commute).</p>
<p class="math">X·Z = −iY, but Z·X = +iY<br>column 3: (X⊗X)·(Z⊗Z)·(Y⊗Y) = (X·Z·Y)⊗(X·Z·Y) = (−i)·(−i) = −1<br>row 3: (−X⊗Z)·(−Z⊗X)·(Y⊗Y) = (X·Z·Y)⊗(Z·X·Y) = (−i)·(+i) = +1</p>
<p>Within a column or a row the measurements commute, so each player can make their three together. Across columns and rows they don’t — X⊗I and Z⊗I, for instance — so the nine results never exist all at once, and there is no complete square to count. That is [contextuality](#contextuality).</p>`,
    `<p>Each [Bell pair](#bell) looks just as simple in every basis:</p>
<p class="math">(|00⟩ + |11⟩)/√2<br>= (|++⟩ + |−−⟩)/√2<br>= (|+i,−i⟩ + |−i,+i⟩)/√2</p>
<p>So when Alice and Bob measure their qubits of one pair both in Z or both in X, they always get the <b>same</b> result; both in Y, always <b>opposite</b> results.</p>
<p>Think of each square as one measurement on each pair. In −X⊗Z, X on pair 1 agrees and Z on pair 2 agrees, so the products agree. Y appears only in Y⊗Y: both pairs give opposite results, and the two flips cancel.</p>`,
    `<p>A quantum computer only measures Z. To measure anything else, rotate first: gates U followed by a Z measurement measure <b>U†·Z·U</b> ([another basis](#basis)). With one qubit: H·Z·H = X, so "H, then measure" measures X.</p>
<p>Each player measures the first two observables of their column or row this way; the third answer follows from their rule.</p>
<table><tr><th></th><th>gates</th><th>measures</th></tr>
<tr><td>Alice, column 1</td><td>H⊗I</td><td>X⊗I, I⊗Z</td></tr>
<tr><td>Alice, column 2</td><td>(H⊗I)·SWAP</td><td>I⊗X, Z⊗I</td></tr>
<tr><td>Alice, column 3</td><td>(H⊗I)·CNOT</td><td>X⊗X, Z⊗Z</td></tr>
<tr><td>Bob, row 1</td><td>H⊗H</td><td>X⊗I, I⊗X</td></tr>
<tr><td>Bob, row 2</td><td>SWAP</td><td>I⊗Z, Z⊗I</td></tr>
<tr><td>Bob, row 3</td><td>(H⊗H)·CZ·(Z⊗Z)</td><td>−X⊗Z, −Z⊗X</td></tr></table>
<p>Read products right to left: (H⊗I)·SWAP means [SWAP](#swap) first, then H. In row 3 the two Z gates supply the minus signs ([CNOT and CZ](#cnot)). Click a square to see its circuit.</p>`,
    `<p><b>No communication.</b> Alice’s answers on their own are perfectly random, and nothing Bob does changes what she sees. Still the answers always fit together — "quantum pseudo-telepathy", a [nonlocal game](#nonlocal).</p>
<p><b>No hidden script.</b> Answers written down in advance are a [classical strategy](#classical), and those win at most 8 of 9. So the quantum results cannot have existed before the measurement ([hidden variables](#hidden), [contextuality](#contextuality)).</p>
<p><b>On real quantum computers</b> noise lowers the 100% somewhat — the game becomes a test of the hardware. Game, square and circuits follow Bravyi, Gosset, König and Tomamichel, <a href="https://arxiv.org/abs/1904.01502" target="_blank" rel="noopener">Quantum advantage with noisy shallow circuits</a> (Nature Physics, 2020), with the magic square of N. David Mermin and Asher Peres (1990).</p>`,
  ],
  product: (key: string) => {
    const odd = key.startsWith('c');
    return `${odd ? 'Column' : 'Row'} ${key[1]}: <span class="math">${PRODUCTS[key]}</span> — the results multiply to ${odd ? '−1: always an <b>odd</b> number of 1s' : '+1: always an <b>even</b> number of 1s'}.`;
  },
  cell: (row: Idx, col: Idx, obs: string) =>
    `Row ${row}, column ${col}: <b>${obs}</b>. Alice ${row < 3 ? 'measures it directly' : 'gets it from her rule (odd)'} in column ${col}; Bob ${col < 3 ? 'measures it directly' : 'gets it from his rule (even)'} in row ${row}.`,
};

/** Glossary terms offered in the "Explain" index, in reading order. */
export const TERMS = [
  'qubit', 'measurement', 'entanglement', 'bell', 'pauli', 'tensor', 'commute', 'basis',
  'gate', 'cnot', 'swap', 'circuit', 'parity', 'classical', 'nonlocal', 'hidden', 'contextuality',
] as const;
