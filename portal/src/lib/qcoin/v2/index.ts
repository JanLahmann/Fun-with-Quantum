/**
 * The redesigned coin game's texts (v2) — English and German for now; the other languages keep
 * the v1 game until their v2 texts exist.
 */
import { rich } from '../i18n';
import type { MessagesV2 } from './types';
import en from './en';
import de from './de';

export type { MessagesV2 } from './types';

export const LOCALES_V2 = ['en', 'de'] as const;
export type LocaleV2 = (typeof LOCALES_V2)[number];
export const MESSAGES_V2: Record<LocaleV2, MessagesV2> = { en, de };

export const isLocaleV2 = (x: string): x is LocaleV2 => (LOCALES_V2 as readonly string[]).includes(x);

const PAINT = /\{([ht]):([^}]+)\}/g;

/** `{h:words}` / `{t:words}` → words in the heads / tails color; then v1's `[words](#term)` links. */
export function paint(html: string): string {
  return rich(html.replace(PAINT, (_m, side: string, words: string) => `<span class="${side === 'h' ? 'hd' : 'tl'}">${words}</span>`));
}

/** Remove the paint markers, e.g. for aria labels. */
export const plain = (html: string) => html.replace(PAINT, '$2');
