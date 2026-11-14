import type { Locale } from './qcoin/i18n';
import type { GameLocale } from './games/locale';

/**
 * Where the "open the notebook" links go. qubins.org has been down since 2026-11-09: GitHub flagged the
 * QuBins org as spam (support ticket open). While QUBINS_DOWN is true, every such link goes to the
 * notebook on GitHub, and the start-up hint gives way to a short note (Jan, 2026-11-14).
 * When qubins.org answers again (the Links check warns then, .github/workflows/links.yml), set
 * QUBINS_DOWN to false; the texts below can then go too. Outside this file, the outage also shows in
 * the lead of src/pages/play/index.astro, the note under the README's games table and the excludes in
 * links.yml.
 */
export const QUBINS_DOWN = true;

const REPO = 'https://github.com/JanLahmann/Fun-with-Quantum';

/** The QuBins launch link of a notebook in this repository, with classic RISE (see CLAUDE.md). */
export const qubinsLaunch = (notebook: string) =>
  `https://qubins.org/launch/?image=2.5-xl&repo=${REPO}&branch=master&path=${notebook}&ui=rise-classic`;

/** The link target: the launch link, or the notebook on GitHub while QuBins is down. */
export const notebookHref = (launchUrl: string, notebook: string) => (QUBINS_DOWN ? `${REPO}/blob/master/${notebook}` : launchUrl);

/** For the Umami event: where the link goes. */
export const notebookTarget = (launchUrl: string) =>
  QUBINS_DOWN ? 'github' : new URL(launchUrl).hostname.includes('qubins') ? 'qubins' : 'binder';

/** The note and link text while QuBins is down, in the languages of the game pages. */
export const NOTEBOOK_DOWN = {
  en: {
    note: 'Notebook launch is temporarily unavailable. You can play the browser version or read the notebook on GitHub.',
    noteNoWeb: 'Notebook launch is temporarily unavailable. You can read the notebook on GitHub.',
    link: 'read the notebook on GitHub ↗',
  },
  de: {
    note: 'Das Starten der Notebooks ist vorübergehend nicht möglich. Du kannst die Browser-Version spielen oder das Notebook auf GitHub lesen.',
    noteNoWeb: 'Das Starten der Notebooks ist vorübergehend nicht möglich. Du kannst das Notebook auf GitHub lesen.',
    link: 'Notebook auf GitHub lesen ↗',
  },
  ja: {
    note: 'ノートブックの起動は一時的にご利用いただけません。ブラウザ版で遊ぶか、GitHub でノートブックを読むことができます。',
    noteNoWeb: 'ノートブックの起動は一時的にご利用いただけません。GitHub でノートブックを読むことができます。',
    link: 'GitHub でノートブックを読む ↗',
  },
  es: {
    note: 'El inicio de los notebooks no está disponible temporalmente. Puedes jugar la versión para navegador o leer el notebook en GitHub.',
    noteNoWeb: 'El inicio de los notebooks no está disponible temporalmente. Puedes leer el notebook en GitHub.',
    link: 'leer el notebook en GitHub ↗',
  },
  uk: {
    note: 'Запуск ноутбуків тимчасово недоступний. Можна зіграти у версію для браузера або прочитати ноутбук на GitHub.',
    noteNoWeb: 'Запуск ноутбуків тимчасово недоступний. Можна прочитати ноутбук на GitHub.',
    link: 'прочитати ноутбук на GitHub ↗',
  },
  it: {
    note: 'L’avvio dei notebook non è temporaneamente disponibile. Puoi giocare alla versione per browser o leggere il notebook su GitHub.',
    noteNoWeb: 'L’avvio dei notebook non è temporaneamente disponibile. Puoi leggere il notebook su GitHub.',
    link: 'leggi il notebook su GitHub ↗',
  },
  fr: {
    note: 'Le lancement des notebooks est temporairement indisponible. Tu peux jouer à la version navigateur ou lire le notebook sur GitHub.',
    noteNoWeb: 'Le lancement des notebooks est temporairement indisponible. Tu peux lire le notebook sur GitHub.',
    link: 'lire le notebook sur GitHub ↗',
  },
} satisfies Record<Locale | GameLocale, { note: string; noteNoWeb: string; link: string }>;
