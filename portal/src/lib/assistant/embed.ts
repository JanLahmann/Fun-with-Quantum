/**
 * The chat widget for sites outside this portal (rasqberry.org): one script tag, served by the
 * assistant Worker as /widget.js (built from this file, see assistant/package.json "widget").
 *
 *   <script src="https://fwq-assistant.jan-35c.workers.dev/widget.js" defer
 *           data-site="rasqberry" data-context="build" data-context-pi="device"></script>
 *
 * data-context-pi: the context to use when the page was opened on a RasQberry (?from=pi, kept for
 * the browser tab); its start URL may add v=<image build>, model=pi4|pi5, led=<LED layout> and
 * ledcheck=true|false|skipped (LED_LAYOUT_VERIFIED). data-public="1" shows it to everyone; until then only with ?assistant=1.
 * A page may switch the shared script tag to another context with a marker element in its body,
 * e.g. rasqberry.org/testing/: <div data-fwq-assistant="tester" data-public="1"></div> — on the Pi
 * too, and public if the marker says so. It is read once, when the script starts (link to such a
 * page with a full page load).
 * The page may define window.fwqAssistantState() to add to the state sent along (page + title).
 * The box floats bottom right in a shadow root, so the site's CSS and ours stay apart.
 */
import type { AssistantTexts } from './i18n';
import { registerState } from './state';
import { mountTester } from './tester-ui';
import { mountAssistant } from './widget';

declare global {
  interface Window { fwqAssistantState?: () => Record<string, unknown> }
}

interface EmbedTexts extends Partial<AssistantTexts> { privacyUrl: string }

const HELPER_ERRORS = {
  errRate: 'That was a lot of questions — please wait a minute (or until tomorrow) and ask again.',
  errBusy: 'Ket has answered all it can for today. Please try again tomorrow.',
  errNetwork: 'Ket couldn’t be reached. Please check the internet connection and try again.',
};

const RASQBERRY_PRIVACY =
  'Your questions and the page you are on are sent to Anthropic (Claude) to answer, and stored for 30 days to improve Ket. Please don’t enter personal data.';

/** Texts per site/context (English only for now). */
export const EMBED_TEXTS: Record<string, EmbedTexts> = {
  'rasqberry/build': {
    open: 'Ask Ket',
    title: 'Ket — ask about building a RasQberry',
    intro: 'Questions about parts, 3D printing, LEDs, installing the image or troubleshooting — for example “Which Raspberry Pi do I need?”',
    privacy: RASQBERRY_PRIVACY,
    explainer: 'Ket (AI)',
    ...HELPER_ERRORS,
    privacyUrl: 'https://fun-with-quantum.org/about/#privacy',
  },
  'rasqberry/device': {
    open: 'Ask Ket',
    title: 'Ket — ask about your RasQberry',
    intro: 'Questions about the demos and games on this RasQberry, how to start them or what they show — for example “Which demo should I try first?”',
    privacy: RASQBERRY_PRIVACY,
    explainer: 'Ket (AI)',
    ...HELPER_ERRORS,
    privacyUrl: 'https://fun-with-quantum.org/about/#privacy',
  },
  'rasqberry/tester': {
    open: 'Ket · tester helper',
    title: 'Ket, the RasQberry Two tester helper',
    intro: 'Missions that fit your setup, and a place for everything you notice. I don’t help with the missions themselves — the documentation and Ket on the other rasqberry.org pages do.',
    privacy:
      'Your messages are answered by Claude (Anthropic). What we keep, and for how long: your tester name or ID (chosen by you, please no e-mail address), ' +
      'your hardware and preferences, your conversations with the tester helper, the findings you save, and which missions you started or finished. ' +
      'We keep them for 90 days, then delete them. The tester passphrase is checked but never stored. We use this only to find and fix problems in ' +
      'RasQberry; findings may become public GitHub issues, without your name or ID.',
    explainer: 'Ket (AI)',
    ...HELPER_ERRORS,
    errRate: 'That’s all the questions for today (60 per tester). Thank you — please continue tomorrow.',
    privacyUrl: 'https://rasqberry.org/testing/',
  },
  'cleanjibe/help': {
    open: 'Ask CleanJibe',
    title: 'CleanJibe help',
    intro: 'Questions about the app, the watch and your numbers — for example “What does CPH mean?”',
    privacy:
      'When you ask, your question and the answer go through Cloudflare to Anthropic (Claude) and are kept for 30 days to improve the answers. ' +
      'No account, no IP address, no location. Please don’t enter personal data.',
    explainer: 'CleanJibe (AI)',
    ...HELPER_ERRORS,
    errBusy: 'The help desk has answered all it can for today. Please try again tomorrow.',
    errNetwork: 'The help desk couldn’t be reached. Please check the internet connection and try again.',
    privacyUrl: 'https://cleanjibe.org/privacy',
  },
};

