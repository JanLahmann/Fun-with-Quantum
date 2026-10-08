/**
 * Texts of the browser Hardy's paradox game (English for now). Conventions as in the coin game's
 * catalogue: a little HTML is fine, `[words](#term)` opens an explanation (src/lib/games/glossary.ts).
 * Every number here is checked in test/hardy.test.ts. Translations: copy this object per language.
 */
import type { Bit, Check } from './game';

const pct2 = (p: number) => `${(100 * p).toFixed(2)}%`;
const share = (k: number, n: number) => (n ? pct2(k / n) : '—');

export const UI = {
  chapters: ['The car factory', 'Quantum cars', 'What went wrong?', 'Find the 9%'],
  chaptersLabel: 'Chapters',
  explain: 'Explain',
  explainTitle: 'Explanations',
  allTerms: '← all terms',
  close: 'Close',
  learnMoreIbm: 'Learn more on IBM Quantum Learning ↗',
  learnMoreDoq: 'Open it on doQumentation ↗',
  noscript: 'The browser version needs JavaScript — the notebook works without it.',
  car: (n: 1 | 2) => `Car ${n}`,
  color: (b: Bit) => (b ? 'blue' : 'red'),
  engine: (b: Bit) => (b ? 'diesel' : 'gasoline'),
  colorLabel: 'color',
  engineLabel: 'engine',
  checkName: (c: Check) => (c ? 'engine' : 'color'),
  check: (c1: Check, c2: Check) => `${c1 ? 'engine' : 'color'} · ${c2 ? 'engine' : 'color'}`,
  rule: (c1: Check, c2: Check) =>
    !c1 && !c2 ? 'Fact 1: never both red'
      : c1 && !c2 ? 'Fact 2: car 1 diesel → car 2 red'
      : !c1 && c2 ? 'Fact 3: car 2 diesel → car 1 red'
      : 'both diesel — impossible?',
  notChecked: 'not checked',
  slider: 'Engine arrow φ',
  circleTitle: 'The Bloch circle: color is measured up–down, the engine along the arrow',
  qubits: ['Car 1', 'Car 2'],
  circuitTitle: 'The factory and the checks',
};

export const PAGE = {
  title: 'Hardy’s Paradox — preview | Fun with Quantum',
  description: 'Play Hardy’s paradox in your browser: three facts that each hold every time rule out two diesel cars — and quantum cars still deliver them, up to about 9% of the time.',
  kicker: 'Play · Nonlocality · preview',
  heading: 'Hardy’s Paradox',
  lead: 'Three facts that hold every single time logically rule out one outcome — and quantum mechanics produces it anyway, up to about 9% of the time.',
  notebook: 'The same paradox as a Jupyter notebook, in real Qiskit code:',
  notebookLink: 'open the notebook ↗',
};

export const STORY = `<p>Every morning two cars leave a factory, in opposite directions. Far apart, two inspectors each check one car — its <b>color</b> (red or blue) or its <b>engine</b> (gasoline or diesel), chosen at random at the last moment. Over many mornings they found three facts that hold <b>every single time</b>:</p>
<p>1. When both check the color: never <b>both red</b>.<br>2. If car 1’s engine is <b>diesel</b>, car 2’s color is <b>red</b>.<br>3. If car 2’s engine is <b>diesel</b>, car 1’s color is <b>red</b>.</p>`;

export const CH1 = {
  title: 'The car factory',
  intro: `${STORY}<p>Can both cars be diesel? You are the factory: give each car a hidden spec sheet — a [classical strategy](#classical). <b>Click the colors and engines</b>; the four squares show what the inspectors find. Try to get <b>both diesel</b> without breaking a fact.</p>`,
  status: (keeps: boolean, both: boolean) =>
    !keeps ? 'These sheets break a fact — the inspectors would catch it.'
      : both ? 'Both diesel and no fact broken!'
      : 'All three facts hold — but the cars are not both diesel.',
  all: 'Try all 16 sheet pairs',
  why: 'Why it’s impossible',
  next: 'Next: quantum cars →',
  allResult: (tried: number, keeping: number, both: number) =>
    `The computer tried all <b>${tried}</b> pairs of spec sheets: <b>${keeping}</b> keep all three facts, and <b>${both}</b> of those make both cars diesel.`,
  proof: `<p><b>Suppose both cars are diesel.</b> Car 1 is diesel, so by fact 2 car 2 is red. Car 2 is diesel, so by fact 3 car 1 is red. Then both are red — and fact 1 says that never happens.</p>
<p>So with spec sheets that keep the facts, two diesel cars are <b>impossible</b>. Rolling dice doesn’t help: a random choice of sheets still has to keep every fact, because the inspectors choose what to check at random. The chance of two diesels is <b>0%</b>.</p>`,
  proofSaid: 'Spec sheets — even random ones — never give two diesel cars.',
};

