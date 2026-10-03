import { describe, expect, it } from 'vitest';
import {
  GATE_ROTATIONS, GATES, HEADS, TAILS, apply, bloch, measure, pHeads, run, stateLabel,
  type GateName, type State,
} from '../src/lib/qcoin/qubit';
import {
  CLASSICAL_MOVES, QUANTUM_MOVES, aWinProbability, emptyScore, isWinningStrategyForA, play,
  quantumA, quantumB, randomClassical, tally, winnerOf,
} from '../src/lib/qcoin/game';
import { IDENTITY, apply as rot, axisAngle, mul, normalOf, shade, tipTo, toCss, toSphereView, toView, type Mat3 } from '../src/lib/qcoin/rotation';

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;
const closeVec = (a: readonly number[], b: readonly number[], eps = 1e-9) => a.every((v, i) => close(v, b[i], eps));
const seq = (...xs: number[]) => { let i = 0; return () => xs[i++ % xs.length]; };

describe('qubit', () => {
  it('starts heads and the classical moves behave like a real coin', () => {
    expect(pHeads(HEADS)).toBe(1);
    expect(pHeads(apply('X', HEADS))).toBe(0);
    expect(pHeads(run(['X', 'X']))).toBe(1);
    expect(pHeads(apply('I', TAILS))).toBe(0);
  });

  it('H puts the coin on its edge: 50:50, and H·H = I (interference)', () => {
    expect(pHeads(apply('H', HEADS))).toBe(0.5);
    expect(pHeads(apply('H', TAILS))).toBe(0.5);
    expect(pHeads(run(['H', 'H']))).toBe(1);
    expect(pHeads(run(['X', 'H', 'H']))).toBe(0);
  });

  it('Z shows up after an H, a single S does not (as the sandbox texts say)', () => {
    expect(pHeads(run(['H', 'Z', 'H']))).toBeCloseTo(0, 12); // tails
    expect(pHeads(run(['H', 'S', 'H']))).toBeCloseTo(0.5, 12); // still 50:50
    expect(pHeads(run(['H', 'S', 'S', 'H']))).toBeCloseTo(0, 12); // two S make a Z
  });

  it('every gate is unitary (keeps total probability 1)', () => {
    const states: State[] = [HEADS, TAILS, apply('H', HEADS), apply('H', TAILS), apply('S', apply('H', HEADS))];
    for (const g of Object.keys(GATES) as GateName[])
      for (const s of states) {
        const t = apply(g, s);
        const norm = t[0].re ** 2 + t[0].im ** 2 + t[1].re ** 2 + t[1].im ** 2;
        expect(close(norm, 1)).toBe(true);
      }
  });

  it('Bloch vectors and labels of the four game states', () => {
    expect(bloch(HEADS)).toEqual([0, 0, 1]);
    expect(bloch(TAILS)).toEqual([0, 0, -1]);
    expect(bloch(apply('H', HEADS))).toEqual([1, 0, 0]);
    expect(bloch(apply('H', TAILS))).toEqual([-1, 0, 0]);
    expect(bloch(apply('S', apply('H', HEADS)))).toEqual([0, 1, 0]);
    expect(stateLabel(HEADS)).toBe('|0⟩');
    expect(stateLabel(TAILS)).toBe('|1⟩');
    expect(stateLabel(apply('H', HEADS))).toBe('|+⟩');
    expect(stateLabel(apply('H', TAILS))).toBe('|−⟩');
    expect(stateLabel(apply('S', apply('H', HEADS)))).toBeNull();
  });

  it('X on |+⟩ changes nothing you could ever measure — the heart of the trick', () => {
    const plus = apply('H', HEADS);
    expect(bloch(apply('X', plus))).toEqual(bloch(plus));
  });

  it('measure follows the probabilities (injected randomness)', () => {
    expect(measure(HEADS, () => 0.999)).toBe('heads');
    expect(measure(TAILS, () => 0)).toBe('tails');
    const plus = apply('H', HEADS);
    expect(measure(plus, () => 0.49)).toBe('heads');
    expect(measure(plus, () => 0.51)).toBe('tails');
  });

  it("each gate's Bloch rotation moves the Bloch vector exactly like the matrix does", () => {
    const starts: State[] = [HEADS, TAILS, apply('H', HEADS), apply('H', TAILS), apply('S', apply('H', HEADS))];
    for (const g of Object.keys(GATES) as GateName[]) {
      const { axis, angle } = GATE_ROTATIONS[g];
      const R = axisAngle(axis, angle);
      for (const s of starts) expect(closeVec(rot(R, bloch(s)), bloch(apply(g, s)), 1e-9)).toBe(true);
    }
  });
});