const EVENTS: Record<string, string> = { rasqberry: 'RasQberry Two', cleanjibe: 'CleanJibe' };

/** A query flag that is remembered for the browser tab (client-side navigation drops the query). */
function flag(param: string, value: string, key: string): boolean {
  try {
    if (new URLSearchParams(location.search).get(param) === value) sessionStorage.setItem(key, '1');
    return sessionStorage.getItem(key) === '1';
  } catch {
    return new URLSearchParams(location.search).get(param) === value;
  }
}

const CSS = `
:host { all: initial; }
.fwq-assist { --c: #0f7f9c; --m: #b8336a; --ink: #1d2433; --muted: #5b6475; --card: #fff; --paper: #f6f7f9; --line: #d7dbe2;
  position: fixed; right: 16px; bottom: 16px; z-index: 2147483000; font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--ink);
  display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
@media (prefers-color-scheme: dark) { .fwq-assist { --c: #4cc3e0; --m: #ff7aa8; --ink: #e8ebf1; --muted: #a3abba; --card: #1b2130; --paper: #121722; --line: #343c4e; } }
.fa-open { font: 600 0.92rem inherit; font-family: inherit; color: #fff; background: var(--c); border: 0; border-radius: 22px; padding: 10px 18px; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,.2); order: 2; }
.fa-panel { order: 1; width: min(400px, calc(100vw - 32px)); max-height: min(640px, calc(100vh - 90px)); overflow: auto; background: var(--card); border: 1px solid var(--line);
  border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,.25); padding: 14px 16px 16px; box-sizing: border-box; display: flex; flex-direction: column; }
.fa-panel[hidden] { display: none; }
.fa-head { display: flex; align-items: flex-start; gap: 8px; }
h3 { font-size: 1.02rem; margin: 0 0 4px; flex: 1; }
.fa-size { background: transparent; border: 1px solid var(--line); border-radius: 8px; color: var(--muted); cursor: pointer; font: 1rem/1 inherit; padding: 3px 7px; }
.fa-size:hover { color: var(--ink); }
/* Larger: most of the window; or the size the reader dragged (inline width/height). */
.fa-panel.fa-large { width: min(760px, calc(100vw - 32px)); height: calc(100vh - 90px); max-height: none; }
.fa-panel.fa-sized { max-height: none; }
.fa-grip { position: absolute; left: 0; top: 0; width: 22px; height: 22px; cursor: nwse-resize; touch-action: none; }
.fa-grip::before { content: ""; position: absolute; left: 6px; top: 6px; width: 9px; height: 9px; border-top: 2px solid var(--muted); border-left: 2px solid var(--muted); border-top-left-radius: 5px; opacity: .7; }
.fa-grip:hover::before { opacity: 1; border-color: var(--c); }
.fa-large form, .fa-sized form { margin-top: auto; } /* the question box stays at the bottom of a big window */
.fa-panel { position: relative; }
.fa-intro { font-size: 0.9rem; margin: 0 0 6px; }
.fa-privacy { color: var(--muted); font-size: 0.76rem; margin: 0 0 10px; }
a { color: var(--c); }
.fa-log { display: flex; flex-direction: column; gap: 10px; flex: 1 1 auto; min-height: 120px; overflow-y: auto; margin-bottom: 10px; }
.fa-log:empty { display: none; }
.fa-msg { font-size: 0.92rem; }
.fa-who { display: block; font: 600 0.68rem ui-monospace, monospace; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); margin-bottom: 2px; }
.fa-bot .fa-body { border-left: 3px solid var(--m); padding-left: 10px; }
.fa-body p { margin: 0; } .fa-body p + p { margin-top: 6px; }
.fa-body a { word-break: break-all; }
.fa-body code { font: 0.85em ui-monospace, monospace; background: var(--paper); border: 1px solid var(--line); border-radius: 4px; padding: 0 3px; }
.fa-thinking { color: var(--muted); font-style: italic; }
.fa-error { color: var(--m); }
.fa-vote { display: flex; gap: 6px; align-items: center; font-size: 0.8rem; color: var(--muted); padding-left: 13px; }
.fa-vote button { background: transparent; border: 1px solid var(--line); border-radius: 8px; padding: 2px 8px; cursor: pointer; font-size: 0.9rem; color: inherit; }
form { display: flex; gap: 8px; align-items: flex-end; margin: 0; }
textarea { flex: 1; font: 0.94rem inherit; font-family: inherit; color: var(--ink); background: var(--paper); border: 1px solid var(--line); border-radius: 10px; padding: 8px 10px; resize: vertical; min-height: 44px; }
textarea:focus, button:focus-visible { outline: 2px solid var(--c); outline-offset: 1px; }
button[type=submit] { font: 600 0.9rem inherit; font-family: inherit; color: #fff; background: var(--c); border: 0; border-radius: 10px; padding: 10px 14px; cursor: pointer; }
button[type=submit]:disabled { opacity: .6; cursor: wait; }
/* Small windows (e.g. the Pi's unmaximized browser): a narrower panel, the answer gets the height. */
@media (max-width: 600px) { .fa-size, .fa-grip { display: none; } .fa-panel.fa-large, .fa-panel.fa-sized { width: min(340px, calc(100vw - 20px)) !important; height: auto !important; max-height: calc(100vh - 70px); } }
@media (max-width: 760px), (max-height: 640px) {
  .fwq-assist { right: 10px; bottom: 10px; font-size: 14px; gap: 6px; }
  .fa-panel { width: min(340px, calc(100vw - 20px)); max-height: calc(100vh - 70px); padding: 10px 12px 12px; }
  .fa-open { padding: 8px 14px; }
  .fa-intro { font-size: 0.84rem; } .fa-privacy { font-size: 0.72rem; margin-bottom: 6px; }
  .fa-panel:has(.fa-log:not(:empty)) .fa-intro { display: none; } /* once the chat runs, the answer needs the room */
  textarea { min-height: 38px; }
}
.fa-signed-in .fa-intro, .fa-signed-in .fa-privacy { display: none; }
.fa-tester-bar a { color: var(--m); }
.fa-tester-bar { font-size: 0.8rem; color: var(--muted); margin: 0 0 8px; }
.fa-link { background: none; border: 0; padding: 0; color: var(--m); text-decoration: underline; cursor: pointer; font: inherit; }
.fa-signin, .fa-setup { display: flex; flex-direction: column; gap: 6px; font-size: 0.88rem; margin-bottom: 10px; }
.fa-signin[hidden], .fa-setup[hidden], .fa-tester-bar[hidden], .fa-mine[hidden] { display: none; }
.fa-mine { font-size: 0.88rem; margin-bottom: 10px; } .fa-mine-list { margin: 6px 0; padding-left: 18px; } .fa-mine-list li { margin: 2px 0; }
.fa-kit { display: inline-flex; flex-wrap: wrap; gap: 4px 10px; align-items: center; color: var(--muted); }
.fa-signin input, .fa-setup input:not([type]) { font: inherit; padding: 6px 8px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); color: inherit; }
.fa-signin button, .fa-setup button[type=submit], .fa-actions button { font: 600 0.85rem inherit; font-family: inherit; color: #fff; background: var(--c); border: 0; border-radius: 8px; padding: 6px 12px; cursor: pointer; align-self: flex-start; }
.fa-setup-intro { margin: 0; }
.fa-setup fieldset { align-self: stretch; min-width: 0; border: 1px solid var(--line); border-radius: 8px; padding: 4px 8px 6px; margin: 0; display: flex; flex-wrap: wrap; gap: 4px 12px; }
.fa-setup legend { font-size: 0.78rem; color: var(--muted); padding: 0 4px; }
.fa-choice { display: inline-flex; gap: 4px; align-items: center; }
.fa-card { border: 1px solid var(--line); border-radius: 10px; padding: 8px 10px; margin-top: 8px; background: var(--paper); }
.fa-card p { margin: 4px 0 0; } .fa-meta { color: var(--muted); font-size: 0.78rem; }
.fa-actions { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 8px; }
.fa-actions .fa-secondary { color: var(--ink); background: transparent; border: 1px solid var(--line); }
.fa-actions button[hidden] { display: none; }
.fa-actions button[aria-pressed=true] { outline: 2px solid var(--m); outline-offset: 1px; }
.fa-actions button:disabled { opacity: .6; cursor: default; }
form[hidden], .fa-log[hidden] { display: none; }
.fa-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  return e;
}

/**
 * The Pi's facts from its start URL (?from=pi&v=<image build>&model=pi4|pi5&led=<layout>&ledcheck=true|false|skipped),
 * kept for the tab like the flags above. The Worker validates them.
 */
export function piDevice(): Record<string, string> | undefined {
  const q = new URLSearchParams(location.search);
  const fresh = Object.fromEntries((['v', 'model', 'led', 'ledcheck'] as const).flatMap((k) => (q.get(k) ? [[k === 'v' ? 'version' : k, q.get(k)!.slice(0, 60)]] : [])));
  try {
    if (Object.keys(fresh).length) sessionStorage.setItem('fwq-pi-device', JSON.stringify(fresh));
    return JSON.parse(sessionStorage.getItem('fwq-pi-device') ?? 'null') ?? undefined;
  } catch {
    return Object.keys(fresh).length ? fresh : undefined;
  }
}

/** The reader's window size, remembered per browser: 'normal', 'large', or a dragged {w, h}. */
const SIZE_KEY = 'fwq-assistant-size';
type Size = 'normal' | 'large' | { w: number; h: number };
const loadSize = (): Size => {
  try {
    const v = JSON.parse(localStorage.getItem(SIZE_KEY) ?? '"normal"');
    return v === 'large' || (v && typeof v.w === 'number' && typeof v.h === 'number') ? v : 'normal';
  } catch { return 'normal'; }
};
const saveSize = (v: Size) => { try { localStorage.setItem(SIZE_KEY, JSON.stringify(v)); } catch { /* not remembered */ } };

function applySize(panel: HTMLElement, v: Size) {
  panel.classList.toggle('fa-large', v === 'large');
  panel.classList.toggle('fa-sized', typeof v === 'object');
  panel.style.width = typeof v === 'object' ? `min(${v.w}px, calc(100vw - 24px))` : '';
  panel.style.height = typeof v === 'object' ? `min(${v.h}px, calc(100vh - 80px))` : '';
  const b = panel.querySelector<HTMLButtonElement>('.fa-size');
  if (b) { const big = v !== 'normal'; b.textContent = big ? '⤡' : '⤢'; b.setAttribute('aria-label', big ? 'Normal size' : 'Larger'); b.title = b.getAttribute('aria-label')!; b.setAttribute('aria-pressed', String(big)); }
}

/** Normal ⇄ larger (a dragged size counts as larger: the button goes back to normal). */
function sizeButton(panel: HTMLElement): HTMLButtonElement {
  const b = el('button', { type: 'button', class: 'fa-size' });
  b.addEventListener('click', () => { const v: Size = loadSize() === 'normal' ? 'large' : 'normal'; saveSize(v); applySize(panel, v); });
  queueMicrotask(() => applySize(panel, loadSize()));
  return b;
}

/** Drag the top-left corner (the box sits bottom right): wider to the left, taller upwards. */
function resizable(panel: HTMLElement, grip: HTMLElement) {
  grip.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    grip.setPointerCapture(e.pointerId);
    const r = panel.getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY, w: r.width, h: r.height };
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    let size = { w: start.w, h: start.h };
    const move = (ev: PointerEvent) => {
      size = { w: Math.round(clamp(start.w + start.x - ev.clientX, 300, window.innerWidth - 24)), h: Math.round(clamp(start.h + start.y - ev.clientY, 320, window.innerHeight - 80)) };
      applySize(panel, size);
    };
    const up = () => { grip.removeEventListener('pointermove', move); grip.removeEventListener('pointerup', up); grip.removeEventListener('pointercancel', up); saveSize(size); };
    grip.addEventListener('pointermove', move);
    grip.addEventListener('pointerup', up);
    grip.addEventListener('pointercancel', up);
  });
}

export function embed(script: HTMLScriptElement): void {
  const d = script.dataset;
  const site = d.site ?? '';
  const onPi = flag('from', 'pi', 'fwq-from-pi');
  const marker = document.querySelector<HTMLElement>('[data-fwq-assistant]');
  const own = marker?.dataset.fwqAssistant && EMBED_TEXTS[`${site}/${marker.dataset.fwqAssistant}`] ? marker.dataset.fwqAssistant : undefined;
  const context = own ?? ((onPi && d.contextPi) || d.context || '');
  const texts = EMBED_TEXTS[`${site}/${context}`];
  const isPublic = d.public === '1' || (own !== undefined && marker!.dataset.public === '1');
  if (!texts || !(isPublic || flag('assistant', '1', 'fwq-assistant'))) return;

  registerState(context, () => {
    const extra = (() => { try { return window.fwqAssistantState?.() ?? {}; } catch { return {}; } })();
    const device = onPi ? piDevice() : undefined;
    return { page: location.pathname, title: document.title.slice(0, 200), ...(device ? { device } : {}), ...extra };
  });

  const host = el('div', { id: 'fwq-assistant' });
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.append(el('style', {}, CSS));
  const root = el('section', {
    class: 'fwq-assist fa-float', 'aria-label': texts.title ?? '',
    'data-url': new URL(script.src).origin, 'data-site': site, 'data-context': context, 'data-locale': 'en',
  });
  const open = el('button', { type: 'button', class: 'fa-open', 'aria-expanded': 'false', 'aria-controls': 'fa-panel' }, `💬 ${texts.open}`);
  const panel = el('div', { class: 'fa-panel', id: 'fa-panel' });
  panel.hidden = true;
  const privacy = el('p', { class: 'fa-privacy' }, `${texts.privacy} `);
  privacy.append(el('a', { href: texts.privacyUrl, target: '_blank', rel: 'noopener' }, 'Privacy'));
  const form = el('form', { class: 'fa-ask' });
  form.append(
    el('label', { class: 'fa-sr', for: 'fa-q' }, 'Your question…'),
    el('textarea', { id: 'fa-q', rows: '2', maxlength: '1000', placeholder: 'Your question…' }),
    el('button', { type: 'submit' }, 'Ask'),
  );
  const head = el('div', { class: 'fa-head' });
  head.append(el('h3', {}, texts.title), sizeButton(panel));
  panel.append(el('span', { class: 'fa-grip', 'aria-hidden': 'true', title: 'Drag to resize' }), head,
    el('p', { class: 'fa-intro' }, texts.intro), privacy, el('div', { class: 'fa-log', 'aria-live': 'polite' }), form);
  resizable(panel, panel.querySelector<HTMLElement>('.fa-grip')!);
  root.append(open, panel);
  shadow.append(root);
  document.body.append(host);
  const { privacyUrl: _, ...t } = texts;
  const log = panel.querySelector<HTMLElement>('.fa-log')!;
  const input = form.querySelector('textarea')!;
  const ask = (q: string) => { input.value = q || 'Please change the draft: '; if (q) form.requestSubmit(); else input.focus(); };
  let resetChat = () => {};
  const hooks = context === 'tester'
    ? mountTester(panel, [log, form], new URL(script.src).origin, () => (onPi ? piDevice() : undefined), ask, () => resetChat())
    : undefined;
  resetChat = mountAssistant(root, { texts: t, events: EVENTS[site] ?? site, hooks }).reset;
}

const me = document.currentScript as HTMLScriptElement | null;
if (me) {
  if (document.body) embed(me);
  else document.addEventListener('DOMContentLoaded', () => embed(me));
}
