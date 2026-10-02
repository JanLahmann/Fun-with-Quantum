/**
 * Texts of the browser GHZ game (English for now). Conventions as in the coin game's catalogue:
 * a little HTML is fine, `[words](#term)` opens an explanation (src/lib/games/glossary.ts).
 */
import { isAllColour, type Question } from './game';

export const UI = {
  chapters: ['Team classical', 'Team quantum', 'How it works'],
  chaptersLabel: 'Chapters',
  explain: 'Explain',
  explainTitle: 'Explanations',
  allTerms: '← all terms',
  close: 'Close',
  learnMoreIbm: 'Learn more on IBM Quantum Learning ↗',
  learnMoreDoq: 'Run it in doQumentation ↗',
  noscript: 'The browser version needs JavaScript — the notebook works without it.',
  players: ['Alice', 'Bob', 'You'],
  colour: 'colour?',
  shape: 'shape?',
  red: 'red', blue: 'blue', star: 'star', rectangle: 'rectangle',
  questionsLabel: 'The question',
  changeThing: (player: string) => `Change ${player}’s object`,
  circuitTitle: 'The game circuit',
  histLabel: 'How often each answer comes out',
  zBasis: 'Z · Z · Z (no question)',
};

export const PAGE = {
  title: 'GHZ Game — preview | Fun with Quantum',
  description: 'Play the GHZ game in your browser: no classical team wins more than 3 of 4 questions — a team sharing three entangled qubits wins every round.',
  kicker: 'Play · Entanglement · preview',
  heading: 'GHZ Game',
  lead: 'Win a game as a team that no classical strategy can win — using three entangled qubits.',
  notebook: 'The same game as a Jupyter notebook, in real Qiskit code:',
  notebookLink: 'open the notebook ↗',
};

const ASK = { C: 'Colour', S: 'Shape' } as const;
export const questionLabel = (q: Question) => q.map((a) => ASK[a]).join(' · ');

/** One player's answer in words: bit 1 = red / star. */
export const said = (ask: 'C' | 'S', bit: number) => (ask === 'C' ? (bit ? UI.red : UI.blue) : bit ? UI.star : UI.rectangle);

const result = (win: boolean) => (win ? '<span class="win">Win!</span>' : '<span class="lose">Lost.</span>');
const pct = (won: number, n: number) => `${((100 * won) / n).toFixed(1)}%`;

/** "2 × red: even — Win!" */
export function verdict(q: Question, bits: readonly number[], win: boolean): string {
  const k = bits.reduce((a, b) => a + b, 0);
  const what = isAllColour(q) ? 'red' : 'red or star';
  return `${k} × ${what}: ${k % 2 ? 'odd' : 'even'}. ${result(win)}`;
}

export const RULES = `<p>Alice, Bob and you are a team. Each of you is asked either for a <b>colour</b> (red or blue) or for a <b>shape</b> (star or rectangle). You may agree on a strategy beforehand — once the questions are asked, nobody can talk.</p>
<p>The quiz master asks all three for the colour, or one for the colour and the other two for the shape. Your team <b>wins</b> if</p>
<p>• all three are asked for the colour, and an <b>even</b> number of you say <b>red</b> (0 or 2);<br>• one colour and two shapes are asked, and an <b>odd</b> number say <b>red or star</b> (1 or 3).</p>`;

export const CH1 = {
  title: 'Team classical',
  intro: `${RULES}<p>A [classical strategy](#classical): each player thinks of an object — a red or blue star or rectangle — and answers from it. <b>Click a player’s object to change it</b>, then let the quiz master ask all four questions.</p>`,
  askAll: 'Ask all four questions',
  all: 'Try all classical teams',
  why: 'Why never 4 of 4?',
  next: 'Next: team quantum →',
  changed: 'Ready — ask the four questions.',
  score: (won: number) => (won === 3 ? 'Your team wins <b>3 of the 4</b> questions — as good as it gets.' : `Your team wins <b>${won} of the 4</b> questions. Can you find a team that wins more?`),
  allResult: (tried: number, best: number) => `The computer tried all <b>${tried}</b> classical teams (4 objects for each of 3 players): the best win <b>${best} of the 4</b> questions — 75%. None wins all four.`,
  proof: `<p><b>Why never 4 of 4?</b> Write each answer as a number: red or star = −1, blue or rectangle = +1. Then an even number of red multiplies to +1, and an odd number of red-or-star to −1 ([parity](#parity)). With colours c and shapes s of Alice (A), Bob (B) and you (Y), winning all four questions means:</p>
<p class="math">c<sub>A</sub>·c<sub>B</sub>·c<sub>Y</sub> = +1<br>c<sub>A</sub>·s<sub>B</sub>·s<sub>Y</sub> = −1<br>s<sub>A</sub>·c<sub>B</sub>·s<sub>Y</sub> = −1<br>s<sub>A</sub>·s<sub>B</sub>·c<sub>Y</sub> = −1</p>
<p>Multiply the last three lines: every shape appears twice, and s·s = +1. What remains is c<sub>A</sub>·c<sub>B</sub>·c<sub>Y</sub> = (−1)·(−1)·(−1) = −1 — the opposite of the first line. So no team of objects wins all four; the best win 3 of 4.</p>`,
  proofSaid: 'Impossible for any classical team: at most 3 of 4 (75%).',
};

