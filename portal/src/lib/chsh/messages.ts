/**
 * Texts of the browser CHSH game (English for now). Conventions as in the coin game's catalogue:
 * a little HTML is fine, `[words](#term)` opens an explanation (src/lib/games/glossary.ts).
 * Every number here is checked in test/chsh.test.ts. Translations: copy this object per language.
 */
import type { Bit, Round } from './game';

export const UI = {
  chapters: ['Play classically', 'The quantum team', 'Turn the angles', 'Why 85% is the limit'],
  chaptersLabel: 'Chapters',
  explain: 'Explain',
  explainTitle: 'Explanations',
  allTerms: '← all terms',
  close: 'Close',
  learnMoreIbm: 'Learn more on IBM Quantum Learning ↗',
  learnMoreDoq: 'Open it on doQumentation ↗',
  noscript: 'The browser version needs JavaScript — the notebook works without it.',
  alice: 'Alice',
  bob: 'Bob',
  answerTo: (who: 'x' | 'y', q: Bit) => `if ${who} = ${q}, answer`,
  question: (x: Bit, y: Bit) => `x = ${x} · y = ${y}`,
  need: (x: Bit, y: Bit) => (x & y ? 'different answers' : 'same answer'),
  sliders: ['Alice, x = 0', 'Alice, x = 1', 'Bob, y = 0', 'Bob, y = 1'],
  circleTitle: 'The Bloch circle: the directions Alice and Bob measure along',
  circleHint: 'dot at the tip: answer 0 · dot at the other end: answer 1',
  qubits: ['Alice', 'Bob'],
  circuitTitle: 'The game circuit',
};

export const PAGE = {
  title: 'CHSH Game — preview | Fun with Quantum',
  description: 'Play the CHSH game in your browser — the Bell test behind the 2022 Nobel Prize: no classical team wins more than 75% of the rounds, an entangled pair of qubits wins 85.4%.',
  kicker: 'Play · Bell test · preview',
  heading: 'The CHSH Game',
  lead: 'The Bell test behind the 2022 Nobel Prize, as a game: no classical team wins more than 75% of the rounds — with an entangled pair of qubits, Alice and Bob win 85.4%.',
  notebook: 'The same game as a Jupyter notebook, in real Qiskit code:',
  notebookLink: 'open the notebook ↗',
};

const pct = (p: number) => `${(100 * p).toFixed(1)}%`;
const share = (won: number, n: number) => pct(won / n);
const result = (win: boolean) => (win ? '<span class="win">Win!</span>' : '<span class="lose">Lost.</span>');
const deg = (d: number) => `${d}°`.replace('-', '−');
/** Angle between two directions, 0°–180°. */
export const between = (a: number, b: number) => { const d = (((a - b) % 360) + 360) % 360; return d > 180 ? 360 - d : d; };

export const RULES = `<p>Alice and Bob may agree on a strategy beforehand — then they are put into <b>separate rooms</b> and cannot talk any more.</p>
<p>The quiz master gives <b>Alice</b> a random bit <b>x</b> and <b>Bob</b> a random bit <b>y</b>. Each answers with a bit: Alice <b>a</b>, Bob <b>b</b>. They <b>win</b> if a ⊕ b = x · y: the <b>same answer</b>, unless both got a 1 — then <b>different answers</b>.</p>`;

export const CH1 = {
  title: 'Play classically',
  intro: `${RULES}<p>A [classical strategy](#classical) is a table: what Alice answers to x = 0 and to x = 1, what Bob answers to y = 0 and to y = 1. <b>Click the answers</b> to make your table — the four squares show which questions it wins.</p>`,
  result: (wins: number, proofShown = false) =>
    `Your table wins <b>${wins} of 4</b> questions (${wins * 25}%).${wins === 3 && !proofShown ? ' Can you find one that wins all four?' : ''}`,
  many: 'Play 1000 rounds',
  all: 'Try all 16 tables',
  why: 'Why never 4 of 4?',
  next: 'Next: the quantum team →',
  manyResult: (won: number, n: number, wins: number) =>
    `Your table: <b>${won} of ${n}</b> rounds won (${share(won, n)}). Each question comes up a quarter of the time, so on average it wins ${wins} of 4 rounds: ${wins * 25}%.`,
  allResult: (tried: number, best: number, nBest: number) =>
    `The computer tried all <b>${tried}</b> tables: <b>${nBest}</b> win ${best} of the 4 questions (${best * 25}%), the other ${tried - nBest} win just 1. None wins all four.`,
  proof: `<p><b>No table wins all four.</b> Write a₀ for Alice’s answer to x = 0, a₁ to x = 1, and b₀, b₁ for Bob’s. Winning every question needs</p>
<p class="math">a₀ ⊕ b₀ = 0 &nbsp; a₀ ⊕ b₁ = 0<br>a₁ ⊕ b₀ = 0 &nbsp; a₁ ⊕ b₁ = 1</p>
<p>Combine all four left sides with ⊕: each of a₀, a₁, b₀, b₁ appears twice, and anything ⊕ itself is 0 — so they give 0. The right sides give 0 ⊕ 0 ⊕ 0 ⊕ 1 = 1 ([parity](#parity)). 0 ≠ 1, so an odd number of the four equations must fail: every table loses 1 or 3 questions. The best win 3 of 4: <b>75%</b>.</p>
<p>Rolling dice doesn’t help: a random strategy is a random choice among the tables, and none of them beats 75%.</p>`,
  proofSaid: 'No table wins all four questions — the best win 75% of the rounds.',
};

