import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as hardy from '../src/lib/hardy/game';
import { CH1, CH2, CH3, CH4, PAGE, TERMS, UI } from '../src/lib/hardy/messages';
import { GLOSSARY_EN, termRefs } from '../src/lib/games/glossary';
import { circuitSvg } from '../src/lib/games/circuit';
import { run } from '../src/lib/qsim';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/hardy_qiskit.json', import.meta.url), 'utf8')) as {
  qiskit: string; cases: { phi: number; c1: hardy.Check; c2: hardy.Check; amplitudes: [number, number][] }[];
};
const rng = (seed: number) => () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

describe('qsim controlled-Ry', () => {
  it('turns the target only when the control is 1, as Qiskit’s CRYGate', () => {
    const t = 1.1;
    const off = run(2, [{ g: 'cry', a: 0, b: 1, t }]);
    expect(off.re[0]).toBeCloseTo(1, 12);
    const on = run(2, [{ g: 'x', q: 0 }, { g: 'cry', a: 0, b: 1, t }]); // |q1 q0⟩ = |01⟩ → cos|01⟩ + sin|11⟩
    expect(on.re[1]).toBeCloseTo(Math.cos(t / 2), 12);
    expect(on.re[3]).toBeCloseTo(Math.sin(t / 2), 12);
  });
});

describe('qsim controlled-Ry, more cases', () => {
  it('control on qubit 1, target qubit 0', () => {
    const t = 0.7, s = run(2, [{ g: 'x', q: 1 }, { g: 'cry', a: 1, b: 0, t }]); // |10⟩ → cos|10⟩ + sin|11⟩
    expect(s.re[2]).toBeCloseTo(Math.cos(t / 2), 12);
    expect(s.re[3]).toBeCloseTo(Math.sin(t / 2), 12);
  });
  it('complex amplitudes turn alike (after S on the target)', () => {
    const t = 1.3, s = run(2, [{ g: 'x', q: 0 }, { g: 'h', q: 1 }, { g: 's', q: 1 }, { g: 'cry', a: 0, b: 1, t }]);
    // control 1, target (|0⟩ + i|1⟩)/√2 → Ry(t) applied: [c·1 − s·i, s·1 + c·i]/√2
    const c = Math.cos(t / 2), sn = Math.sin(t / 2), r = Math.SQRT1_2;
    expect(s.re[1]).toBeCloseTo(r * c, 12); expect(s.im[1]).toBeCloseTo(-r * sn, 12);
    expect(s.re[3]).toBeCloseTo(r * sn, 12); expect(s.im[3]).toBeCloseTo(r * c, 12);
  });
});

describe('Hardy: classical spec sheets', () => {
  it('16 pairs: 5 keep all three facts, none of them makes both cars diesel', () => {
    const all = hardy.allCards();
    expect(all).toHaveLength(16);
    const keeping = all.filter((x) => x.keeps);
    expect(keeping).toHaveLength(5);
    expect(keeping.filter((x) => x.bothDiesel)).toHaveLength(0);
  });
});

