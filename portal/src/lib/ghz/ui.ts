/**
 * Browser side of the GHZ game (markup: components/GhzGame.astro).
 *
 *   1  Team classical — pick an object per player, ask all four questions: at most 3 of 4.
 *   2  Team quantum   — a shared GHZ state, X for color, Y for shape: every round won.
 *   3  How it works   — the GHZ state, exact answer statistics, why the proof fails.
 */
import { mountShell, track, type Shell } from '../games/shell';
import { circuitSvg } from '../games/circuit';
import { probabilities, run } from '../qsim';
import {
  GHZ, QUESTIONS, THINGS, bestClassical, classicalAnswer, classicalScore, gameOps, gameSteps,
  playQuantum, randomQuestion, wins, type Ask, type Question, type Thing,
} from './game';
import { CH1, CH2, CH3, TERMS, UI, questionLabel, said, verdict } from './messages';

type Mode = 'edit' | 'pick' | 'hist' | 'off';

const STAR = 'M24 4 L29.6 17.4 L44 18.6 L33 28 L36.4 42 L24 34.6 L11.6 42 L15 28 L4 18.6 L18.4 17.4 Z';

/** An object, an answer or a question mark: color and/or shape (null = not known). */
function thingSvg(color: 0 | 1 | null, shape: 0 | 1 | null): string {
  const paint = color === null ? 'class="outline"' : `class="${color ? 'red' : 'blue'}"`;
  let body: string;
  if (shape === null) body = color === null ? '<text x="24" y="32" text-anchor="middle">?</text>' : `<circle ${paint} cx="24" cy="24" r="16"/>`;
  else if (shape) body = `<path ${paint} d="${STAR}"/>`;
  else body = `<rect ${paint} x="7" y="13" width="34" height="22" rx="3"/>`;
  return `<svg viewBox="0 0 48 48" width="56" height="56" aria-hidden="true">${body}</svg>`;
}

