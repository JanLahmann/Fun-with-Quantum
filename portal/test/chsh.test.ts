import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as chsh from '../src/lib/chsh/game';
import { CH1, CH2, CH3, CH4, PAGE, TERMS, UI } from '../src/lib/chsh/messages';
import { GLOSSARY_EN, termRefs } from '../src/lib/games/glossary';
import { circuitSvg } from '../src/lib/games/circuit';
import { probabilities, run } from '../src/lib/qsim';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/chsh_qiskit.json', import.meta.url), 'utf8')) as {
  qiskit: string; cases: { bell: boolean; alpha: number; beta: number; probabilities: number[]; amplitudes: [number, number][] }[];
};
const COS2_PI8 = Math.cos(Math.PI / 8) ** 2;
const rng = (seed: number) => () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

describe('qsim Ry', () => {
  it('Ry(θ)|0⟩ = cos(θ/2)|0⟩ + sin(θ/2)|1⟩, as Qiskit', () => {
    for (const t of [0.3, 1, Math.PI / 2, 2.5, -0.7]) {
      const s = run(1, [{ g: 'ry', q: 0, t }]);
      expect(s.re[0]).toBeCloseTo(Math.cos(t / 2), 12);
      expect(s.re[1]).toBeCloseTo(Math.sin(t / 2), 12);
    }
  });
  it('Ry(−90°) after H is the identity on |0⟩ (H|0⟩ = |+⟩ lies at 90°)', () => {
    expect(probabilities(run(1, [{ g: 'h', q: 0 }, { g: 'ry', q: 0, t: -Math.PI / 2 }]))[0]).toBeCloseTo(1, 12);
  });
});

describe('CHSH: classical', () => {
  it('16 strategies: 8 win 3 of 4 questions, 8 win 1 — none wins all four', () => {
    const all = chsh.allStrategies();
    expect(all).toHaveLength(16);
    expect(all.filter((s) => s.wins === 3)).toHaveLength(8);
    expect(all.filter((s) => s.wins === 1)).toHaveLength(8);
    expect(Math.max(...all.map((s) => s.wins))).toBe(3);
  });
  it('always answering 0 wins every question but x = y = 1', () => {
    for (const [x, y] of chsh.QUESTIONS) expect(chsh.playClassical(chsh.ALWAYS_ZERO, x, y).win).toBe(!(x && y));
  });
  it('the parity argument: the four left sides XOR to 0, the four targets to 1', () => {
    for (const { strategy: { alice: a, bob: b } } of chsh.allStrategies()) {
      expect(a[0] ^ b[0] ^ a[0] ^ b[1] ^ a[1] ^ b[0] ^ a[1] ^ b[1]).toBe(0);
    }
    expect(chsh.QUESTIONS.reduce((s, [x, y]) => s ^ (x & y), 0)).toBe(1);
  });
});

