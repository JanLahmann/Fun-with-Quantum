/**
 * Browser side of the 3-SAT / Grover page (markup: components/SatGame.astro).
 *
 *   1  The party puzzle   — click a guest list, the rules are checked; check all 16.
 *   2  Grover's search    — the party puzzle step by step: H, oracle, diffuser, measure.
 *   3  A classic 3-SAT    — the notebook's 5-clause problem: 3 of 8, one round = 84.4%.
 *   4  Your own puzzle    — any formula with up to 6 variables.
 *   5  How it works       — interference, rounds as rotations, scaling, limits.
 */
import { mountShell, track, type Choice, type Shell } from '../games/shell';
import { circuitSvg, type Step } from '../games/circuit';
import {
  FormulaError, afterRounds, assignment, bestIterations, bitString, clausesToFormula, countSolutions, dimacsClauses,
  diffuser, mean, oracle, predicted, puzzle, sample, successProbability, superposition, type Puzzle,
} from './logic';
import { CH1, CH2, CH3, CH4, CH5, PARTY, SAT3_DIMACS, STEP, TERMS, UI, guestList, pct, summary } from './messages';

type Mode = 'party' | 'grover' | 'custom' | 'rounds' | 'off';
type Phase = 'start' | 'h' | 'oracle' | 'diffused';

const PARTY_PUZZLE = puzzle(PARTY);
const SAT3_PUZZLE = puzzle(clausesToFormula(dimacsClauses(SAT3_DIMACS)));

