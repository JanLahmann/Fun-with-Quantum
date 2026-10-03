/**
 * Browser side shared by the GHZ game, the magic square and 3-SAT (markup: components/GameFrame.astro):
 * chapters as small async scripts, buttons you can await, explanations on demand.
 *
 * Same pattern as the coin game (src/lib/qcoin/ui.ts): `ask()` waits for a button press, so a
 * chapter reads top to bottom; switching chapters bumps `epoch`, which makes every pending wait
 * of the old chapter throw `Abort` and end quietly.
 */
import { GLOSSARY_EN, doqLink, ibmLink, rich, type TermKey } from './glossary';

export class Abort extends Error {}

declare global {
  interface Window { umami?: { track: (name: string, data?: Record<string, string | number>) => void } }
}
export function track(name: string, data?: Record<string, string | number>) {
  try { window.umami?.track(name, data); } catch { /* analytics is best-effort */ }
}

export const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export interface Choice<T> { label: string; value: T; kind?: 'primary' | 'quantum' | 'current' }

export interface UiLabels {
  allTerms: string;
  explainTitle: string;
  learnMoreIbm: string;
  learnMoreDoq: string;
}

export interface Shell {
  root: HTMLElement;
  /** Current chapter run; compare with the `e` a chapter was started with. */
  readonly epoch: number;
  setTitle(text: string): void;
  setText(html: string): void;
  say(html: string): void;
  score(text: string): void;
  circuit(svg: string): void;
  wait(ms: number, e: number): Promise<void>;
  /** Render buttons, resolve with the chosen value; aborts if the chapter changes meanwhile. */
  ask<T>(e: number, options: Choice<T>[], extra?: string): Promise<T>;
  /** Resolve when `fn` is called by an outside control (e.g. a click on the stage), or a button. */
  askOr<T>(e: number, options: Choice<T>[], hook: (resolve: (v: T) => void) => void, extra?: string): Promise<T>;
  go(chapter: number): void;
  markDone(chapter: number): void;
}

