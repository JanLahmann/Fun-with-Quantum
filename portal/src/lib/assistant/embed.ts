/**
 * The chat widget for sites outside this portal (rasqberry.org): one script tag, served by the
 * assistant Worker as /widget.js (built from this file, see assistant/package.json "widget").
 *
 *   <script src="https://fwq-assistant.jan-35c.workers.dev/widget.js" defer
 *           data-site="rasqberry" data-context="build" data-context-pi="device"></script>
 *
 * data-context-pi: the context to use when the page was opened on a RasQberry (?from=pi, kept for
 * the browser tab); its start URL may add v=<image build>, model=pi4|pi5 and led=<LED layout>. data-public="1" shows it to everyone; until then only with ?assistant=1.
 * The page may define window.fwqAssistantState() to add to the state sent along (page + title).
 * The box floats bottom right in a shadow root, so the site's CSS and ours stay apart.
 */
import type { AssistantTexts } from './i18n';
import { registerState } from './state';
import { mountAssistant } from './widget';

declare global {
  interface Window { fwqAssistantState?: () => Record<string, unknown> }
}

interface EmbedTexts extends Partial<AssistantTexts> { privacyUrl: string }

const HELPER_ERRORS = {
  errRate: 'That was a lot of questions — please wait a minute (or until tomorrow) and ask again.',
  errBusy: 'The helper has answered all it can for today. Please try again tomorrow.',
  errNetwork: 'The helper couldn’t be reached. Please check the internet connection and try again.',
};

const RASQBERRY_PRIVACY =
  'Your questions and the page you are on are sent to Anthropic (Claude) to answer, and stored for 30 days to improve the helper. Please don’t enter personal data.';

/** Texts per site/context (English only for now). */
export const EMBED_TEXTS: Record<string, EmbedTexts> = {
  'rasqberry/build': {
    open: 'Ask the RasQberry helper',
    title: 'Ask about building a RasQberry',
    intro: 'Questions about parts, 3D printing, LEDs, installing the image or troubleshooting — for example “Which Raspberry Pi do I need?”',
    privacy: RASQBERRY_PRIVACY,
    explainer: 'Helper',
    ...HELPER_ERRORS,
    privacyUrl: 'https://fun-with-quantum.org/about/#privacy',
  },
  'rasqberry/device': {
    open: 'Ask the RasQberry helper',
    title: 'Ask about your RasQberry',
    intro: 'Questions about the demos and games on this RasQberry, how to start them or what they show — for example “Which demo should I try first?”',
    privacy: RASQBERRY_PRIVACY,
    explainer: 'Helper',
    ...HELPER_ERRORS,
    privacyUrl: 'https://fun-with-quantum.org/about/#privacy',
  },
};

const EVENTS: Record<string, string> = { rasqberry: 'RasQberry Two' };

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
  border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,.25); padding: 14px 16px 16px; box-sizing: border-box; }
.fa-panel[hidden] { display: none; }
h3 { font-size: 1.02rem; margin: 0 0 4px; }
.fa-intro { font-size: 0.9rem; margin: 0 0 6px; }
.fa-privacy { color: var(--muted); font-size: 0.76rem; margin: 0 0 10px; }
a { color: var(--c); }
.fa-log { display: flex; flex-direction: column; gap: 10px; max-height: 340px; overflow-y: auto; margin-bottom: 10px; }
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
.fa-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  return e;
}

/**
 * The Pi's facts from its start URL (?from=pi&v=<image build>&model=pi4|pi5&led=<layout>),
 * kept for the tab like the flags above. The Worker validates them.
 */
function piDevice(): Record<string, string> | undefined {
  const q = new URLSearchParams(location.search);
  const fresh = Object.fromEntries((['v', 'model', 'led'] as const).flatMap((k) => (q.get(k) ? [[k === 'v' ? 'version' : k, q.get(k)!.slice(0, 60)]] : [])));
  try {
    if (Object.keys(fresh).length) sessionStorage.setItem('fwq-pi-device', JSON.stringify(fresh));
    return JSON.parse(sessionStorage.getItem('fwq-pi-device') ?? 'null') ?? undefined;
  } catch {
    return Object.keys(fresh).length ? fresh : undefined;
  }
}

export function embed(script: HTMLScriptElement): void {
  const d = script.dataset;
  const site = d.site ?? '';
  const onPi = flag('from', 'pi', 'fwq-from-pi');
  const context = (onPi && d.contextPi) || d.context || '';
  const texts = EMBED_TEXTS[`${site}/${context}`];
  if (!texts || !(d.public === '1' || flag('assistant', '1', 'fwq-assistant'))) return;

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
  const form = el('form');
  form.append(
    el('label', { class: 'fa-sr', for: 'fa-q' }, 'Your question…'),
    el('textarea', { id: 'fa-q', rows: '2', maxlength: '1000', placeholder: 'Your question…' }),
    el('button', { type: 'submit' }, 'Ask'),
  );
  panel.append(el('h3', {}, texts.title), el('p', { class: 'fa-intro' }, texts.intro), privacy, el('div', { class: 'fa-log', 'aria-live': 'polite' }), form);
  root.append(open, panel);
  shadow.append(root);
  document.body.append(host);
  const { privacyUrl: _, ...t } = texts;
  mountAssistant(root, { texts: t, events: EVENTS[site] ?? site });
}

const me = document.currentScript as HTMLScriptElement | null;
if (me) {
  if (document.body) embed(me);
  else document.addEventListener('DOMContentLoaded', () => embed(me));
}
