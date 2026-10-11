/**
 * The assistant chat widget: question in, streamed answer out, thumbs under each answer.
 * Markup comes from AssistantChat.astro; the live state from state.ts. Talks only to the
 * Worker in data-url (assistant/ in this repo), which holds the API key.
 */
import { ASSISTANT_TEXTS, type AssistantTexts } from './i18n';
import { isLocale } from '../qcoin/i18n';
import { readEvents, renderAnswer } from './render';
import { currentState } from './state';
import { getLevel, isLevel, setLevel, type Level } from '../level';

/** Question/answer pairs kept for follow-up questions (the Worker uses the last 5–10). */
const KEEP_TURNS = 10;

declare global {
  interface Window { umami?: { track: (name: string, data?: Record<string, string | number>) => void } }
}
const track = (name: string, data?: Record<string, string | number>) => { try { window.umami?.track(name, data); } catch { /* best effort */ } };

/**
 * `texts` overrides the game texts (other sites); `events` is the analytics prefix, as in
 * "<Site>: assistant ask" (family/EVENTS.md).
 */
export function mountAssistant(root: HTMLElement, opts: { texts?: Partial<AssistantTexts>; events?: string } = {}): void {
  const url = (root.dataset.url ?? '').replace(/\/$/, '');
  const site = root.dataset.site ?? 'fwq';
  const context = root.dataset.context ?? '';
  const lang = root.dataset.locale ?? 'en';
  const t: AssistantTexts = { ...ASSISTANT_TEXTS[isLocale(lang) ? lang : 'en'], ...opts.texts };
  const events = opts.events ?? 'Portal';
  const openBtn = root.querySelector<HTMLButtonElement>('.fa-open')!;
  const panel = root.querySelector<HTMLElement>('.fa-panel')!;
  const log = root.querySelector<HTMLElement>('.fa-log')!;
  const form = root.querySelector<HTMLFormElement>('form')!;
  const input = form.querySelector<HTMLTextAreaElement>('textarea')!;
  const send = form.querySelector<HTMLButtonElement>('button[type=submit]')!;

  // Only where the chat box has the level switch (the games); other sites send no level.
  const radios = root.querySelectorAll<HTMLInputElement>('.fa-level input');
  let level: Level | undefined = radios.length ? getLevel() : undefined;
  for (const r of radios) {
    r.checked = r.value === level;
    r.addEventListener('change', () => {
      if (!r.checked || !isLevel(r.value)) return;
      level = r.value;
      setLevel(level);
      track(`${events}: assistant level`, { context, level });
    });
  }

  const history: { role: 'user' | 'assistant'; content: string }[] = [];
  let busy: AbortController | null = null;

  openBtn.addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open;
    openBtn.setAttribute('aria-expanded', String(open));
    if (open) { input.focus(); track(`${events}: assistant open`, { context }); }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); }
  });

  function bubble(who: 'you' | 'bot', html: string): HTMLElement {
    const el = document.createElement('div');
    el.className = `fa-msg fa-${who}`;
    el.innerHTML = `<span class="fa-who">${who === 'you' ? t.you : t.explainer}</span><div class="fa-body">${html}</div>`;
    log.append(el);
    el.scrollIntoView({ block: 'nearest' });
    return el.querySelector<HTMLElement>('.fa-body')!;
  }

  /**
   * Keep the growing answer in view while it streams: inside the chat log, follow the end of
   * the answer until it no longer fits, then hold its first line at the top; on the page,
   * scroll down as far as needed to show it, but never past its start.
   */
  function follow(msg: HTMLElement) {
    const logBox = log.getBoundingClientRect();
    const box = msg.getBoundingClientRect();
    if (box.height <= log.clientHeight) log.scrollTop = log.scrollHeight;
    else log.scrollTop += box.top - logBox.top;
    if (root.classList.contains('fa-float')) return; // a floating box never scrolls the page
    const view = log.getBoundingClientRect();
    const below = Math.min(view.bottom, msg.getBoundingClientRect().bottom) + 12 - window.innerHeight;
    const roomAbove = msg.getBoundingClientRect().top - 12;
    if (below > 0 && roomAbove > 0) window.scrollBy({ top: Math.min(below, roomAbove) });
  }

  function feedback(after: HTMLElement, id: string) {
    const row = document.createElement('div');
    row.className = 'fa-vote';
    for (const [vote, label, icon] of [[1, t.helpful, '👍'], [-1, t.notHelpful, '👎']] as const) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = icon;
      b.setAttribute('aria-label', label);
      b.title = label;
      b.addEventListener('click', () => {
        row.textContent = t.thanks;
        track(`${events}: assistant vote`, { context, vote: vote === 1 ? 'up' : 'down' });
        fetch(`${url}/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, vote }) }).catch(() => {});
      });
      row.append(b);
    }
    after.after(row);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    busy?.abort();
    const ctrl = new AbortController();
    busy = ctrl;
    input.value = '';
    send.disabled = true;
    bubble('you', renderAnswer(question));
    const body = bubble('bot', `<p class="fa-thinking">${t.thinking}</p>`);
    track(`${events}: assistant ask`, level ? { context, level } : { context });
    let answer = '';
    const fail = (msg: string) => { body.innerHTML = `<p class="fa-error">${msg}</p>`; };
    try {
      const res = await fetch(`${url}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site, context, locale: lang, level, question, state: currentState(context), history: history.slice(-2 * KEEP_TURNS) }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        fail(res.status === 429 ? t.errRate : res.status === 503 ? t.errBusy : t.errNetwork);
        return;
      }
      for await (const { event, data } of readEvents(res.body)) {
        if (event === 'delta') { answer += data.t; body.innerHTML = renderAnswer(answer); follow(body.parentElement!); }
        else if (event === 'done') {
          history.push({ role: 'user', content: question }, { role: 'assistant', content: answer });
          if (typeof data.id === 'string') feedback(body.parentElement!, data.id);
          follow(body.parentElement!);
        } else if (event === 'error') fail(t.errNetwork);
      }
    } catch (err) {
      if (!ctrl.signal.aborted) fail(t.errNetwork);
    } finally {
      if (busy === ctrl) { busy = null; send.disabled = false; }
    }
  });
}
