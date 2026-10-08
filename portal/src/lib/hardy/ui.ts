/**
 * Browser side of Hardy's paradox (markup: components/HardyGame.astro).
 *
 *   1  The car factory    — write spec sheets for two cars; no pair keeping the facts gives two diesels.
 *   2  Quantum cars       — an entangled pair: the facts hold every time, and still both diesel 1 in 12.
 *   3  What went wrong?   — the state, the counterfactual step, no spec sheets, Hardy's original.
 *   4  Find the 9%        — turn the engine arrow; the best angle gives (5√5 − 11)/2 ≈ 9.02%.
 */
import { mountShell, track, type Shell } from '../games/shell';
import { circuitSvg } from '../games/circuit';
import {
  BEST_PHI, CHECKS, HARDY_MAX, allCards, amplitudes, answer, bothDiesel, breaksFact, checkSteps,
  eventProbability, inspect, keepsFacts, randomCheck, type Bit, type Card, type Check, type Round,
} from './game';
import { CH1, CH2, CH3, CH4, TERMS, UI } from './messages';

type Mode = 'cards' | 'pick' | 'explain' | 'angle' | 'off';
const pct2 = (p: number) => `${(100 * Math.max(0, p)).toFixed(2)}%`;

/** The Bloch circle for chapter 4: color up–down (red |0⟩ top, blue |1⟩ bottom), the engine arrow at φ. */
function circleSvg(phi: number): string {
  const C = 110, R = 70;
  const pt = (deg: number, r = R) => { const t = (deg * Math.PI) / 180; return [C + r * Math.sin(t), C - r * Math.cos(t)]; };
  const [x, y] = pt(phi), [ox, oy] = pt(phi + 180), [lx, ly] = pt(phi, R + 22), [mx, my] = pt(phi + 180, R + 22);
  const t = (phi * Math.PI) / 180, ux = Math.sin(t), uy = -Math.cos(t), px = -uy, py = ux;
  const head = `${x},${y} ${x - 10 * ux + 5 * px},${y - 10 * uy + 5 * py} ${x - 10 * ux - 5 * px},${y - 10 * uy - 5 * py}`;
  return `<svg class="hp-circle-svg" viewBox="-30 0 280 220" role="img" aria-label="${UI.circleTitle}">`
    + `<circle class="rim" cx="${C}" cy="${C}" r="${R}"/>`
    + `<line class="axis" x1="${C}" y1="${C - R}" x2="${C}" y2="${C + R}"/>`
    + `<circle class="pole red" cx="${C}" cy="${C - R}" r="6"/><circle class="pole blue" cx="${C}" cy="${C + R}" r="6"/>`
    + `<text class="ket" x="${C - 10}" y="${C - R - 6}" text-anchor="end">red |0⟩</text><text class="ket" x="${C - 10}" y="${C + R + 16}" text-anchor="end">blue |1⟩</text>`
    + `<line class="engine back" x1="${C}" y1="${C}" x2="${ox}" y2="${oy}"/>`
    + `<g class="engine"><line x1="${C}" y1="${C}" x2="${x - 8 * ux}" y2="${y - 8 * uy}"/><polygon points="${head}"/></g>`
    + `<text class="elabel" x="${lx}" y="${ly + 4}" text-anchor="middle">gasoline</text><text class="elabel" x="${mx}" y="${my + 4}" text-anchor="middle">diesel</text>`
    + `<text class="ket" x="-26" y="16">φ = ${phi.toFixed(phi % 1 ? 2 : 0)}°</text></svg>`;
}

