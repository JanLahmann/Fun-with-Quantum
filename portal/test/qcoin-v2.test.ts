import { describe, expect, it } from 'vitest';
import { MESSAGES, termRefs } from '../src/lib/qcoin/i18n';
import { LOCALES_V2, MESSAGES_V2, paint, plain } from '../src/lib/qcoin/v2';
import type { MessagesV2 } from '../src/lib/qcoin/v2';
import { roundMoves, roundPHeads, stepStates } from '../src/lib/qcoin/v2/flow';
import { pHeads, run, stateLabel, type GateName } from '../src/lib/qcoin/qubit';

/** Every string in a v2 catalogue, keyed by path; functions are called with sample arguments. */
function strings(m: MessagesV2): Record<string, string> {
  const out: Record<string, string> = {};
  const args: Record<string, unknown[]> = {
    'ui.goal': ['SIDE'], 'ui.tally': [2, 3], 'ui.guesses': [1, 4], 'ui.yourBox': ['MOVE'],
    'round.youWin': ['SIDE'], 'round.computerWins': ['SIDE'], 'ch2.youStartLoss': ['SIDE'],
    'ch4.luckyWin': [true], 'ch4.loss': [false],
    'ch5.inspect': [2, 'H'], 'ch5.many': [53, 47, 50, 50], 'ch5.measured': ['SIDE'], 'ch5.played': ['H', 'NAME'],
  };
  const walk = (v: unknown, path: string) => {
    if (typeof v === 'string') out[path] = v;
    else if (typeof v === 'function') out[path] = (v as (...a: unknown[]) => string)(...(args[path] ?? []));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
  };
  walk(m, '');
  return out;
}

const words = (s: string) => plain(s).replace(/<[^>]+>|\[([^\]]+)\]\(#\w+\)/g, '$1').split(/\s+/).filter(Boolean).length;

describe('coin game v2 texts', () => {
  const en = strings(MESSAGES_V2.en);

  it('has English and German with the same entries', () => {
    expect([...LOCALES_V2]).toEqual(['en', 'de']);
    expect(Object.keys(strings(MESSAGES_V2.de)).sort()).toEqual(Object.keys(en).sort());
  });

  for (const l of LOCALES_V2) {
    const t = strings(MESSAGES_V2[l]);
    it(`${l}: links only to glossary terms, paints only heads/tails`, () => {
      const terms = Object.keys(MESSAGES[l].glossary);
      for (const [k, s] of Object.entries(t)) {
        for (const ref of termRefs(s)) expect(terms, `${k} → #${ref}`).toContain(ref);
        for (const [, side, w] of s.matchAll(/\{([a-z]):([^}]*)\}/g)) {
          expect(['h', 't'], k).toContain(side);
          expect(w.toLowerCase(), k).toBe((side === 'h' ? MESSAGES[l].ui.heads : MESSAGES[l].ui.tails).toLowerCase());
        }
      }
    });
    it(`${l}: captions stay short (one idea, about 15 words)`, () => {
      const captions = Object.entries(t).filter(([k]) => /^(round|ch[1-6])\./.test(k));
      for (const [k, s] of captions) expect(words(s), `${k}: ${s}`).toBeLessThanOrEqual(18);
    });
  }

  it('German is a translation, not the English placeholder', () => {
    const de = strings(MESSAGES_V2.de);
    const same = Object.keys(en).filter((k) => de[k] === en[k] && en[k].length > 12 && !/[|⟩]/.test(en[k]));
    expect(same).toEqual([]);
  });

  it('paints heads and tails and keeps glossary links', () => {
    expect(paint('{h:Heads} and {t:tails} [H](#hadamard)')).toBe(
      '<span class="hd">Heads</span> and <span class="tl">tails</span> <button type="button" class="qc-term" data-term="hadamard">H</button>');
    expect(plain('{h:Heads} = you win')).toBe('Heads = you win');
  });
});

describe('coin game v2 flow', () => {
  it('steps through H · move · H: heads, on its edge, still on its edge, heads', () => {
    for (const move of ['I', 'X'] as GateName[]) {
      const s = stepStates(['H', move, 'H']);
      expect(s.map((x) => stateLabel(x))).toEqual(['|0⟩', '|+⟩', '|+⟩', '|0⟩']);
      expect(s.map(pHeads)).toEqual([1, 0.5, 0.5, 1]);
    }
  });

  it('seats the moves: as A you move first and last, as B in the middle', () => {
    expect(roundMoves('A', ['H', 'X'], ['I'])).toEqual(['H', 'I', 'X']);
    expect(roundMoves('B', ['X'], ['H', 'H'])).toEqual(['H', 'X', 'H']);
  });

  it('what if, chapter 1: with the computer\'s moves fixed, your other move flips the result', () => {
    for (const c1 of ['I', 'X'] as GateName[])
      for (const c2 of ['I', 'X'] as GateName[]) {
        const a = roundPHeads(roundMoves('B', ['X'], [c1, c2]));
        const b = roundPHeads(roundMoves('B', ['I'], [c1, c2]));
        expect(a + b).toBe(1); // one is heads for sure, the other tails
        expect([0, 1]).toContain(a);
      }
  });

  it('what if, chapter 2: the quantum computer starts — heads whatever you do', () => {
    for (const you of ['I', 'X'] as GateName[]) expect(roundPHeads(roundMoves('B', [you], ['H', 'H']))).toBe(1);
  });

  it('what if, chapter 2: you start — from the middle H gives 50:50 whatever you do', () => {
    for (const a1 of ['I', 'X'] as GateName[])
      for (const a2 of ['I', 'X'] as GateName[]) expect(roundPHeads(roundMoves('A', [a1, a2], ['H']))).toBe(0.5);
  });

  it('sandbox hints: H, Z, H ends on tails; H, S, H stays 50:50; H, S, S, H ends on tails', () => {
    expect(pHeads(run(['H', 'Z', 'H']))).toBe(0);
    expect(pHeads(run(['H', 'S', 'H']))).toBe(0.5);
    expect(pHeads(run(['H', 'S', 'S', 'H']))).toBe(0);
  });
});
