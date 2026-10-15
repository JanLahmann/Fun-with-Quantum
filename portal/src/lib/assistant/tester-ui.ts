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
/** A card line; tolerates a bullet, quote, bold or backticks around it. */
const LINE = /^[-*>\s`]*(?:\*\*)?(MISSION|FINDING):(?:\*\*)?\s*(.*?)[\s`]*$/;

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
  if (/^[-*>\s`]*(?:\*\*?)?(M|MI|MIS|MISS|MISSI|MISSIO|MISSION|F|FI|FIN|FIND|FINDI|FINDIN|FINDING)$/.test(last.trim())) lines.pop();
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
export function mountTester(panel: HTMLElement, chat: HTMLElement[], url: string, device: () => Record<string, string> | undefined,
  ask: (q: string) => void, resetChat: () => void): ChatHooks {
  let creds = store.get();
  let me: Me | null = null;
  const missionState: Record<string, string> = {};
  /** Another tester may sign in on this browser: drop everything of the previous one. */
  const signOut = (message = '') => {
    store.set(null); creds = null; me = null;
    for (const k of Object.keys(missionState)) delete missionState[k];
    resetChat();
    nameIn.value = ''; passIn.value = ''; signMsg.textContent = message;
    show('signin');
  };

  const status = el('p', { class: 'fa-tester-bar' });
  const signin = el('form', { class: 'fa-signin' });
  const setup = el('form', { class: 'fa-setup' });
  const mine = el('div', { class: 'fa-mine' });
  panel.insertBefore(status, chat[0]);
  panel.insertBefore(mine, chat[0]);
  panel.insertBefore(signin, chat[0]);
  panel.insertBefore(setup, chat[0]);

  const post = async (path: string, body: Record<string, unknown>) => fetch(`${url}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Tester-Pass': creds?.pass ?? '' },
    body: JSON.stringify({ site: 'rasqberry', tester: creds?.tester, ...body }),
  });

  function show(view: 'signin' | 'setup' | 'mine' | 'chat') {
    signin.hidden = view !== 'signin';
    setup.hidden = view !== 'setup';
    mine.hidden = view !== 'mine';
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
    el('label', { for: 'fa-tname' }, 'Tester name: any name or ID you like, not your real name, no e-mail address (3–30 letters or digits)'), nameIn,
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
    try { res = await post('/tester/me', {}); } catch { signMsg.textContent = 'Ket couldn’t be reached. Please check the internet connection.'; show('signin'); return; }
    if (res.status === 401) {
      if (!fresh) store.set(null); // only a refused sign-in forgets the saved one
      signMsg.textContent = 'That didn’t work: please check the passphrase, and use 3–30 letters, digits, spaces, _ . or - for your name.';
      show('signin');
      return;
    }
    if (!res.ok) { signMsg.textContent = 'Something went wrong. Please try again in a minute.'; show('signin'); return; }
    me = (await res.json()) as Me;
    Object.assign(missionState, me.missions);
    store.set(creds);
    status.textContent = '';
    status.append(`Tester: ${creds!.tester} · `);
    const setupBtn = el('button', { type: 'button', class: 'fa-link' }, 'My setup');
    setupBtn.addEventListener('click', () => { fillSetup(); show('setup'); });
    const out = el('button', { type: 'button', class: 'fa-link' }, 'Sign out');
    out.addEventListener('click', () => signOut());
    const mineBtn = el('button', { type: 'button', class: 'fa-link' }, 'My missions');
    mineBtn.addEventListener('click', () => { fillMine(); show('mine'); });
    status.append(setupBtn, ' · ', mineBtn, ' · ', out, ' · ', el('a', { href: 'https://rasqberry.org/testing/#privacy', target: '_blank', rel: 'noopener' }, 'Privacy'));
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
  // Cancel only when editing a saved setup ("My setup"); the first-time form has Save only.
  const setupButtons = el('div', { class: 'fa-actions' });
  const cancelSetup = el('button', { type: 'button', class: 'fa-secondary' }, 'Cancel');
  cancelSetup.addEventListener('click', () => { setupMsg.textContent = ''; show('chat'); });
  setupButtons.append(el('button', { type: 'submit' }, 'Save my setup'), cancelSetup);
  const kit = el('span', { class: 'fa-kit' });
  kit.append('kit:', radio('led-kit', 'single', 'single'), radio('led-kit', 'quad', 'quad'), radio('led-kit', 'other', 'other'));
  setup.append(
    el('p', { class: 'fa-setup-intro' }, 'Your setup decides which missions fit. You can change it any time.'),
    group('Raspberry Pi', radio('pi', 'pi4', 'Pi 4'), radio('pi', 'pi5', 'Pi 5')),
    group('Image', radio('image', 'ab', 'A/B image'), radio('image', 'single', 'single-system image'), radio('image', 'unsure', 'not sure')),
    group('Hardware', box('led-panel', 'LED panel'), kit, box('display', 'screen'), box('touchscreen', 'touchscreen'),
      box('bluetooth-speaker', 'Bluetooth speaker'), box('camera', 'camera')),
    group('Accounts and network', box('ibm-account', 'IBM Quantum account'), box('offline', 'offline system (no internet)')),
    group('Interests', box('i-core', 'core RasQberry'), box('i-games', 'games'), box('i-leds', 'LEDs'), box('i-coding', 'coding'), box('i-big', 'big demos')),
    setupButtons,
  );
  const setupMsg = el('p', { class: 'fa-error', 'aria-live': 'polite' });
  setup.append(setupMsg);

  function fillSetup() {
    const p = me?.preferences ?? {};
    cancelSetup.hidden = !Object.keys(p).length;
    for (const i of setup.querySelectorAll<HTMLInputElement>('input')) {
      if (i.type === 'radio') i.checked = p[i.name] === i.value;
      else if (i.type === 'checkbox') i.checked = i.name.startsWith('i-') ? Array.isArray(p.interests) && p.interests.includes(i.name.slice(2)) : p[i.name] === true;
    }
  }

  setup.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prefs: Record<string, unknown> = { interests: [] as string[] };
    for (const i of setup.querySelectorAll<HTMLInputElement>('input')) {
      if (i.type === 'radio' && i.checked) prefs[i.name] = i.value;
      else if (i.type === 'checkbox' && i.name.startsWith('i-')) { if (i.checked) (prefs.interests as string[]).push(i.name.slice(2)); }
      else if (i.type === 'checkbox') prefs[i.name] = i.checked;
    }
    const res = await post('/tester/prefs', { preferences: prefs }).catch(() => null);
    if (!res?.ok) { setupMsg.textContent = 'Couldn’t save your setup. Please try again.'; return; }
    const first = !Object.keys(me?.preferences ?? {}).length;
    if (me) me.preferences = prefs;
    setupMsg.textContent = '';
    show('chat');
    if (first) ask('Hi! What should I test first?');
  });

  // --- "My missions": each state can be undone, or all reset (findings stay) ---
  const STATE_LABEL: Record<string, string> = { started: 'working on it', done: 'done', skipped: 'skipped' };
  function fillMine() {
    mine.replaceChildren(el('p', { class: 'fa-setup-intro' }, 'Your missions. Undo makes a mission new again; your findings stay.'));
    const ids = Object.keys(missionState).filter((id) => missionState[id] in STATE_LABEL);
    const list = el('ul', { class: 'fa-mine-list' });
    for (const id of ids) {
      const li = el('li');
      li.append(el('span', {}, `${me?.catalogue.find((m) => m.id === id)?.title ?? id} — ${STATE_LABEL[missionState[id]]} `));
      const undo = el('button', { type: 'button', class: 'fa-link' }, 'Undo');
      undo.addEventListener('click', async () => {
        const res = await post('/tester/status', { mission_id: id, state: 'open' }).catch(() => null);
        if (!res?.ok) { undo.textContent = 'Undo (failed, try again)'; return; }
        delete missionState[id];
        for (const x of panel.querySelectorAll<HTMLButtonElement>(`button[data-mission="${id}"]`)) x.setAttribute('aria-pressed', 'false');
        li.remove();
      });
      li.append(undo);
      list.append(li);
    }
    if (!ids.length) mine.append(el('p', {}, 'No missions yet.'));
    else mine.append(list);
    const row = el('div', { class: 'fa-actions' });
    const back = el('button', { type: 'button' }, 'Back to the chat');
    back.addEventListener('click', () => show('chat'));
    row.append(back);
    if (ids.length) {
      const reset = el('button', { type: 'button' }, 'Reset all missions');
      let armed = false;
      reset.addEventListener('click', async () => {
        if (!armed) { armed = true; reset.textContent = 'Really reset all? Click again'; return; }
        const res = await post('/tester/reset', {}).catch(() => null);
        if (!res?.ok) { reset.textContent = 'Reset failed — try again'; armed = false; return; }
        for (const k of Object.keys(missionState)) delete missionState[k];
        for (const x of panel.querySelectorAll<HTMLButtonElement>('button[data-mission]')) x.setAttribute('aria-pressed', 'false');
        fillMine();
      });
      row.append(reset);
    }
    mine.append(row);
  }

  // --- cards ---
  function missionCard(id: string, help: boolean): HTMLElement | null {
    const m = me?.catalogue.find((x) => x.id === id);
    if (!m) return null;
    const card = el('div', { class: 'fa-card' });
    card.append(el('strong', {}, m.title), el('p', {}, m.goal), el('p', { class: 'fa-meta' }, `${m.group}${m.beta ? ' · early beta, not yet tested by people' : ''}`));
    if (help) card.append(el('p', { class: 'fa-meta' }, 'Start: you’re working on it now · Done: you finished it, then tell me how it went · Skip: not for you, it won’t be suggested again'));
    const row = el('div', { class: 'fa-actions' });
    const note = el('span', { class: 'fa-meta', 'aria-live': 'polite' });
    for (const [state, label] of [['started', 'Start'], ['done', 'Done'], ['skipped', 'Skip']] as const) {
      const b = el('button', { type: 'button', 'aria-pressed': String(missionState[id] === state), 'data-mission': id, 'data-state': state }, label);
      b.addEventListener('click', async () => {
        for (const x of row.querySelectorAll('button')) x.disabled = true;
        const res = await post('/tester/status', { mission_id: id, state }).catch(() => null);
        for (const x of row.querySelectorAll('button')) x.disabled = false;
        if (!res?.ok) { note.textContent = 'Not saved — please try again.'; return; }
        missionState[id] = state;
        // Every card of this mission (it may be suggested again later) shows the new state.
        for (const x of panel.querySelectorAll<HTMLButtonElement>(`button[data-mission="${id}"]`)) x.setAttribute('aria-pressed', String(x.dataset.state === state));
        note.textContent = state === 'started' ? 'Started — good luck! Tell me how it went.' : state === 'done' ? 'Marked as done.' : 'Skipped.';
        // Done and Skip continue the conversation, as the helper promised; Start leaves the tester to it.
        if (state === 'done') ask(`I'm done with “${m.title}”.`);
        if (state === 'skipped') ask(`I skipped “${m.title}”.`);
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
    card.append(el('p', { class: 'fa-meta' }, `Draft finding · ${kind}${['blocker', 'major', 'minor'].includes(String(f.severity)) ? ` · ${String(f.severity)}` : ''}${f.mission_id ? ` · ${String(f.mission_id)}` : ''}`), el('strong', {}, String(f.title)));
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
      ask(`I saved the finding “${String(f.title)}”.`);
    });
    change.addEventListener('click', () => ask(''));
    row.append(save, change, note);
    card.append(row);
    return card;
  }

  show('signin');
  if (creds) { signin.hidden = true; load(false); }

  return {
    headers: () => ({ 'X-Tester-Pass': creds?.pass ?? '' }),
    body: () => ({ tester: creds?.tester }),
    visible: visibleText,
    decorate: (msg, answer, id) => {
      let first = true;
      for (const c of cardLines(answer)) {
        const card = c.kind === 'mission' ? missionCard(c.id, first) : findingCard(c.finding, id);
        if (c.kind === 'mission' && card) first = false;
        if (card) msg.append(card);
      }
    },
    unauthorized: () => signOut('Please sign in again.'),
  };
}
