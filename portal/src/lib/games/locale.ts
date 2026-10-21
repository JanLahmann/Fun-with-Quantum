/**
 * Languages of the browser games other than the coin game (which has its own seven, src/lib/qcoin/i18n):
 * English everywhere, German for the games that have a `de` catalogue (TRANSLATED_GAMES).
 */
export const GAME_LOCALES = ['en', 'de'] as const;
export type GameLocale = (typeof GAME_LOCALES)[number];

export const isGameLocale = (x: string | undefined): x is GameLocale => (GAME_LOCALES as readonly string[]).includes(x ?? '');

/** A probability as a percentage in the locale's style: 85.4% · 85,4 % (German: decimal comma, no-break space). */
export function percent(p: number, digits: number, locale: GameLocale): string {
  const v = (100 * p).toFixed(digits);
  return locale === 'de' ? `${v.replace('.', ',')}\u00a0%` : `${v}%`;
}

/** The game pages in a language other than English: /de/play/<slug>/. */
export const gamePath = (slug: string, locale: GameLocale) => (locale === 'en' ? `/play/${slug}/` : `/${locale}/play/${slug}/`);

/** The browser games with a page in more than one language (each other language: src/pages/<locale>/play/<slug>.astro). */
export const TRANSLATED_GAMES: Record<string, readonly GameLocale[]> = {
  'ghz-game': ['en', 'de'],
  'chsh-game': ['en', 'de'],
};

export const LANG_NAME: Record<GameLocale, string> = { en: 'English', de: 'Deutsch' };
