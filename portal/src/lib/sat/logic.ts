/**
 * Boolean satisfiability and Grover's search — the logic of the browser 3-SAT page, the same as
 * 3sat.ipynb.
 *
 * Formulas use & (AND), | (OR), ~ (NOT) and parentheses, with Python's precedence (~ before &
 * before |), as Qiskit's PhaseOracleGate reads them. Variables are put on qubits 0, 1, 2, … in
 * natural order, x2 before x10 (the notebook's `variables()`); assignment index i has variable k =
 * bit k of i.
 *
 * Grover is simulated exactly on the real amplitudes: superposition (all equal), oracle (flip the
 * sign of every solution), diffuser (reflect about the average: a → 2·mean − a).
 */

export type Node =
  | { t: 'var'; name: string }
  | { t: 'not'; a: Node }
  | { t: 'and' | 'or'; a: Node; b: Node };

export class FormulaError extends Error {
  /** `at`: 0-based position of the problem in the formula, or −1 when it is not about one place. */
  constructor(message: string, public at: number) { super(message); }
}

type Token = { k: 'id' | '&' | '|' | '~' | '(' | ')' | 'end'; v: string; at: number };

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    if ('&|~()'.includes(ch)) { out.push({ k: ch as Token['k'], v: ch, at: i }); i++; continue; }
    const m = /^[A-Za-z_]\w*/.exec(src.slice(i));
    if (m) { out.push({ k: 'id', v: m[0], at: i }); i += m[0].length; continue; }
    throw new FormulaError(`unexpected “${ch}”`, i);
  }
  out.push({ k: 'end', v: '', at: src.length });
  return out;
}

/** Parse a formula; throws FormulaError with the position of the problem. */
export function parse(src: string): Node {
  const tok = tokenize(src);
  let p = 0;
  const peek = () => tok[p];
  const take = (k: Token['k']) => {
    if (tok[p].k !== k) throw new FormulaError(k === ')' ? 'missing “)”' : `expected “${k}”`, tok[p].at);
    return tok[p++];
  };
  function or(): Node {
    let n = and();
    while (peek().k === '|') { p++; n = { t: 'or', a: n, b: and() }; }
    return n;
  }
  function and(): Node {
    let n = not();
    while (peek().k === '&') { p++; n = { t: 'and', a: n, b: not() }; }
    return n;
  }
  function not(): Node {
    if (peek().k === '~') { p++; return { t: 'not', a: not() }; }
    return atom();
  }
  function atom(): Node {
    const t = peek();
    if (t.k === 'id') { p++; return { t: 'var', name: t.v }; }
    if (t.k === '(') { p++; const n = or(); take(')'); return n; }
    throw new FormulaError(t.k === 'end' ? 'the formula ends too early' : `unexpected “${t.v}”`, t.at);
  }
  if (peek().k === 'end') throw new FormulaError('the formula is empty', 0);
  const n = or();
  if (peek().k !== 'end') throw new FormulaError(`unexpected “${peek().v}”`, peek().at);
  return n;
}

/**
 * Natural order, as the notebook's variables(): split names into text and number runs, compare
 * text by code point (capitals before small letters, like Python) and numbers by value.
 */
function naturalKey(v: string): (string | number)[] {
  return v.split(/(\d+)/).map((t, i) => (i % 2 ? Number(t) : t));
}
export function compareNames(a: string, b: string): number {
  const ka = naturalKey(a), kb = naturalKey(b);
  for (let i = 0; i < Math.min(ka.length, kb.length); i++) {
    const x = ka[i], y = kb[i];
    if (x !== y) return x < y ? -1 : 1; // same position → same type (text, number, text, …)
  }
  return ka.length - kb.length;
}

/** The variables of a formula in natural order (x2 before x10). */
export function variables(n: Node): string[] {
  const s = new Set<string>();
  const walk = (x: Node) => { if (x.t === 'var') s.add(x.name); else if (x.t === 'not') walk(x.a); else { walk(x.a); walk(x.b); } };
  walk(n);
  return [...s].sort(compareNames);
}

export function evaluate(n: Node, v: Record<string, boolean>): boolean {
  switch (n.t) {
    case 'var': return v[n.name];
    case 'not': return !evaluate(n.a, v);
    case 'and': return evaluate(n.a, v) && evaluate(n.b, v);
    case 'or': return evaluate(n.a, v) || evaluate(n.b, v);
  }
}

/** Assignment index i → values: variable vars[k] is bit k of i (qubit k). */
export function assignment(vars: readonly string[], i: number): Record<string, boolean> {
  return Object.fromEntries(vars.map((name, k) => [name, ((i >> k) & 1) === 1]));
}

