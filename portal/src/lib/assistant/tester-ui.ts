/**
 * The RasQberry tester helper's own UI around the chat (rasqberry.org/testing/, context
 * rasqberry/tester): sign-in with a tester name and the shared passphrase, the "My setup" form,
 * and the cards the helper's answers turn into. Nothing is saved by the model: mission states,
 * the setup and findings are stored only by the tester's clicks here (assistant/src/tester.ts).
 *
 * In an answer, a line `MISSION: <id>` becomes a mission card (Start / Done / Skip), and a line
 * `FINDING: {json}` a finding draft with a Save button.
 */
import type { ChatHooks } from './widget';

interface CatalogueEntry { id: string; title: string; goal: string; group: string; beta: boolean }
interface Me { preferences: Record<string, unknown>; missions: Record<string, string>; catalogue: CatalogueEntry[]; needs: Record<string, string> }

const KEY = 'rqb-tester';
const LINE = /^(MISSION|FINDING):\s*(.*)$/;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  return e;
}

/** The answer without the card lines, also while a card line is still streaming in. */
export function visibleText(answer: string): string {
  const lines = answer.split('\n');
  const last = lines.at(-1) ?? '';
  if (/^(M|MI|MIS|MISS|MISSI|MISSIO|MISSION|F|FI|FIN|FIND|FINDI|FINDIN|FINDING)$/.test(last.trim())) lines.pop();
  return lines.filter((l) => !LINE.test(l.trim())).join('\n').replace(/\n{3,}/g, '\n\n');
}

/** The card lines of a complete answer, in order. Findings must be valid JSON objects with a kind and a title. */
export function cardLines(answer: string): ({ kind: 'mission'; id: string } | { kind: 'finding'; finding: Record<string, unknown> })[] {
  const out: ({ kind: 'mission'; id: string } | { kind: 'finding'; finding: Record<string, unknown> })[] = [];
  for (const raw of answer.split('\n')) {
    const m = LINE.exec(raw.trim());
    if (!m) continue;
    if (m[1] === 'MISSION' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(m[2].trim())) out.push({ kind: 'mission', id: m[2].trim() });
    if (m[1] === 'FINDING') {
      try {
        const f = JSON.parse(m[2]);
        if (f && typeof f === 'object' && !Array.isArray(f) && typeof f.title === 'string' && typeof f.kind === 'string') out.push({ kind: 'finding', finding: f });
      } catch { /* not a draft */ }
    }
  }
  return out;
}

const store = {
  get(): { tester: string; pass: string } | null {
    try { const v = JSON.parse(localStorage.getItem(KEY) ?? 'null'); return v && typeof v.tester === 'string' && typeof v.pass === 'string' ? v : null; } catch { return null; }
  },
  set(v: { tester: string; pass: string } | null) {
    try { if (v) localStorage.setItem(KEY, JSON.stringify(v)); else localStorage.removeItem(KEY); } catch { /* private mode: sign in again next time */ }
  },
};

const KIND_LABEL: Record<string, string> = { bug: 'Bug', docs: 'Documentation', confusing: 'Confusing', idea: 'Idea', praise: 'Worked well' };

/**
 * Builds the sign-in and setup views into `panel` (before the chat log) and returns the hooks
 * for mountAssistant. `chat` is the log + question form, shown only once signed in.
 */