export const CH2 = {
  title: 'The quantum team',
  intro: `<p>Now Alice and Bob share a [Bell pair](#bell): two [entangled](#entanglement) [qubits](#qubit), one for each. In their rooms, each [measures](#measurement) their qubit along an arrow on the [Bloch circle](#bloch) that depends on their question: Alice along A0 (0°) or A1 (90°), Bob along B0 (45°) or B1 (−45°). The result is their answer: 0 along the arrow, 1 the opposite way.</p>
<p><b>Click a question</b> in the squares — or let the quiz master pick.</p>`,
  again: 'They don’t win every round. Play on: in the long run they win about 85% — more than any classical table.',
  ask: 'Quiz master asks',
  many: 'Play 1000 rounds',
  next: 'Next: turn the angles yourself →',
  manyResult: (won: number, n: number) =>
    `Quantum team: <b>${won} of ${n}</b> rounds won (${share(won, n)}). The exact chance: cos²(22.5°) ≈ 85.4% — the best classical team: 75%.`,
  score: (won: number, n: number) => `Quantum team: ${won} of ${n} rounds won`,
};

/** One round, with the reason for its odds: P(same) = cos²(Δ/2). */
export const round = (r: Round, alpha: number, beta: number) => {
  const d = between(alpha, beta), same = Math.cos((d * Math.PI) / 360) ** 2;
  return `x = ${r.x}, y = ${r.y}: they need ${UI.need(r.x, r.y)}.<br>Alice along ${deg(alpha)}: <b>${r.a}</b> · Bob along ${deg(beta)}: <b>${r.b}</b> — ${result(r.win)}`
    + `<br><small>Their arrows are ${d}° apart, so they answer the same with probability cos²(${d}°/2) = ${pct(same)}.</small>`;
};

export const CH3 = {
  title: 'Turn the angles',
  intro: `<p>Why these four arrows? <b>Turn them yourself</b> with the sliders. Each square shows the exact chance to win that question: Alice and Bob answer the same with probability cos²(Δ/2), where Δ is the angle between their two arrows.</p>
<p>Can you beat 85.4%?</p>`,
  best: 'Best angles',
  allZ: 'All along Z',
  random: 'Random angles',
  many: 'Play 1000 rounds',
  next: 'Next: why 85% is the limit →',
  total: (win: number, max: number) =>
    `Win rate: <b>${pct(win)}</b>${win >= max - 1e-9 ? ' — the maximum. No angles, and no other quantum strategy, do better.'
      : win > 0.75 + 1e-9 ? ' — better than any classical team (75%).'
      : win > 0.75 - 1e-9 ? ' — exactly as good as the best classical team.'
      : ' — worse than the best classical team (75%).'}`,
  allZSaid: 'All four arrows along Z: the answers always agree — at random, both 0 or both 1. That is no better than the classical table “always answer 0”: 75%.',
  manyResult: (won: number, n: number, exact: number) =>
    `With these angles: <b>${won} of ${n}</b> rounds won (${share(won, n)}); exactly ${pct(exact)}.`,
};

