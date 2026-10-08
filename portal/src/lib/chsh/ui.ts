/**
 * Browser side of the CHSH game (markup: components/ChshGame.astro).
 *
 *   1  Play classically     — click a table of answers; 3 of 4 at best; try all 16; the parity proof.
 *   2  The quantum team     — a Bell pair measured along four arrows: about 85% of the rounds.
 *   3  Turn the angles      — sliders for the four arrows, exact win rates, 1000 sampled rounds.
 *   4  Why 85% is the limit — the Bloch circle, S ≤ 2, S ≤ 2√2, what it means.
 */
import { mountShell, track, type Shell } from '../games/shell';
import { circuitSvg } from '../games/circuit';
import {
  BEST_ANGLES, QUESTIONS, TSIRELSON_WIN, allStrategies, classicalWins, gameSteps,
  playClassical, playQuantum, randomBit, totalWin, winProbability, type Angles, type Bit, type Round,
} from './game';
import { CH1, CH2, CH3, CH4, TERMS, UI, round } from './messages';

type Mode = 'strategy' | 'pick' | 'angles' | 'explain' | 'off';
const pct = (p: number) => `${(100 * p).toFixed(1)}%`;

/** The Bloch circle with the four arrows; the active pair bold, answers as dots (tip = 0, other end = 1). */
function circleSvg(angles: Angles, active: { x: Bit; y: Bit } | null, answers: { a: Bit; b: Bit } | null): string {
  const C = 110, R = 70;
  const pt = (deg: number, r = R) => { const t = (deg * Math.PI) / 180; return [C + r * Math.sin(t), C - r * Math.cos(t)]; };
  const out: string[] = [`<svg class="ch-circle-svg" viewBox="0 0 220 220" role="img" aria-label="${UI.circleTitle}">`];
  out.push(`<circle class="rim" cx="${C}" cy="${C}" r="${R}"/>`,
    `<line class="axis" x1="${C}" y1="${C - R - 6}" x2="${C}" y2="${C + R + 6}"/><line class="axis" x1="${C - R - 6}" y1="${C}" x2="${C + R + 6}" y2="${C}"/>`,
    `<text class="ket" x="${C - 22}" y="${C - R - 4}" text-anchor="end">|0⟩</text><text class="ket" x="${C + 6}" y="${C + R + 17}">|1⟩</text>`,
    `<text class="ket" x="${C + R + 4}" y="${C + 20}">|+⟩</text><text class="ket" x="${C - R - 4}" y="${C + 20}" text-anchor="end">|−⟩</text>`);
  const arrow = (deg: number, who: 'alice' | 'bob', q: Bit, on: boolean, answer: Bit | null) => {
    const both = who === 'alice' ? angles.alice : angles.bob, P = who === 'alice' ? 'A' : 'B';
    const same = (((both[0] - both[1]) % 360) + 360) % 360 === 0; // both arrows on top of each other: one label
    const label = same ? (q === 0 ? `${P}0,1` : '') : `${P}${q}`;
    const [x, y] = pt(deg), [lx, ly] = pt(deg, R + (who === 'alice' ? 16 : 30));
    const t = (deg * Math.PI) / 180, ux = Math.sin(t), uy = -Math.cos(t), px = -uy, py = ux;
    const head = `${x},${y} ${x - 10 * ux + 5 * px},${y - 10 * uy + 5 * py} ${x - 10 * ux - 5 * px},${y - 10 * uy - 5 * py}`;
    out.push(`<g class="arrow ${who}${on ? ' on' : ''}"><line x1="${C}" y1="${C}" x2="${x - 8 * ux}" y2="${y - 8 * uy}"/><polygon points="${head}"/>`
      + `<text x="${lx}" y="${ly + 4}" text-anchor="middle">${label}</text></g>`);
    if (answer !== null) {
      const [dx, dy] = answer === 0 ? pt(deg) : pt(deg + 180);
      out.push(`<circle class="dot ${who}" cx="${dx}" cy="${dy}" r="7"/><text class="dotv" x="${dx}" y="${dy + 4}" text-anchor="middle">${answer}</text>`);
    }
  };
  for (const q of [0, 1] as Bit[]) arrow(angles.alice[q], 'alice', q, !active || active.x === q, active && answers && active.x === q ? answers.a : null);
  for (const q of [0, 1] as Bit[]) arrow(angles.bob[q], 'bob', q, !active || active.y === q, active && answers && active.y === q ? answers.b : null);
  out.push('</svg>');
  return out.join('');
}

