/**
 * The browser games in German (GHZ, CHSH): every German text has the same keys,
 * explanation links, HTML tags and numbers as the English one, so tools/check_numbers.py, which
 * checks the English texts, covers the German ones too.
 */
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GLOSSARY_EN, glossaryEntry, termRefs, type TermKey } from '../src/lib/games/glossary';
import { GLOSSARY_DE } from '../src/lib/games/glossary-de';
import { TRANSLATED_GAMES, gamePath, percent } from '../src/lib/games/locale';
import * as ghz from '../src/lib/ghz/messages';
import * as chsh from '../src/lib/chsh/messages';
import { TSIRELSON_WIN } from '../src/lib/chsh/game';

/** Every string in a catalogue, keyed by path; functions are called with sample arguments. */
function strings(m: object, samples: Record<string, unknown[]>): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (v: unknown, path: string) => {
    if (typeof v === 'string') out[path] = v;
    else if (typeof v === 'function') {
      const args = samples[path];
      if (!args) throw new Error(`no sample arguments for ${path}`);
      out[path] = String((v as (...a: unknown[]) => unknown)(...args));
    } else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
  };
  walk(m, '');
  return out;
}

/** The numbers in a text, German style normalized to English: 85,4 % → 85.4. English "1s" is German "Einsen". */
const numbers = (s: string) =>
  (s.replace(/\b[01]s\b/g, '').replace(/(\d),(\d)/g, '$1.$2').match(/\d+(?:\.\d+)?/g) ?? []).sort();
const tags = (s: string) => (s.match(/<\/?[a-z]+\b/g) ?? []).sort();

const GHZ_SAMPLES: Record<string, unknown[]> = {
  'UI.thing': [1, 0], 'UI.changeThing': ['Bob'],
  'CH1.score': [2], 'CH1.allResult': [64, 3], 'CH2.manyResult': [1000, 1000], 'CH2.score': [7, 9],
  questionLabel: [['C', 'S', 'S']], said: ['S', 1], verdict: [['C', 'S', 'S'], [1, 0, 0], true], percent: [0.854, 1],
};

describe('GHZ game in German', () => {
  const en = strings(ghz.MESSAGES.en, GHZ_SAMPLES);
  const de = strings(ghz.MESSAGES.de, GHZ_SAMPLES);

  it('has the same keys as English, and is a real translation', () => {
    expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort());
    const same = Object.keys(en).filter((k) => de[k] === en[k] && en[k].length > 12);
    expect(same, same.join(', ')).toEqual([]);
  });

  it('keeps the explanation links, HTML tags and numbers of every text', () => {
    for (const k of Object.keys(en)) {
      expect(termRefs(de[k]).sort(), k).toEqual(termRefs(en[k]).sort());
      expect(tags(de[k]), k).toEqual(tags(en[k]));
      expect(numbers(de[k]), k).toEqual(numbers(en[k]));
    }
  });

  it('writes percentages the German way', () => {
    expect(de.percent).toBe('85,4 %');
    expect(de['CH2.manyResult']).toContain('(100,0 %)');
    expect(de.verdict).toBe('1 × rot oder Stern: ungerade. <span class="win">Gewonnen!</span>');
    expect(ghz.MESSAGES.de.UI.thing(0, 1)).toBe('blauer Stern');
    expect(ghz.MESSAGES.de.UI.thing(1, 0)).toBe('rotes Rechteck');
  });

  it('explains every term it links to, and every term in its index, in German', () => {
    const refs = new Set<string>([...Object.values(de).flatMap(termRefs), ...ghz.TERMS]);
    for (const r of refs) expect(Object.keys(GLOSSARY_DE), r).toContain(r);
  });
});

const CHSH_SAMPLES: Record<string, unknown[]> = {
  'UI.answerTo': ['x', 1], 'UI.question': [0, 1], 'UI.need': [1, 1], 'UI.needs': [1, 1],
  'UI.tally': [7, 9], 'UI.degrees': [-45], 'UI.winCell': [TSIRELSON_WIN],
  'CH1.result': [3], 'CH1.manyResult': [748, 1000, 3], 'CH1.allResult': [16, 3, 8],
  'CH2.manyResult': [853, 1000], 'CH2.score': [7, 9],
  'CH3.total': [0.8, TSIRELSON_WIN], 'CH3.manyResult': [851, 1000, TSIRELSON_WIN],
  'CH4.question': [1, 1, 90, -45, TSIRELSON_WIN],
  round: [{ x: 1, y: 1, a: 0, b: 1, win: true }, 90, -45], percent: [TSIRELSON_WIN, 1],
};