describe('CHSH: quantum', () => {
  it(`the simulator matches Qiskit ${fixture.qiskit} for ${fixture.cases.length} angle pairs`, () => {
    for (const c of fixture.cases) {
      const ops = chsh.gameOps(c.alpha, c.beta).slice(c.bell ? 0 : 2); // plain cases: without the Bell pair
      const st = run(2, ops), p = probabilities(st);
      c.probabilities.forEach((q, i) => expect(p[i]).toBeCloseTo(q, 10));
      c.amplitudes.forEach(([re, im], i) => { expect(st.re[i]).toBeCloseTo(re, 10); expect(st.im[i]).toBeCloseTo(im, 10); });
      if (c.bell) chsh.answerProbabilities(c.alpha, c.beta).forEach((q, i) => expect(q).toBeCloseTo(p[i], 12));
    }
    expect(fixture.cases.filter((c) => !c.bell).length).toBeGreaterThan(0);
  });
  it('P(same answer) = cos²(Δ/2) for any two angles', () => {
    const r = rng(7);
    for (let k = 0; k < 200; k++) {
      const a = Math.round(r() * 720 - 360), b = Math.round(r() * 720 - 360);
      const p = chsh.answerProbabilities(a, b);
      expect(p[0] + p[3]).toBeCloseTo(chsh.sameFormula(a, b), 12);
      expect(p[0]).toBeCloseTo(p[3], 12); // 00 and 11 equally likely, 01 and 10 too
      expect(p[1]).toBeCloseTo(p[2], 12);
    }
  });
  it('with the best angles every question is won with cos²(π/8) = 85.36%', () => {
    for (const [x, y] of chsh.QUESTIONS) expect(chsh.winProbability(x, y)).toBeCloseTo(COS2_PI8, 12);
    expect(chsh.totalWin()).toBeCloseTo(COS2_PI8, 12);
    expect(chsh.TSIRELSON_WIN).toBeCloseTo(COS2_PI8, 15);
    expect((100 * COS2_PI8).toFixed(1)).toBe('85.4');
    expect((100 * (1 - COS2_PI8)).toFixed(1)).toBe('14.6');
  });
  it('win rate = 1/2 + S/8; S = 2√2 at the best angles, 2 with all directions along Z', () => {
    const r = rng(11);
    for (let k = 0; k < 100; k++) {
      const ang = (): number => Math.round(r() * 72) * 5 - 180;
      const A: chsh.Angles = { alice: [ang(), ang()], bob: [ang(), ang()] };
      expect(chsh.totalWin(A)).toBeCloseTo(0.5 + chsh.chshS(A) / 8, 12);
      expect(chsh.chshS(A)).toBeLessThanOrEqual(2 * Math.SQRT2 + 1e-12);
    }
    expect(chsh.chshS()).toBeCloseTo(2 * Math.SQRT2, 12);
    const allZ: chsh.Angles = { alice: [0, 0], bob: [0, 0] };
    expect(chsh.chshS(allZ)).toBeCloseTo(2, 12);
    for (const [x, y] of chsh.QUESTIONS) expect(chsh.winProbability(x, y, allZ)).toBeGreaterThanOrEqual(0); // no −0.0%
    expect(chsh.totalWin(allZ)).toBeCloseTo(0.75, 12);
  });
  it('Bob at ±β (Alice 0°, 90°): win = 1/2 + (cos β + sin β)/4, best at 45°, 75% at 0°, worst 14.6% at −135°', () => {
    const w = (b: number) => chsh.totalWin({ alice: [0, 90], bob: [b, -b] });
    for (let b = -180; b <= 180; b += 5) {
      const t = (b * Math.PI) / 180;
      expect(w(b)).toBeCloseTo(0.5 + (Math.cos(t) + Math.sin(t)) / 4, 12);
    }
    expect(w(45)).toBeCloseTo(COS2_PI8, 12);
    expect(w(0)).toBeCloseTo(0.75, 12);
    expect(w(-135)).toBeCloseTo(1 - COS2_PI8, 12);
  });
  it('no signaling: Alice alone gets 0 or 1 half the time, whatever Bob measures', () => {
    for (const a of [0, 90, 33]) for (const b of [45, -45, 0, 120]) {
      const p = chsh.answerProbabilities(a, b);
      expect(p[0] + p[2]).toBeCloseTo(0.5, 12); // Alice answered 0
      expect(p[0] + p[1]).toBeCloseTo(0.5, 12); // Bob answered 0
    }
  });
  it('1000 sampled rounds land near 85%', () => {
    const r = rng(3);
    let won = 0;
    for (let i = 0; i < 1000; i++) if (chsh.playQuantum(chsh.randomBit(r), chsh.randomBit(r), chsh.BEST_ANGLES, r).win) won++;
    expect(won).toBeGreaterThan(810);
    expect(won).toBeLessThan(900);
  });
  it('draws the circuit with the Ry angles', () => {
    const svg = circuitSvg(UI.qubits, chsh.gameSteps(90, -45), UI.circuitTitle);
    expect(svg).toContain('>Ry<');
    expect(svg).toContain('>−90°<');
    expect(svg).toContain('>45°<');
  });
});

describe('CHSH texts', () => {
  const all = JSON.stringify({ CH1, CH2, CH3, CH4, PAGE, UI }) + [
    CH1.result(3), CH1.manyResult(750, 1000, 3), CH2.manyResult(854, 1000),
    CH3.total(0.8, chsh.TSIRELSON_WIN), CH4.question(1, 1, 90, -45, chsh.TSIRELSON_WIN), CH4.texts.join(''),
  ].join('');
  it('every [words](#term) link is a known term, and the index lists real terms', () => {
    for (const t of termRefs(all)) expect(t in GLOSSARY_EN, t).toBe(true);
    for (const t of TERMS) expect(t in GLOSSARY_EN, t).toBe(true);
  });
  it('the dynamic texts say the right thing at their thresholds', () => {
    expect(CH3.total(0.75, chsh.TSIRELSON_WIN)).toContain('exactly as good as the best classical team');
    expect(CH3.total(chsh.totalWin(), chsh.TSIRELSON_WIN)).toContain('the maximum');
    expect(CH3.total(chsh.totalWin({ alice: [0, 0], bob: [0, 0] }), chsh.TSIRELSON_WIN)).toContain('exactly as good');
    expect(CH3.total(0.7, chsh.TSIRELSON_WIN)).toContain('worse');
    expect(CH3.total(0.8, chsh.TSIRELSON_WIN)).toContain('better than any classical team');
    const all = chsh.allStrategies();
    expect(CH1.allResult(all.length, 3, all.filter((x) => x.wins === 3).length)).toContain('<b>16</b> tables: <b>8</b> win 3 of the 4 questions (75%), the other 8 win just 1');
    expect(CH4.question(1, 1, 90, -45, chsh.winProbability(1, 1))).toContain('arrows 135° apart, the same answer with cos²(135°/2) = 14.6%; they need different answers — win 85.4%');
    expect(CH1.result(3)).toContain('all four');
    expect(CH1.result(3, true)).not.toContain('all four');
  });
  it('states the computed numbers', () => {
    expect(all).toContain('85.4%');
    expect(all).toContain('75%');
    expect(all).not.toContain('85.3%');
  });
});
