import { describe, expect, it } from 'vitest';
import { apply, bitsOf, label, probabilities, run, sample, zero, type Op } from '../src/lib/qsim';
import * as magic from '../src/lib/magic/square';
import * as ghz from '../src/lib/ghz/game';
import { circuitSvg } from '../src/lib/games/circuit';

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;
const seq = (...xs: number[]) => { let i = 0; return () => xs[i++ % xs.length]; };

describe('qsim', () => {
  it('uses the Qiskit bit order: qubit 0 is the lowest bit', () => {
    const s = run(3, [{ g: 'x', q: 0 }]);
    expect(probabilities(s)[1]).toBe(1);
    expect(label(1, 3)).toBe('001');
    expect(bitsOf(6, 3)).toEqual([0, 1, 1]);
  });

  it('H·H = I, and every gate keeps the total probability 1', () => {
    expect(probabilities(run(1, [{ g: 'h', q: 0 }, { g: 'h', q: 0 }]))[0]).toBeCloseTo(1, 12);
    const ops: Op[] = [{ g: 'h', q: 0 }, { g: 'y', q: 1 }, { g: 's', q: 0 }, { g: 'sdg', q: 1 }, { g: 'cx', a: 0, b: 2 }, { g: 'cz', a: 1, b: 2 }, { g: 'swap', a: 0, b: 2 }, { g: 'h', q: 2 }];
    let s = zero(3);
    for (const op of ops) {
      s = apply(s, op);
      expect(close(probabilities(s).reduce((a, b) => a + b, 0), 1)).toBe(true);
    }
  });

  it('S·S† = I and S·S = Z (phases)', () => {
    const plus: Op[] = [{ g: 'h', q: 0 }];
    const back = (ops: Op[]) => probabilities(run(1, [...plus, ...ops, { g: 'h', q: 0 }]))[0];
    expect(back([{ g: 's', q: 0 }, { g: 'sdg', q: 0 }])).toBeCloseTo(1, 12);
    expect(back([{ g: 's', q: 0 }, { g: 's', q: 0 }])).toBeCloseTo(0, 12); // Z|+⟩ = |−⟩
    expect(back([{ g: 'z', q: 0 }])).toBeCloseTo(0, 12);
  });

  it('CX flips the target when the control is 1; SWAP exchanges; a Bell pair is 00 or 11', () => {
    expect(probabilities(run(2, [{ g: 'x', q: 0 }, { g: 'cx', a: 0, b: 1 }]))[3]).toBe(1);
    expect(probabilities(run(2, [{ g: 'x', q: 0 }, { g: 'swap', a: 0, b: 1 }]))[2]).toBe(1);
    const bell = probabilities(run(2, [{ g: 'h', q: 0 }, { g: 'cx', a: 0, b: 1 }]));
    expect(bell[0]).toBeCloseTo(0.5, 12);
    expect(bell[3]).toBeCloseTo(0.5, 12);
  });

  it('samples with the given random source', () => {
    const s = run(1, [{ g: 'h', q: 0 }]);
    expect(sample(s, () => 0.2)).toBe(0);
    expect(sample(s, () => 0.7)).toBe(1);
    expect(sample(s, () => 0.9999999999999999)).toBe(1);
  });
});

describe('magic square', () => {
  it('no square satisfies all six rules (the parity proof, by brute force)', () => {
    let found = 0;
    for (let m = 0; m < 512; m++) {
      const g = [0, 1, 2].map((r) => [0, 1, 2].map((c) => (m >> (3 * r + c)) & 1));
      const { cols, rows } = magic.checkSquare(g);
      if ([...cols, ...rows].every(Boolean)) found++;
    }
    expect(found).toBe(0);
  });

  it('the best classical strategy wins 8 of 9 — and the one shown is optimal', () => {
    expect(magic.bestClassical()).toEqual({ tried: 4096, best: 8 });
    expect(magic.classicalWins(magic.BEST_STRATEGY)).toBe(8);
    for (const col of magic.BEST_STRATEGY.alice) expect(col.reduce((a, b) => a + b) % 2).toBe(1);
    for (const row of magic.BEST_STRATEGY.bob) expect(row.reduce((a, b) => a + b) % 2).toBe(0);
    expect(magic.playClassical(magic.BEST_STRATEGY, 3, 3).win).toBe(false);
    expect(magic.playClassical(magic.BEST_STRATEGY, 2, 3).win).toBe(true);
  });

  it('the quantum team wins all nine questions with certainty', () => {
    for (const col of magic.IDX) for (const row of magic.IDX)
      expect(magic.quantumWinProbability(col, row), `column ${col}, row ${row}`).toBeCloseTo(1, 12);
  });

  it('every quantum answer obeys the rules, and each player alone sees random answers', () => {
    for (const col of magic.IDX) for (const row of magic.IDX) {
      const p = probabilities(magic.gameOps(col, row).reduce(apply, zero(4)));
      let aliceFirst = 0;
      p.forEach((pi, i) => {
        if (pi < 1e-12) return;
        const { alice, bob } = magic.answers(bitsOf(i, 4));
        expect(alice.reduce((a, b) => a + b) % 2).toBe(1);
        expect(bob.reduce((a, b) => a + b) % 2).toBe(0);
        aliceFirst += alice[0] ? pi : 0;
      });
      expect(aliceFirst).toBeCloseTo(0.5, 12);
    }
  });

  it('a played round fills in the answers', () => {
    const r = magic.playQuantum(3, 3, seq(0.3));
    expect(r.win).toBe(true);
    expect(r.alice).toHaveLength(3);
    expect(r.bob).toHaveLength(3);
  });
});