/** Bit string of an assignment as Qiskit prints it: qubit 0 (the first variable) on the right. */
export function bitString(i: number, n: number): string {
  let s = '';
  for (let k = n - 1; k >= 0; k--) s += (i >> k) & 1;
  return s;
}

export interface Puzzle {
  formula: string;
  node: Node;
  vars: string[];
  /** solution[i]: does assignment i satisfy the formula? */
  solution: boolean[];
}

export const MAX_VARS = 6;

export function puzzle(formula: string): Puzzle {
  const node = parse(formula);
  const vars = variables(node);
  if (vars.length > MAX_VARS) throw new FormulaError(`at most ${MAX_VARS} variables here (this one has ${vars.length})`, -1);
  const solution = Array.from({ length: 1 << vars.length }, (_, i) => evaluate(node, assignment(vars, i)));
  return { formula, node, vars, solution };
}

export const countSolutions = (p: Puzzle) => p.solution.filter(Boolean).length;

/* ------------------------------------------------------------------ Grover */

/** Hadamard on every qubit: all N assignments with amplitude 1/√N. */
export const superposition = (n: number): number[] => new Array(1 << n).fill(1 / Math.sqrt(1 << n));

/** The oracle: flip the sign of every solution. */
export const oracle = (amps: readonly number[], solution: readonly boolean[]): number[] =>
  amps.map((a, i) => (solution[i] ? -a : a));

/** The diffuser: reflect every amplitude about the average. */
export function diffuser(amps: readonly number[]): number[] {
  const mean = amps.reduce((s, a) => s + a, 0) / amps.length;
  return amps.map((a) => 2 * mean - a);
}

export const mean = (amps: readonly number[]) => amps.reduce((s, a) => s + a, 0) / amps.length;

/** Amplitudes after k full rounds (oracle + diffuser). */
export function afterRounds(p: Puzzle, k: number): number[] {
  let a = superposition(p.vars.length);
  for (let r = 0; r < k; r++) a = diffuser(oracle(a, p.solution));
  return a;
}

export const probabilities = (amps: readonly number[]) => amps.map((a) => a * a);

export function successProbability(amps: readonly number[], solution: readonly boolean[]): number {
  return amps.reduce((s, a, i) => s + (solution[i] ? a * a : 0), 0);
}

/** sin²((2k+1)θ) with sin²θ = M/N — the closed form of the success probability after k rounds. */
export function predicted(nVars: number, m: number, k: number): number {
  const theta = Math.asin(Math.sqrt(m / 2 ** nVars));
  return Math.sin((2 * k + 1) * theta) ** 2;
}

/**
 * The number of rounds that reaches the first peak of sin²((2k+1)θ): floor(π/(4θ)), about
 * π/4·√(N/M). It is 0 when half or more of the assignments are solutions — then no round raises
 * the chance (|sin 3θ| ≤ sin θ for sin²θ ≥ ½), so you just measure. null without solutions.
 * Same as the notebook's best_iterations().
 */
export function bestIterations(nVars: number, m: number): number | null {
  if (m === 0) return null;
  if (2 * m >= 2 ** nVars) return 0;
  const theta = Math.asin(Math.sqrt(m / 2 ** nVars));
  return Math.floor(Math.PI / (4 * theta));
}

/** One measurement: an assignment index drawn with its probability. */
export function sample(amps: readonly number[], rng: () => number = Math.random): number {
  let u = rng();
  for (let i = 0; i < amps.length; i++) {
    u -= amps[i] * amps[i];
    if (u < 0) return i;
  }
  for (let i = amps.length - 1; i >= 0; i--) if (amps[i] !== 0) return i; // rounding
  return amps.length - 1;
}

/* ------------------------------------------------------------------ DIMACS */

/** DIMACS CNF → clauses (lists of ±k), ignoring comment (c) and problem (p) lines. */
export function dimacsClauses(text: string): number[][] {
  return text.split('\n').map((l) => l.trim())
    .filter((l) => l && l[0] !== 'c' && l[0] !== 'p')
    .map((l) => l.split(/\s+/).map(Number))
    .map((nums) => { if (nums[nums.length - 1] !== 0) throw new Error('a clause must end with 0'); return nums.slice(0, -1); });
}

/** Clauses → formula, as the notebook does: one (… | … | …) per clause, joined with &. */
export const clausesToFormula = (clauses: readonly (readonly number[])[]) =>
  clauses.map((c) => `(${c.map((l) => `${l < 0 ? '~' : ''}x${Math.abs(l)}`).join(' | ')})`).join(' & ');
