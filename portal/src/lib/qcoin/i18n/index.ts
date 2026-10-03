/**
 * Locales of the Quantum Coin Game and where each glossary term is explained in depth.
 *
 * Links go to IBM Quantum Learning in the player's language where IBM has a translation (ja, de,
 * es, fr, it; English otherwise) and to the same page on doQumentation in that language, where
 * the code runs in the browser. Both sites share the page paths and section anchors (checked
 * 2026-10-01).
 */
import type { Messages, TermKey } from './types';
import en from './en';
import de from './de';
import ja from './ja';
import es from './es';
import uk from './uk';
import it from './it';
import fr from './fr';

export type { Messages, TermKey } from './types';

/** English first; the rest in order of doQumentation traffic. */
export const LOCALES = ['en', 'de', 'ja', 'es', 'uk', 'it', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];

export const MESSAGES: Record<Locale, Messages> = { en, de, ja, es, uk, it, fr };

export function isLocale(x: string): x is Locale {
  return (LOCALES as readonly string[]).includes(x);
}

/** IBM Quantum Learning languages (others fall back to English). */
const IBM_LANGS: ReadonlySet<string> = new Set(['en', 'ja', 'de', 'es', 'fr', 'it']);

/** Path below /learning/ — identical on IBM Quantum Learning and doQumentation — plus anchor. */
export const TERM_PAGES: Record<TermKey, string> = {
  qubit: 'courses/basics-of-quantum-information/single-systems/quantum-information#quantum-state-vectors',
  superposition: 'modules/quantum-mechanics/superposition-with-qiskit#quantum-coin',
  measurement: 'courses/basics-of-quantum-information/single-systems/quantum-information#measuring-quantum-states',
  bloch: 'modules/quantum-mechanics/superposition-with-qiskit#the-qubit-state-as-a-bloch-vector',
  ket: 'courses/basics-of-quantum-information/single-systems/quantum-information#examples-of-qubit-states',
  gate: 'courses/basics-of-quantum-information/single-systems/quantum-information#examples-of-unitary-operations-on-qubits',
  hadamard: 'courses/basics-of-quantum-information/single-systems/quantum-information#examples-of-unitary-operations-on-qubits',
  xgate: 'courses/basics-of-quantum-information/single-systems/quantum-information#examples-of-unitary-operations-on-qubits',
  zgate: 'courses/basics-of-quantum-information/single-systems/quantum-information#examples-of-unitary-operations-on-qubits',
  sgate: 'courses/basics-of-quantum-information/single-systems/quantum-information#examples-of-unitary-operations-on-qubits',
  igate: 'courses/basics-of-quantum-information/single-systems/quantum-information#examples-of-unitary-operations-on-qubits',
  interference: 'modules/quantum-mechanics/superposition-with-qiskit#the-quantum-phase',
  phase: 'modules/quantum-mechanics/superposition-with-qiskit#the-quantum-phase',
  circuit: 'courses/basics-of-quantum-information/quantum-circuits/circuits#quantum-circuits',
  algorithms: 'courses/fundamentals-of-quantum-algorithms',
  math: 'courses/basics-of-quantum-information/single-systems/quantum-information#compositions-of-qubit-unitary-operations',
};

export function ibmLink(term: TermKey, locale: Locale): string {
  const lang = IBM_LANGS.has(locale) ? locale : 'en';
  return `https://quantum.cloud.ibm.com/learning/${lang}/${TERM_PAGES[term]}`;
}

export function doqLink(term: TermKey, locale: Locale): string {
  const host = locale === 'en' ? 'doqumentation.org' : `${locale}.doqumentation.org`;
  return `https://${host}/learning/${TERM_PAGES[term]}`;
}

/** URL of the (unlisted) game page in a locale. */
export function pagePath(locale: Locale): string {
  return locale === 'en' ? '/preview/coin-game/' : `/${locale}/preview/coin-game/`;
}

const TERM_LINK = /\[([^\]]+)\]\(#([a-z]+)\)/g;

/** Turn `[words](#term)` into explanation buttons; everything else is trusted catalogue HTML. */
export function rich(html: string): string {
  return html.replace(TERM_LINK, (_m, words: string, term: string) =>
    `<button type="button" class="qc-term" data-term="${term}">${words}</button>`);
}

/** All `#term` references in a string — used by tests to catch typos in translations. */
export function termRefs(html: string): string[] {
  return [...html.matchAll(TERM_LINK)].map((m) => m[2]);
}
