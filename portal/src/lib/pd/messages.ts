/**
 * Texts of the browser quantum prisoner's dilemma (English for now). Conventions as in the coin
 * game's catalogue: a little HTML is fine, `[words](#term)` opens an explanation
 * (src/lib/games/glossary.ts). Every number here is checked in test/pd.test.ts.
 */
import type { Bit, Move } from './game';

const f2 = (x: number) => x.toFixed(2);
const pct = (x: number) => `${(100 * x).toFixed(1)}%`;
const deg = (d: number) => `${Math.round(d) % 360}°`.replace('-', '−');

export const UI = {
  chapters: ['The dilemma', 'Quantum moves', 'Why Q wins', 'The catch'],
  chaptersLabel: 'Chapters',
  explain: 'Explain',
  explainTitle: 'Explanations',
  allTerms: '← all terms',
  close: 'Close',
  learnMoreIbm: 'Learn more on IBM Quantum Learning ↗',
  learnMoreDoq: 'Open it on doQumentation ↗',
  noscript: 'The browser version needs JavaScript — the notebook works without it.',
  you: 'You (Alice)',
  bob: 'Bob',
  move: (b: Bit) => (b ? 'D' : 'C'),
  moveName: (b: Bit) => (b ? 'defect' : 'cooperate'),
  matrixTitle: 'Points (you, Bob)',
  bobPlays: 'Bob plays',
  yourMove: 'Your move',
  sliders: ['θ', 'φ', 'α'],
  odds: 'Outcome',
  expected: (a: number, b: number) => `expected points: you ${f2(a)}, Bob ${f2(b)}`,
  landTitle: (bob: string) => `Your expected points against ${bob} — click to play that move`,
  qubits: ['You', 'Bob'],
  circuitTitle: 'The game circuit',
  mixLabel: 'a random mix of I, iσx, iσy, iσz',
  mixExpected: (avg: number) => `your expected points against the mix: ${f2(avg)}`,
  describe: (m: Move) => `U(θ ${deg(m.theta)}, φ ${deg(m.phi)}${m.alpha ? `, α ${deg(m.alpha)}` : ''})`,
};

export const PAGE = {
  title: 'Quantum Prisoner’s Dilemma — preview | Fun with Quantum',
  description: 'Play the quantum prisoner’s dilemma in your browser: entanglement removes the dilemma — for a restricted set of moves. With all quantum moves, every move has a counter.',
  kicker: 'Play · Quantum game theory · preview',
  heading: 'The Quantum Prisoner’s Dilemma',
  lead: 'The classic dilemma of game theory, played with entangled qubits: a quantum move makes cooperation pay — and then there is a catch.',
  notebook: 'The same game as a Jupyter notebook, in real Qiskit code:',
  notebookLink: 'open the notebook ↗',
};

export const RULES = `<p>You (Alice) and Bob each choose, without knowing the other’s choice: <b>cooperate</b> (C) or <b>defect</b> (D).</p>
<p>Both cooperate: <b>3</b> points each. Both defect: <b>1</b> each. One defects, the other cooperates: the defector gets <b>5</b>, the cooperator <b>0</b>.</p>`;

export const CH1 = {
  title: 'The dilemma',
  intro: `${RULES}<p>Bob can’t see your choice, so for now he picks at random. <b>Choose your move</b> — and watch which one pays.</p>`,
  coop: 'Cooperate',
  defect: 'Defect',
  why: 'Why defect?',
  next: 'Next: quantum moves →',
  round: (a: Bit, b: Bit, pa: number, pb: number) =>
    `You ${UI.moveName(a)}, Bob ${UI.moveName(b)}s: you <b>${pa}</b>, Bob <b>${pb}</b>.`,
  tally: (cN: number, cPts: number, dN: number, dPts: number) =>
    `Cooperate: ${cN} round${cN === 1 ? '' : 's'}, ${cN ? f2(cPts / cN) : '—'} points a round · Defect: ${dN} round${dN === 1 ? '' : 's'}, ${dN ? f2(dPts / dN) : '—'} a round`,
  proof: `<p><b>Whatever Bob does, defecting pays you more:</b> if he cooperates, 5 instead of 3; if he defects, 1 instead of 0. Defecting is a <b>dominant</b> move.</p>
<p>Bob reasons the same way. So both defect and get <b>1</b> each — although both cooperating would give <b>3</b> each. That is the dilemma. Both defecting is the only [Nash equilibrium](#nash): neither player gains by changing alone.</p>`,
  proofSaid: 'Rational players end at (D, D): 1 point each, not 3.',
};

export const CH2 = {
  title: 'Quantum moves',
  intro: `<p>Now a referee prepares two [qubits](#qubit) in |00⟩ (0 = C) and [entangles](#entanglement) them with the gate <b>J</b>. Each player gets one qubit and turns it with a <b>move</b> U(θ, φ) — a [gate](#gate) with two angles. The referee undoes J (applies J†) and [measures](#measurement): 0 means C, 1 means D, and the points are paid as before.</p>
<p>U(0°, 0°) does nothing: that is <b>C</b>. U(180°, 0°) flips the qubit: <b>D</b>. With these two, the referee’s J and J† cancel and the old game comes back. But there is a new move: <b>Q</b> = U(0°, 90°).</p>
<p><b>Set your move</b> with the sliders or the buttons, choose Bob’s move, and play.</p>`,
  presets: ['C', 'D', 'Q'],
  play: 'Play a round',
  many: 'Play 1000 rounds',
  next: 'Next: why Q wins →',
  round: (a: Bit, b: Bit, pa: number, pb: number) =>
    `Measured: you <b>${UI.move(a)}</b>, Bob <b>${UI.move(b)}</b> — you ${pa}, Bob ${pb} points.`,
  manyResult: (pa: number, pb: number, n: number, ea: number, eb: number) =>
    `${n} rounds: you ${f2(pa / n)} points a round, Bob ${f2(pb / n)}. Expected: ${f2(ea)} and ${f2(eb)}.`,
  qSaid: 'Q against D: you 5, Bob 0. Defecting is no longer safe.',
};