export function mountHardy(root: HTMLElement) {
  const board = root.querySelector<HTMLElement>('.hp-board')!;
  const cells = Array.from(root.querySelectorAll<HTMLButtonElement>('.hp-q'));
  const cars = Array.from(root.querySelectorAll<HTMLElement>('.hp-car'));
  const circle = root.querySelector<HTMLElement>('.hp-circle')!;
  const slider = root.querySelector<HTMLInputElement>('.hp-slider input')!;
  const sliderOut = root.querySelector<HTMLOutputElement>('.hp-slider output')!;
  const stateLine = root.querySelector<HTMLElement>('.hp-state')!;
  const cellAt = (c1: Check, c2: Check) => cells[2 * c1 + c2];

  let mode: Mode = 'off';
  let sheets: { car1: Card; car2: Card } = { car1: { color: 0, engine: 0 }, car2: { color: 1, engine: 0 } }; // chapter 1 keeps them
  let phi = 90;
  let pickResolve: ((v: 'pick') => void) | null = null;
  let picked: { c1: Check; c2: Check } | null = null;

  function setMode(m: Mode) {
    mode = m;
    board.dataset.mode = m;
    for (const c of cells) { c.disabled = m !== 'pick'; c.classList.remove('ok', 'bad', 'paradox', 'on'); c.setAttribute('aria-pressed', 'false'); }
  }
  function paintCells(val: (c1: Check, c2: Check) => string, mark?: (c1: Check, c2: Check) => 'ok' | 'bad' | 'paradox' | null) {
    for (const [c1, c2] of CHECKS) {
      const el = cellAt(c1, c2);
      el.querySelector('.val')!.innerHTML = val(c1, c2);
      const m = mark?.(c1, c2) ?? null;
      for (const k of ['ok', 'bad', 'paradox']) el.classList.toggle(k, m === k);
    }
  }
  const highlight = (q: { c1: Check; c2: Check } | null) => {
    for (const [c1, c2] of CHECKS) {
      const on = !!q && q.c1 === c1 && q.c2 === c2;
      cellAt(c1, c2).classList.toggle('on', on);
      cellAt(c1, c2).setAttribute('aria-pressed', String(on));
    }
  };
  /** Paint one car: its color (or gray if unknown) and the two lines. `shown` = what is visible. */
  function paintCar(i: 0 | 1, color: Bit | null, engine: Bit | null) {
    const el = cars[i];
    el.classList.toggle('red', color === 0);
    el.classList.toggle('blue', color === 1);
    el.querySelector('.cv')!.textContent = color === null ? UI.notChecked : UI.color(color);
    el.querySelector('.ev')!.textContent = engine === null ? UI.notChecked : UI.engine(engine);
    el.classList.toggle('diesel', engine === 1);
  }

  /* ---- stage controls ---- */
  board.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;
    const toggle = t.closest<HTMLButtonElement>('.hp-toggle');
    const cell = t.closest<HTMLButtonElement>('.hp-q');
    if (toggle && mode === 'cards') {
      const car = toggle.dataset.car === '1' ? sheets.car1 : sheets.car2;
      const what = toggle.dataset.what as 'color' | 'engine';
      car[what] = (car[what] ^ 1) as Bit;
      paintSheets();
      return;
    }
    if (cell && mode === 'pick' && !('busy' in board.dataset)) {
      picked = { c1: Number(cell.dataset.c1) as Check, c2: Number(cell.dataset.c2) as Check };
      pickResolve?.('pick');
    }
  });
  slider.addEventListener('input', () => { phi = Number(slider.value); paintAngle(); });

  /* ---- chapter 1 ---- */
  function paintSheets() {
    paintCar(0, sheets.car1.color, sheets.car1.engine);
    paintCar(1, sheets.car2.color, sheets.car2.engine);
    for (const b of root.querySelectorAll<HTMLButtonElement>('.hp-toggle')) {
      const car = b.dataset.car === '1' ? sheets.car1 : sheets.car2, what = b.dataset.what as 'color' | 'engine';
      const v = what === 'color' ? UI.color(car.color) : UI.engine(car.engine);
      b.textContent = v;
      b.setAttribute('aria-label', `${UI.car(Number(b.dataset.car) as 1 | 2)}, ${what === 'color' ? UI.colorLabel : UI.engineLabel}: ${v}`);
    }
    const res = (c1: Check, c2: Check) => [answer(sheets.car1, c1), answer(sheets.car2, c2)] as [Bit, Bit];
    paintCells((c1, c2) => {
      const [r1, r2] = res(c1, c2);
      const mark = breaksFact(c1, c2, r1, r2) ? ' ✗' : bothDiesel(c1, c2, r1, r2) ? ' ‼' : c1 && c2 ? '' : ' ✓';
      return `${c1 ? UI.engine(r1) : UI.color(r1)} · ${c2 ? UI.engine(r2) : UI.color(r2)}${mark}`;
    }, (c1, c2) => {
      const [r1, r2] = res(c1, c2);
      return breaksFact(c1, c2, r1, r2) ? 'bad' : bothDiesel(c1, c2, r1, r2) ? 'paradox' : c1 && c2 ? null : 'ok';
    });
    shell.say(CH1.status(keepsFacts(sheets), sheets.car1.engine === 1 && sheets.car2.engine === 1));
  }

  async function chapter1(e: number) {
    setMode('cards');
    shell.setTitle(CH1.title);
    shell.setText(CH1.intro);
    paintSheets();
    for (;;) {
      const v = await shell.ask(e, [
        { label: CH1.all, value: 'all' as const }, { label: CH1.why, value: 'why' as const },
        { label: CH1.next, value: 'next' as const, kind: 'primary' as const },
      ]);
      if (v === 'next') { shell.markDone(1); return shell.go(2); }
      if (v === 'all') {
        const all = allCards(), keeping = all.filter((x) => x.keeps);
        shell.say(CH1.allResult(all.length, keeping.length, keeping.filter((x) => x.bothDiesel).length));
        track('Portal: hardy all sheets');
      } else {
        shell.setText(CH1.proof);
        shell.say(CH1.proofSaid);
        track('Portal: hardy proof');
      }
    }
  }

  /* ---- chapter 2 ---- */
  async function chapter2(e: number) {
    setMode('pick');
    shell.setTitle(CH2.title);
    shell.setText(CH2.intro);
    const tally = CHECKS.map(() => ({ k: 0, n: 0 }));
    let mornings = 0, both = 0;
    const tallyText = (c1: Check, c2: Check) => { const t = tally[2 * c1 + c2]; return CH2.tally(c1, c2, t.k, t.n); };
    const record = (r: Round) => {
      const t = tally[2 * r.c1 + r.c2]; t.n++; mornings++;
      if (breaksFact(r.c1, r.c2, r.r1, r.r2) || bothDiesel(r.c1, r.c2, r.r1, r.r2)) t.k++;
      if (bothDiesel(r.c1, r.c2, r.r1, r.r2)) both++;
    };
    paintCar(0, null, null); paintCar(1, null, null);
    paintCells(tallyText);
    shell.circuit(circuitSvg(UI.qubits, checkSteps(1, 1), UI.circuitTitle));
    for (;;) {
      picked = null;
      const v = await shell.askOr<'ask' | 'many' | 'next' | 'pick'>(e, [
        { label: CH2.ask, value: 'ask', kind: 'primary' }, { label: CH2.many, value: 'many' }, { label: CH2.next, value: 'next' },
      ], (resolve) => { pickResolve = resolve; });
      pickResolve = null;
      if (v === 'next') { shell.markDone(2); return shell.go(3); }
      if (v === 'many') {
        let ee = 0, dd = 0, broken = 0;
        for (let i = 0; i < 1000; i++) {
          const r = inspect(randomCheck(), randomCheck());
          record(r);
          if (r.c1 && r.c2) { ee++; if (bothDiesel(r.c1, r.c2, r.r1, r.r2)) dd++; }
          if (breaksFact(r.c1, r.c2, r.r1, r.r2)) broken++;
        }
        highlight(null);
        paintCar(0, null, null); paintCar(1, null, null);
        paintCells(tallyText, (c1, c2) => (c1 && c2 ? 'paradox' : tally[2 * c1 + c2].k ? 'bad' : 'ok'));
        shell.say(CH2.manyResult(dd, ee, broken));
        track('Portal: hardy 1000 mornings', { both: dd, engines: ee });
      } else {
        const c1 = v === 'pick' ? picked!.c1 : randomCheck(), c2 = v === 'pick' ? picked!.c2 : randomCheck();
        const r = inspect(c1, c2);
        record(r);
        shell.circuit(circuitSvg(UI.qubits, checkSteps(c1, c2), UI.circuitTitle));
        highlight({ c1, c2 });
        paintCar(0, null, null); paintCar(1, null, null);
        board.dataset.busy = '';
        try { await shell.wait(250, e); } finally { delete board.dataset.busy; }
        paintCar(0, c1 ? null : r.r1, c1 ? r.r1 : null);
        paintCar(1, c2 ? null : r.r2, c2 ? r.r2 : null);
        const isBoth = bothDiesel(c1, c2, r.r1, r.r2), broke = breaksFact(c1, c2, r.r1, r.r2);
        paintCells(tallyText, (x, y) => (x === c1 && y === c2 ? (isBoth ? 'paradox' : broke ? 'bad' : c1 && c2 ? null : 'ok') : null));
        shell.say(CH2.round(c1, c2, r.r1, r.r2, isBoth, broke));
        track('Portal: hardy round', { check: `${c1}${c2}`, both: isBoth ? 1 : 0 });
      }
      shell.score(CH2.score(both, mornings));
    }
  }

  /* ---- chapter 3 ---- */
  async function chapter3(e: number) {
    setMode('explain');
    shell.setTitle(CH3.title);
    paintCar(0, null, null); paintCar(1, null, null);
    paintCells((c1, c2) => `${c1 && c2 ? 'both diesel' : 'broken'}: ${pct2(eventProbability(c1, c2))}`, (c1, c2) => (c1 && c2 ? 'paradox' : 'ok'));
    shell.circuit(circuitSvg(UI.qubits, checkSteps(1, 1), UI.circuitTitle));
    let s = 0;
    for (;;) {
      shell.setText(CH3.texts[s]);
      shell.say(CH3.said[s]);
      const v = await shell.ask<number | 'next'>(e, [
        ...CH3.sections.map((label, i) => ({ label, value: i as number | 'next', kind: i === s ? ('current' as const) : undefined })),
        { label: CH3.next, value: 'next', kind: 'primary' },
      ]);
      if (v === 'next') { shell.markDone(3); return shell.go(4); }
      s = v;
      track('Portal: hardy explain section', { section: s + 1 });
    }
  }

  /* ---- chapter 4 ---- */
  function paintAngle() {
    slider.value = String(Math.round(phi));
    slider.setAttribute('aria-valuetext', `${phi.toFixed(phi % 1 ? 2 : 0)} degrees`);
    sliderOut.textContent = `${phi.toFixed(phi % 1 ? 2 : 0)}°`;
    circle.innerHTML = circleSvg(phi);
    const { a, c } = amplitudes(phi);
    stateLine.textContent = CH4.state(a, c);
    paintCells((c1, c2) => `${c1 && c2 ? 'both diesel' : 'broken'}: ${pct2(eventProbability(c1, c2, phi))}`, (c1, c2) => (c1 && c2 ? 'paradox' : 'ok'));
    shell.say(CH4.status(phi, eventProbability(1, 1, phi), HARDY_MAX));
    shell.circuit(circuitSvg(UI.qubits, checkSteps(1, 1, phi), UI.circuitTitle));
  }

  async function chapter4(e: number) {
    setMode('angle');
    shell.setTitle(CH4.title);
    shell.setText(CH4.intro);
    paintAngle();
    for (;;) {
      const v = await shell.ask(e, [
        { label: CH4.best, value: 'best' as const, kind: 'primary' as const }, { label: CH4.x, value: 'x' as const },
        { label: CH4.many, value: 'many' as const },
      ]);
      if (v === 'best') { phi = BEST_PHI; paintAngle(); shell.say(`${CH4.status(phi, eventProbability(1, 1, phi), HARDY_MAX)}<br><small>${CH4.bestSaid}</small>`); shell.markDone(4); }
      if (v === 'x') { phi = 90; paintAngle(); }
      if (v === 'many') {
        let both = 0, broken = 0;
        for (let i = 0; i < 1000; i++) {
          const r = inspect(1, 1, phi);
          if (bothDiesel(1, 1, r.r1, r.r2)) both++;
          for (const [c1, c2] of CHECKS.slice(0, 3)) { // and 1000 mornings for each fact
            const f = inspect(c1, c2, phi);
            if (breaksFact(c1, c2, f.r1, f.r2)) broken++;
          }
        }
        shell.say(CH4.manyResult(both, 1000, eventProbability(1, 1, phi), broken));
        track('Portal: hardy angle rounds', { phi: Math.round(phi), both });
      }
      track('Portal: hardy angle', { action: v, phi: Math.round(phi * 100) / 100 });
    }
  }

  const shell: Shell = mountShell(root, [chapter1, chapter2, chapter3, chapter4], {
    game: 'hardy',
    storageKey: 'fwq-hardy-done',
    terms: TERMS,
    labels: UI,
    locale: root.dataset.locale ?? 'en',
    onEnter: () => { setMode('off'); pickResolve = null; picked = null; highlight(null); },
  });
}
