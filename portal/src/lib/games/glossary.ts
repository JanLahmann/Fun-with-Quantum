/**
 * Explanations on demand for the GHZ game and the magic square (the coin game has its own, in
 * src/lib/qcoin/i18n). Same conventions: `[words](#term)` in any game text becomes a button that
 * opens the term; each term links to IBM Quantum Learning and to the same page on doQumentation
 * (shared paths and anchors, checked 2026-10-02).
 */

export type TermKey =
  | 'qubit' | 'superposition' | 'measurement' | 'entanglement' | 'bell' | 'ghz'
  | 'pauli' | 'tensor' | 'commute' | 'basis' | 'gate' | 'cnot' | 'swap' | 'circuit'
  | 'parity' | 'classical' | 'nonlocal' | 'hidden' | 'contextuality';

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
    body: 'Qubits that share one joint state, which cannot be split into a state for each qubit. In the states used in these games, each qubit on its own gives random results, yet the results fit together perfectly. No signal passes between them — and still no list of answers written in advance can produce these correlations.',
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
    body: 'An operation on qubits — the quantum version of a logic gate. H (Hadamard) creates [superposition](#superposition), X flips 0 and 1, Z, S and S† change the phase. Gates are reversible.',
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
    body: 'A recipe of [gates](#gate), read from left to right: one line per qubit, the measurements at the end. The dashed line separates preparing the shared state from what each player does.',
  },
  parity: {
    title: 'Even and odd (parity)',
    body: 'Whether a list of 0s and 1s has an even or an odd number of 1s. Written as numbers +1 and −1 (0 → +1, 1 → −1), it is their product: even → +1, odd → −1. That is how the proofs turn counting into multiplying.',
  },
  classical: {
    title: 'Classical strategy',
    body: 'Any plan without quantum help. Because the players cannot talk during the game, it comes down to a fixed table: what each player answers to each question. (Rolling dice never does better than the best table.) There are only finitely many tables — 64 in the GHZ game, 4096 in the magic square — so the computer can try them all.',
  },
  nonlocal: {
    title: 'Nonlocal game',
    body: 'Separated players each get a question and must answer without talking. Comparing the best [classical strategy](#classical) with the best quantum one shows what [entanglement](#entanglement) can do. In the GHZ game and the magic square the quantum team wins every round — "quantum pseudo-telepathy". The best-known nonlocal game is the CHSH game.',
  },
  hidden: {
    title: 'Hidden variables',
    body: 'The idea, defended by Einstein, that every measurement result is fixed in advance, like a script each particle carries, and that nothing far away can change it. Such a script is exactly a [classical strategy](#classical) — so if the quantum team wins more often, the idea is wrong. The GHZ game shows it without any statistics.',
  },
  contextuality: {
    title: 'Contextuality',
    body: 'Each observable of the magic square sits in one row and one column. No fixed values for all nine work in every row and column — that is the [parity](#parity) proof. So a quantum result cannot be a value that exists in advance, independent of which other measurements are made with it (its context). This is the Kochen–Specker theorem; the magic square is one of its simplest proofs.',
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