export function mountGhzGame(root: HTMLElement) {
  const board = root.querySelector<HTMLElement>('.gz-board')!;
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('.gz-questions button'));
  const players = Array.from(root.querySelectorAll<HTMLElement>('.gz-player'));
  const verdictEl = root.querySelector<HTMLElement>('.gz-verdict')!;
  const table = root.querySelector<HTMLElement>('.gz-table')!;
  const hist = root.querySelector<HTMLElement>('.gz-hist')!;

  let mode: Mode = 'off';
  const team: Thing[] = [THINGS[3], THINGS[3], THINGS[3]]; // blue rectangles: wins 1 of 4 — room to improve
  let pickQ: ((q: number) => void) | null = null;

  const setMode = (m: Mode) => { mode = m; board.dataset.mode = m; };
  const markChip = (i: number | null) => chips.forEach((c, k) => c.setAttribute('aria-pressed', String(k === i)));

  /** Show each player: their question (if any) and their object or answer. */
  function paintPlayers(view: { ask?: (Ask | null)[]; color?: (0 | 1 | null)[]; shape?: (0 | 1 | null)[]; words?: string[] }) {
    players.forEach((p, i) => {
      const a = view.ask?.[i] ?? null;
      p.querySelector('.ask')!.textContent = a === 'C' ? UI.color : a === 'S' ? UI.shape : '';
      p.querySelector('.thing')!.innerHTML = thingSvg(view.color?.[i] ?? null, view.shape?.[i] ?? null);
      p.querySelector('.said')!.textContent = view.words?.[i] ?? '';
      p.querySelector<HTMLButtonElement>('.thing')!.disabled = mode !== 'edit';
    });
  }
  const paintTeam = () => paintPlayers({
    color: team.map((t) => t.color), shape: team.map((t) => t.shape),
    words: team.map((t) => `${t.color ? UI.red : UI.blue} ${t.shape ? UI.star : UI.rectangle}`),
  });

  function paintHist(q: Question | null) {
    const p = probabilities(run(3, q ? gameOps(q) : GHZ));
    const bars: string[] = [];
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let y = 0; y < 2; y++) {
      const pi = p[a + 2 * b + 4 * y];
      const cls = q && pi > 1e-9 ? (wins(q, [a, b, y]) ? 'win' : 'lose') : '';
      bars.push(`<div class="bar"><span class="pct">${pi > 1e-9 ? `${Math.round(pi * 100)}%` : ''}</span><span class="track"><i class="fill ${cls}" style="height:${(pi * 100).toFixed(1)}%"></i></span><span class="lbl">${a}${b}${y}</span></div>`);
    }
    hist.innerHTML = `<div class="bars" role="img" aria-label="${UI.histLabel}">${bars.join('')}</div>
      <p class="cap">${q ? questionLabel(q) : UI.zBasis} — ${UI.players.join(' · ')}</p>`;
  }
  const zSteps = () => [...GHZ.map((o) => ({ ...o, tone: 'prep' })), { g: 'barrier' as const }, { g: 'measure' as const }];

  /* ---- stage clicks ---- */
  board.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;
    const thing = t.closest<HTMLButtonElement>('.thing');
    const chip = t.closest<HTMLButtonElement>('.gz-questions button');
    if (thing && mode === 'edit') {
      const i = Number(thing.dataset.player);
      team[i] = THINGS[(THINGS.indexOf(team[i]) + 1) % THINGS.length];
      paintTeam();
      table.innerHTML = '';
      verdictEl.innerHTML = '';
      shell.say(CH1.changed);
      return;
    }
    if (chip) {
      const qi = Number(chip.dataset.q);
      if (mode === 'pick') pickQ?.(qi);
      if (mode === 'hist') {
        markChip(qi);
        paintHist(QUESTIONS[qi]);
        shell.circuit(circuitSvg(UI.players, gameSteps(QUESTIONS[qi]), UI.circuitTitle));
      }
    }
  });

  /* ---- chapters ---- */
  async function chapter1(e: number) {
    setMode('edit');
    shell.setTitle(CH1.title);
    shell.setText(CH1.intro);
    paintTeam();
    for (;;) {
      const v = await shell.ask(e, [
        { label: CH1.askAll, value: 'ask' as const, kind: 'primary' as const },
        { label: CH1.all, value: 'all' as const },
        { label: CH1.why, value: 'why' as const },
        { label: CH1.next, value: 'next' as const },
      ]);
      if (v === 'next') { shell.markDone(1); return shell.go(2); }
      if (v === 'all') { const { tried, best } = bestClassical(); shell.say(CH1.allResult(tried, best)); track('Portal: ghz game all strategies'); continue; }
      if (v === 'why') { shell.setText(CH1.proof); shell.say(CH1.proofSaid); track('Portal: ghz game proof'); continue; }
      setMode('off');
      table.innerHTML = '';
      verdictEl.innerHTML = '';
      shell.say('');
      const rows: string[] = [];
      for (const q of QUESTIONS) {
        const bits = classicalAnswer(team, q);
        const win = wins(q, bits);
        paintPlayers({
          ask: [...q], color: team.map((t, i) => (q[i] === 'C' ? t.color : null)), shape: team.map((t, i) => (q[i] === 'S' ? t.shape : null)),
          words: q.map((a, i) => said(a, bits[i])),
        });
        verdictEl.innerHTML = `${questionLabel(q)}: ${verdict(q, bits, win)}`;
        rows.push(`<tr><td>${questionLabel(q)}</td><td>${q.map((a, i) => said(a, bits[i])).join(', ')}</td><td class="${win ? 'win' : 'lose'}">${win ? '✓' : '✗'}</td></tr>`);
        table.innerHTML = `<table>${rows.join('')}</table>`;
        await shell.wait(700, e);
      }
      setMode('edit');
      paintTeam();
      verdictEl.innerHTML = '';
      const won = classicalScore(team);
      shell.say(CH1.score(won));
      track('Portal: ghz game classical', { won });
    }
  }

  async function chapter2(e: number) {
    setMode('pick');
    shell.setTitle(CH2.title);
    shell.setText(CH2.intro);
    markChip(null);
    paintPlayers({});
    let won = 0, n = 0;
    for (;;) {
      const v = await shell.askOr<'ask' | 'many' | 'next' | number>(e, [
        { label: CH2.ask, value: 'ask', kind: 'primary' },
        { label: CH2.many, value: 'many' },
        { label: CH2.next, value: 'next' },
      ], (resolve) => { pickQ = resolve; });
      pickQ = null;
      if (v === 'next') { shell.markDone(2); return shell.go(3); }
      if (v === 'many') {
        let w = 0;
        for (let i = 0; i < 1000; i++) if (playQuantum(randomQuestion()).win) w++;
        shell.say(CH2.manyResult(w, 1000));
        track('Portal: ghz game 1000 rounds', { won: w });
        continue;
      }
      const qi = typeof v === 'number' ? v : QUESTIONS.indexOf(randomQuestion());
      const q = QUESTIONS[qi];
      markChip(qi);
      shell.circuit(circuitSvg(UI.players, gameSteps(q), UI.circuitTitle));
      const r = playQuantum(q);
      setMode('off');
      verdictEl.innerHTML = '';
      const shown: { ask: Ask[]; color: (0 | 1 | null)[]; shape: (0 | 1 | null)[]; words: string[] } = { ask: [...q], color: [null, null, null], shape: [null, null, null], words: ['', '', ''] };
      paintPlayers(shown);
      for (let i = 0; i < 3; i++) {
        await shell.wait(260, e);
        if (q[i] === 'C') shown.color[i] = r.bits[i] as 0 | 1; else shown.shape[i] = r.bits[i] as 0 | 1;
        shown.words[i] = said(q[i], r.bits[i]);
        paintPlayers(shown);
      }
      setMode('pick');
      n++; if (r.win) won++;
      verdictEl.innerHTML = `${questionLabel(q)}: ${verdict(q, r.bits, r.win)}`;
      shell.say(n === 3 ? CH2.again : '');
      shell.score(CH2.score(won, n));
      track('Portal: ghz game round', { result: r.win ? 'win' : 'lost', question: q.join('') });
    }
  }

  async function chapter3(e: number) {
    setMode('hist');
    shell.setTitle(CH3.title);
    markChip(null);
    paintHist(null);
    shell.circuit(circuitSvg(UI.players, zSteps(), UI.circuitTitle));
    let s = 0;
    for (;;) {
      shell.setText(CH3.texts[s]);
      const v = await shell.ask(e, CH3.sections.map((label, i) => ({ label, value: i, kind: i === s ? ('current' as const) : undefined })));
      if (v === 1 && s !== 1) {
        markChip(1);
        paintHist(QUESTIONS[1]);
        shell.circuit(circuitSvg(UI.players, gameSteps(QUESTIONS[1]), UI.circuitTitle));
      }
      if (v === 0) {
        markChip(null);
        paintHist(null);
        shell.circuit(circuitSvg(UI.players, zSteps(), UI.circuitTitle));
      }
      s = v;
      track('Portal: ghz game explain section', { section: s + 1 });
    }
  }

  const shell: Shell = mountShell(root, [chapter1, chapter2, chapter3], {
    game: 'ghz game',
    storageKey: 'fwq-ghz-done',
    terms: TERMS,
    labels: UI,
    locale: root.dataset.locale ?? 'en',
    onEnter: () => {
      setMode('off');
      pickQ = null;
      table.innerHTML = '';
      verdictEl.innerHTML = '';
      hist.innerHTML = '';
      markChip(null);
    },
  });
}