describe('GHZ game', () => {
  it('the best classical team wins 3 of 4 questions', () => {
    expect(ghz.bestClassical()).toEqual({ tried: 64, best: 3 });
  });

  it('reads the rules like the notebook', () => {
    expect(ghz.wins(['C', 'C', 'C'], [1, 1, 0])).toBe(true); // red, red, blue: even number of red
    expect(ghz.wins(['C', 'S', 'S'], [1, 1, 0])).toBe(false); // red, star, rectangle: even — should be odd
    expect(ghz.wins(['C', 'S', 'S'], [1, 0, 0])).toBe(true);
  });

  it('GHZ: only 000 and 111 in the Z basis', () => {
    const p = probabilities(run(3, ghz.GHZ));
    expect(p[0]).toBeCloseTo(0.5, 12);
    expect(p[7]).toBeCloseTo(0.5, 12);
  });

  it('the quantum team wins every question with certainty, each answer alone random', () => {
    for (const q of ghz.QUESTIONS) {
      expect(ghz.quantumWinProbability(q), q.join('')).toBeCloseTo(1, 12);
      for (let player = 0; player < 3; player++) {
        const p1 = ghz.outcomeProbabilities(q).reduce((s, o) => s + (o.bits[player] ? o.p : 0), 0);
        expect(p1).toBeCloseTo(0.5, 12);
      }
    }
    expect(ghz.playQuantum(['S', 'S', 'C'], seq(0.6)).win).toBe(true);
  });
});

describe('circuit drawing', () => {
  it('draws wires, gates, two-qubit links and meters', () => {
    const svg = circuitSvg(['a', 'b', 'c', 'd'], magic.gameSteps(3, 3));
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.match(/class="wire"/g)).toHaveLength(4);
    expect(svg).toContain('class="barrier"');
    expect(svg.match(/class="gate meter"/g)).toHaveLength(4);
    expect(svg).toContain('tone-alice');
    expect(svg).toContain('tone-bob');
    expect(circuitSvg(['x', 'y', 'z'], ghz.gameSteps(['C', 'S', 'S']))).toContain('S†');
  });
});

describe('explanations', () => {
  const texts = (o: unknown, out: string[] = []): string[] => {
    if (typeof o === 'string') out.push(o);
    else if (typeof o === 'function') {
      const SAMPLES: unknown[][] = [['c1'], [['C', 'S', 'S'], [1, 0, 0], true], [1, 1, [0, 1, 1], [1, 0, 1], true]];
      for (const args of SAMPLES) {
        try { out.push(String((o as (...a: unknown[]) => unknown)(...args))); break; } catch { /* try the next signature */ }
      }
    }
    else if (o && typeof o === 'object') for (const v of Object.values(o)) texts(v, out);
    return out;
  };

  it('every [words](#term) link in the games and the glossary points to a real term', async () => {
    const { GLOSSARY_EN, termRefs } = await import('../src/lib/games/glossary');
    const all = [...texts(await import('../src/lib/magic/messages')), ...texts(await import('../src/lib/ghz/messages')), ...texts(GLOSSARY_EN)];
    const refs = all.flatMap(termRefs);
    expect(refs.length).toBeGreaterThan(30);
    for (const r of refs) expect(Object.keys(GLOSSARY_EN), r).toContain(r);
  });

  it('the Explain index of each game lists only real terms', async () => {
    const { GLOSSARY_EN } = await import('../src/lib/games/glossary');
    for (const m of [await import('../src/lib/magic/messages'), await import('../src/lib/ghz/messages')])
      for (const t of m.TERMS) expect(Object.keys(GLOSSARY_EN)).toContain(t);
  });

  it('links go to IBM Quantum Learning and doQumentation (same path), or nowhere', async () => {
    const { ibmLink, doqLink } = await import('../src/lib/games/glossary');
    expect(ibmLink('ghz')).toBe('https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information/multiple-systems/quantum-information#ghz-and-w-states');
    expect(doqLink('ghz')).toBe('https://doqumentation.org/learning/courses/basics-of-quantum-information/multiple-systems/quantum-information#ghz-and-w-states');
    expect(doqLink('bell', 'de')).toMatch(/^https:\/\/de\.doqumentation\.org\/learning\//);
    expect(ibmLink('parity')).toBeNull();
  });
});
