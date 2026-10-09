/**
 * Browser side of the quantum prisoner's dilemma (markup: components/PrisonersDilemmaGame.astro).
 *
 *   1  The dilemma     — play C or D against a random Bob; defecting dominates.
 *   2  Quantum moves   — J, your U(θ, φ), Bob's C/D/Q, J†: exact odds and points, sampled rounds.
 *   3  Why Q wins      — the payoff map against Bob's move; (Q, Q) is the equilibrium.
 *   4  The catch       — all one-qubit moves: a counter to every move; random moves give 2.25.
 */
import { mountShell, track, type Shell } from '../games/shell';
import { circuitSvg } from '../games/circuit';
import {
  C, COUNTER_Q, D, Q, QUATERNIONS, counterMove, gameSteps, landscape, outcomes, payoffs,
  playRound, points, randomMove, type Bit, type Move,
} from './game';
import { CH1, CH2, CH3, CH4, TERMS, UI } from './messages';

type Mode = 'classic' | 'quantum' | 'map' | 'full' | 'off';
const NAMES: Record<string, Move> = { C, D, Q };
const same = (a: Move, b: Move) => a.theta === b.theta && a.phi === b.phi && (a.alpha ?? 0) === (b.alpha ?? 0);
const nameOf = (m: Move) => Object.keys(NAMES).find((k) => same(NAMES[k], m)) ?? UI.describe(m);