export function mountShell(
  root: HTMLElement,
  chapters: ((e: number) => Promise<void>)[],
  opts: { game: string; storageKey: string; terms: readonly TermKey[]; labels: UiLabels; locale: string; onEnter?: (chapter: number) => void },
): Shell {
  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const title = $('.qg-title'), text = $('.qg-text'), status = $('.qg-status');
  const actions = $('.qg-actions'), scoreEl = $('.qg-score'), circuitEl = $('.qg-circuit');
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('.qg-chapters button'));
  let epoch = 0;
  let pending: ((v: never) => void) | null = null;

  function buttons<T>(e: number, options: Choice<T>[], done: (v: T) => void, extra: string) {
    actions.innerHTML = '';
    for (const o of options) {
      const b = document.createElement('button');
      b.type = 'button';
      if (o.kind) b.classList.add(o.kind);
      if (o.kind === 'current') b.setAttribute('aria-current', 'true');
      b.innerHTML = o.label;
      b.addEventListener('click', () => { if (e === epoch) done(o.value); });
      actions.appendChild(b);
    }
    if (extra) actions.insertAdjacentHTML('beforeend', extra);
  }

  const shell: Shell = {
    root,
    get epoch() { return epoch; },
    setTitle: (t) => { title.textContent = t; },
    setText: (html) => { text.innerHTML = rich(html); },
    say: (html) => { status.innerHTML = rich(html); },
    score: (t) => { scoreEl.textContent = t; },
    circuit: (svg) => { circuitEl.innerHTML = svg; },
    wait: (ms, e) => new Promise<void>((res, rej) =>
      setTimeout(() => (e === epoch ? res() : rej(new Abort())), reducedMotion() ? Math.min(ms, 120) : ms)),
    ask: (e, options, extra = '') => shell.askOr(e, options, () => {}, extra),
    askOr<T>(e: number, options: Choice<T>[], hook: (resolve: (v: T) => void) => void, extra = '') {
      return new Promise<T>((resolve, reject) => {
        if (e !== epoch) { reject(new Abort()); return; }
        let settled = false;
        const done = (v: T) => {
          if (settled || e !== epoch) return;
          settled = true;
          pending = null;
          actions.querySelectorAll('button').forEach((x) => (x.disabled = true));
          resolve(v);
        };
        pending = (() => { if (!settled) { settled = true; reject(new Abort()); } }) as (v: never) => void;
        buttons(e, options, done, extra);
        hook(done);
      });
    },
    go,
    markDone,
  };

  /* ---- explanations on demand ---- */
  const dlg = root.querySelector<HTMLDialogElement>('.qg-explain')!;
  const dlgBody = dlg.querySelector<HTMLElement>('.qg-explain-body')!;
  const { labels, locale, game } = opts;
  const isTerm = (x: string | undefined): x is TermKey => !!x && x in GLOSSARY_EN;
  function explain(term: TermKey | null) {
    if (term) {
      const g = GLOSSARY_EN[term];
      const ibm = ibmLink(term, locale), doq = doqLink(term, locale);
      const ev = `data-umami-event="Portal: ${game} learn more" data-umami-event-term="${term}"`;
      dlgBody.innerHTML = `<button type="button" class="qg-back" data-term="">${labels.allTerms}</button>
        <h3 tabindex="-1">${g.title}</h3>
        <p>${rich(g.body)}</p>
        ${ibm && doq ? `<p class="qg-more">
          <a href="${ibm}" target="_blank" rel="noopener" ${ev} data-umami-event-site="ibm">${labels.learnMoreIbm}</a><br>
          <a href="${doq}" target="_blank" rel="noopener" ${ev} data-umami-event-site="doqumentation">${labels.learnMoreDoq}</a>
        </p>` : ''}`;
      track(`Portal: ${game} explain`, { term, lang: locale });
    } else {
      dlgBody.innerHTML = `<h3 tabindex="-1">${labels.explainTitle}</h3>
        <ul class="qg-terms">${opts.terms.map((t) => `<li><button type="button" class="qg-term" data-term="${t}">${GLOSSARY_EN[t].title}</button></li>`).join('')}</ul>`;
    }
    if (!dlg.open) dlg.showModal();
    dlgBody.querySelector<HTMLElement>('h3')?.focus();
  }
  root.addEventListener('click', (ev) => {
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-term]');
    if (!el || !root.contains(el)) return;
    ev.preventDefault();
    explain(isTerm(el.dataset.term) ? el.dataset.term : null);
  });
  root.querySelector('.qg-explain-btn')?.addEventListener('click', () => explain(null));
  dlg.querySelector('.qg-close')?.addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (ev) => { // a click on the backdrop (outside the box) closes
    const r = dlg.getBoundingClientRect();
    if (ev.target === dlg && (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom)) dlg.close();
  });

  /* ---- chapters ---- */
  const done = new Set<number>((() => { try { return JSON.parse(localStorage.getItem(opts.storageKey) ?? '[]'); } catch { return []; } })());
  let current = 1;
  function paintTabs() {
    for (const t of tabs) {
      const n = Number(t.dataset.chapter);
      t.setAttribute('aria-selected', String(n === current));
      const isDone = done.has(n) && n !== current;
      t.classList.toggle('done', isDone);
      const badge = t.querySelector('.n');
      if (badge) badge.textContent = isDone ? '✓' : String(n);
    }
  }
  function markDone(ch: number) {
    done.add(ch);
    try { localStorage.setItem(opts.storageKey, JSON.stringify([...done])); } catch { /* private mode: fine */ }
    paintTabs();
  }
  function go(ch: number, initial = false) {
    pending?.(undefined as never);
    epoch++;
    const e = epoch;
    current = ch;
    paintTabs();
    actions.innerHTML = ''; scoreEl.textContent = ''; status.innerHTML = ''; circuitEl.innerHTML = ''; text.innerHTML = '';
    opts.onEnter?.(ch);
    if (!initial) track(`Portal: ${game} chapter`, { chapter: ch });
    chapters[ch - 1](e).catch((err) => { if (!(err instanceof Abort)) console.error(err); });
  }
  tabs.forEach((t) => t.addEventListener('click', () => go(Number(t.dataset.chapter))));
  queueMicrotask(() => go(1, true));
  return shell;
}