describe('Hardy: quantum cars', () => {
  it(`the simulator matches Qiskit ${fixture.qiskit} (amplitudes) for ${fixture.cases.length} circuits`, () => {
    for (const c of fixture.cases) {
      const s = run(2, hardy.checkOps(c.c1, c.c2, c.phi));
      c.amplitudes.forEach(([re, im], i) => { expect(s.re[i]).toBeCloseTo(re, 10); expect(s.im[i]).toBeCloseTo(im, 10); });
    }
  });
  it('the three facts hold exactly, for every engine angle', () => {
    for (let phi = 0; phi <= 180; phi += 1) for (const [c1, c2] of hardy.CHECKS.slice(0, 3)) expect(hardy.eventProbability(c1, c2, phi)).toBeLessThan(1e-12);
  });
  it('at 90° (X): the exact outcome tables of the notebook', () => {
    const P = (c1: hardy.Check, c2: hardy.Check) => hardy.outcomeProbabilities(c1, c2, 90);
    [0, 1 / 3, 1 / 3, 1 / 3].forEach((p, i) => expect(P(0, 0)[i]).toBeCloseTo(p, 12)); // red·red, blue·red, red·blue, blue·blue
    [1 / 6, 1 / 6, 2 / 3, 0].forEach((p, i) => expect(P(1, 0)[i]).toBeCloseTo(p, 12)); // car 1 engine: gas·red, diesel·red, gas·blue, diesel·blue
    [3 / 4, 1 / 12, 1 / 12, 1 / 12].forEach((p, i) => expect(P(1, 1)[i]).toBeCloseTo(p, 12));
    expect(hardy.eventProbability(1, 1, 90)).toBeCloseTo(1 / 12, 12);
    expect((100 / 12).toFixed(2)).toBe('8.33');
  });
  it('the state is a·(|red, blue⟩ + |blue, red⟩) + c·|blue, blue⟩', () => {
    for (const phi of [0, 40, 90, 150, 180]) {
      const { a, c } = hardy.amplitudes(phi), s = run(2, hardy.factoryOps(phi));
      expect(s.re[0]).toBeCloseTo(0, 12); // red, red
      expect(s.re[1]).toBeCloseTo(a, 12); // car 1 blue, car 2 red (qubit 0 is the low bit)
      expect(s.re[2]).toBeCloseTo(a, 12);
      expect(s.re[3]).toBeCloseTo(c, 12);
    }
    expect(hardy.amplitudes(90).a).toBeCloseTo(1 / Math.sqrt(3), 12);
  });
  it('P(both diesel) = u²(1 − u)/(1 + u); the maximum (5√5 − 11)/2 at φ ≈ 76.35°; 0 at 0° and 180°', () => {
    for (let phi = 0; phi <= 180; phi += 0.5) expect(hardy.eventProbability(1, 1, phi)).toBeCloseTo(hardy.bothDieselFormula(phi), 12);
    expect(hardy.BEST_PHI).toBeCloseTo(76.3454, 4);
    expect(hardy.eventProbability(1, 1, hardy.BEST_PHI)).toBeCloseTo(hardy.HARDY_MAX, 12);
    expect((100 * hardy.HARDY_MAX).toFixed(2)).toBe('9.02');
    let best = 0;
    for (let phi = 0; phi <= 180; phi += 0.01) best = Math.max(best, hardy.bothDieselFormula(phi));
    expect(best).toBeLessThanOrEqual(hardy.HARDY_MAX + 1e-15);
    expect(hardy.eventProbability(1, 1, 0)).toBeLessThan(1e-12);
    expect(hardy.eventProbability(1, 1, 180)).toBeLessThan(1e-12);
  });
  it('1000 sampled engine·engine mornings land near 8.3%', () => {
    const r = rng(5);
    let both = 0;
    for (let i = 0; i < 1000; i++) { const x = hardy.inspect(1, 1, 90, r); if (hardy.bothDiesel(1, 1, x.r1, x.r2)) both++; }
    expect(both).toBeGreaterThan(55);
    expect(both).toBeLessThan(115);
  });
  it('draws the factory with a controlled Ry', () => {
    const svg = circuitSvg(UI.qubits, hardy.checkSteps(0, 0), UI.circuitTitle); // no engine checks: the only −90° is the controlled turn
    expect(svg).toContain('>−90°<');
    expect(svg).toMatch(/<g class="gate two[^"]*"><line class="link"[^>]*\/><circle class="dot"[^>]*\/><rect[^>]*\/><text[^>]*>Ry<\/text>/);
  });
});

describe('Hardy texts', () => {
  const all = JSON.stringify({ CH1, CH2, CH3, CH4, PAGE, UI }) + [
    CH1.allResult(16, 5, 0), CH2.manyResult(21, 250, 0), CH4.status(90, 1 / 12, hardy.HARDY_MAX),
    CH4.status(hardy.BEST_PHI, hardy.HARDY_MAX, hardy.HARDY_MAX), CH4.manyResult(83, 1000, 1 / 12, 0), CH3.texts.join(''),
  ].join('');
  it('every [words](#term) link is a known term, and the index lists real terms', () => {
    for (const t of termRefs(all)) expect(t in GLOSSARY_EN, t).toBe(true);
    for (const t of TERMS) expect(t in GLOSSARY_EN, t).toBe(true);
  });
  it('states the computed numbers', () => {
    expect(all).toContain('8.33%');
    expect(all).toContain('9.02%');
    expect(all).toContain('76.35°');
    expect(CH4.status(hardy.BEST_PHI, hardy.HARDY_MAX, hardy.HARDY_MAX)).toContain('the maximum');
    expect(CH4.status(90, 1 / 12, hardy.HARDY_MAX)).not.toContain('the maximum');
    expect(CH4.status(hardy.BEST_PHI, hardy.HARDY_MAX, hardy.HARDY_MAX)).not.toContain('..');
    expect(CH2.manyResult(21, 250, 0)).toContain('held every time');
    expect(CH2.manyResult(21, 250, 2)).toContain('broken 2 times');
    expect(CH2.round(1, 1, 1, 1, true, false)).toContain('both diesel!');
    expect(CH2.round(0, 0, 0, 1, false, false)).toContain('the fact holds');
    expect(CH2.round(0, 0, 0, 0, false, true)).toContain('broken');
    expect(CH4.status(0, 0, hardy.HARDY_MAX)).toContain('maximally entangled');
    expect(CH4.status(180, 0, hardy.HARDY_MAX)).toContain('always blue');
  });
});