describe('CHSH game in German', () => {
  const en = strings(chsh.MESSAGES.en, CHSH_SAMPLES);
  const de = strings(chsh.MESSAGES.de, CHSH_SAMPLES);

  it('has the same keys as English, and is a real translation', () => {
    expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort());
    // formulas such as "x = 0 · y = 1" stay as they are
    const same = Object.keys(en).filter((k) => de[k] === en[k] && en[k].length > 12 && !/^[\sxyab0-9=·,]+$/.test(en[k]));
    expect(same, same.join(', ')).toEqual([]);
  });

  it('keeps the explanation links, HTML tags and numbers of every text', () => {
    for (const k of Object.keys(en)) {
      expect(termRefs(de[k]).sort(), k).toEqual(termRefs(en[k]).sort());
      expect(tags(de[k]), k).toEqual(tags(en[k]));
      expect(numbers(de[k]), k).toEqual(numbers(en[k]));
    }
  });

  it('keeps the numbers in every branch of the win-rate verdict', () => {
    for (const [win, max] of [[TSIRELSON_WIN, TSIRELSON_WIN], [0.8, TSIRELSON_WIN], [0.75, TSIRELSON_WIN], [0.5, TSIRELSON_WIN]])
      expect(numbers(chsh.MESSAGES.de.CH3.total(win, max)), String(win)).toEqual(numbers(chsh.MESSAGES.en.CH3.total(win, max)));
    expect(numbers(chsh.MESSAGES.de.CH1.result(2))).toEqual(numbers(chsh.MESSAGES.en.CH1.result(2)));
    expect(chsh.MESSAGES.de.UI.winCell(TSIRELSON_WIN)).toBe('Gewinnchance 85,4\u00a0%');
    expect(chsh.MESSAGES.de.CH2.manyResult(853, 1000)).toContain('(85,3\u00a0%)');
  });

  it('explains every term it links to, and every term in its index, in German', () => {
    const refs = new Set<string>([...Object.values(de).flatMap(termRefs), ...chsh.TERMS]);
    for (const r of refs) expect(Object.keys(GLOSSARY_DE), r).toContain(r);
  });
});

describe('German explanations', () => {
  const keys = Object.keys(GLOSSARY_DE) as TermKey[];

  it('have the numbers and links of the English ones', () => {
    for (const k of keys) {
      const d = GLOSSARY_DE[k]!, e = GLOSSARY_EN[k];
      expect(numbers(d.body), k).toEqual(numbers(e.body));
      expect(termRefs(d.body).sort(), k).toEqual(termRefs(e.body).sort());
      expect(d.body, k).not.toBe(e.body);
    }
  });

  it('link only to terms that are explained in German too', () => {
    for (const k of keys) for (const r of termRefs(GLOSSARY_DE[k]!.body)) expect(keys, `${k} → #${r}`).toContain(r);
  });

  it('are used in German, with English for the rest', () => {
    expect(glossaryEntry('ghz', 'de').title).toBe('GHZ-Zustand');
    expect(glossaryEntry('ghz').title).toBe('GHZ state');
    expect(glossaryEntry('grover', 'de')).toBe(GLOSSARY_EN.grover);
  });
});

describe('translated game pages', () => {
  it('exist for every language listed, English first', () => {
    for (const [slug, locales] of Object.entries(TRANSLATED_GAMES)) {
      expect(locales[0]).toBe('en');
      for (const l of locales.slice(1)) {
        expect(gamePath(slug, l)).toBe(`/${l}/play/${slug}/`);
        expect(existsSync(new URL(`../src/pages/${l}/play/${slug}.astro`, import.meta.url)), `${l}/${slug}`).toBe(true);
      }
    }
  });

  it('percent() formats English and German', () => {
    expect(percent(0.75, 0, 'en')).toBe('75%');
    expect(percent(0.75, 0, 'de')).toBe('75 %');
  });
});
