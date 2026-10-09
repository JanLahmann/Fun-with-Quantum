import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as pd from '../src/lib/pd/game';
import { CH1, CH2, CH3, CH4, PAGE, TERMS, UI } from '../src/lib/pd/messages';
import { GLOSSARY_EN, termRefs } from '../src/lib/games/glossary';
import { run } from '../src/lib/qsim';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/pd_qiskit.json', import.meta.url), 'utf8')) as {
  qiskit: string; cases: { alice: number[]; bob: number[]; names: string[]; amplitudes: [number, number][] }[];
};
const mv = (a: number[]): pd.Move => ({ theta: a[0], phi: a[1], alpha: a[2] });
const rng = (seed: number) => () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

describe('qsim Rz and RYY', () => {
  it('Rz(t) = diag(e^{−it/2}, e^{it/2})', () => {
    const t = 0.9, s = run(1, [{ g: 'h', q: 0 }, { g: 'rz', q: 0, t }]);
    expect(s.re[0]).toBeCloseTo(Math.SQRT1_2 * Math.cos(t / 2), 12); expect(s.im[0]).toBeCloseTo(-Math.SQRT1_2 * Math.sin(t / 2), 12);
    expect(s.re[1]).toBeCloseTo(Math.SQRT1_2 * Math.cos(t / 2), 12); expect(s.im[1]).toBeCloseTo(Math.SQRT1_2 * Math.sin(t / 2), 12);
  });
  it('RYY(t)|00⟩ = cos(t/2)|00⟩ + i·sin(t/2)|11⟩', () => {
    const t = 1.2, s = run(2, [{ g: 'ryy', a: 0, b: 1, t }]);
    expect(s.re[0]).toBeCloseTo(Math.cos(t / 2), 12); expect(s.im[3]).toBeCloseTo(Math.sin(t / 2), 12);
  });
});

describe('prisoner’s dilemma: classical', () => {
  it('points and dominance: D beats C whatever Bob does; (D, D) gives 1 each, (C, C) 3 each', () => {
    expect(pd.points(0, 0)).toEqual([3, 3]); expect(pd.points(1, 0)).toEqual([5, 0]);
    expect(pd.points(0, 1)).toEqual([0, 5]); expect(pd.points(1, 1)).toEqual([1, 1]);
    expect(pd.bestClassicalReply(0)).toBe(1); expect(pd.bestClassicalReply(1)).toBe(1);
  });
});