export function mountSatGame(root: HTMLElement) {
  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const board = $('.sat-board');
  const friends = Array.from(root.querySelectorAll<HTMLButtonElement>('.sat-friend'));
  const rules = $('.sat-rules'), verdictEl = $('.sat-verdict'), tiles = $('.sat-tiles');
  const chart = $('.sat-chart'), chanceEl = $('.sat-chance'), hintEl = $('.sat-hint'), countsEl = $('.sat-counts');
  const input = $<HTMLInputElement>('.sat-input input'), summaryEl = $('.sat-summary');
  const roundsChart = $('.sat-rounds-chart');

  let mode: Mode = 'off';
  let guests = 0b0011; // Alice and Bob — a list that works, as a first impression
  let custom: Puzzle = PARTY_PUZZLE;
  let submitFormula: ((p: Puzzle) => void) | null = null;
  const setMode = (m: Mode) => { mode = m; board.dataset.mode = m; };

  /* ---- chapter 1: the party ---- */
  function paintParty() {
    const v = assignment(PARTY_PUZZLE.vars, guests);
    friends.forEach((f, k) => {
      const on = ((guests >> k) & 1) === 1;
      f.setAttribute('aria-pressed', String(on));
      f.querySelector('.st')!.textContent = on ? UI.invited : UI.notInvited;
    });
    const couple = (v.A && v.B) || (v.C && v.D), breakup = !(v.A && v.D);
    rules.innerHTML = `<li class="${couple ? 'ok' : 'bad'}">${couple ? '✓' : '✗'} ${UI.ruleCouple}</li><li class="${breakup ? 'ok' : 'bad'}">${breakup ? '✓' : '✗'} ${UI.ruleBreakup}</li>`;
    const ok = PARTY_PUZZLE.solution[guests];
    verdictEl.innerHTML = `<span class="${ok ? 'win' : 'lose'}">${ok ? UI.works : UI.fails}</span>`;
    tiles.querySelectorAll<HTMLElement>('.tile').forEach((t) => t.classList.toggle('current', Number(t.dataset.i) === guests));
  }
  function showAllTiles() {
    tiles.innerHTML = PARTY_PUZZLE.solution.map((ok, i) =>
      `<div class="tile ${ok ? 'ok' : 'bad'}${i === guests ? ' current' : ''}" data-i="${i}"><b>${bitString(i, 4)}</b><span>${guestList(i)}</span><i>${ok ? '✓' : '✗'}</i></div>`).join('');
  }

  /* ---- the amplitude chart ---- */
  function paintChart(p: Puzzle, amps: readonly number[], showMean: boolean) {
    const n = amps.length, labels = n <= 16;
    if (chart.childElementCount !== n + 1 || chart.dataset.n !== String(n)) {
      chart.dataset.n = String(n);
      chart.innerHTML = `<div class="avg" hidden><span>${UI.average}</span></div>` + amps.map((_, i) =>
        `<div class="col" title="${bitString(i, p.vars.length)}"><span class="amp"></span>${labels ? `<span class="lbl">${bitString(i, p.vars.length)}</span>` : ''}</div>`).join('');
    }
    const cols = chart.querySelectorAll<HTMLElement>('.col');
    amps.forEach((a, i) => {
      const bar = cols[i].querySelector<HTMLElement>('.amp')!;
      const h = Math.min(1, Math.abs(a)) * 50;
      bar.style.height = `${h}%`;
      bar.style.bottom = a >= 0 ? '50%' : `${50 - h}%`;
      bar.classList.toggle('solution', p.solution[i]);
      cols[i].title = `${bitString(i, p.vars.length)}: amplitude ${a.toFixed(3)}, probability ${pct(a * a)}`;
    });
    const avg = chart.querySelector<HTMLElement>('.avg')!;
    avg.hidden = !showMean;
    avg.style.bottom = `${50 + Math.max(-1, Math.min(1, mean(amps))) * 50}%`;
    chanceEl.innerHTML = UI.chance(successProbability(amps, p.solution));
    hintEl.textContent = UI.bitsHint(p.vars);
  }

  function circuitFor(p: Puzzle, phase: Phase, rounds: number): string {
    const nq = p.vars.length, last = nq - 1;
    const steps: Step[] = [];
    if (phase !== 'start') for (let q = 0; q < nq; q++) steps.push({ g: 'h', q, tone: 'prep' });
    for (let r = 0; r < rounds; r++) {
      steps.push({ g: 'box', label: UI.oracle, from: 0, to: last, tone: 'bob' });
      steps.push({ g: 'box', label: UI.diffuser, from: 0, to: last, tone: 'alice' });
    }
    if (phase === 'oracle') steps.push({ g: 'box', label: UI.oracle, from: 0, to: last, tone: 'bob' });
    steps.push({ g: 'measure' });
    const short = (v: string) => (v.length > 8 ? `${v.slice(0, 7)}…` : v); // the label column is narrow
    return circuitSvg(p.vars.map((v, q) => `${short(v)} (q${q})`), steps, UI.circuitTitle);
  }

  function describe(p: Puzzle, i: number): string {
    if (p === PARTY_PUZZLE) return guestList(i);
    const v = assignment(p.vars, i);
    return p.vars.map((name) => `${name}=${v[name] ? 1 : 0}`).join(' ');
  }

  /**
   * Grover step by step on puzzle p. `extra` adds chapter buttons (e.g. Next); for the own-puzzle
   * chapter, a new formula from the input restarts the run.
   */
  async function stepper(e: number, start: Puzzle, extra: Choice<string>[], allowFormula = false, handlers: Record<string, () => void> = {}): Promise<string> {
    let p = start;
    let amps: number[] = [], phase: Phase = 'start', rounds = 0, prevChance = 0;
    const reset = () => {
      amps = new Array(1 << p.vars.length).fill(0); amps[0] = 1;
      phase = 'start'; rounds = 0; countsEl.innerHTML = '';
      paintChart(p, amps, false);
      chanceEl.innerHTML = ''; // the chance line starts with H: before that there is nothing to search yet
      shell.circuit(circuitFor(p, phase, rounds));
      shell.say(STEP.start(p === PARTY_PUZZLE));
    };
    reset();
    for (;;) {
      const m = countSolutions(p), best = bestIterations(p.vars.length, m);
      const options: Choice<string>[] = [];
      if (phase === 'start') options.push({ label: STEP.h, value: 'h', kind: 'primary' });
      else if (phase === 'oracle') options.push({ label: STEP.diffuser, value: 'diffuser', kind: 'primary' });
      else {
        if (phase === 'h') options.push({ label: STEP.oracle, value: 'oracle', kind: 'primary' });
        options.push({ label: STEP.measure, value: 'measure', kind: phase === 'diffused' ? 'primary' : undefined });
        options.push({ label: STEP.measureMany, value: 'many' });
        if (phase === 'diffused') options.push({ label: STEP.again, value: 'oracle' });
      }
      if (allowFormula && best !== null && best > 0 && phase !== 'oracle') options.push({ label: STEP.best(best), value: 'best' });
      if (phase !== 'start') options.push({ label: STEP.restart, value: 'restart' });
      options.push(...extra);
      const v = await shell.askOr<string>(e, options, (resolve) => {
        submitFormula = allowFormula ? (np) => { p = np; resolve('formula'); } : null;
      });
      submitFormula = null;
      if (handlers[v]) { handlers[v](); continue; }
      if (extra.some((x) => x.value === v)) return v;
      if (v === 'formula' || v === 'restart') { reset(); if (v === 'formula') paintSummary(p); continue; }
      if (v === 'best') {
        amps = afterRounds(p, best!); phase = 'diffused'; rounds = best!; countsEl.innerHTML = '';
        paintChart(p, amps, false);
        shell.circuit(circuitFor(p, phase, rounds));
        shell.say(STEP.bestDone(rounds));
        prevChance = successProbability(amps, p.solution);
        continue;
      }
      if (v === 'h') {
        amps = superposition(p.vars.length); phase = 'h';
        paintChart(p, amps, false);
        shell.say(m === 0 ? STEP.noSolution : m === amps.length ? STEP.allSolutions : STEP.hDone(amps.length, m));
        prevChance = successProbability(amps, p.solution);
      } else if (v === 'oracle') {
        amps = oracle(amps, p.solution); phase = 'oracle'; countsEl.innerHTML = '';
        paintChart(p, amps, true);
        shell.say(m === 0 ? STEP.noSolution : STEP.oracleDone);
      } else if (v === 'diffuser') {
        amps = diffuser(amps); phase = 'diffused'; rounds++;
        paintChart(p, amps, true);
        const chance = successProbability(amps, p.solution);
        const change = chance > prevChance + 1e-9 ? 'up' : chance < prevChance - 1e-9 ? 'down' : 'same';
        shell.say(STEP.diffuserDone(rounds, change) + (best !== null && change === 'down' && rounds > best ? ` ${STEP.overshoot(best)}` : ''));
        prevChance = chance;
        track('Portal: 3sat round', { rounds, chance: Math.round(chance * 100) });
      } else if (v === 'measure') {
        const i = sample(amps);
        shell.say(STEP.measured(bitString(i, p.vars.length), describe(p, i), p.solution[i]));
        countsEl.innerHTML = '';
        track('Portal: 3sat measure', { rounds, result: p.solution[i] ? 'solution' : 'other' });
      } else if (v === 'many') {
        const counts = new Map<number, number>();
        let hits = 0;
        for (let s = 0; s < 1000; s++) { const i = sample(amps); counts.set(i, (counts.get(i) ?? 0) + 1); if (p.solution[i]) hits++; }
        shell.say(STEP.many(hits, 1000));
        const top = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 8);
        countsEl.innerHTML = `<table>${top.map(([i, c]) => `<tr><td>${bitString(i, p.vars.length)}</td><td>${describe(p, i)}</td><td>${c}</td><td class="${p.solution[i] ? 'win' : 'lose'}">${p.solution[i] ? '✓' : '✗'}</td></tr>`).join('')}</table>`;
      }
      shell.circuit(circuitFor(p, phase, rounds));
    }
  }

  function paintSummary(p: Puzzle) {
    const m = countSolutions(p), best = bestIterations(p.vars.length, m);
    summaryEl.innerHTML = summary(p.vars.length, 1 << p.vars.length, m, best, best === null ? null : predicted(p.vars.length, m, best));
  }

  /* ---- chapter 5: chance after k rounds ---- */
  function paintRounds(p: Puzzle) {
    const m = countSolutions(p), n = p.vars.length;
    const bars = Array.from({ length: 9 }, (_, k) => {
      const v = m === 0 ? 0 : predicted(n, m, k);
      return `<div class="bar"><span class="pct">${pct(v)}</span><span class="track"><i class="fill" style="height:${(v * 100).toFixed(1)}%"></i></span><span class="lbl">${k}</span></div>`;
    });
    const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    roundsChart.innerHTML = `<div class="bars" role="img" aria-label="${CH5.chartLabel}">${bars.join('')}</div><p class="cap">${CH5.chartLabel} (${CH5.rounds} 0–8): ${p === PARTY_PUZZLE ? CH5.party : p === SAT3_PUZZLE ? CH5.sat3 : esc(p.formula)}</p>`;
  }

  /* ---- stage events ---- */
  board.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;
    const f = t.closest<HTMLButtonElement>('.sat-friend');
    if (f && mode === 'party') { guests ^= 1 << Number(f.dataset.k); paintParty(); return; }
    const ex = t.closest<HTMLButtonElement>('.sat-examples button');
    if (ex && mode === 'custom') { input.value = ex.dataset.formula ?? ''; tryFormula(); return; }
    const which = t.closest<HTMLButtonElement>('.sat-rounds-pick button');
    if (which && mode === 'rounds') {
      root.querySelectorAll('.sat-rounds-pick button').forEach((b) => b.setAttribute('aria-pressed', String(b === which)));
      paintRounds(which.dataset.p === 'party' ? PARTY_PUZZLE : which.dataset.p === 'sat3' ? SAT3_PUZZLE : custom);
    }
  });
  root.querySelector('.sat-input')!.addEventListener('submit', (ev) => { ev.preventDefault(); tryFormula(); });
  function tryFormula() {
    try {
      const p = puzzle(input.value);
      custom = p;
      paintSummary(p);
      submitFormula?.(p);
      track('Portal: 3sat own formula', { vars: p.vars.length, solutions: countSolutions(p) });
    } catch (err) {
      if (!(err instanceof FormulaError)) throw err;
      summaryEl.innerHTML = `<span class="lose">${CH4.error(err.message, err.at)}</span>`;
    }
  }

  /* ---- chapters ---- */
  async function chapter1(e: number) {
    setMode('party');
    shell.setTitle(CH1.title);
    shell.setText(CH1.intro);
    tiles.innerHTML = '';
    paintParty();
    for (;;) {
      const v = await shell.ask(e, [{ label: CH1.checkAll, value: 'all', kind: 'primary' }, { label: CH1.next, value: 'next' }]);
      if (v === 'next') { shell.markDone(1); return shell.go(2); }
      showAllTiles();
      shell.say(CH1.allResult);
      track('Portal: 3sat check all');
    }
  }

  async function chapter2(e: number) {
    setMode('grover');
    shell.setTitle(CH2.title);
    shell.setText(CH2.intro);
    await stepper(e, PARTY_PUZZLE, [{ label: CH2.next, value: 'next' }]);
    shell.markDone(2);
    shell.go(3);
  }

  async function chapter3(e: number) {
    setMode('grover');
    shell.setTitle(CH3.title);
    shell.setText(CH3.intro);
    const check = () => {
      const list = SAT3_PUZZLE.solution.map((ok, i) => (ok ? i : -1)).filter((i) => i >= 0)
        .map((i) => `<b>${bitString(i, 3)}</b> (${describe(SAT3_PUZZLE, i)})`);
      shell.say(CH3.allResult(`${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`));
      track('Portal: 3sat check all', { puzzle: '3sat' });
    };
    await stepper(e, SAT3_PUZZLE, [{ label: CH3.checkAll, value: 'check' }, { label: CH3.next, value: 'next' }], false, { check });
    shell.markDone(3);
    shell.go(4);
  }

  async function chapter4(e: number) {
    setMode('custom');
    shell.setTitle(CH4.title);
    shell.setText(CH4.intro);
    input.value = custom.formula; // the box always shows the puzzle the chart describes
    paintSummary(custom);
    await stepper(e, custom, [{ label: CH4.next, value: 'next' }], true);
    shell.markDone(4);
    shell.go(5);
  }

  async function chapter5(e: number) {
    setMode('rounds');
    shell.setTitle(CH5.title);
    root.querySelectorAll('.sat-rounds-pick button').forEach((b) => b.setAttribute('aria-pressed', String((b as HTMLElement).dataset.p === 'party')));
    paintRounds(PARTY_PUZZLE);
    const table = [10, 20, 30, 40].map((n) =>
      `<tr><td>${n}</td><td>${(2 ** n).toLocaleString('en-US')}</td><td>${bestIterations(n, 1)!.toLocaleString('en-US')}</td></tr>`).join('');
    let s = 0;
    for (;;) {
      shell.setText(CH5.texts[s].replace('{{TABLE}}', table));
      if (s === 1) { // this section's text describes the party puzzle's chart
        root.querySelectorAll('.sat-rounds-pick button').forEach((b) => b.setAttribute('aria-pressed', String((b as HTMLElement).dataset.p === 'party')));
        paintRounds(PARTY_PUZZLE);
      }
      const v = await shell.ask(e, CH5.sections.map((label, i) => ({ label, value: i, kind: i === s ? ('current' as const) : undefined })));
      s = v;
      track('Portal: 3sat explain section', { section: s + 1 });
    }
  }

  const shell: Shell = mountShell(root, [chapter1, chapter2, chapter3, chapter4, chapter5], {
    game: '3sat',
    storageKey: 'fwq-3sat-done',
    terms: TERMS,
    labels: UI,
    locale: root.dataset.locale ?? 'en',
    onEnter: () => { setMode('off'); submitFormula = null; countsEl.innerHTML = ''; summaryEl.innerHTML = ''; },
  });
}