export function mountPd(root: HTMLElement) {
  const board = root.querySelector<HTMLElement>('.pd-board')!;
  const matrix = root.querySelector<HTMLElement>('.pd-matrix')!;
  const bobBtns = Array.from(root.querySelectorAll<HTMLButtonElement>('.pd-bob button'));
  const bobLabel = root.querySelector<HTMLElement>('.pd-bob .label')!;
  const presetBtns = Array.from(root.querySelectorAll<HTMLButtonElement>('.pd-presets button'));
  const sliders = Array.from(root.querySelectorAll<HTMLInputElement>('.pd-slider input'));
  const sliderOut = Array.from(root.querySelectorAll<HTMLOutputElement>('.pd-slider output'));
  const odds = root.querySelector<HTMLElement>('.pd-odds')!;
  const land = root.querySelector<HTMLElement>('.pd-land')!;

  let mode: Mode = 'off';
  let you: Move = { ...Q };
  let bob: Move = { ...D };
  let lastRound: { a: Bit; b: Bit } | null = null;
  let onChange: (() => void) | null = null;

  function setMode(m: Mode) {
    mode = m; board.dataset.mode = m; lastRound = null;
    if (m === 'quantum' || m === 'map') { // EWL's two angles; Bob back to C, D or Q
      you = { theta: you.theta, phi: Math.min(90, you.phi) };
      if (!Object.values(NAMES).some((n) => same(n, bob))) bob = { ...D };
    }
    sliders[1].max = m === 'full' ? '359' : '90';
  }

  /* ---- the points table: 2×2 classically, C/D/Q quantum ---- */
  function paintMatrix() {
    const keys = mode === 'classic' ? ['C', 'D'] : ['C', 'D', 'Q'];
    const head = `<tr><th>${UI.you} ↓ · ${UI.bob} →</th>${keys.map((k) => `<th>${k}</th>`).join('')}</tr>`;
    const rows = keys.map((a) => `<tr><th>${a}</th>${keys.map((b) => {
      const [pa, pb] = payoffs(NAMES[a], NAMES[b]);
      const on = mode === 'classic' ? !!lastRound && UI.move(lastRound.a) === a && UI.move(lastRound.b) === b : same(you, NAMES[a]) && same(bob, NAMES[b]);
      return `<td class="${on ? 'on' : ''}">${pa.toFixed(0)}, ${pb.toFixed(0)}</td>`;
    }).join('')}</tr>`).join('');
    matrix.innerHTML = `<table aria-label="${UI.matrixTitle}"><caption>${UI.matrixTitle}</caption>${head}${rows}</table>`;
  }

  /* ---- outcome odds for the current moves ---- */
  function paintOdds() {
    const p = outcomes(you, bob), [ea, eb] = payoffs(you, bob);
    const labels = ['C · C', 'D · C', 'C · D', 'D · D']; // index a + 2b: your move first
    odds.innerHTML = `<div class="pd-bars">${[0, 2, 1, 3].map((i) => `<div class="pd-bar${lastRound && lastRound.a + 2 * lastRound.b === i ? ' hit' : ''}"><span class="lab">${labels[i]}</span><span class="track"><span class="fill" style="width:${(100 * p[i]).toFixed(1)}%"></span></span><span class="num">${(100 * p[i]).toFixed(1)}%</span></div>`).join('')}</div>`
      + `<p class="pd-exp">${UI.expected(ea, eb)}</p>`;
  }

  /* ---- the payoff map (chapter 3) ---- */
  function paintLand() {
    const { thetas, phis, pts } = landscape(bob);
    const W = 19, H = 19, cell = 12, left = 30, top = 8;
    let best = { v: -1, i: 0, j: 0 };
    pts.forEach((row, j) => row.forEach((v, i) => { if (v > best.v + 1e-9) best = { v, i, j }; }));
    const color = (v: number) => `hsl(${(v / 5) * 140}, 65%, ${38 + v * 4}%)`;
    const rects = pts.map((row, j) => row.map((v, i) =>
      `<rect class="lc${you.theta === thetas[i] && you.phi === phis[j] && !you.alpha ? ' me' : ''}" data-theta="${thetas[i]}" data-phi="${phis[j]}" x="${left + i * cell}" y="${top + (H - 1 - j) * cell}" width="${cell}" height="${cell}" fill="${color(v)}"><title>θ ${thetas[i]}°, φ ${phis[j]}°: ${v.toFixed(2)}</title></rect>`).join('')).join('');
    land.innerHTML = `<svg class="pd-land-svg" viewBox="0 0 ${left + W * cell + 70} ${top + H * cell + 30}" role="img" aria-label="${UI.landTitle(nameOf(bob))}">`
      + rects
      + `<rect class="best" x="${left + best.i * cell}" y="${top + (H - 1 - best.j) * cell}" width="${cell}" height="${cell}"/>`
      + `<text class="ax" x="${left}" y="${top + H * cell + 14}">θ 0°</text><text class="ax" x="${left + W * cell}" y="${top + H * cell + 14}" text-anchor="end">180°</text>`
      + `<text class="ax" x="${left - 4}" y="${top + H * cell}" text-anchor="end">φ 0°</text><text class="ax" x="${left - 4}" y="${top + 10}" text-anchor="end">90°</text>`
      + [0, 1, 2, 3, 4, 5].map((v) => `<rect x="${left + W * cell + 14}" y="${top + (5 - v) * 34}" width="12" height="34" fill="${color(v)}"/><text class="ax" x="${left + W * cell + 30}" y="${top + (5 - v) * 34 + 20}">${v}</text>`).join('')
      + `</svg><p class="pd-land-cap">${UI.landTitle(nameOf(bob))}</p>`;
    return { pts: best.v, move: { theta: thetas[best.i], phi: phis[best.j] } as Move };
  }

  function paintMoves() {
    const vals = [you.theta, you.phi, you.alpha ?? 0];
    sliders.forEach((s, i) => {
      const v = Math.round(vals[i]) % (i === 0 ? 181 : 360);
      s.value = String(v); s.setAttribute('aria-valuetext', `${v} degrees`); sliderOut[i].textContent = `${v}°`;
    });
    presetBtns.forEach((b) => b.setAttribute('aria-pressed', String(same(you, NAMES[b.dataset.m!]))));
    bobBtns.forEach((b) => b.setAttribute('aria-pressed', String(same(bob, NAMES[b.dataset.m!]))));
    bobLabel.textContent = `${UI.bobPlays}: ${nameOf(bob)}`;
  }

  function repaint() {
    paintMoves();
    if (mode !== 'classic') { paintOdds(); shell.circuit(circuitSvg(UI.qubits, gameSteps(you, bob), UI.circuitTitle)); }
    if (mode === 'classic' || mode === 'quantum') paintMatrix();
    if (mode === 'map') onChange?.();
  }

  /* ---- stage controls ---- */
  board.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;
    const preset = t.closest<HTMLButtonElement>('.pd-presets button');
    const bobBtn = t.closest<HTMLButtonElement>('.pd-bob button');
    const lc = t.closest<SVGRectElement>('rect.lc');
    if (preset) { you = { ...NAMES[preset.dataset.m!] }; lastRound = null; repaint(); }
    else if (bobBtn) { bob = { ...NAMES[bobBtn.dataset.m!] }; lastRound = null; repaint(); }
    else if (lc && mode === 'map') { you = { theta: Number(lc.dataset.theta), phi: Number(lc.dataset.phi) }; lastRound = null; repaint(); }
  });
  sliders.forEach((s, i) => s.addEventListener('input', () => {
    const v = Number(s.value);
    you = i === 0 ? { ...you, theta: v } : i === 1 ? { ...you, phi: v } : { ...you, alpha: v };
    lastRound = null;
    repaint();
  }));

  /* ---- chapter 1 ---- */
  async function chapter1(e: number) {
    setMode('classic');
    shell.setTitle(CH1.title);
    shell.setText(CH1.intro);
    paintMatrix();
    const t = { cN: 0, cP: 0, dN: 0, dP: 0 };
    for (;;) {
      const v = await shell.ask(e, [
        { label: CH1.coop, value: 'C' as const, kind: 'primary' as const }, { label: CH1.defect, value: 'D' as const, kind: 'primary' as const },
        { label: CH1.why, value: 'why' as const }, { label: CH1.next, value: 'next' as const },
      ]);
      if (v === 'next') { shell.markDone(1); return shell.go(2); }
      if (v === 'why') { shell.setText(CH1.proof); shell.say(CH1.proofSaid); track('Portal: pd why defect'); continue; }
      const a: Bit = v === 'D' ? 1 : 0, b: Bit = Math.random() < 0.5 ? 0 : 1, [pa, pb] = points(a, b);
      if (a) { t.dN++; t.dP += pa; } else { t.cN++; t.cP += pa; }
      lastRound = { a, b };
      paintMatrix();
      shell.say(CH1.round(a, b, pa, pb));
      shell.score(CH1.tally(t.cN, t.cP, t.dN, t.dP));
      track('Portal: pd classical round', { move: v });
    }
  }

  /* ---- chapter 2 ---- */
  async function chapter2(e: number) {
    setMode('quantum');
    shell.setTitle(CH2.title);
    shell.setText(CH2.intro);
    repaint();
    for (;;) {
      const v = await shell.ask(e, [
        { label: CH2.play, value: 'play' as const, kind: 'primary' as const }, { label: CH2.many, value: 'many' as const },
        { label: CH2.next, value: 'next' as const },
      ]);
      if (v === 'next') { shell.markDone(2); return shell.go(3); }
      if (v === 'play') {
        const r = playRound(you, bob);
        lastRound = { a: r.a, b: r.b };
        repaint();
        shell.say(CH2.round(r.a, r.b, r.alice, r.bob) + (same(you, Q) && same(bob, D) ? `<br><small>${CH2.qSaid}</small>` : ''));
        track('Portal: pd quantum round', { you: nameOf(you), bob: nameOf(bob) });
      } else {
        let pa = 0, pb = 0;
        for (let i = 0; i < 1000; i++) { const r = playRound(you, bob); pa += r.alice; pb += r.bob; }
        const [ea, eb] = payoffs(you, bob);
        shell.say(CH2.manyResult(pa, pb, 1000, ea, eb));
        track('Portal: pd 1000 rounds', { you: nameOf(you), bob: nameOf(bob) });
      }
    }
  }

  /* ---- chapter 3 ---- */
  async function chapter3(e: number) {
    setMode('map');
    shell.setTitle(CH3.title);
    shell.setText(CH3.intro);
    onChange = () => { const best = paintLand(); shell.say(CH3.best(nameOf(bob), best.pts, nameOf(best.move))); };
    repaint();
    await shell.ask(e, [{ label: CH3.next, value: 'next' as const, kind: 'primary' as const }]);
    shell.markDone(3);
    shell.go(4);
  }

  /* ---- chapter 4 ---- */
  async function chapter4(e: number) {
    setMode('full');
    shell.setTitle(CH4.title);
    bob = { ...Q };
    repaint();
    let s = 0;
    for (;;) {
      shell.setText(CH4.texts[s]);
      const extra = s === 0 ? [{ label: CH4.counterQ, value: 'counter' as const, kind: 'primary' as const }]
        : s === 1 ? [{ label: CH4.randomBob, value: 'random' as const, kind: 'primary' as const }]
        : s === 2 ? [{ label: CH4.mixed, value: 'mixed' as const, kind: 'primary' as const }] : [];
      const v = await shell.ask<number | 'counter' | 'random' | 'mixed'>(e, [
        ...extra,
        ...CH4.sections.map((label, i) => ({ label, value: i as number | 'counter' | 'random' | 'mixed', kind: i === s ? ('current' as const) : undefined })),
      ]);
      if (typeof v === 'number') { s = v; track('Portal: pd catch section', { section: s + 1 }); continue; }
      if (v === 'counter') {
        bob = { ...Q }; you = { ...COUNTER_Q }; repaint();
        const [pa, pb] = payoffs(you, bob);
        shell.say(CH4.counterResult(pa, pb));
      } else if (v === 'random') {
        bob = randomMove();
        const c = counterMove(bob);
        you = c.move;
        repaint();
        shell.say(CH4.randomResult(UI.describe(bob), UI.describe(you), c.points));
      } else {
        const avg = QUATERNIONS.reduce((sum, m) => sum + payoffs(you, m)[0], 0) / QUATERNIONS.length;
        bobLabel.textContent = `${UI.bobPlays}: ${UI.mixLabel}`;
        odds.innerHTML = `<p class="pd-exp">${UI.mixExpected(avg)}</p>`;
        shell.say(CH4.mixedResult(UI.describe(you), avg));
      }
      track('Portal: pd catch', { action: v });
    }
  }

  const shell: Shell = mountShell(root, [chapter1, chapter2, chapter3, chapter4], {
    game: 'pd',
    storageKey: 'fwq-pd-done',
    terms: TERMS,
    labels: UI,
    locale: root.dataset.locale ?? 'en',
    onEnter: () => { setMode('off'); onChange = null; },
  });
}