describe('prisoner’s dilemma: quantum', () => {
  it(`the simulator matches Qiskit ${fixture.qiskit} (and the EWL matrices) for ${fixture.cases.length} move pairs, up to a global phase`, () => {
    for (const c of fixture.cases) {
      const s = run(2, pd.gameOps(mv(c.alice), mv(c.bob)));
      let ip = { re: 0, im: 0 }; // ⟨qiskit|ours⟩
      c.amplitudes.forEach(([re, im], i) => { ip = { re: ip.re + re * s.re[i] + im * s.im[i], im: ip.im + re * s.im[i] - im * s.re[i] }; });
      expect(Math.hypot(ip.re, ip.im)).toBeCloseTo(1, 10);
      c.amplitudes.forEach(([re, im], i) => expect(s.re[i] ** 2 + s.im[i] ** 2).toBeCloseTo(re * re + im * im, 10));
    }
  });
  it('the C/D/Q table: the classical game inside, Q beats D, (Q, Q) pays 3 each', () => {
    const T: Record<string, [number, number]> = { CC: [3, 3], CD: [0, 5], CQ: [1, 1], DC: [5, 0], DD: [1, 1], DQ: [0, 5], QC: [1, 1], QD: [5, 0], QQ: [3, 3] };
    for (const [k, v] of Object.entries(T)) {
      const [a, b] = pd.payoffs(pd.NAMED[k[0] as 'C'], pd.NAMED[k[1] as 'C']);
      expect(a).toBeCloseTo(v[0], 12); expect(b).toBeCloseTo(v[1], 12);
    }
  });
  it('(Q, Q) is the only equilibrium in EWL’s two-angle moves (grid θ 10°, φ 5°); against Q nothing earns more than 3', () => {
    const grid: pd.Move[] = [];
    for (let t = 0; t <= 180; t += 10) for (let p = 0; p <= 90; p += 5) grid.push({ theta: t, phi: p });
    const n = grid.length, A = grid.map((a) => grid.map((b) => pd.payoffs(a, b)));
    const ne: [number, number][] = [];
    const bestA = grid.map((_, j) => Math.max(...grid.map((_, k) => A[k][j][0]))); // Alice's best reply to Bob's move j
    const bestB = grid.map((_, i) => Math.max(...grid.map((_, k) => A[i][k][1]))); // Bob's best reply to Alice's move i
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (A[i][j][0] >= bestA[j] - 1e-9 && A[i][j][1] >= bestB[i] - 1e-9) ne.push([i, j]);
    }
    expect(ne).toHaveLength(1);
    expect(grid[ne[0][0]]).toEqual(pd.Q); expect(grid[ne[0][1]]).toEqual(pd.Q);
    const land = pd.landscape(pd.Q);
    expect(Math.max(...land.pts.flat())).toBeCloseTo(3, 12);
  }, 30000);
  it('with all one-qubit moves: iσx beats Q 5:0, and every move of Bob has a counter worth 5', () => {
    const [a, b] = pd.payoffs(pd.COUNTER_Q, pd.Q);
    expect(a).toBeCloseTo(5, 12); expect(b).toBeCloseTo(0, 12);
    const r = rng(9);
    const bobs: pd.Move[] = Array.from({ length: 300 }, () => pd.randomMove(r));
    for (const theta of [0, 1, 3, 7, 90, 173, 177, 179, 180]) for (const phi of [0, 38, 200, 359]) bobs.push({ theta, phi, alpha: (phi * 7) % 360 });
    for (const b of bobs) {
      const c = pd.counterMove(b), [pa, pb] = pd.payoffs(c.move, b);
      expect(pa).toBeCloseTo(5, 10); expect(pb).toBeCloseTo(0, 10);
      // the move as displayed (whole degrees) still earns 5, since the counter of a whole-degree move is whole
      expect(Number.isInteger(c.move.theta) && Number.isInteger(c.move.phi) && Number.isInteger(c.move.alpha ?? 0)).toBe(true);
    }
    const q = pd.counterMove(pd.Q).move; // −iσx: the same move as iσx up to a global phase
    expect(pd.outcomes(q, pd.Q).map((x) => x.toFixed(12))).toEqual(pd.outcomes(pd.COUNTER_Q, pd.Q).map((x) => x.toFixed(12)));
  });
  it('against a random mix of I, iσx, iσy, iσz, every reply earns 2.25 on average', () => {
    expect(pd.MIXED_PAYOFF).toBe(2.25);
    const r = rng(4);
    for (let k = 0; k < 50; k++) {
      const m = pd.randomMove(r);
      const avgA = pd.QUATERNIONS.reduce((s, q) => s + pd.payoffs(m, q)[0], 0) / 4;
      const avgB = pd.QUATERNIONS.reduce((s, q) => s + pd.payoffs(q, m)[1], 0) / 4;
      expect(avgA).toBeCloseTo(2.25, 12); expect(avgB).toBeCloseTo(2.25, 12);
    }
    expect(pd.QUATERNIONS[2]).toEqual({ ...pd.D, alpha: 0 }); // iσy = D
    expect(pd.QUATERNIONS[3]).toEqual({ ...pd.Q, alpha: 0 }); // iσz = Q
  });
  it('sampled rounds match the expected points', () => {
    const r = rng(2);
    let pa = 0;
    for (let i = 0; i < 2000; i++) pa += pd.playRound({ theta: 60, phi: 30 }, pd.Q, r).alice;
    expect(pa / 2000).toBeCloseTo(pd.payoffs({ theta: 60, phi: 30 }, pd.Q)[0], 0);
  });
});

describe('prisoner’s dilemma texts', () => {
  const all = JSON.stringify({ CH1, CH2, CH3, CH4, PAGE, UI }) + CH4.texts.join('') + CH1.proof + CH3.intro;
  it('every [words](#term) link is a known term, and the index lists real terms', () => {
    for (const t of termRefs(all)) expect(t in GLOSSARY_EN, t).toBe(true);
    for (const t of TERMS) expect(t in GLOSSARY_EN, t).toBe(true);
  });
  it('states the computed numbers', () => {
    expect(all).toContain('2.25');
    expect(CH4.counterResult(...pd.payoffs(pd.COUNTER_Q, pd.Q))).toContain('<b>5.00</b>, Bob <b>0.00</b>');
  });
});
