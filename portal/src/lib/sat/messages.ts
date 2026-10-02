/**
 * Texts of the browser 3-SAT / Grover page (English for now). Conventions as in the other games:
 * a little HTML is fine, `[words](#term)` opens an explanation (src/lib/games/glossary.ts).
 */

export const UI = {
  chapters: ['The party puzzle', 'Grover’s search', 'A classic 3-SAT', 'Your own puzzle', 'How it works'],
  chaptersLabel: 'Chapters',
  explain: 'Explain',
  explainTitle: 'Explanations',
  allTerms: '← all terms',
  close: 'Close',
  learnMoreIbm: 'Learn more on IBM Quantum Learning ↗',
  learnMoreDoq: 'Run it in doQumentation ↗',
  noscript: 'The browser version needs JavaScript — the notebook works without it.',
  friends: ['Alice', 'Bob', 'Carol', 'David'],
  invited: 'invited',
  notInvited: 'not invited',
  ruleCouple: 'At least one complete couple',
  ruleBreakup: 'Not Alice and David together',
  works: 'This list works.',
  fails: 'This list doesn’t work.',
  chartLabel: 'Amplitude of every assignment',
  average: 'average',
  chance: (p: number) => `Chance to measure a solution: <b>${pct(p)}</b>`,
  legendSolution: 'solution',
  legendOther: 'not a solution',
  bitsHint: (vars: readonly string[]) => `Bits read right to left: ${vars.join(', ')} (1 = true)`,
  circuitTitle: 'Grover circuit',
  oracle: 'oracle',
  diffuser: 'diffuser',
  formulaLabel: 'Your formula',
  examplesLabel: 'Examples',
  run: 'Use this formula',
};

export const PAGE = {
  title: '3-SAT with Grover’s Algorithm — preview | Fun with Quantum',
  description: 'Solve logic puzzles with Grover’s search in your browser: watch the amplitudes of all guest lists, see the oracle mark the solutions and interference amplify them.',
  kicker: 'Play · Grover’s search algorithm · preview',
  heading: '3-SAT with Grover’s Algorithm',
  lead: 'Some puzzles are easy to check but hard to solve. Watch a quantum computer find the solutions — with interference.',
  notebook: 'The same puzzles as a Jupyter notebook, in real Qiskit code:',
  notebookLink: 'open the notebook ↗',
};

export function pct(p: number): string {
  const x = 100 * p;
  if (Math.abs(x - Math.round(x)) < 0.05) return `${Math.round(x)}%`;
  return `${x.toFixed(1)}%`;
}

export const PARTY = '((A & B) | (C & D)) & ~(A & D)';
export const SAT3_DIMACS = `c example DIMACS-CNF 3-SAT
p cnf 3 5
-1 -2 -3 0
1 -2 3 0
1 2 -3 0
1 -2 -3 0
-1 2 3 0`;