export const CH4 = {
  title: 'Why 85% is the limit',
  sections: ['The Bloch circle', 'The classical limit: 75%', 'The quantum limit: 85.4%', 'What it means'],
  texts: [
    `<p>A qubit with real amplitudes, cos(φ/2)|0⟩ + sin(φ/2)|1⟩, is an arrow on the [Bloch circle](#bloch) at angle φ: |0⟩ at the top, |1⟩ at the bottom, |+⟩ at 90° and |−⟩ at −90°. To measure along an arrow at angle φ, turn the qubit back with the [gate](#gate) Ry(−φ), then measure: 0 means along the arrow, 1 the opposite way.</p>
<p>For the [Bell pair](#bell) (|00⟩ + |11⟩)/√2, each player alone gets 0 or 1 half the time. Together they answer the same with probability</p>
<p class="math">P(same) = cos²(Δ/2), Δ = the angle between the two arrows</p>
<p>With the best arrows, three questions have Δ = 45°: the same answer with cos²(22.5°) ≈ 85.4%. For x = y = 1, Δ = 135°: the same answer with only cos²(67.5°) ≈ 14.6% — different answers, as needed, with 85.4%.</p>
<p><small>IBM Quantum Learning’s lesson uses half these angles, the angle in the state cos θ|0⟩ + sin θ|1⟩: 0 and π/4 for Alice, π/8 and −π/8 for Bob.</small></p>`,
    `<p>Score each question by its correlation: E = P(same) − P(different), from −1 to +1. When x · y = 0 they win with P(same) = (1 + E)/2; when x = y = 1, with P(different) = (1 − E)/2. Averaged over the four questions:</p>
<p class="math">win rate = 1/2 + S/8,<br>S = E₀₀ + E₀₁ + E₁₀ − E₁₁</p>
<p>A classical table has every E = +1 or −1 and loses at least one question, so S = (questions won) − (questions lost) ≤ 3 − 1 = 2. Mixing tables at random averages S, so it stays at most 2. That is the [CHSH inequality](#inequality), S ≤ 2: win rate ≤ 1/2 + 2/8 = <b>75%</b>.</p>`,
    `<p>For the Bell pair, E = P(same) − P(different) = cos²(Δ/2) − sin²(Δ/2) = cos Δ — the dot product of the two arrows. So</p>
<p class="math">S = A0·B0 + A0·B1 + A1·B0 − A1·B1<br>&nbsp; = A0·(B0 + B1) + A1·(B0 − B1)<br>&nbsp; ≤ |B0 + B1| + |B0 − B1| ≤ 2√2</p>
<p>First step: the dot product of an arrow of length 1 with any vector is at most that vector’s length. Second step: |B0 + B1|² + |B0 − B1|² = 4, and two lengths whose squares add up to 4 add up to at most 2√2 — reached when both are √2, with B0 and B1 at right angles, as 45° and −45° are. Then A0 points along B0 + B1 (0°) and A1 along B0 − B1 (90°).</p>
<p>So, for the Bell pair, S ≤ 2√2 ≈ 2.83 and the win rate is at most 1/2 + √2/4 = cos²(22.5°) ≈ <b>85.4%</b>. Boris Tsirelson proved in 1980 that this holds for every quantum strategy — any entangled state, any measurements: [Tsirelson’s bound](#tsirelson).</p>`,
    `<p><b>Not every round.</b> Unlike in the GHZ game and the magic square, the quantum team loses some rounds. The advantage shows in the statistics — as in real Bell tests: play many rounds, then compare with 75%.</p>
<p><b>No signaling.</b> Alice’s answers alone are 50:50, whatever Bob measures, so she can’t learn y from them, and no message travels ([no signaling](#signaling)). The correlation appears only when the two lists of answers are compared.</p>
<p><b>No hidden script.</b> Answers fixed in advance — [hidden variables](#hidden) carried by the qubits — are a classical table and win at most 75%. John Bell found in 1964 that quantum mechanics predicts more; Clauser, Horne, Shimony and Holt turned it into this test. Experiments by John Clauser, Alain Aspect, Anton Zeilinger and others confirmed quantum mechanics — the 2022 Nobel Prize in Physics. In 2015 three experiments closed the main loopholes at once.</p>
<p><b>Why not 100%?</b> An imagined “PR box” (Popescu and Rohrlich, 1994) would win every round and still send no message. Quantum mechanics stops at 85.4%. On real quantum computers, noise lowers the win rate (answers at random would win 50%) — staying clearly above 75% is a test of the hardware.</p>
<p>J. F. Clauser, M. A. Horne, A. Shimony, R. A. Holt, <a href="https://doi.org/10.1103/PhysRevLett.23.880" target="_blank" rel="noopener">Phys. Rev. Lett. 23, 880 (1969)</a>; studied as a nonlocal game: R. Cleve, P. Høyer, B. Toner, J. Watrous, <a href="https://arxiv.org/abs/quant-ph/0404076" target="_blank" rel="noopener">arXiv:quant-ph/0404076</a> (2004); B. S. Tsirelson (Cirel’son), <a href="https://doi.org/10.1007/BF00417500" target="_blank" rel="noopener">Lett. Math. Phys. 4, 93 (1980)</a>. More in IBM Quantum Learning’s lesson <a href="https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information/entanglement-in-action/chsh-game" target="_blank" rel="noopener">The CHSH game</a>.</p>`,
  ],
  said: [
    'Click a question square to see its two arrows and their angle.',
    'Classical tables: S ≤ 2, win rate ≤ 75% — the CHSH inequality.',
    'Best angles: S = 2√2 ≈ 2.83, win rate 85.4% — Tsirelson’s bound.',
    'Quantum: 85.4%. Classical: 75%. An imagined PR box: 100%.',
  ],
  question: (x: Bit, y: Bit, alpha: number, beta: number, win: number) => {
    const d = between(alpha, beta);
    return `x = ${x}, y = ${y}: arrows ${d}° apart, the same answer with cos²(${d}°/2) = ${pct(Math.cos((d * Math.PI) / 360) ** 2)}; they need ${UI.need(x, y)} — win ${pct(win)}.`;
  },
};

/** Glossary terms offered in the "Explain" index, in reading order. */
export const TERMS = [
  'qubit', 'measurement', 'entanglement', 'bell', 'bloch', 'gate', 'basis', 'circuit',
  'parity', 'classical', 'nonlocal', 'hidden', 'inequality', 'tsirelson', 'signaling',
] as const;