export function mountTester(panel: HTMLElement, chat: HTMLElement[], url: string, device: () => Record<string, string> | undefined, ask: (q: string) => void): ChatHooks {
  let creds = store.get();
  let me: Me | null = null;
  const missionState: Record<string, string> = {};

  const status = el('p', { class: 'fa-tester-bar' });
  const signin = el('form', { class: 'fa-signin' });
  const setup = el('form', { class: 'fa-setup' });
  panel.insertBefore(status, chat[0]);
  panel.insertBefore(signin, chat[0]);
  panel.insertBefore(setup, chat[0]);

  const post = async (path: string, body: Record<string, unknown>) => fetch(`${url}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Tester-Pass': creds?.pass ?? '' },
    body: JSON.stringify({ site: 'rasqberry', tester: creds?.tester, ...body }),
  });

  function show(view: 'signin' | 'setup' | 'chat') {
    signin.hidden = view !== 'signin';
    setup.hidden = view !== 'setup';
    for (const c of chat) c.hidden = view !== 'chat';
    status.hidden = view === 'signin';
    // Signed in: the long intro and privacy note give way to the chat (the bar links the privacy note).
    panel.classList.toggle('fa-signed-in', view !== 'signin');
  }

  // --- sign-in ---
  const nameIn = el('input', { id: 'fa-tname', autocomplete: 'nickname', maxlength: '30', required: '', pattern: '[A-Za-z0-9 _.\\-]{3,30}' });
  const passIn = el('input', { id: 'fa-tpass', type: 'password', autocomplete: 'off', required: '' });
  const signMsg = el('p', { class: 'fa-error', 'aria-live': 'polite' });
  signin.append(
    el('label', { for: 'fa-tname' }, 'Your tester name or ID (3–30 letters or digits, no e-mail address)'), nameIn,
    el('label', { for: 'fa-tpass' }, 'Tester passphrase'), passIn,
    el('button', { type: 'submit' }, 'Start testing'), signMsg,
  );
  signin.addEventListener('submit', async (e) => {
    e.preventDefault();
    creds = { tester: nameIn.value.trim(), pass: passIn.value };
    signMsg.textContent = '';
    await load(true);
  });

  async function load(fresh: boolean) {
    let res: Response;
    try { res = await post('/tester/me', {}); } catch { signMsg.textContent = 'The helper couldn’t be reached. Please check the internet connection.'; show('signin'); return; }
    if (res.status === 401 || !res.ok) {
      signMsg.textContent = res.status === 401
        ? 'That didn’t work: please check the passphrase, and use 3–30 letters, digits, spaces, _ . or - for your name.'
        : 'Something went wrong. Please try again in a minute.';
      if (!fresh) store.set(null);
      show('signin');
      return;
    }
    me = (await res.json()) as Me;
    Object.assign(missionState, me.missions);
    store.set(creds);
    status.textContent = '';
    status.append(`Tester: ${creds!.tester} · `);
    const setupBtn = el('button', { type: 'button', class: 'fa-link' }, 'My setup');
    setupBtn.addEventListener('click', () => { fillSetup(); show('setup'); });
    const out = el('button', { type: 'button', class: 'fa-link' }, 'Sign out');
    out.addEventListener('click', () => { store.set(null); creds = null; nameIn.value = ''; passIn.value = ''; show('signin'); });
    status.append(setupBtn, ' · ', out, ' · ', el('a', { href: 'https://rasqberry.org/testing/#privacy', target: '_blank', rel: 'noopener' }, 'Privacy'));
    if (!Object.keys(me.preferences).length) { fillSetup(); show('setup'); } else show('chat');
  }

  // --- "My setup" ---
  const radio = (name: string, value: string, label: string) => {
    const l = el('label', { class: 'fa-choice' });
    l.append(el('input', { type: 'radio', name, value }), ` ${label}`);
    return l;
  };
  const box = (name: string, label: string) => {
    const l = el('label', { class: 'fa-choice' });
    l.append(el('input', { type: 'checkbox', name }), ` ${label}`);
    return l;
  };
  const group = (legend: string, ...items: HTMLElement[]) => {
    const f = el('fieldset');
    f.append(el('legend', {}, legend), ...items);
    return f;
  };
  const kit = el('input', { name: 'led-kit', maxlength: '60', placeholder: 'which LED kit (optional)', 'aria-label': 'Which LED kit' });
  setup.append(
    el('p', { class: 'fa-setup-intro' }, 'Your setup decides which missions fit. You can change it any time.'),
    group('Raspberry Pi', radio('pi', 'pi4', 'Pi 4'), radio('pi', 'pi5', 'Pi 5')),
    group('Image', radio('image', 'ab', 'A/B image'), radio('image', 'single', 'single-system image'), radio('image', 'unsure', 'not sure')),
    group('Hardware', box('led-panel', 'LED panel'), kit, box('display', 'screen'), box('touchscreen', 'touchscreen'),
      box('bluetooth-speaker', 'Bluetooth speaker'), box('camera', 'camera')),
    group('Accounts and network', box('ibm-account', 'IBM Quantum account'), box('internet', 'internet at hand')),
    group('Interests', box('i-games', 'games'), box('i-leds', 'LEDs'), box('i-coding', 'coding'), box('i-big', 'big demos')),
    el('button', { type: 'submit' }, 'Save my setup'),
  );
  const setupMsg = el('p', { class: 'fa-error', 'aria-live': 'polite' });
  setup.append(setupMsg);

  function fillSetup() {
    const p = me?.preferences ?? {};
    for (const i of setup.querySelectorAll<HTMLInputElement>('input')) {
      if (i.type === 'radio') i.checked = p[i.name] === i.value;
      else if (i.type === 'checkbox') i.checked = i.name.startsWith('i-') ? Array.isArray(p.interests) && p.interests.includes(i.name.slice(2)) : p[i.name] === true;
      else if (i.name === 'led-kit') i.value = typeof p['led-kit'] === 'string' ? p['led-kit'] : '';
    }
  }

  setup.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prefs: Record<string, unknown> = { interests: [] as string[] };
    for (const i of setup.querySelectorAll<HTMLInputElement>('input')) {
      if (i.type === 'radio' && i.checked) prefs[i.name] = i.value;
      else if (i.type === 'checkbox' && i.name.startsWith('i-')) { if (i.checked) (prefs.interests as string[]).push(i.name.slice(2)); }
      else if (i.type === 'checkbox') prefs[i.name] = i.checked;
      else if (i.name === 'led-kit' && i.value.trim()) prefs['led-kit'] = i.value.trim();
    }
    const res = await post('/tester/prefs', { preferences: prefs }).catch(() => null);
    if (!res?.ok) { setupMsg.textContent = 'Couldn’t save your setup. Please try again.'; return; }
    const first = !Object.keys(me?.preferences ?? {}).length;
    if (me) me.preferences = prefs;
    setupMsg.textContent = '';
    show('chat');
    if (first) ask('Hi! What should I test first?');
  });

  // --- cards ---
  function missionCard(id: string): HTMLElement | null {
    const m = me?.catalogue.find((x) => x.id === id);
    if (!m) return null;
    const card = el('div', { class: 'fa-card' });
    card.append(el('strong', {}, m.title), el('p', {}, m.goal), el('p', { class: 'fa-meta' }, `${m.group}${m.beta ? ' · early beta, not yet tested by people' : ''}`));
    const row = el('div', { class: 'fa-actions' });
    const note = el('span', { class: 'fa-meta', 'aria-live': 'polite' });
    for (const [state, label] of [['started', 'Start'], ['done', 'Done'], ['skipped', 'Skip']] as const) {
      const b = el('button', { type: 'button', 'aria-pressed': String(missionState[id] === state) }, label);
      b.addEventListener('click', async () => {
        const res = await post('/tester/status', { mission_id: id, state }).catch(() => null);
        if (!res?.ok) { note.textContent = 'Not saved — please try again.'; return; }
        missionState[id] = state;
        for (const x of row.querySelectorAll('button')) x.setAttribute('aria-pressed', String(x === b));
        note.textContent = state === 'started' ? 'Started — good luck! Tell me how it went.' : state === 'done' ? 'Marked as done. How did it go?' : 'Skipped.';
      });
      row.append(b);
    }
    row.append(note);
    card.append(row);
    return card;
  }

  function findingCard(f: Record<string, unknown>, messageId: string | undefined): HTMLElement {
    const card = el('div', { class: 'fa-card fa-finding' });
    const kind = KIND_LABEL[String(f.kind)] ?? String(f.kind);
    card.append(el('p', { class: 'fa-meta' }, `Draft finding · ${kind}${f.severity ? ` · ${String(f.severity)}` : ''}${f.mission_id ? ` · ${String(f.mission_id)}` : ''}`), el('strong', {}, String(f.title)));
    for (const [k, label] of [['expected', 'Expected'], ['actual', 'What happened'], ['steps', 'Steps']] as const) {
      if (typeof f[k] === 'string' && f[k]) { const p = el('p'); p.append(el('em', {}, `${label}: `), String(f[k])); card.append(p); }
    }
    const row = el('div', { class: 'fa-actions' });
    const note = el('span', { class: 'fa-meta', 'aria-live': 'polite' });
    const save = el('button', { type: 'button' }, 'Save');
    const change = el('button', { type: 'button' }, 'Change something');
    save.addEventListener('click', async () => {
      save.disabled = true;
      const dev = device();
      const res = await post('/tester/finding', { finding: { ...f, image_version: dev?.version, pi_model: dev?.model, message_ids: messageId ? [messageId] : [] } }).catch(() => null);
      if (!res?.ok) { save.disabled = false; note.textContent = 'Not saved — please try again.'; return; }
      change.remove();
      save.textContent = 'Saved ✓';
      note.textContent = 'Thank you!';
    });
    change.addEventListener('click', () => ask(''));
    row.append(save, change, note);
    card.append(row);
    return card;
  }

  if (creds) load(false); else show('signin');

  return {
    headers: () => ({ 'X-Tester-Pass': creds?.pass ?? '' }),
    body: () => ({ tester: creds?.tester }),
    visible: visibleText,
    decorate: (msg, answer, id) => {
      for (const c of cardLines(answer)) {
        const card = c.kind === 'mission' ? missionCard(c.id) : findingCard(c.finding, id);
        if (card) msg.append(card);
      }
    },
    unauthorized: () => { store.set(null); signMsg.textContent = 'Please sign in again.'; show('signin'); },
  };
}
