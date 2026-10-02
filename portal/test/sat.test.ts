import { describe, expect, it } from 'vitest';
import {
  FormulaError, afterRounds, assignment, bestIterations, bitString, clausesToFormula, countSolutions, diffuser,
  dimacsClauses, evaluate, mean, oracle, parse, predicted, probabilities, puzzle, sample, successProbability,
  superposition, variables,
} from '../src/lib/sat/logic';
import * as M from '../src/lib/sat/messages';
import qiskit from './fixtures/grover_qiskit.json';

const seq = (...xs: number[]) => { let i = 0; return () => xs[i++ % xs.length]; };

describe('formulas', () => {
  it('parse with Python precedence: ~ before & before |', () => {
    const f = parse('~a | b & c');
    for (let i = 0; i < 8; i++) {
      const v = assignment(['a', 'b', 'c'], i);
      expect(evaluate(f, v)).toBe(!v.a || (v.b && v.c));
    }
    const g = parse('~(a | b) & c');
    expect(evaluate(g, { a: false, b: false, c: true })).toBe(true);
    expect(evaluate(g, { a: true, b: false, c: true })).toBe(false);
    expect(evaluate(parse('~~a'), { a: true })).toBe(true);
  });

  it('sort variables like Python (capitals first) and accept long names', () => {
    expect(variables(parse('Bob & ~alice | eve & (Dan | ~Bob)'))).toEqual(['Bob', 'Dan', 'alice', 'eve']);
    expect(variables(parse('x10 | x2 | x1'))).toEqual(['x1', 'x2', 'x10']); // natural order, as the notebook
    expect(variables(parse('b2 | a10 | B | a2 | a'))).toEqual(['B', 'a', 'a2', 'a10', 'b2']);
    expect(variables(parse('_a & b_2'))).toEqual(['_a', 'b_2']);
  });

  it('reject broken formulas with a position', () => {
    const bad: [string, number][] = [['', 0], ['A &', 3], ['(A | B', 6], ['A B', 2], ['A ^ B', 2], ['A & | B', 4], [')', 0], ['A & 2', 4], ['A && B', 3]];
    for (const [f, at] of bad) {
      let err: unknown = null;
      try { parse(f); } catch (e) { err = e; }
      expect(err, f).toBeInstanceOf(FormulaError);
      expect((err as FormulaError).at, f).toBe(at);
    }
    expect(() => puzzle('a&b&c&d&e&f&g')).toThrow(FormulaError);
    expect(M.CH4.error('at most 6 variables here (this one has 7)', -1)).toBe('That formula is too big: at most 6 variables here (this one has 7).');
    expect(M.CH4.error('unexpected “|”', 4)).toBe('That formula doesn’t parse: unexpected “|” (at character 5).');
    expect(puzzle('a&b&c&d&e&f').vars).toHaveLength(6);
  });

  it('bit strings follow Qiskit: qubit 0 (the first variable) on the right', () => {
    expect(bitString(0b0011, 4)).toBe('0011');
    expect(bitString(1, 3)).toBe('001');
    expect(assignment(['A', 'B', 'C', 'D'], 0b0011)).toEqual({ A: true, B: true, C: false, D: false });
  });
});

describe('the two puzzles', () => {
  it('party: exactly the 4 lists Alice+Bob, Alice+Bob+Carol, Carol+David, Bob+Carol+David', () => {
    const p = puzzle(M.PARTY);
    const sols = p.solution.map((ok, i) => (ok ? bitString(i, 4) : null)).filter(Boolean);
    expect(sols).toEqual(['0011', '0111', '1100', '1110']);
    expect(M.guestList(0b0011)).toBe('Alice and Bob');
    expect(M.guestList(0b0111)).toBe('Alice, Bob and Carol');
    expect(M.guestList(0b1110)).toBe('Bob, Carol and David');
    expect(M.guestList(0)).toBe('nobody');
  });

  it('3-SAT: the DIMACS text gives the notebook formula and the solutions 000, 101, 110 (read x1 x2 x3)', () => {
    const clauses = dimacsClauses(M.SAT3_DIMACS);
    expect(clauses).toEqual([[-1, -2, -3], [1, -2, 3], [1, 2, -3], [1, -2, -3], [-1, 2, 3]]);
    const f = clausesToFormula(clauses);
    expect(f).toBe('(~x1 | ~x2 | ~x3) & (x1 | ~x2 | x3) & (x1 | x2 | ~x3) & (x1 | ~x2 | ~x3) & (~x1 | x2 | x3)');
    const p = puzzle(f);
    expect(p.vars).toEqual(['x1', 'x2', 'x3']);
    const readX1X2X3 = p.solution.map((ok, i) => (ok ? bitString(i, 3).split('').reverse().join('') : null)).filter(Boolean).sort();
    expect(readX1X2X3).toEqual(['000', '101', '110']);
    // every clause of the LaTeX formula in the page text, checked against the DIMACS clauses
    expect(M.CH3.intro).toContain('(¬x₁ ∨ ¬x₂ ∨ ¬x₃) ∧ (x₁ ∨ ¬x₂ ∨ x₃) ∧ (x₁ ∨ x₂ ∨ ¬x₃) ∧ (x₁ ∨ ¬x₂ ∨ ¬x₃) ∧ (¬x₁ ∨ x₂ ∨ x₃)');
    expect(M.CH3.intro).toContain('-1 -2 -3 0<br>1 -2 3 0<br>1 2 -3 0<br>1 -2 -3 0<br>-1 2 3 0');
  });
});