describe('coin game (Quantum-Coin-Game.ipynb)', () => {
  // The notebook's classical truth table: heads iff an even number of X.
  it('classical moves: heads exactly when the coin was turned an even number of times', () => {
    for (const a1 of CLASSICAL_MOVES) for (const b of CLASSICAL_MOVES) for (const a2 of CLASSICAL_MOVES) {
      const flips = [a1, b, a2].filter((m) => m === 'X').length;
      expect(aWinProbability(a1, b, a2)).toBe(flips % 2 === 0 ? 1 : 0);
    }
  });

  it('no classical strategy wins for sure; H…H is the only quantum one (of I, X, H)', () => {
    const winners: string[] = [];
    for (const a1 of QUANTUM_MOVES) for (const a2 of QUANTUM_MOVES) if (isWinningStrategyForA(a1, a2)) winners.push(a1 + a2);
    expect(winners).toEqual(['HH']);
  });

  // Same 18 combinations the RasQberry Kivy app enumerates (A1 ∈ {I,X,H}, B ∈ {I,X}, A2 ∈ {I,X,H}).
  it('all 18 notebook combinations: probabilities of heads', () => {
    const expected: Record<string, number> = {
      III: 1, IIX: 0, IXI: 0, IXX: 1, XII: 0, XIX: 1, XXI: 1, XXX: 0,
      HII: 0.5, HIX: 0.5, HXI: 0.5, HXX: 0.5, HIH: 1, HXH: 1,
      IIH: 0.5, XIH: 0.5, IXH: 0.5, XXH: 0.5,
    };
    for (const [k, p] of Object.entries(expected)) {
      const [a1, b, a2] = k.split('') as GateName[];
      expect(aWinProbability(a1, b, a2), k).toBe(p);
    }
  });

  it('play(): states, outcome and winner', () => {
    const r = play({ a1: 'H', b: 'X', a2: 'H' }, () => 0.99);
    expect(r.states.map(bloch)).toEqual([[1, 0, 0], [1, 0, 0], [0, 0, 1]]);
    expect(r.outcome).toBe('heads');
    expect(r.winner).toBe('A');
    const fair = play({ a1: 'H', b: 'I', a2: 'I' }, () => 0.7);
    expect(fair.pHeads).toBe(0.5);
    expect(fair.outcome).toBe('tails');
    expect(fair.winner).toBe('B');
    expect(winnerOf('heads')).toBe('A');
  });

  it('the quantum computer wins 1000 out of 1000 rounds against a random classical player', () => {
    let rnd = 12345;
    const rand = () => ((rnd = (rnd * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    let aWins = 0;
    for (let i = 0; i < 1000; i++) {
      const r = play({ a1: quantumA(0, rand), b: randomClassical(1, rand), a2: quantumA(2, rand) }, rand);
      if (r.winner === 'A') aWins++;
    }
    expect(aWins).toBe(1000);
  });

  it('two classical players split roughly 50:50', () => {
    let rnd = 777;
    const rand = () => ((rnd = (rnd * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    let aWins = 0;
    for (let i = 0; i < 4000; i++) {
      const r = play({ a1: randomClassical(0, rand), b: randomClassical(1, rand), a2: randomClassical(2, rand) }, rand);
      if (r.winner === 'A') aWins++;
    }
    expect(aWins / 4000).toBeGreaterThan(0.45);
    expect(aWins / 4000).toBeLessThan(0.55);
  });

  it('who starts matters: a quantum B (middle move only) gets exactly 50:50 against every classical A', () => {
    const b = quantumB(1, Math.random);
    for (const a1 of CLASSICAL_MOVES) for (const a2 of CLASSICAL_MOVES) expect(aWinProbability(a1, b, a2)).toBe(0.5);
  });

  it('…and no B move — classical or quantum — beats H…H', () => {
    for (const b of QUANTUM_MOVES) expect(aWinProbability('H', b, 'H')).toBe(b === 'H' ? 0.5 : 1);
  });

  it('randomClassical only ever plays I or X', () => {
    const r = seq(0.1, 0.9);
    expect([randomClassical(1, r), randomClassical(1, r)]).toEqual(['I', 'X']);
  });

  it('tally keeps score from the human side', () => {
    let s = emptyScore();
    s = tally(s, 'B', 'A');
    s = tally(s, 'B', 'B');
    expect(s).toEqual({ you: 1, computer: 1, rounds: 2 });
  });
});

describe('coin orientation = Bloch vector', () => {
  const orient = (gates: GateName[]): Mat3 =>
    gates.reduce<Mat3>((R, g) => mul(axisAngle(GATE_ROTATIONS[g].axis, GATE_ROTATIONS[g].angle), R), IDENTITY);

  it('after any sequence of gates the coin normal equals the Bloch vector', () => {
    const seqs: GateName[][] = [[], ['X'], ['H'], ['H', 'X'], ['H', 'X', 'H'], ['X', 'H'], ['H', 'S'], ['H', 'S', 'H', 'Z']];
    for (const s of seqs) expect(closeVec(normalOf(orient(s)), bloch(run(s)), 1e-9), s.join('')).toBe(true);
  });

  it('tipTo turns a standing coin flat in the right direction', () => {
    const R = orient(['H']);
    for (const target of [[0, 0, 1], [0, 0, -1]] as const) {
      const { axis, angle } = tipTo(R, target);
      expect(close(angle, Math.PI / 2)).toBe(true);
      expect(closeVec(normalOf(mul(axisAngle(axis, angle), R)), target, 1e-9)).toBe(true);
    }
  });

  it('toCss produces a finite matrix3d and shade stays in 0..1', () => {
    for (const s of [[], ['H'], ['X'], ['H', 'S']] as GateName[][]) {
      const css = toCss(orient(s));
      expect(css.startsWith('matrix3d(')).toBe(true);
      const nums = css.slice(9, -1).split(',').map(Number);
      expect(nums).toHaveLength(16);
      expect(nums.every(Number.isFinite)).toBe(true);
      const l = shade(orient(s));
      expect(l).toBeGreaterThanOrEqual(0);
      expect(l).toBeLessThanOrEqual(1);
    }
  });

  // matrix3d is column-major: columns 0, 1, 2 are the screen images of the coin's local x, y, z
  const cols = (css: string) => { const n = css.slice(9, -1).split(',').map(Number); return [n.slice(0, 3), n.slice(4, 7), n.slice(8, 11)]; };
  const det3 = ([a, b, c]: number[][]) =>
    a[0] * (b[1] * c[2] - b[2] * c[1]) - b[0] * (a[1] * c[2] - a[2] * c[1]) + c[0] * (a[1] * b[2] - a[2] * b[1]);

  it('the coin is never mirrored: the full transform is a proper rotation for every gate sequence', () => {
    for (const s of [[], ['X'], ['H'], ['H', 'X'], ['H', 'Z'], ['H', 'S'], ['S', 'H', 'X', 'Z']] as GateName[][])
      expect(close(det3(cols(toCss(orient(s), 0))), 1, 1e-6), s.join('')).toBe(true);
  });

  it('standing after H, the heads glyph faces us upright and unmirrored', () => {
    const [x, y, z] = cols(toCss(orient(['H']), 0)); // camera level with the table
    expect(closeVec(z, [0, 0, 1], 1e-6)).toBe(true); // face normal toward the viewer
    expect(closeVec(y, [0, 1, 0], 1e-6)).toBe(true); // glyph's "down" points down
    expect(closeVec(x, [1, 0, 0], 1e-6)).toBe(true); // glyph's right is the viewer's right
  });

  it('right-handed Bloch picture: x toward the viewer, y to the right, z up', () => {
    expect(closeVec(toView([1, 0, 0], 0), [0, 0, 1], 1e-9)).toBe(true);
    expect(closeVec(toView([0, 1, 0], 0), [1, 0, 0], 1e-9)).toBe(true);
    expect(closeVec(toView([0, 0, 1], 0), [0, -1, 0], 1e-9)).toBe(true);
  });

  it('the sphere is drawn from the textbook angle: |+⟩ to the lower left, |0⟩ up, +i to the right', () => {
    const plus = toSphereView([1, 0, 0]), zero = toSphereView([0, 0, 1]), yi = toSphereView([0, 1, 0]);
    expect(plus[0]).toBeLessThan(-0.3); // left
    expect(plus[1]).toBeGreaterThan(0); // and down (we look from slightly above)
    expect(zero[1]).toBeLessThan(-0.9); // up
    expect(yi[0]).toBeGreaterThan(0.7); // right
  });

  it('heads-up coin: front face points up and toward the camera; tails-up shows the back', () => {
    // m31..m33 column of matrix3d = image of local z (face normal) in view space
    const nz = (css: string) => css.slice(9, -1).split(',').map(Number)[10]; // z-component of the normal
    expect(nz(toCss(IDENTITY))).toBeGreaterThan(0); // front face visible
    expect(nz(toCss(orient(['X'])))).toBeLessThan(0); // back (tails) visible
    expect(nz(toCss(orient(['H'])))).toBeGreaterThan(0.9); // standing, facing us
  });
});

describe('chapter 6, the math', () => {
  const same = (a: State, b: State) => closeVec([a[0].re, a[0].im, a[1].re, a[1].im], [b[0].re, b[0].im, b[1].re, b[1].im]);
  const R = Math.SQRT1_2;
  const plus: State = [{ re: R, im: 0 }, { re: R, im: 0 }];
  const minus: State = [{ re: R, im: 0 }, { re: -R, im: 0 }];

  it('the gates on |0⟩ and |1⟩, as stated', () => {
    expect(same(apply('X', HEADS), TAILS)).toBe(true);
    expect(same(apply('X', TAILS), HEADS)).toBe(true);
    expect(same(apply('H', HEADS), plus)).toBe(true); // (|0⟩ + |1⟩)/√2
    expect(same(apply('H', TAILS), minus)).toBe(true); // (|0⟩ − |1⟩)/√2
  });

  it('case 1: H(H|0⟩) = (H|0⟩ + H|1⟩)/√2 = |0⟩', () => {
    const viaParts: State = [
      { re: R * (apply('H', HEADS)[0].re + apply('H', TAILS)[0].re), im: 0 },
      { re: R * (apply('H', HEADS)[1].re + apply('H', TAILS)[1].re), im: 0 },
    ];
    expect(same(apply('H', apply('H', HEADS)), viaParts)).toBe(true);
    expect(same(viaParts, HEADS)).toBe(true);
  });

  it('case 2: X((|0⟩ + |1⟩)/√2) = H|0⟩, so H(X(H|0⟩)) = |0⟩', () => {
    expect(same(apply('X', plus), apply('H', HEADS))).toBe(true);
    expect(same(run(['H', 'X', 'H']), HEADS)).toBe(true);
  });
});
