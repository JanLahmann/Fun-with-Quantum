/**
 * Explanations on demand for the browser games (the coin game has its own, in
 * src/lib/qcoin/i18n). Same conventions: `[words](#term)` in any game text becomes a button that
 * opens the term; each term links to IBM Quantum Learning and to the same page on doQumentation
 * (shared paths and anchors, checked 2026-10-02).
 */

export type TermKey =
  | 'qubit' | 'superposition' | 'measurement' | 'entanglement' | 'bell' | 'ghz'
  | 'pauli' | 'tensor' | 'commute' | 'basis' | 'gate' | 'cnot' | 'swap' | 'circuit'
  | 'parity' | 'classical' | 'nonlocal' | 'hidden' | 'contextuality'
  | 'sat' | 'cnf' | 'npcomplete' | 'search' | 'grover' | 'oracle' | 'diffuser' | 'amplitude'
  | 'interference' | 'iterations' | 'speedup'
  | 'bloch' | 'inequality' | 'tsirelson' | 'signaling' | 'counterfactual';

export interface GlossaryEntry {
  title: string;
  /** 2–5 short sentences; may use [words](#term) links. */
  body: string;
}

/** Path below /learning/ plus anchor; terms without a page show no links. */
export const TERM_PAGES: Partial<Record<TermKey, string>> = {
  qubit: 'courses/basics-of-quantum-information/single-systems/quantum-information#quantum-state-vectors',
  superposition: 'modules/quantum-mechanics/superposition-with-qiskit#quantum-coin',
  measurement: 'courses/basics-of-quantum-information/single-systems/quantum-information#measuring-quantum-states',
  entanglement: 'courses/basics-of-quantum-information/multiple-systems/quantum-information#entangled-states',
  bell: 'courses/basics-of-quantum-information/multiple-systems/quantum-information#bell-states',
  ghz: 'courses/basics-of-quantum-information/multiple-systems/quantum-information#ghz-and-w-states',
  pauli: 'courses/foundations-of-quantum-error-correction/stabilizer-formalism/pauli-operations-and-observables#pauli-observables',
  tensor: 'courses/basics-of-quantum-information/multiple-systems/quantum-information#tensor-products-of-quantum-state-vectors',
  commute: 'courses/foundations-of-quantum-error-correction/stabilizer-formalism/pauli-operations-and-observables#properties-of-pauli-matrices',
  basis: 'courses/foundations-of-quantum-error-correction/stabilizer-formalism/pauli-operations-and-observables#measurements-from-pauli-operations',
  gate: 'courses/basics-of-quantum-information/single-systems/quantum-information#examples-of-unitary-operations-on-qubits',
  cnot: 'courses/basics-of-quantum-information/multiple-systems/quantum-information#controlled-unitary-operations',
  swap: 'courses/basics-of-quantum-information/multiple-systems/quantum-information#the-swap-operation',
  circuit: 'courses/basics-of-quantum-information/quantum-circuits/circuits#quantum-circuits',
  classical: 'courses/basics-of-quantum-information/entanglement-in-action/chsh-game#limitation-of-classical-strategies',
  nonlocal: 'courses/basics-of-quantum-information/entanglement-in-action/chsh-game#nonlocal-games',
  hidden: 'modules/quantum-mechanics/bells-inequality-with-qiskit#what-does-einsteins-option-hidden-variables-predict',
  search: 'courses/fundamentals-of-quantum-algorithms/grover-algorithm/unstructured-search#formal-problem-statement',
  grover: 'courses/fundamentals-of-quantum-algorithms/grover-algorithm/grover-algorithm-description#description-of-the-algorithm',
  oracle: 'courses/fundamentals-of-quantum-algorithms/grover-algorithm/grover-algorithm-description#phase-query-gates',
  diffuser: 'courses/fundamentals-of-quantum-algorithms/grover-algorithm/analysis#action-of-the-grover-operation',
  amplitude: 'courses/basics-of-quantum-information/single-systems/quantum-information#quantum-state-vectors',
  interference: 'courses/fundamentals-of-quantum-algorithms/grover-algorithm/analysis#geometric-picture',
  iterations: 'courses/fundamentals-of-quantum-algorithms/grover-algorithm/number-of-iterations#multiple-solutions',
  speedup: 'courses/fundamentals-of-quantum-algorithms/grover-algorithm/concluding-remarks',
  bloch: 'modules/quantum-mechanics/superposition-with-qiskit#the-qubit-state-as-a-bloch-vector',
  inequality: 'courses/basics-of-quantum-information/entanglement-in-action/chsh-game#limitation-of-classical-strategies',
  tsirelson: 'courses/basics-of-quantum-information/entanglement-in-action/chsh-game#geometric-picture',
};

