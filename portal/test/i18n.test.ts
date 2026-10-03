import { describe, expect, it } from 'vitest';
import { LOCALES, MESSAGES, TERM_PAGES, doqLink, ibmLink, pagePath, rich, termRefs } from '../src/lib/qcoin/i18n';
import type { Messages } from '../src/lib/qcoin/i18n';

/** Every string in a catalogue, keyed by path; functions are called with sample arguments. */
function strings(m: Messages): Record<string, string> {
  const out: Record<string, string> = {};
  const sample = (fn: (...a: never[]) => string, path: string) => {
    const args: Record<string, unknown[]> = {
      'ui.score': [2, 3, 5], 'states.other': ['0.50', '0.50', '0.71'],
      'ch1.intro': ['RULES', 'WIN'], 'ch1.youWin': ['SIDE'], 'ch1.computerWins': ['SIDE'],
      'ch2.introComputerFirst': ['RULES', 'WIN'], 'ch2.introYouFirst': ['WIN'], 'ch2.youStartLoss': ['SIDE'],
      'ch4.luckyWin': [true], 'ch4.loss': [false],
      'ch5.many': [53, 47, 50, 50], 'ch5.measured': ['SIDE'], 'ch5.played': ['H', 'NAME'],
    };
    return (fn as (...a: unknown[]) => string)(...(args[path] ?? []));
  };
  const walk = (v: unknown, path: string) => {
    if (typeof v === 'string') out[path] = v;
    else if (typeof v === 'function') out[path] = sample(v as never, path);
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
  };
  walk(m, '');
  return out;
}

const en = strings(MESSAGES.en);

describe('coin game translations', () => {
  it('has all seven locales, each tagged with its own language', () => {
    expect([...LOCALES]).toEqual(['en', 'de', 'ja', 'es', 'uk', 'it', 'fr']);
    for (const l of LOCALES) expect(MESSAGES[l].lang).toBe(l);
  });

  for (const l of LOCALES.filter((x) => x !== 'en')) {
    const t = strings(MESSAGES[l]);

    it(`${l}: is a real translation, not the English placeholder`, () => {
      const same = Object.keys(en).filter((k) => t[k] === en[k] && en[k].length > 12 && !/^[|(HXIZS0-9 ⟩→↔·+−=√/½:]+$/.test(en[k]));
      // a few strings are legitimately identical (formulas, "Hadamard" …); whole texts are not
      expect(same.length, same.join(', ')).toBeLessThan(6);
      expect(MESSAGES[l].langName).not.toBe('English');
    });

    it(`${l}: same keys and the same explanation links as English`, () => {
      expect(Object.keys(t).sort()).toEqual(Object.keys(en).sort());
      for (const k of Object.keys(en)) expect(termRefs(t[k]).sort(), `${l} ${k}`).toEqual(termRefs(en[k]).sort());
    });

    it(`${l}: keeps formulas, kets, HTML tags and interpolated values`, () => {
      for (const k of ['ch3.mathH', 'ch3.mathH2', 'states.plus', 'states.minus']) {
        for (const ket of ['|0⟩', '|1⟩']) if (en[k].includes(ket)) expect(t[k], `${l} ${k}`).toContain(ket);
      }
      for (const k of Object.keys(en)) {
        const tags = (s: string) => (s.match(/<\/?(strong|em|b|p)\b/g) ?? []).sort();
        expect(tags(t[k]), `${l} ${k}`).toEqual(tags(en[k]));
        for (const token of ['RULES', 'WIN', 'SIDE', 'NAME']) if (en[k].includes(token)) expect(t[k], `${l} ${k}`).toContain(token);
      }
      expect(t['ui.score']).toMatch(/2.*3.*5/s);
      expect(t['ch5.many']).toMatch(/53.*47.*50.*50/s);
    });
  }
});

describe('explanations', () => {
  it('every term link in every locale points to a glossary entry', () => {
    for (const l of LOCALES) {
      const all = strings(MESSAGES[l]);
      for (const [k, v] of Object.entries(all))
        for (const ref of termRefs(v)) expect(Object.keys(MESSAGES[l].glossary), `${l} ${k} → #${ref}`).toContain(ref);
    }
  });

  it('rich() turns [words](#term) into buttons and leaves other text alone', () => {
    expect(rich('a [superposition](#superposition) b')).toBe('a <button type="button" class="qc-term" data-term="superposition">superposition</button> b');
    expect(rich('<strong>x</strong> (#not a link)')).toBe('<strong>x</strong> (#not a link)');
  });

  it('links: IBM Quantum Learning in the player’s language where it exists, doQumentation per locale', () => {
    expect(ibmLink('bloch', 'de')).toBe(`https://quantum.cloud.ibm.com/learning/de/${TERM_PAGES.bloch}`);
    expect(ibmLink('bloch', 'uk')).toBe(`https://quantum.cloud.ibm.com/learning/en/${TERM_PAGES.bloch}`); // no Ukrainian on IBM
    expect(doqLink('bloch', 'en')).toBe(`https://doqumentation.org/learning/${TERM_PAGES.bloch}`);
    expect(doqLink('bloch', 'uk')).toBe(`https://uk.doqumentation.org/learning/${TERM_PAGES.bloch}`);
  });

  it('page paths', () => {
    expect(pagePath('en')).toBe('/preview/coin-game/');
    expect(pagePath('ja')).toBe('/ja/preview/coin-game/');
  });
});

describe('chapter 6 formulas in every language', () => {
  for (const l of LOCALES) {
    it(`${l}: keeps every formula of the derivation`, () => {
      const c = MESSAGES[l].ch6;
      for (const f of ['α|0⟩ + β|1⟩', '|α|² + |β|² = 1', '|0⟩ → |1⟩', '|1⟩ → |0⟩', '|0⟩ → (|0⟩ + |1⟩)/√2', '|1⟩ → (|0⟩ − |1⟩)/√2'])
        expect(c.intro, `${l} intro ${f}`).toContain(f);
      expect(c.caseLeave).toContain('H(H|0⟩) = H((|0⟩ + |1⟩)/√2)<br>= (H|0⟩ + H|1⟩)/√2<br>= ½(|0⟩ + |1⟩) + ½(|0⟩ − |1⟩)<br>= |0⟩');
      expect(c.caseFlip).toContain('X((|0⟩ + |1⟩)/√2) = (|1⟩ + |0⟩)/√2 = H|0⟩');
      expect(c.caseFlip).toContain('H(X(H|0⟩)) = H(H|0⟩) = |0⟩');
      expect(MESSAGES[l].ui.chapters).toHaveLength(6);
      expect(c.title.startsWith('6 · ')).toBe(true);
    });
  }
});