export const CH2 = {
  title: 'Quantum cars',
  intro: `<p>Now the factory ships two [entangled](#entanglement) [qubits](#qubit). Checking the color [measures](#measurement) a qubit as usual: 0 red, 1 blue. Checking the engine measures it in [another basis](#basis), along the X axis of the [Bloch circle](#bloch): 0 gasoline, 1 diesel.</p>
<p><b>Click a square</b> to choose what the two inspectors check — or let them choose at random. Watch the three facts, and the last square.</p>`,
  ask: 'Inspectors choose',
  many: 'Play 1000 mornings',
  next: 'Next: what went wrong? →',
  round: (c1: Check, c2: Check, r1: Bit, r2: Bit, both: boolean, broken: boolean) =>
    `Car 1 (${UI.checkName(c1)}): <b>${c1 ? UI.engine(r1) : UI.color(r1)}</b> · Car 2 (${UI.checkName(c2)}): <b>${c2 ? UI.engine(r2) : UI.color(r2)}</b>`
    + (both ? ' — <strong>both diesel!</strong> “Impossible” by the three facts.' : broken ? ' — the fact is broken!' : c1 && c2 ? '' : ' — the fact holds.'),
  tally: (c1: Check, c2: Check, k: number, n: number) =>
    !n ? '—' : c1 && c2 ? `both diesel: ${k} of ${n} (${share(k, n)})` : `broken: ${k} of ${n}`,
  manyResult: (both: number, ee: number, broken: number) =>
    `1000 mornings: ${broken ? `the facts were broken ${broken} times` : 'the facts held every time'} — and in <b>${both}</b> of the ${ee} mornings with two engine checks, both cars were diesel (${share(both, ee)}). Exactly: 1/12 ≈ 8.33%.`,
  score: (both: number, n: number) => `${n} morning${n === 1 ? '' : 's'} · both diesel ${both} time${both === 1 ? '' : 's'}`,
};