export function mountChsh(root: HTMLElement) {
  const board = root.querySelector<HTMLElement>('.ch-board')!;
  const circle = root.querySelector<HTMLElement>('.ch-circle')!;
  const cells = Array.from(root.querySelectorAll<HTMLButtonElement>('.ch-q'));
  const answerBtns = Array.from(root.querySelectorAll<HTMLButtonElement>('.ch-ans'));
  const sliders = Array.from(root.querySelectorAll<HTMLInputElement>('.ch-slider input'));
  const sliderOut = Array.from(root.querySelectorAll<HTMLOutputElement>('.ch-slider output'));
  const cellAt = (x: Bit, y: Bit) => cells[2 * x + y];

  let mode: Mode = 'off';
  let table: { alice: [Bit, Bit]; bob: [Bit, Bit] } = { alice: [0, 1], bob: [1, 0] }; // chapter 1's table survives chapter switches
  let angles: Angles = BEST_ANGLES;
  let pickResolve: ((v: 'pick') => void) | null = null;
  let proofShown = false; // after the proof, chapter 1 stops asking for a table that wins all four
  let picked: { x: Bit; y: Bit } | null = null;

  function setMode(m: Mode) {
    mode = m;
    board.dataset.mode = m;
    for (const c of cells) { c.disabled = m !== 'pick' && m !== 'explain'; c.classList.remove('win', 'lose', 'on'); }
  }
  /** Fill each question square: `val(x, y)` is its text, `mark(x, y)` win/lose. */
  function paintCells(val: (x: Bit, y: Bit) => string, mark?: (x: Bit, y: Bit) => 'win' | 'lose' | null) {
    for (const [x, y] of QUESTIONS) {
      const el = cellAt(x, y);
      el.querySelector('.val')!.innerHTML = val(x, y);
      const m = mark?.(x, y) ?? null;
      el.classList.toggle('win', m === 'win');
      el.classList.toggle('lose', m === 'lose');
    }
  }
  const highlight = (q: { x: Bit; y: Bit } | null) => {
    for (const [x, y] of QUESTIONS) {
      const on = !!q && q.x === x && q.y === y;
      cellAt(x, y).classList.toggle('on', on);
      cellAt(x, y).setAttribute('aria-pressed', String(on));
    }
  };

  /* ---- stage controls ---- */
  board.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;
    const ans = t.closest<HTMLButtonElement>('.ch-ans');
    const cell = t.closest<HTMLButtonElement>('.ch-q');
    if (ans && mode === 'strategy') {
      const who = ans.dataset.who as 'alice' | 'bob', q = Number(ans.dataset.q) as Bit;
      table[who][q] = (table[who][q] ^ 1) as Bit;
      paintStrategy();
      return;
    }
    if (cell && (mode === 'pick' || mode === 'explain')) {
      picked = { x: Number(cell.dataset.x) as Bit, y: Number(cell.dataset.y) as Bit };
      if (mode === 'pick') pickResolve?.('pick');
      else explainQuestion(picked.x, picked.y);
    }
  });
  sliders.forEach((s, i) => s.addEventListener('input', () => {
    const v = Number(s.value);
    const all = [...angles.alice, ...angles.bob];
    all[i] = v;
    angles = { alice: [all[0], all[1]], bob: [all[2], all[3]] };
    paintAngles();
  }));

  /* ---- chapter 1 ---- */
  function paintStrategy() {
    for (const b of answerBtns) {
      const who = b.dataset.who as 'alice' | 'bob', q = Number(b.dataset.q) as Bit, v = String(table[who][q]);
      b.textContent = v;
      b.setAttribute('aria-label', `${who === 'alice' ? UI.alice : UI.bob}, ${UI.answerTo(who === 'alice' ? 'x' : 'y', q)} ${v}`);
    }
    paintCells((x, y) => {
      const r = playClassical(table, x, y);
      return `a = ${r.a}, b = ${r.b} ${r.win ? '✓' : '✗'}`;
    }, (x, y) => (playClassical(table, x, y).win ? 'win' : 'lose'));
    shell.say(CH1.result(classicalWins(table), proofShown));
  }

  async function chapter1(e: number) {
    setMode('strategy');
    shell.setTitle(CH1.title);
    shell.setText(CH1.intro);
    paintStrategy();
    for (;;) {
      const v = await shell.ask(e, [
        { label: CH1.many, value: 'many' as const }, { label: CH1.all, value: 'all' as const },
        { label: CH1.why, value: 'why' as const }, { label: CH1.next, value: 'next' as const, kind: 'primary' as const },
      ]);
      if (v === 'next') { shell.markDone(1); return shell.go(2); }
      if (v === 'many') {
        let won = 0;
        for (let i = 0; i < 1000; i++) if (playClassical(table, randomBit(), randomBit()).win) won++;
        shell.say(CH1.manyResult(won, 1000, classicalWins(table)));
        track('Portal: chsh game 1000 rounds', { chapter: 1, won });
      } else if (v === 'all') {
        const all = allStrategies(), best = Math.max(...all.map((s) => s.wins));
        shell.say(CH1.allResult(all.length, best, all.filter((s) => s.wins === best).length));
        track('Portal: chsh game all strategies');
      } else {
        proofShown = true;
        shell.setText(CH1.proof);
        shell.say(CH1.proofSaid);
        track('Portal: chsh game proof');
      }
    }
  }

  /* ---- chapter 2 ---- */
  async function chapter2(e: number) {
    setMode('pick');
    shell.setTitle(CH2.title);
    shell.setText(CH2.intro);
    const tally = QUESTIONS.map(() => ({ won: 0, n: 0 }));
    const tallyText = (x: Bit, y: Bit) => { const t = tally[2 * x + y]; return t.n ? `${t.won} of ${t.n} won (${pct(t.won / t.n)})` : '—'; };
    let won = 0, n = 0, lostOnce = false;
    circle.innerHTML = circleSvg(BEST_ANGLES, null, null);
    paintCells(tallyText);
    shell.circuit(circuitSvg(UI.qubits, gameSteps(BEST_ANGLES.alice[0], BEST_ANGLES.bob[0]), UI.circuitTitle));
    const record = (r: Round) => { const t = tally[2 * r.x + r.y]; t.n++; n++; if (r.win) { t.won++; won++; } };
    for (;;) {
      picked = null;
      const v = await shell.askOr<'ask' | 'many' | 'next' | 'pick'>(e, [
        { label: CH2.ask, value: 'ask', kind: 'primary' }, { label: CH2.many, value: 'many' }, { label: CH2.next, value: 'next' },
      ], (resolve) => { pickResolve = resolve; });
      pickResolve = null;
      if (v === 'next') { shell.markDone(2); return shell.go(3); }
      if (v === 'many') {
        let w = 0;
        for (let i = 0; i < 1000; i++) { const r = playQuantum(randomBit(), randomBit()); record(r); if (r.win) w++; }
        circle.innerHTML = circleSvg(BEST_ANGLES, null, null);
        highlight(null);
        paintCells(tallyText);
        shell.say(CH2.manyResult(w, 1000));
        track('Portal: chsh game 1000 rounds', { chapter: 2, won: w });
      } else {
        const x = v === 'pick' ? picked!.x : randomBit(), y = v === 'pick' ? picked!.y : randomBit();
        const r = playQuantum(x, y);
        record(r);
        const alpha = BEST_ANGLES.alice[x], beta = BEST_ANGLES.bob[y];
        shell.circuit(circuitSvg(UI.qubits, gameSteps(alpha, beta), UI.circuitTitle));
        circle.innerHTML = circleSvg(BEST_ANGLES, { x, y }, null);
        board.dataset.busy = ''; // clicks on the squares wait for the next question
        try { await shell.wait(250, e); } finally { delete board.dataset.busy; }
        circle.innerHTML = circleSvg(BEST_ANGLES, { x, y }, { a: r.a, b: r.b });
        paintCells(tallyText, (qx, qy) => (qx === x && qy === y ? (r.win ? 'win' : 'lose') : null));
        highlight({ x, y });
        const firstLoss = !r.win && !lostOnce; // say once that losing a round is part of the game
        if (!r.win) lostOnce = true;
        shell.say(round(r, alpha, beta) + (firstLoss ? `<br><small>${CH2.again}</small>` : ''));
        track('Portal: chsh game round', { chapter: 2, result: r.win ? 'win' : 'lost', question: `x${x}y${y}` });
      }
      shell.score(CH2.score(won, n));
    }
  }

  /* ---- chapter 3 ---- */
  function paintAngles() {
    sliders.forEach((s, i) => {
      const v = i < 2 ? angles.alice[i] : angles.bob[i - 2];
      s.value = String(v);
      s.setAttribute('aria-valuetext', `${v} degrees`);
      sliderOut[i].textContent = `${v}°`.replace('-', '−');
    });
    circle.innerHTML = circleSvg(angles, null, null);
    paintCells((x, y) => `win ${pct(winProbability(x, y, angles))}`);
    shell.say(CH3.total(totalWin(angles), TSIRELSON_WIN));
  }

  async function chapter3(e: number) {
    setMode('angles');
    shell.setTitle(CH3.title);
    shell.setText(CH3.intro);
    paintAngles();
    for (;;) {
      const v = await shell.ask(e, [
        { label: CH3.best, value: 'best' as const }, { label: CH3.allZ, value: 'z' as const }, { label: CH3.random, value: 'random' as const },
        { label: CH3.many, value: 'many' as const }, { label: CH3.next, value: 'next' as const, kind: 'primary' as const },
      ]);
      if (v === 'next') { shell.markDone(3); return shell.go(4); }
      if (v === 'best') angles = BEST_ANGLES;
      if (v === 'z') angles = { alice: [0, 0], bob: [0, 0] };
      if (v === 'random') { const r = () => Math.round(Math.random() * 72) * 5 - 180; angles = { alice: [r(), r()], bob: [r(), r()] }; }
      paintAngles();
      if (v === 'z') shell.say(`${CH3.total(totalWin(angles), TSIRELSON_WIN)}<br><small>${CH3.allZSaid}</small>`);
      if (v === 'many') {
        let won = 0;
        for (let i = 0; i < 1000; i++) if (playQuantum(randomBit(), randomBit(), angles).win) won++;
        shell.say(`${CH3.total(totalWin(angles), TSIRELSON_WIN)}<br>${CH3.manyResult(won, 1000, totalWin(angles))}`);
        track('Portal: chsh game 1000 rounds', { chapter: 3, won });
      }
      track('Portal: chsh game angles', { action: v, win: Math.round(1000 * totalWin(angles)) / 10 });
    }
  }

  /* ---- chapter 4 ---- */
  function explainQuestion(x: Bit, y: Bit) {
    circle.innerHTML = circleSvg(BEST_ANGLES, { x, y }, null);
    highlight({ x, y });
    shell.say(CH4.question(x, y, BEST_ANGLES.alice[x], BEST_ANGLES.bob[y], winProbability(x, y)));
    shell.circuit(circuitSvg(UI.qubits, gameSteps(BEST_ANGLES.alice[x], BEST_ANGLES.bob[y]), UI.circuitTitle));
  }

  async function chapter4(e: number) {
    setMode('explain');
    shell.setTitle(CH4.title);
    circle.innerHTML = circleSvg(BEST_ANGLES, null, null);
    paintCells((x, y) => `win ${pct(winProbability(x, y))}`);
    let s = 0;
    for (;;) {
      shell.setText(CH4.texts[s]);
      shell.say(CH4.said[s]);
      shell.circuit('');
      highlight(null);
      circle.innerHTML = circleSvg(BEST_ANGLES, null, null);
      const v = await shell.ask(e, CH4.sections.map((label, i) => ({ label, value: i, kind: i === s ? ('current' as const) : undefined })));
      s = v;
      track('Portal: chsh game explain section', { section: s + 1 });
    }
  }

  const shell: Shell = mountShell(root, [chapter1, chapter2, chapter3, chapter4], {
    game: 'chsh game',
    storageKey: 'fwq-chsh-done',
    terms: TERMS,
    labels: UI,
    locale: root.dataset.locale ?? 'en',
    onEnter: () => { setMode('off'); pickResolve = null; picked = null; highlight(null); },
  });
}