export const CH2 = {
  title: 'Team quantum',
  intro: `<p>Team quantum shares three [entangled](#entanglement) [qubits](#qubit) in a [GHZ state](#ghz) — one for each player. Asked for the colour, a player [measures](#measurement) X: an H gate, then measure. Asked for the shape, Y: S†, H, then measure ([another basis](#basis)). Result 1 means red or star, 0 means blue or rectangle.</p>
<p><b>Pick a question</b> above the players — or let the quiz master ask.</p>`,
  ask: 'Quiz master asks',
  many: 'Play 1000 rounds',
  next: 'Next: how does it work? →',
  again: 'The answers change every round — each player alone sees pure chance — but the team always wins.',
  manyResult: (won: number, n: number) => `Team quantum: <b>${won} of ${n}</b> rounds won (${pct(won, n)}). The best classical team: 75%.`,
  score: (won: number, n: number) => `Team quantum: ${won} of ${n} rounds won`,
};

export const CH3 = {
  title: 'How it works',
  sections: ['The GHZ state', 'What each question gives', 'Why the proof fails', 'What it means'],
  texts: [
    `<p>The [GHZ state](#ghz) (|000⟩ + |111⟩)/√2 comes from the first three gates of the [circuit](#circuit): H puts Alice’s qubit into [superposition](#superposition), and two [CNOTs](#cnot) copy its 0 or 1 to Bob’s and your qubit.</p>
<p>Measured directly (Z), the three always agree: 000 or 111, 50:50 — see the chart. That alone is no mystery; two coins glued together do the same. The surprise comes with the questions.</p>`,
    `<p><b>Pick a question</b> above the chart: it shows how often each answer comes out, computed exactly. For colour · colour · colour only answers with an <b>even</b> number of 1s (red) appear; for the other three questions only <b>odd</b> numbers of 1s (red or star). Every answer that can appear wins.</p>
<p>And each player alone? Their own 0 or 1 is 50:50, whatever the others are asked. Nobody can read anything about the others’ questions from their own answer — no signal passes between them.</p>`,
    `<p>The proof assumed that every player carries <b>both</b> answers — a colour and a shape — and reveals the one asked for. For qubits, colour (X) and shape (Y) cannot both have a value: X·Y = −Y·X, they don’t [commute](#commute). Only the question actually asked gets an answer, and those answers always fit.</p>
<blockquote>“What didn’t happen didn’t happen.”</blockquote>
<p>— N. David Mermin’s motto for quantum physicists, in <i>Quantum Computer Science: An Introduction</i>.</p>`,
    `<p><b>No hidden script.</b> If every player carried fixed answers — Einstein’s [hidden variables](#hidden) — the team would lose at least one of the four questions. Quantum mechanics predicts that it wins every single round. Unlike Bell’s inequality, the contradiction is not about averages.</p>
<p><b>No communication.</b> Each answer alone is random, and the questions of the others leave no trace in it — a [nonlocal game](#nonlocal), won by entanglement alone.</p>
<p><b>On real quantum computers</b> noise makes the team lose now and then. How often — and how to do better — is the topic of <a href="/play/ghz-real-devices/">the GHZ game on real devices</a>. The game goes back to Daniel Greenberger, Michael Horne and Anton Zeilinger (1989), in the form popularised by N. David Mermin (1990).</p>`,
  ],
};

export const TERMS = [
  'qubit', 'superposition', 'measurement', 'entanglement', 'ghz', 'pauli', 'basis', 'commute',
  'gate', 'cnot', 'circuit', 'parity', 'classical', 'nonlocal', 'hidden',
] as const;