export const CH3 = {
  title: 'Why Q wins',
  intro: `<p>The map shows your expected points for every move U(θ, φ) against Bob’s move. Choose Bob’s move above it.</p>
<p>• Against <b>D</b>, Q earns 5: defecting has lost its edge.<br>• Against <b>Q</b>, no move earns more than 3 — and Q itself earns 3.</p>
<p>So when both play Q, neither gains by changing alone: (Q, Q) is a [Nash equilibrium](#nash), and it pays <b>3 each</b> — like cooperating. Among these moves it is the only equilibrium in fixed moves. The dilemma is gone.</p>`,
  best: (bob: string, pts: number, m: string) => `Best reply to ${bob}: <b>${f2(pts)}</b> points, with ${m}.`,
  next: 'Next: the catch →',
};

export const CH4 = {
  title: 'The catch',
  sections: ['A counter to Q', 'Every move has a counter', 'Random moves', 'What it means'],
  texts: [
    `<p>Why should the players be limited to U(θ, φ)? A qubit can be turned in any direction: a third angle α gives <b>every</b> one-qubit move. Simon Benjamin and Patrick Hayden pointed out (2001) that then Q has a counter: <b>iσx</b> = U(180°, 0°, α = 90°).</p>
<p>Against Q, it earns you <b>5</b> and leaves Bob 0. So (Q, Q) is no longer an equilibrium.</p>`,
    `<p>It gets worse: against <b>every</b> move of Bob there is a reply worth 5 points to you — and against every reply of yours, Bob has one worth 5 to him. Entanglement lets a player undo the other’s move on the shared state. So with all quantum moves there is no equilibrium in fixed moves at all.</p>
<p>Click <b>Bob plays a random move</b>: the computer works out your counter.</p>`,
    `<p>Equilibria come back with <b>random</b> choices: if Bob picks one of four moves — I (= C), iσx, iσy (= D), iσz (= Q) — at random, every reply of yours earns on average exactly <b>2.25</b>, and the same holds the other way round. Both players doing this is an equilibrium: 2.25 each — better than 1, worse than 3. (2.25 is the average of 3, 0, 5 and 1: all four outcomes equally likely. Benjamin and Hayden let each player pick a completely random move; these four give the same averages.) It is not the only one: Eisert and Wilkens (2000) found another random equilibrium worth 2.5 each.</p>`,
    `<p>The quantum prisoner’s dilemma is a different game: a referee entangles the players’ qubits. Eisert, Wilkens and Lewenstein (1999) showed that with the moves U(θ, φ) the dilemma disappears. Benjamin and Hayden (2001) showed that this depends on the restricted set of moves: with every move, equilibria exist only with random choices. Entanglement still changes the game, but it does not simply remove the dilemma.</p>
<p>In 1999, the same year as Eisert, Wilkens and Lewenstein, David Meyer played a quantum coin flip: in his game a quantum player can always beat a classical one — our <a href="/preview/coin-game/">Quantum Coin Game</a>. When both players have every quantum move, neither has that edge.</p>
<p>J. Eisert, M. Wilkens, M. Lewenstein, <a href="https://doi.org/10.1103/PhysRevLett.83.3077" target="_blank" rel="noopener">Phys. Rev. Lett. 83, 3077 (1999)</a>; S. C. Benjamin, P. M. Hayden, <a href="https://doi.org/10.1103/PhysRevLett.87.069801" target="_blank" rel="noopener">Phys. Rev. Lett. 87, 069801 (2001)</a>; J. Eisert, M. Wilkens, <a href="https://doi.org/10.1080/09500340008232180" target="_blank" rel="noopener">J. Mod. Opt. 47, 2543 (2000)</a>; D. A. Meyer, <a href="https://doi.org/10.1103/PhysRevLett.82.1052" target="_blank" rel="noopener">Phys. Rev. Lett. 82, 1052 (1999)</a>.</p>`,
  ],
  counterQ: 'Counter Q',
  randomBob: 'Bob plays a random move',
  mixed: 'Bob mixes I, iσx, iσy, iσz',
  counterResult: (pa: number, pb: number) => `Your counter-move iσx against Q: you <b>${f2(pa)}</b>, Bob <b>${f2(pb)}</b>.`,
  randomResult: (bob: string, me: string, pts: number) =>
    `Bob plays ${bob}. Your counter ${me}: <b>${f2(pts)}</b> points for you, 0 for Bob.`,
  mixedResult: (mine: string, avg: number) =>
    `Against Bob’s random mix, your move ${mine} earns on average <b>${f2(avg)}</b> points — whatever you play.`,
};

/** Glossary terms offered in the "Explain" index, in reading order. */
export const TERMS = ['qubit', 'measurement', 'entanglement', 'gate', 'nash'] as const;

export { pct };