/** Names of the invited friends for a party assignment (bit k = friend k). */
export function guestList(i: number): string {
  const names = UI.friends.filter((_, k) => (i >> k) & 1);
  if (names.length === 0) return 'nobody';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export const CH1 = {
  title: 'The party puzzle',
  intro: `<p>You want to invite some of your friends — <b>A</b>lice, <b>B</b>ob, <b>C</b>arol and <b>D</b>avid — and keep everybody happy:</p>
<p>• Alice and Bob are a couple, so are Carol and David: invite at least <b>one complete couple</b>.<br>• Alice and David just broke up: never invite <b>both of them</b>.</p>
<p><b>Click the friends</b> to make a guest list. As a [Boolean formula](#sat), with & for AND, | for OR and ~ for NOT:</p>
<p class="math">((A & B) | (C & D)) & ~(A & D)</p>`,
  checkAll: 'Check all 16 lists',
  next: 'Next: Grover’s search →',
  allResult: `<b>4 of the 16 lists work.</b> Checking a list is easy; finding the good ones took 16 checks — and every extra friend doubles the number of lists. That is what makes puzzles like this [hard](#npcomplete).`,
};

export const CH2 = {
  title: 'Grover’s search',
  next: 'Next: a classic 3-SAT →',
  intro: `<p>A quantum computer can search differently. Four [qubits](#qubit) hold a guest list — qubit 0 is Alice, 1 Bob, 2 Carol, 3 David; 1 means invited. The chart shows the [amplitude](#amplitude) of each of the 16 lists: the square of a bar is the chance to get that list when you [measure](#measurement).</p>
<p>Step through [Grover’s search](#grover) and watch the bars.</p>`,
};

export const STEP = {
  start: 'Start: all qubits are 0 — the empty list, with certainty.',
  h: 'H on every qubit',
  hDone: (n: number, m: number) => `[Superposition](#superposition): all ${n} assignments now have the same amplitude. Measuring would give a random one — a solution ${m} times in ${n}.`,
  oracle: 'Oracle: mark the solutions',
  oracleDone: 'The [oracle](#oracle) flipped the sign of every solution. They are marked — but a sign changes no probability: the chance is the same as before.',
  diffuser: 'Diffuser: reflect about the average',
  diffuserDone: (k: number, change: 'up' | 'down' | 'same') => `The [diffuser](#diffuser) reflected every amplitude about the average (dashed line)${
    change === 'up' ? ': the marked ones grew, the others shrank — [interference](#interference)'
    : change === 'down' ? ' — but this time the marked ones shrank and the others grew' : ''}. Round ${k} done.`,
  bestDone: (k: number) => `Ran ${k} round${k === 1 ? '' : 's'} of oracle + diffuser.`,
  measure: 'Measure',
  measureMany: 'Measure 1000 times',
  again: 'Another round',
  best: (k: number) => `Run ${k} round${k === 1 ? '' : 's'}`,
  restart: 'Start over',
  measured: (bits: string, what: string, ok: boolean) => `Measured <b>${bits}</b>${what ? ` — ${what}` : ''}: ${ok ? '<span class="win">a solution ✓</span>' : '<span class="lose">not a solution ✗</span> — check the answer, then run again'}.`,
  many: (hits: number, n: number) => `${n} measurements: <b>${hits}</b> solutions (${pct(hits / n)}).`,
  overshoot: (best: number) => (best === 0
    ? 'More than half of all assignments are solutions, so a Grover round only lowers the chance — measuring right away is best ([how many rounds?](#iterations)).'
    : `Too far: the chance fell again — the state turned past the solutions. The first peak was after ${best} round${best === 1 ? '' : 's'} ([how many rounds?](#iterations)).`),
  noSolution: 'No assignment satisfies this formula, so the oracle marks nothing and Grover can’t amplify anything — every assignment keeps the same small chance.',
  allSolutions: 'Every assignment satisfies this formula — there is nothing to search for.',
};

export const CH3 = {
  title: 'A classic 3-SAT',
  intro: `<p>A textbook [3-SAT](#cnf) problem: three variables x₁, x₂, x₃ and five clauses of three literals each. Every clause needs at least one true literal.</p>
<p class="math">(¬x₁ ∨ ¬x₂ ∨ ¬x₃) ∧ (x₁ ∨ ¬x₂ ∨ x₃) ∧ (x₁ ∨ x₂ ∨ ¬x₃) ∧ (x₁ ∨ ¬x₂ ∨ ¬x₃) ∧ (¬x₁ ∨ x₂ ∨ x₃)</p>
<p>The same in DIMACS format, one clause per line (k for xₖ, −k for ¬xₖ, 0 ends a clause):</p>
<p class="math">-1 -2 -3 0<br>1 -2 3 0<br>1 2 -3 0<br>1 -2 -3 0<br>-1 2 3 0</p>
<p>Qubit 0 is x₁, 1 is x₂, 2 is x₃. Here 3 of the 8 assignments are solutions — so one round can’t reach 100%. Step through and see.</p>`,
  checkAll: 'Check all 8 classically',
  next: 'Next: your own puzzle →',
  allResult: (list: string) => `Checked classically: the solutions are ${list}. With 3 of 8, one Grover round finds one of them 84.4% of the time — so you always check the answer, which is easy for SAT.`,
};

export const CH4 = {
  title: 'Your own puzzle',
  next: 'Next: how it works →',
  intro: `<p>Write a formula with & (AND), | (OR), ~ (NOT) and parentheses — any variable names, up to 6 variables. ~ binds before &, & before |, as in Qiskit. The variables go onto qubits 0, 1, 2, … in sorted order (capital letters before small ones).</p>`,
  examples: [
    { label: 'Party', formula: '((A & B) | (C & D)) & ~(A & D)' },
    { label: 'Notebook’s turn', formula: '((A & C) | (B & D)) & ~(A & D)' },
    { label: 'Exactly one of three', formula: '(a | b | c) & ~(a & b) & ~(a & c) & ~(b & c)' },
    { label: 'One in 64', formula: 'a & b & c & d & e & f' },
    { label: 'No solution', formula: 'x & ~x' },
  ],
  error: (msg: string, at: number) => (at < 0 ? `That formula is too big: ${msg}.` : `That formula doesn’t parse: ${msg} (at character ${at + 1}).`),
};

/** "… about π/4·√(N/M) = k rounds reach the first peak: p%" */
export const summary = (nv: number, n: number, m: number, best: number | null, p: number | null) =>
  `${nv} variable${nv === 1 ? '' : 's'}, ${n} assignments, <b>${m}</b> solution${m === 1 ? '' : 's'}`
  + (best === null || p === null ? '.'
    : best === 0 ? `. More than half are solutions, so Grover can’t help: measuring right away finds one ${pct(p)} of the time.`
    : `. About π/4·√(N/M) = <b>${best}</b> round${best === 1 ? '' : 's'} reach${best === 1 ? 'es' : ''} the first peak: a solution ${pct(p)} of the time.`);

export const CH5 = {
  title: 'How it works',
  sections: ['Signs and interference', 'Rounds are rotations', 'Quadratic, not exponential', 'What it can’t do'],
  texts: [
    `<p>Measuring gives each assignment with probability amplitude². The [oracle](#oracle) only changes signs, so on its own it changes nothing you could see. The [diffuser](#diffuser) reflects all amplitudes about their average: because the marked amplitudes are negative, the average sits a little lower, and the reflection throws the marked ones far up while the others shrink.</p>
<p>That is [interference](#interference): amplitudes add up for the solutions and partly cancel for everything else.</p>`,
    `<p>Each round turns the state by the same angle 2θ towards the solutions, where sin²θ = M/N (M solutions among N). After k rounds the chance of a solution is</p>
<p class="math">sin²((2k + 1)·θ)</p>
<p>The chart shows it for the party puzzle (M = 4, N = 16, θ = 30°): one round reaches exactly 100%, a second overshoots back to 25%. For the 3-SAT problem (M = 3, N = 8, θ ≈ 37.8°) the first peak is after one round, 84.4%. A later peak can come closer to 100% — 3 rounds give 99.0% — but costs three times the work. About π/4·√(N/M) rounds reach the first peak ([how many rounds?](#iterations)).</p>`,
    `<p>A classical search for one solution among N = 2ⁿ assignments needs up to N checks; Grover needs about π/4·√N rounds ([quadratic speed-up](#speedup)):</p>
<table><tr><th>variables</th><th>assignments</th><th>Grover rounds</th></tr>{{TABLE}}</table>
<p>Still exponential in the number of variables — but with half the exponent.</p>`,
    `<p><b>No shortcut for NP-complete problems.</b> SAT is [NP-complete](#npcomplete); a quadratic speed-up does not make it easy, and most researchers expect that quantum computers cannot solve such problems efficiently.</p>
<p><b>Real SAT solvers are clever.</b> They use the structure of the formula and routinely handle industrial problems with millions of clauses. Grover’s search assumes no structure at all ([unstructured search](#search)).</p>
<p><b>Always check.</b> Grover finds a solution with high probability, not certainty — but checking a SAT answer is easy, so a wrong answer costs just one more run.</p>`,
  ],
  chartLabel: 'Chance of a solution after k rounds',
  rounds: 'rounds',
  party: 'party puzzle',
  sat3: '3-SAT',
};

export const TERMS = [
  'sat', 'cnf', 'npcomplete', 'search', 'qubit', 'superposition', 'amplitude', 'measurement',
  'grover', 'oracle', 'diffuser', 'interference', 'iterations', 'speedup', 'circuit',
] as const;