describe('Grover', () => {
  it('agrees with Qiskit (PhaseOracleGate + grover_operator, as in the notebook) for k = 0…4 rounds', () => {
    expect(qiskit.cases.length).toBeGreaterThanOrEqual(9);
    for (const c of qiskit.cases) {
      const p = puzzle(c.formula);
      expect(p.vars, c.formula).toEqual(c.vars);
      c.probabilities.forEach((ref: number[], k: number) => {
        const ours = probabilities(afterRounds(p, k));
        ref.forEach((x, i) => expect(Math.abs(ours[i] - x), `${c.formula}, k=${k}, |${bitString(i, p.vars.length)}⟩`).toBeLessThan(1e-9));
      });
    }
  });

  it('the success chance follows sin²((2k+1)θ) with sin²θ = M/N', () => {
    for (const f of [M.PARTY, 'a & b & c & d & e & f', '(a | b | c) & ~(a & b) & ~(a & c) & ~(b & c)', 'x']) {
      const p = puzzle(f), m = countSolutions(p);
      for (let k = 0; k < 8; k++) expect(successProbability(afterRounds(p, k), p.solution)).toBeCloseTo(predicted(p.vars.length, m, k), 12);
    }
  });

  it('the numbers the page states', () => {
    expect(predicted(4, 4, 0)).toBeCloseTo(0.25, 12);
    expect(predicted(4, 4, 1)).toBeCloseTo(1, 12); // party: one round, 100%
    expect(predicted(4, 4, 2)).toBeCloseTo(0.25, 12); // overshoot back to 25%
    expect(predicted(3, 3, 1)).toBeCloseTo(27 / 32, 12); // 3-SAT: 84.4%
    expect(M.pct(27 / 32)).toBe('84.4%');
    expect(Math.asin(Math.sqrt(4 / 16)) * 180 / Math.PI).toBeCloseTo(30, 12); // θ = 30°
    expect(bestIterations(4, 4)).toBe(1);
    expect(bestIterations(3, 3)).toBe(1);
    // the scaling table: about π/4·√N rounds for one solution
    expect([10, 20, 30, 40].map((n) => bestIterations(n, 1))).toEqual([25, 804, 25735, 823549]);
    expect(Math.round(Math.PI / 4 * Math.sqrt(2 ** 40))).toBe(823550); // "about 820,000" in the glossary
  });

  it('rounds to the first peak: floor(π/(4θ)); 0 when more than half are solutions; null without solutions', () => {
    expect(bestIterations(6, 1)).toBe(6);
    expect(bestIterations(1, 1)).toBe(0); // exactly half: 0 rounds (1 round would also give 50%)
    expect(bestIterations(3, 4)).toBe(0);
    expect(predicted(3, 4, 1)).toBeCloseTo(predicted(3, 4, 0), 12);
    expect(bestIterations(3, 0)).toBeNull();
    expect(bestIterations(3, 8)).toBe(0); // every assignment a solution
    expect(bestIterations(2, 3)).toBe(0); // 'a | b': one round would drop 75% to 0%
    expect(predicted(2, 3, 1)).toBeCloseTo(0, 12);
    // for M/N > ½ any single round lowers the chance; at the returned k the chance is the best of k = 0…k+1
    for (let n = 1; n <= 6; n++) for (let m = 1; m <= 2 ** n; m++) {
      const k = bestIterations(n, m)!;
      if (2 * m >= 2 ** n) { expect(k).toBe(0); expect(predicted(n, m, 1)).toBeLessThan(predicted(n, m, 0) + 1e-12); }
      for (let j = 0; j <= k + 1; j++) expect(predicted(n, m, k), `n=${n} m=${m} k=${k} j=${j}`).toBeGreaterThanOrEqual(predicted(n, m, j) - 1e-12);
    }
  });

  it('oracle flips signs only; diffuser reflects about the mean and keeps the norm', () => {
    const p = puzzle(M.PARTY);
    const s = superposition(4);
    const o = oracle(s, p.solution);
    expect(successProbability(o, p.solution)).toBeCloseTo(successProbability(s, p.solution), 12);
    const d = diffuser(o);
    d.forEach((x, i) => expect(x).toBeCloseTo(2 * mean(o) - o[i], 12));
    expect(probabilities(d).reduce((a, b) => a + b)).toBeCloseTo(1, 12);
  });

  it('no solution: nothing is amplified; all solutions: always a solution', () => {
    const none = puzzle('x & ~x');
    expect(countSolutions(none)).toBe(0);
    for (let k = 0; k < 4; k++) expect(probabilities(afterRounds(none, k))).toEqual([0.5, 0.5].map((x) => expect.closeTo(x, 12)));
    const all = puzzle('a | ~a');
    for (let k = 0; k < 4; k++) expect(successProbability(afterRounds(all, k), all.solution)).toBeCloseTo(1, 12);
  });

  it('measures with the given random source', () => {
    const p = puzzle(M.PARTY);
    const a = afterRounds(p, 1);
    for (const u of [0, 0.3, 0.6, 0.9999999]) expect(p.solution[sample(a, seq(u))]).toBe(true);
  });
});