export const CH3 = {
  title: 'What went wrong?',
  sections: ['The quantum cars', 'The faulty step', 'No spec sheets', 'Hardy’s thought experiment'],
  next: 'Next: find the 9% →',
  texts: [
    `<p>The factory makes the state (|red, blue⟩ + |blue, red⟩ + |blue, blue⟩)/√3 — car 1 first. Each color pair except red–red comes up with 1/3: <b>fact 1</b>.</p>
<p>Whenever car 2 is blue, car 1 is in (|red⟩ + |blue⟩)/√2 = |+⟩ — gasoline for sure. So a diesel car 1 never comes with a blue car 2: <b>fact 2</b>, and <b>fact 3</b> the same way round.</p>
<p>In engine terms, gasoline is |+⟩ = (|red⟩ + |blue⟩)/√2 and diesel is |−⟩ = (|red⟩ − |blue⟩)/√2 — each blue car brings a minus sign. The amplitude of diesel–diesel is</p>
<p class="math">½·(0 − 1/√3 − 1/√3 + 1/√3) = −1/(2√3)</p>
<p>Squared: <b>1/12 ≈ 8.33%</b>. Nothing cancels it.</p>`,
    `<p>Look again at the proof in chapter 1: “car 1 is diesel, <b>so car 2 is red</b>.” In a morning when both engines are checked, nobody looks at car 2’s color. The proof uses the result of a check that was never made.</p>
<p>For spec sheets that is fine — the color is written down whether anyone looks or not. For qubits it is not: a color that was not measured has no value — at least none fixed in advance on the car itself. “Unperformed experiments have no results”, as Asher Peres titled a 1978 paper — the proof takes a [counterfactual](#counterfactual) step, and it fails.</p>`,
    `<p>Any spec sheets, even random ones, give two diesels <b>0%</b> of the time. Quantum cars give 8.33%. So the cars cannot carry their answers with them — no [hidden variables](#hidden) can explain it, as long as a car’s sheet can’t depend on what is checked on the other car, far away.</p>
<p>Unlike the [CHSH game](#inequality), no inequality is needed: given the three facts, <b>a single</b> diesel–diesel morning rules out every spec sheet. Nonlocality without inequalities, as the title of Hardy’s 1993 paper puts it — like the GHZ game, but with only two qubits, and the contradiction shows up only on some mornings. ([Nonlocal](#nonlocal), but no message travels: what one inspector finds doesn’t depend on what the other checks.)</p>`,
    `<p>Lucien Hardy found the paradox in 1992 in a thought experiment with an electron and a positron, each in its own interferometer; the two interferometers overlap, and where they overlap the particles would annihilate. Checking which path a particle took plays the role of the color; seeing which detector clicks after the last beam splitter plays the role of the engine. Later experiments tested it with photons.</p>
<p>In 1993 he showed it works for <b>every</b> entangled pure state of two qubits — except the maximally entangled ones, such as the Bell pair. N. David Mermin retold it with two detectors, each with a switch and red and green lights (1994). The two-qubit version follows an earlier chapter of the Qiskit Textbook; the car story comes from the first version of our notebook (2020).</p>
<p>L. Hardy, <a href="https://doi.org/10.1103/PhysRevLett.68.2981" target="_blank" rel="noopener">Phys. Rev. Lett. 68, 2981 (1992)</a> and <a href="https://doi.org/10.1103/PhysRevLett.71.1665" target="_blank" rel="noopener">71, 1665 (1993)</a>; A. Peres, <a href="https://doi.org/10.1119/1.11393" target="_blank" rel="noopener">Am. J. Phys. 46, 745 (1978)</a>; N. D. Mermin, <a href="https://doi.org/10.1119/1.17733" target="_blank" rel="noopener">Am. J. Phys. 62, 880 (1994)</a>.</p>`,
  ],
  said: [
    'Facts 1–3: probability 0. Both diesel: 1/12 ≈ 8.33%.',
    'The proof needs a color that nobody checked.',
    'Spec sheets: 0%. Quantum cars: 8.33%.',
    'Hardy 1992, 1993 — nonlocality without inequalities.',
  ],
};

export const CH4 = {
  title: 'Find the 9%',
  intro: `<p>The engine check doesn’t have to be X. Turn the <b>engine arrow</b> on the [Bloch circle](#bloch): gasoline along the arrow, diesel the opposite way. For each angle φ the game builds a factory state that keeps all three facts, and the squares show the exact chances.</p>
<p>How often can the cars be both diesel? With u = cos²(φ/2):</p>
<p class="math">P(both diesel) = u²·(1 − u)/(1 + u)</p>`,
  best: 'Best angle',
  x: 'Back to X (90°)',
  many: 'Play 1000 mornings',
  status: (phi: number, p: number, max: number) => {
    const at = phi === 0 ? ' At 0° the engine is the color, the state is maximally entangled — and the paradox vanishes.'
      : phi === 180 ? ' At 180° both cars are always blue — no entanglement, no paradox.' : '';
    return `φ = ${phi.toFixed(phi % 1 ? 2 : 0)}°: both diesel <b>${pct2(p)}</b>${p >= max - 1e-12 ? ' — the maximum, (5√5 − 11)/2. No quantum system does better (Rabelo, Zhi, Scarani 2012).' : '.'}${at}`;
  },
  state: (a: number, c: number) => `State: ${a.toFixed(3)}·(|red, blue⟩ + |blue, red⟩) + ${c.toFixed(3)}·|blue, blue⟩`,
  bestSaid: 'The best: cos²(φ/2) = (√5 − 1)/2 ≈ 0.618 (one over the golden ratio), φ ≈ 76.35° — both diesel (5√5 − 11)/2 ≈ 9.02%.',
  manyResult: (both: number, n: number, exact: number, broken: number) =>
    `${n} mornings with two engine checks: both diesel <b>${both}</b> times (${share(both, n)}); exactly ${pct2(exact)}. `
    + (broken ? `The facts were broken ${broken} times.` : `And ${n} mornings for each fact: not broken once.`),
};

/** Glossary terms offered in the "Explain" index, in reading order. */
export const TERMS = [
  'qubit', 'measurement', 'entanglement', 'basis', 'bloch', 'gate', 'circuit',
  'classical', 'hidden', 'counterfactual', 'nonlocal', 'inequality',
] as const;