export const GLOSSARY_EN: Record<TermKey, GlossaryEntry> = {
  qubit: {
    title: 'Qubit',
    body: 'The quantum version of a bit. When you measure it, you always get 0 or 1. Before that it can be in a [superposition](#superposition) of both, and several qubits can be [entangled](#entanglement).',
  },
  superposition: {
    title: 'Superposition',
    body: 'A qubit can be in a combination of 0 and 1 at the same time. A [measurement](#measurement) then picks one of them at random. The H gate turns |0⟩ into an equal superposition: 50:50.',
  },
  measurement: {
    title: 'Measurement',
    body: 'Reading a qubit gives 0 or 1, at random, with probabilities set by its state. A quantum computer reads qubits in just one direction, the Z basis. To measure X or Y, rotate the qubit first with [gates](#gate) — see [measuring in another basis](#basis).',
  },
  entanglement: {
    title: 'Entanglement',
    body: 'Qubits that share one joint state, which cannot be split into a state for each qubit. In the states used in our games, each qubit on its own gives random results, yet the results fit together — perfectly in the GHZ game and the magic square, 85% of the time in the CHSH game. No signal passes between them — and still no list of answers written in advance can produce these correlations.',
  },
  bell: {
    title: 'Bell pair',
    body: 'Two entangled qubits in the state (|00⟩ + |11⟩)/√2, made from |00⟩ by an H and a [CNOT](#cnot). Measured both in Z or both in X, they always give the same result; both in Y, always opposite results. Written in the X basis it is (|++⟩ + |−−⟩)/√2 — just as simple.',
  },
  ghz: {
    title: 'GHZ state',
    body: 'Three entangled qubits in the state (|000⟩ + |111⟩)/√2, named after Greenberger, Horne and Zeilinger. One H and two [CNOTs](#cnot) make it. Measured in Z: all 0 or all 1. Measured X, X, X: always an even number of 1s. Measured X, Y, Y (in any order): always an odd number.',
  },
  pauli: {
    title: 'X, Y and Z measurements',
    body: 'The three basic measurements of a qubit, along the three axes of the Bloch sphere. Each gives +1 or −1, which we write as 0 or 1. On two qubits, X⊗Z means X on the first and Z on the second; its result is the product of the two.',
  },
  tensor: {
    title: '⊗ (tensor product)',
    body: 'Puts operations on separate qubits together: X⊗Z does X on the first qubit and Z on the second. For states, |0⟩⊗|1⟩ is written |01⟩.',
  },
  commute: {
    title: 'Commuting measurements',
    body: 'Two measurements commute if their order does not matter: A·B = B·A. Then they can be made together. X and Z do not commute: X·Z = −Z·X. So X and Z of one qubit cannot both have a value at the same time — and a proof that multiplies all answers together, as if they did, does not apply.',
  },
  basis: {
    title: 'Measuring in another basis',
    body: 'A quantum computer only measures Z. Applying gates U and then measuring Z is the same as measuring U†·Z·U. Since H·Z·H = X, "H, then measure" measures X; "S†, H, then measure" measures Y. With two-qubit gates such as [CNOT](#cnot) and [SWAP](#swap) the same trick measures X⊗X, Z⊗Z and more.',
  },
  gate: {
    title: 'Quantum gate',
    body: 'An operation on qubits — the quantum version of a logic gate. H (Hadamard) creates [superposition](#superposition), X flips 0 and 1, Z, S and S† change the phase, Ry(θ) turns the qubit by θ on the [Bloch circle](#bloch). Gates are reversible.',
  },
  cnot: {
    title: 'CNOT and CZ',
    body: 'Two-qubit gates. CNOT (drawn ● and ⊕) flips the second qubit if the first is 1. CZ (● and ●) multiplies by −1 when both are 1. An H on the first qubit before a CNOT creates [entanglement](#entanglement) — a [Bell pair](#bell); CZ does the same when both qubits get an H first.',
  },
  swap: {
    title: 'SWAP',
    body: 'Exchanges two qubits (drawn × and ×). Put before a measurement, it turns a measurement of the second qubit into one of the first.',
  },
  circuit: {
    title: 'Quantum circuit',
    body: 'A recipe of [gates](#gate), read from left to right: one line per qubit, the measurements at the end. Boxes such as “oracle” and “diffuser” stand for groups of gates. In the games with players far apart, a dashed line separates preparing the shared state from what each player (or inspector) does.',
  },
  parity: {
    title: 'Even and odd (parity)',
    body: 'Whether a list of 0s and 1s has an even or an odd number of 1s. Written as numbers +1 and −1 (0 → +1, 1 → −1), it is their product: even → +1, odd → −1. That is how the proofs turn counting into multiplying.',
  },
  classical: {
    title: 'Classical strategy',
    body: 'Any plan without quantum help. Because the players cannot talk during the game, it comes down to a fixed table: what each player answers to each question. (Rolling dice never does better than the best table.) There are only finitely many tables — 16 in the CHSH game and in Hardy’s paradox, 64 in the GHZ game, 4096 in the magic square — so the computer can try them all.',
  },
  nonlocal: {
    title: 'Nonlocal game',
    body: 'Separated players each get a question and must answer without talking. Comparing the best [classical strategy](#classical) with the best quantum one shows what [entanglement](#entanglement) can do. In the GHZ game and the magic square the quantum team wins every round — "quantum pseudo-telepathy". The best-known nonlocal game is the CHSH game.',
  },
  hidden: {
    title: 'Hidden variables',
    body: 'The idea, defended by Einstein, that every measurement result is fixed in advance, like a script each particle carries, and that nothing far away can change it. Such a script is exactly a [classical strategy](#classical) — so if the quantum team wins more often, the idea is wrong. The GHZ game and Hardy’s paradox show it without any inequality.',
  },
  sat: {
    title: 'Boolean satisfiability (SAT)',
    body: 'Given a formula of true/false variables joined with AND, OR and NOT: is there an assignment that makes it true? Checking a proposed assignment is quick. Finding one can take very long: the number of possible assignments doubles with every variable, and no known method avoids searching through a large part of them in the worst case.',
  },
  cnf: {
    title: 'Clauses and 3-SAT',
    body: 'A literal is a variable or its negation, like x₁ or ¬x₂. A clause is an OR of literals, like (x₁ ∨ ¬x₂ ∨ x₃). A formula in conjunctive normal form (CNF) is an AND of clauses; when every clause has three literals it is a 3-SAT problem. The DIMACS text format writes a clause as numbers: 3 for x₃, −2 for ¬x₂, and 0 to end it.',
  },
  npcomplete: {
    title: 'NP-complete',
    body: 'NP is the class of problems whose solutions can be checked quickly. SAT was the first problem shown to be NP-complete (Cook 1971, Levin 1973): every problem in NP can be translated into SAT. No fast algorithm is known for NP-complete problems, and most researchers expect that quantum computers cannot solve them fast either — Grover’s [speed-up](#speedup) is quadratic, not exponential.',
  },
  search: {
    title: 'Unstructured search',
    body: 'Finding one of M marked items among N when all you can do is check items one at a time — no index, no structure to exploit. Classically that takes about N/M checks; Grover’s search needs about π/4·√(N/M) rounds.',
  },
  grover: {
    title: 'Grover’s search',
    body: 'Lov Grover’s quantum search algorithm (1996): put all N candidates into [superposition](#superposition), repeat [oracle](#oracle) + [diffuser](#diffuser) about π/4·√(N/M) times, then measure. A solution comes out with high probability.',
  },
  oracle: {
    title: 'Oracle',
    body: 'The part of the circuit that recognizes solutions: it flips the sign of the [amplitude](#amplitude) of every assignment that satisfies the formula and leaves all others alone. Building it needs only the formula, not the solutions. A sign alone changes no probability — the [diffuser](#diffuser) turns it into a change of probability.',
  },
  diffuser: {
    title: 'Diffuser',
    body: 'Reflects every [amplitude](#amplitude) about the average: a → 2·average − a. After the [oracle](#oracle) the solutions are negative and pull the average down a little; reflecting about it makes them large and all others small. In the circuit it is H gates on every qubit, a sign flip of |00…0⟩, and H gates again (up to an overall sign, which no measurement can see).',
  },
  amplitude: {
    title: 'Amplitude',
    body: 'Every possible result of a measurement has an amplitude; the square of its size is the probability of that result. Unlike probabilities, amplitudes can be negative, so they can cancel or add up — that is [interference](#interference).',
  },
  interference: {
    title: 'Interference in Grover’s search',
    body: 'Amplitudes add up or cancel like waves. Each Grover round turns the state by the same angle 2θ towards the solutions, where sin²θ = M/N. After k rounds the chance of measuring a solution is sin²((2k+1)θ) — it rises, peaks, and falls again if you go on.',
  },
  iterations: {
    title: 'How many rounds?',
    body: 'With M solutions among N and sin²θ = M/N, the first peak comes after ⌊π/(4θ)⌋ rounds — about π/4·√(N/M) when solutions are rare. Fewer rounds stop short; a few more overshoot and the chance falls — more is not better. (It rises again later, but every later peak costs more rounds.) If half or more of all assignments are solutions, don’t search at all — just measure. If M is unknown, quantum counting can estimate it, or you try growing numbers of rounds.',
  },
  speedup: {
    title: 'Quadratic speed-up',
    body: 'Grover needs about π/4·√(N/M) rounds where a classical search needs about N/M checks. With n variables, N = 2ⁿ: still exponential in n, but with half the exponent. For 40 variables and one solution that is up to about 10¹² classical checks against about 820,000 Grover rounds.',
  },
  contextuality: {
    title: 'Contextuality',
    body: 'Each observable of the magic square sits in one row and one column. No fixed values for all nine work in every row and column — that is the [parity](#parity) proof. So a quantum result cannot be a value that exists in advance, independent of which other measurements are made with it (its context). This is the Kochen–Specker theorem; the magic square is one of its simplest proofs.',
  },
  bloch: {
    title: 'Bloch circle',
    body: 'Every qubit state is an arrow on the Bloch sphere: |0⟩ at the top, |1⟩ at the bottom. States with real amplitudes, cos(φ/2)|0⟩ + sin(φ/2)|1⟩, lie on one circle through the top and the bottom, at angle φ from the top: |+⟩ at 90°, |−⟩ at −90°. To measure along an arrow at angle φ, turn the qubit back with Ry(−φ) and measure: 0 means along the arrow, 1 the opposite way.',
  },
  inequality: {
    title: 'CHSH inequality',
    body: 'Score each question by its correlation E = P(same) − P(different). In the CHSH game the win rate is 1/2 + S/8 with S = E₀₀ + E₀₁ + E₁₀ − E₁₁. Every [classical strategy](#classical) — any local [hidden variables](#hidden) — has S ≤ 2, so it wins at most 75%. Quantum mechanics reaches S = 2√2 ≈ 2.83. Clauser, Horne, Shimony and Holt (1969) found this form of John Bell’s inequality, the form most experiments test.',
  },
  tsirelson: {
    title: 'Tsirelson’s bound',
    body: 'No quantum strategy wins the CHSH game more often than cos²(π/8) = 1/2 + √2/4 ≈ 85.4% (S ≤ 2√2) — whatever the entangled state and the measurements. Boris Tsirelson proved it in 1980. A [Bell pair](#bell) measured along the right arrows reaches it exactly.',
  },
  counterfactual: {
    title: 'Counterfactual reasoning',
    body: 'Reasoning about the result of a check that was not made: “had we looked at the color, it would have been red.” For things that carry their properties with them, such as written spec sheets, this is harmless. For qubits it fails: a measurement that was not made has no result fixed in advance — “unperformed experiments have no results”, as Asher Peres titled a 1978 paper. Hardy’s paradox shows exactly where it breaks.',
  },
  signaling: {
    title: 'No signaling',
    body: 'Entanglement does not let Alice and Bob send messages. Alice’s results on their own don’t depend on what Bob measures (in our games they are simply 50:50), so they tell her nothing about Bob’s question. The correlation appears only when both lists of results are brought together — and that needs ordinary communication.',
  },
};

/** IBM Quantum Learning languages (others fall back to English). */
const IBM_LANGS: ReadonlySet<string> = new Set(['en', 'ja', 'de', 'es', 'fr', 'it']);

export function ibmLink(term: TermKey, locale = 'en'): string | null {
  const page = TERM_PAGES[term];
  return page ? `https://quantum.cloud.ibm.com/learning/${IBM_LANGS.has(locale) ? locale : 'en'}/${page}` : null;
}

export function doqLink(term: TermKey, locale = 'en'): string | null {
  const page = TERM_PAGES[term];
  return page ? `https://${locale === 'en' ? '' : `${locale}.`}doqumentation.org/learning/${page}` : null;
}

const TERM_LINK = /\[([^\]]+)\]\(#([a-z]+)\)/g;

/** Turn `[words](#term)` into explanation buttons; everything else is trusted catalogue HTML. */
export function rich(html: string): string {
  return html.replace(TERM_LINK, (_m, words: string, term: string) =>
    `<button type="button" class="qg-term" data-term="${term}">${words}</button>`);
}

/** All `#term` references in a string — used by tests to catch typos. */
export function termRefs(html: string): string[] {
  return [...html.matchAll(TERM_LINK)].map((m) => m[2]);
}
