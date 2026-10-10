/**
 * Browser side of the Quantum Coin Game: the animated 3D coin and the five chapters.
 *
 *   1  A fair game          — you vs. a classical computer, coin hidden: 50:50.
 *   2  vs. a quantum computer — same rules, the computer wins every round.
 *   3  Look inside           — the same round, box off, step by step: H · your move · H.
 *   4  You be quantum        — you are A with I/X/H against a random classical B.
 *   5  Sandbox               — any gates, live coin, measure many times.
 *   6  The math              — the notebook's derivation, each case played on the coin.
 *
 * Each chapter is a small async script; `ask()` waits for a button press, so the flow reads top
 * to bottom. Switching chapters bumps `epoch`, which makes every pending wait of the old chapter
 * throw `Abort` and end quietly.
 */
import { GATE_ROTATIONS, HEADS, apply, bloch, measure, pHeads, stateLabel, type GateName, type State } from './qubit';
import { emptyScore, quantumA, quantumB, randomClassical, tally, type Player, type Score, type Strategy } from './game';
import { IDENTITY, axisAngle, lift, mul, normalOf, shade, tipTo, toCss, toSphereView as toView, type Mat3 } from './rotation';
import { MESSAGES, doqLink, ibmLink, isLocale, rich, type Locale, type Messages, type TermKey } from './i18n';

type Chapter = 1 | 2 | 3 | 4 | 5 | 6;
const QUANTUM: ReadonlySet<GateName> = new Set(['H', 'Z', 'S']);

class Abort extends Error {}

declare global {
  interface Window { umami?: { track: (name: string, data?: Record<string, string | number>) => void } }
}
function track(name: string, data?: Record<string, string | number>) {
  try { window.umami?.track(name, data); } catch { /* analytics is best-effort */ }
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeIn = (t: number) => t * t * t;

/* ------------------------------------------------------------------ the coin */

/**
 * The Bloch sphere next to the coin, drawn from the same camera: outline, equator and the x–z
 * meridian (back halves dashed), the four game states labelled, and an arrow that is exactly the
 * coin's face normal.
 */
class BlochView {
  private vec: SVGLineElement;
  private tip: SVGCircleElement;
  private axisLayer: SVGGElement;
  private C = 75;
  private r = 52;
  constructor(svg: SVGSVGElement, m: Messages) {
    this.vec = svg.querySelector('.vec')!;
    this.tip = svg.querySelector('.tip')!;
    this.axisLayer = svg.querySelector('.axisline')!;
    const g = svg.querySelector('.sphere')!;
    const NS = 'http://www.w3.org/2000/svg';
    const el = (tag: string, attrs: Record<string, string | number>) => {
      const e = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
      g.appendChild(e);
      return e;
    };
    el('circle', { class: 'outline', cx: this.C, cy: this.C, r: this.r });
    for (const ring of [(t: number) => [Math.cos(t), Math.sin(t), 0] as const, (t: number) => [Math.cos(t), 0, Math.sin(t)] as const]) {
      let front = '', back = '';
      for (let i = 0; i <= 96; i++) {
        const t = (i / 96) * 2 * Math.PI;
        const v = toView(ring(t));
        const [x, y] = this.xy(v);
        const seg = `${x.toFixed(1)},${y.toFixed(1)} `;
        if (v[2] >= 0) { front += seg; back += '|'; } else { back += seg; front += '|'; }
      }
      for (const [cls, pts] of [['ring', front], ['ring back', back]] as const)
        for (const run of pts.split('|').map((p) => p.trim()).filter((p) => p.split(' ').length > 1))
          el('polyline', { class: cls, points: run });
    }
    const labels: [readonly [number, number, number], string, number, number][] = [
      [[0, 0, 1], `|0⟩ ${m.ui.heads}`, 0, -7], [[0, 0, -1], `|1⟩ ${m.ui.tails}`, 0, 13],
      [[1, 0, 0], '|+⟩', -11, 10], [[-1, 0, 0], '|−⟩', 11, -5],
      [[0, 1, 0], '+i', 10, 3], [[0, -1, 0], '−i', -10, 3],
    ];
    for (const [v, text, dx, dy] of labels) {
      const [x, y] = this.xy(toView(v));
      el('line', { class: 'axis', x1: this.C, y1: this.C, x2: x, y2: y });
      const t = el('text', { class: 'lbl', x: x + dx, y: y + dy, 'text-anchor': 'middle' });
      t.textContent = text;
    }
  }
  /** Dashed line through the sphere along a gate's rotation axis (null hides it). */
  showAxis(axis: readonly [number, number, number] | null) {
    const g = this.axisLayer;
    g.replaceChildren();
    if (!axis) return;
    const NS = 'http://www.w3.org/2000/svg';
    const [x1, y1] = this.xy(toView([-axis[0] * 1.18, -axis[1] * 1.18, -axis[2] * 1.18]));
    const [x2, y2] = this.xy(toView([axis[0] * 1.18, axis[1] * 1.18, axis[2] * 1.18]));
    const line = document.createElementNS(NS, 'line');
    for (const [k, v] of Object.entries({ x1, y1, x2, y2, class: 'rotaxis' })) line.setAttribute(k, String(v));
    g.appendChild(line);
  }
  private xy(v: readonly number[]): [number, number] {
    return [this.C + this.r * v[0], this.C + this.r * v[1]];
  }
  show(R: Mat3) {
    const v = toView(normalOf(R));
    const [x, y] = this.xy(v);
    this.vec.setAttribute('x2', x.toFixed(2));
    this.vec.setAttribute('y2', y.toFixed(2));
    this.tip.setAttribute('cx', x.toFixed(2));
    this.tip.setAttribute('cy', y.toFixed(2));
    const behind = v[2] < -0.05; // pointing away from us: draw it fainter
    this.vec.classList.toggle('behind', behind);
    this.tip.classList.toggle('behind', behind);
  }
}

class CoinView {
  R: Mat3 = IDENTITY;
  private bloch: BlochView | null;
  private pos: HTMLElement;
  private coin: HTMLElement;
  private scene: HTMLElement;
  constructor(private root: HTMLElement, m: Messages) {
    this.pos = root.querySelector('.qc-pos')!;
    this.coin = root.querySelector('.qc-coin')!;
    this.scene = root.querySelector('.qc-scene')!;
    const svg = root.querySelector<SVGSVGElement>('.qc-bloch svg');
    this.bloch = svg ? new BlochView(svg, m) : null;
    this.render();
  }
  private radius() { return (this.coin.offsetWidth || 180) / 2; }
  render() {
    const l = lift(this.R, this.radius());
    this.pos.style.transform = l.css;
    this.coin.style.transform = toCss(this.R);
    this.coin.style.setProperty('--light', (0.82 + 0.45 * shade(this.R)).toFixed(3));
    const up = l.height / this.radius(); // 0 flat … 1 standing
    this.scene.style.setProperty('--shadow-x', (1 - 0.55 * up).toFixed(3));
    this.scene.style.setProperty('--shadow-o', (1 - 0.35 * up).toFixed(3));
    this.bloch?.show(this.R);
  }
  set(R: Mat3) { this.R = R; this.render(); }
  showAxis(axis: readonly [number, number, number] | null) { this.bloch?.showAxis(axis); }
  /** Rotate about a fixed Bloch axis by `angle` over `ms` — a gate, played out. */
  rotate(axis: readonly [number, number, number], angle: number, ms: number, ease = easeInOut, guard?: () => void): Promise<void> {
    const R0 = this.R;
    const end = mul(axisAngle(axis, angle), R0);
    if (ms <= 0 || reducedMotion() || angle === 0) { this.set(end); return Promise.resolve(); }
    return new Promise((resolve, reject) => {
      const t0 = performance.now();
      const step = (now: number) => {
        try { guard?.(); } catch (e) { reject(e); return; } // chapter changed: the new one owns the coin now
        const t = Math.min(1, (now - t0) / ms);
        this.R = mul(axisAngle(axis, angle * ease(t)), R0);
        this.render();
        if (t < 1) requestAnimationFrame(step); else { this.set(end); resolve(); }
      };
      requestAnimationFrame(step);
    });
  }
  /** "Leave it": a small nudge so the move is visible, ending exactly where it started. */
  wobble(ms: number, guard?: () => void): Promise<void> {
    if (ms <= 0 || reducedMotion()) return Promise.resolve();
    const R0 = this.R;
    return new Promise((resolve, reject) => {
      const t0 = performance.now();
      const step = (now: number) => {
        try { guard?.(); } catch (e) { reject(e); return; }
        const t = Math.min(1, (now - t0) / ms);
        this.R = mul(axisAngle([0, 1, 0], 0.32 * Math.sin(Math.PI * t) * (1 - t * 0.3)), R0);
        this.render();
        if (t < 1) requestAnimationFrame(step); else { this.set(R0); resolve(); }
      };
      requestAnimationFrame(step);
    });
  }
  gate(g: GateName, ms = 900, guard?: () => void) {
    if (g === 'I') return this.wobble(ms * 0.7, guard);
    const { axis, angle } = GATE_ROTATIONS[g];
    return this.rotate(axis, angle, ms, easeInOut, guard);
  }
  /** Measurement: a coin on its edge tips over to the side that came up. */
  async fall(outcome: 'heads' | 'tails', guard?: () => void) {
    const { axis, angle } = tipTo(this.R, outcome === 'heads' ? [0, 0, 1] : [0, 0, -1]);
    if (angle < 1e-6) return this.wobble(380, guard);
    await this.rotate(axis, angle, 650, easeIn, guard);
    await this.rotate(axis, -0.12, 110, easeInOut, guard);
    await this.rotate(axis, 0.12, 140, easeInOut, guard);
  }
}

/* ------------------------------------------------------------------ the game */

interface Slot { gate: GateName | '?' | null; who: string; active?: boolean; secret?: boolean }

/**
 * What the player can see right now, for the assistant widget: never more. Moves the player
 * hasn't seen (the quantum computer's in chapter 2) are '?', and while the coin is in the box
 * there are no probabilities.
 */
export interface CoinSnapshot {
  game: 'quantum-coin-game';
  chapter: Chapter;
  starter?: 'computer' | 'you';
  you?: Player;
  lastRound?: { moves: (GateName | '?')[]; outcome: 'heads' | 'tails'; winner: Player; youWin: boolean };
  /** This chapter's last rounds, oldest first (at most ROUND_LOG), each with the player's seat. */
  rounds?: { you: Player; moves: (GateName | '?')[]; outcome: 'heads' | 'tails'; winner: Player; youWin: boolean }[];
  score?: Score;
  /** Scores of the other chapters played so far. */
  otherScores?: Partial<Record<Chapter, Score>>;
  sandbox?: GateName[];
  lastAction: string;
  facts?: { pHeads: number; stateLabel?: string };
}

export function mountCoinGame(root: HTMLElement) {
  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const lang = root.dataset.locale ?? 'en';
  const locale: Locale = isLocale(lang) ? lang : 'en';
  const m: Messages = MESSAGES[locale];
  const coin = new CoinView(root, m);
  const title = $('.qc-title'), text = $('.qc-text'), status = $('.qc-status');
  const actions = $('.qc-actions'), scoreEl = $('.qc-score'), circuitEl = $('.qc-circuit'), stateEl = $('.qc-state');
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('.qc-chapters button'));

  let state: State = HEADS;
  let epoch = 0;
  const scores: Record<Chapter, Score> = { 1: emptyScore(), 2: emptyScore(), 3: emptyScore(), 4: emptyScore(), 5: emptyScore(), 6: emptyScore() };
  let lastQuantumRound: GateName = 'X'; // your move in the last chapter-2 round, replayed in chapter 3
  /** Per-chapter facts for the assistant's snapshot; reset on every chapter change. */
  let seen: { lastRound?: CoinSnapshot['lastRound']; sandbox?: GateName[]; you?: Player; lastAction: string } = { lastAction: 'chapter-open' };
  /** Rounds per chapter for the assistant (what the player saw), kept across chapter changes. */
  const ROUND_LOG = 10;
  const roundLog: Record<Chapter, NonNullable<CoinSnapshot['rounds']>> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  const logRound = (ch: Chapter, you: Player, r: NonNullable<CoinSnapshot['lastRound']>) => {
    roundLog[ch].push({ you, ...r, moves: [...r.moves] });
    if (roundLog[ch].length > ROUND_LOG) roundLog[ch].shift();
  };

  const guardFor = (e: number) => () => { if (e !== epoch) throw new Abort(); };
  const wait = (ms: number, e: number) => new Promise<void>((res, rej) =>
    setTimeout(() => (e === epoch ? res() : rej(new Abort())), reducedMotion() ? Math.min(ms, 150) : ms));

  /* ---- small renderers ---- */
  const setText = (html: string) => { text.innerHTML = rich(html); };
  const say = (html: string) => { status.innerHTML = rich(html); };
  const showScore = (ch: Chapter) => {
    const s = scores[ch];
    scoreEl.textContent = s.rounds ? m.ui.score(s.you, s.computer, s.rounds) : '';
  };
  const sideName = (o: 'heads' | 'tails') => (o === 'heads' ? m.ui.heads : m.ui.tails);
  const cover = (on: boolean) => root.classList.toggle('covered', on);
  const shake = async (e: number) => { root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake'); await wait(520, e); root.classList.remove('shake'); };
  const showProbs = () => {
    const p = pHeads(state);
    root.querySelector<HTMLElement>('.fill.heads')!.style.width = `${p * 100}%`;
    root.querySelector<HTMLElement>('.fill.tails')!.style.width = `${(1 - p) * 100}%`;
    const covered = root.classList.contains('covered');
    root.querySelector('[data-p="heads"]')!.textContent = covered ? '?' : `${Math.round(p * 100)}%`;
    root.querySelector('[data-p="tails"]')!.textContent = covered ? '?' : `${Math.round((1 - p) * 100)}%`;
    const lbl = stateLabel(state);
    stateEl.textContent = covered ? m.ui.hiddenInBox : describe(state, lbl, m);
  };
  const circuit = (slots: Slot[] | null) => {
    if (!slots) { circuitEl.innerHTML = ''; return; }
    const parts = [`<span class="qc-wire-label">${m.ui.coin} |0⟩</span>`];
    for (const s of slots) {
      const g = s.gate;
      const cls = g === null ? 'empty' : g === '?' ? 'secret' : QUANTUM.has(g) ? 'quantum' : 'classical';
      parts.push('<span class="qc-seg"></span>');
      parts.push(`<span class="qc-gate ${cls}${s.active ? ' active' : ''}"><b>${g ?? ''}</b><i>${s.who}</i></span>`);
    }
    parts.push(`<span class="qc-seg"></span><span class="qc-gate qc-meter"><b>⌒↗</b><i>${m.ui.look}</i></span>`);
    circuitEl.innerHTML = parts.join('');
  };

  /** Render buttons, resolve with the chosen value; aborts if the chapter changes meanwhile. */
  function ask<T>(e: number, options: { label: string; value: T; kind?: 'primary' | 'quantum'; gate?: GateName }[], extra = ''): Promise<T> {
    actions.innerHTML = '';
    return new Promise<T>((resolve, reject) => {
      const myEpoch = e;
      for (const o of options) {
        const b = document.createElement('button');
        b.type = 'button';
        if (o.kind) b.classList.add(o.kind);
        b.innerHTML = o.gate ? `<span class="g">${o.gate}</span>${o.label}` : o.label;
        b.addEventListener('click', () => {
          if (myEpoch !== epoch) { reject(new Abort()); return; }
          actions.querySelectorAll('button').forEach((x) => (x.disabled = true));
          resolve(o.value);
        });
        actions.appendChild(b);
      }
      if (extra) actions.insertAdjacentHTML('beforeend', extra);
      actions.querySelector('button')?.focus({ preventScroll: true });
    });
  }

  const gatefx = $('.qc-gatefx');
  function explainGate(g: GateName | null) {
    gatefx.innerHTML = g ? rich(m.gates.fx[g]) : '';
    coin.showAxis(g && g !== 'I' ? GATE_ROTATIONS[g].axis : null);
  }

  async function animateGate(g: GateName, e: number, visible = true) {
    state = apply(g, state);
    if (visible) explainGate(g);
    if (visible) await coin.gate(g, 950, guardFor(e));
    else {
      const { axis, angle } = GATE_ROTATIONS[g];
      coin.set(mul(axisAngle(axis, angle), coin.R));
    }
    showProbs();
  }

  async function reveal(e: number): Promise<'heads' | 'tails'> {
    cover(false);
    showProbs();
    await wait(620, e);
    const p = pHeads(state);
    const outcome = measure(state);
    if (p > 0 && p < 1) {
      say(m.round.onEdge);
      await wait(700, e);
      await coin.fall(outcome, guardFor(e));
    }
    state = outcome === 'heads' ? HEADS : apply('X', HEADS);
    showProbs();
    return outcome;
  }

  function resetCoin() {
    state = HEADS;
    explainGate(null);
    coin.set(IDENTITY);
    cover(false);
    showProbs();
  }

  /* ---- chapters ---- */

  /**
   * One hidden-coin round against the computer. Whoever starts is player A and moves first and
   * last; the other (B) gets the single middle move. Heads → A wins, tails → B wins.
   */
  async function roundVs(e: number, ch: 1 | 2, you: Player, computer: Strategy) {
    resetCoin();
    const seat = (i: 0 | 1 | 2) => ((i === 1) === (you === 'B') ? 'you' : 'computer');
    const who = (i: 0 | 1 | 2) => (seat(i) === 'you' ? m.ui.whoYou : m.ui.whoComputer);
    const slots: Slot[] = [0, 1, 2].map((i) => ({ gate: null, who: who(i as 0 | 1 | 2) }));
    circuit(slots);
    say(m.round.startsHeads);
    await wait(900, e);
    cover(true); showProbs();
    await wait(600, e);

    const moves: GateName[] = [];
    const prompts = you === 'B' ? ['', m.round.yourMoveB, ''] : [m.round.youStartA, '', m.round.yourLastA];
    const computerLines = you === 'B' ? [m.round.computerFirst, '', m.round.computerLast] : ['', m.round.computerMiddle, ''];
    for (const i of [0, 1, 2] as const) {
      if (seat(i) === 'you') {
        slots[i] = { gate: null, who: m.ui.whoYou, active: true };
        circuit(slots);
        say(prompts[i]);
        const mv = await ask<GateName>(e, [
          { label: m.round.flipIt, value: 'X', gate: 'X', kind: 'primary' },
          { label: m.round.leaveIt, value: 'I', gate: 'I' },
        ]);
        actions.innerHTML = '';
        moves.push(mv);
        slots[i] = { gate: mv, who: m.ui.whoYou };
        circuit(slots);
        await shake(e);
        await animateGate(mv, e, false);
      } else {
        const mv = computer(i, Math.random);
        moves.push(mv);
        slots[i] = { gate: '?', who: m.ui.whoComputer, active: true };
        circuit(slots);
        say(computerLines[i]);
        await shake(e);
        await animateGate(mv, e, false);
        slots[i].active = false;
        circuit(slots);
      }
    }

    say(m.round.lifting);
    await wait(500, e);
    const outcome = await reveal(e);
    // The classical computer's moves aren't secret; the quantum computer's stay hidden until chapter 3.
    if (ch === 1) { moves.forEach((mv, i) => { slots[i].gate = mv; }); circuit(slots); }
    const winner: Player = outcome === 'heads' ? 'A' : 'B';
    const youWin = winner === you;
    scores[ch] = tally(scores[ch], you, winner);
    seen = { you, lastRound: { moves: slots.map((s) => s.gate ?? '?'), outcome, winner, youWin }, lastAction: 'round-finished' };
    logRound(ch, you, seen.lastRound!);
    if (ch === 2 && you === 'B') lastQuantumRound = moves[1];
    track('Portal: coin game round', { chapter: ch, result: youWin ? 'you win' : 'computer wins', starts: you === 'A' ? 'you' : 'computer' });
    return { youWin, outcome };
  }


  /** Who starts in chapters 1–2: the starter is player A (first and last move). */
  const starter: Record<1 | 2, 'computer' | 'you'> = { 1: 'computer', 2: 'computer' };
  const orderEl = root.querySelector<HTMLElement>('.qc-order')!;
  const youSeat = (ch: 1 | 2): Player => (starter[ch] === 'you' ? 'A' : 'B');
  const rulesLine = (ch: 1 | 2) => (starter[ch] === 'computer' ? m.ch1.rulesComputerFirst : m.ch1.rulesYouFirst);
  const winLine = (ch: 1 | 2) => (starter[ch] === 'computer' ? m.ch1.winComputerFirst : m.ch1.winYouFirst);

  async function chapter1(e: number) {
    title.textContent = m.ch1.title;
    setText(m.ch1.intro(rulesLine(1), winLine(1)));
    showScore(1);
    for (;;) {
      const { youWin, outcome } = await roundVs(e, 1, youSeat(1), randomClassical);
      say(youWin ? m.ch1.youWin(sideName(outcome)) : m.ch1.computerWins(sideName(outcome)));
      showScore(1);
      const s = scores[1];
      const next = await ask<'again' | 'next'>(e, [
        { label: m.round.playAgain, value: 'again', kind: s.rounds >= 3 ? undefined : 'primary' },
        { label: m.ch1.next, value: 'next', kind: s.rounds >= 3 ? 'primary' : undefined },
      ]);
      if (next === 'next') { markDone(1); return go(2); }
    }
  }

  async function chapter2(e: number) {
    title.textContent = m.ch2.title;
    const youStart = starter[2] === 'you';
    setText(youStart ? m.ch2.introYouFirst(winLine(2)) : m.ch2.introComputerFirst(rulesLine(2), winLine(2)));
    showScore(2);
    for (;;) {
      const { youWin, outcome } = await roundVs(e, 2, youSeat(2), youStart ? quantumB : quantumA);
      const s = scores[2];
      if (youStart) {
        say(youWin ? m.ch2.youStartWin : m.ch2.youStartLoss(sideName(outcome)));
      } else {
        const lines = m.ch2.lossLines;
        say(youWin ? m.ch2.impossible : `<strong>${lines[Math.min(s.computer - 1, lines.length - 1)]}</strong>`);
      }
      showScore(2);
      const opts: { label: string; value: 'again' | 'peek' | 'swap'; kind?: 'primary' }[] = [
        { label: m.round.playAgain, value: 'again', kind: s.rounds < 3 ? 'primary' : undefined },
      ];
      if (s.rounds >= 2) opts.push({ label: youStart ? m.ch2.peekYouFirst : m.ch2.peekComputerFirst, value: 'peek', kind: s.rounds >= 3 ? 'primary' : undefined });
      if (s.rounds >= 3) opts.push({ label: youStart ? m.ch2.swapToComputer : m.ch2.swapToYou, value: 'swap' });
      const next = await ask(e, opts);
      if (next === 'peek') { markDone(2); track('Portal: coin game peek'); return go(3); }
      if (next === 'swap') { setStarter(2, youStart ? 'computer' : 'you'); return; }
    }
  }

  function paintOrder(ch: Chapter) {
    const show = ch === 1 || ch === 2;
    orderEl.hidden = !show;
    if (!show) return;
    orderEl.querySelectorAll<HTMLButtonElement>('button').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.order === starter[ch as 1 | 2])));
  }
  function setStarter(ch: 1 | 2, who: 'computer' | 'you') {
    if (starter[ch] === who) return;
    starter[ch] = who;
    scores[ch] = emptyScore(); // a different game: start counting afresh
    roundLog[ch] = [];
    track('Portal: coin game order', { chapter: ch, starts: who });
    go(ch);
  }
  orderEl.querySelectorAll<HTMLButtonElement>('button').forEach((b) =>
    b.addEventListener('click', () => {
      const ch = current;
      if (ch === 1 || ch === 2) setStarter(ch, b.dataset.order as 'computer' | 'you');
    }));

  async function chapter3(e: number) {
    title.textContent = m.ch3.title;
    let yourMove: GateName = lastQuantumRound;
    for (;;) {
      resetCoin();
      const slots: Slot[] = [{ gate: 'H', who: m.ui.whoComputer }, { gate: yourMove, who: m.ui.whoYou }, { gate: 'H', who: m.ui.whoComputer }];
      circuit(slots);
      const math = (formula: string) => setText(m.ch3.intro + `<p class="math">${formula}</p>`);
      setText(m.ch3.intro);
      say(m.ch3.start);
      await ask(e, [{ label: m.ch3.nextComputer, value: 1, kind: 'primary' }]);

      slots[0].active = true; circuit(slots);
      seen = { lastAction: 'step' };
      await animateGate('H', e);
      say(m.ch3.afterH);
      math(m.ch3.mathH);
      await ask(e, [{ label: yourMove === 'X' ? m.ch3.nextFlip : m.ch3.nextLeave, value: 1, kind: 'primary' }]);

      slots[0].active = false; slots[1].active = true; circuit(slots);
      await animateGate(yourMove, e);
      say(yourMove === 'X' ? m.ch3.afterFlip : m.ch3.afterLeave);
      math(yourMove === 'X' ? m.ch3.mathFlip : m.ch3.mathLeave);
      await ask(e, [{ label: m.ch3.nextComputer2, value: 1, kind: 'primary' }]);

      slots[1].active = false; slots[2].active = true; circuit(slots);
      await animateGate('H', e);
      say(m.ch3.afterH2);
      math(m.ch3.mathH2);
      slots[2].active = false; circuit(slots);
      const next = await ask<'other' | 'next'>(e, [
        { label: yourMove === 'X' ? m.ch3.tryLeave : m.ch3.tryFlip, value: 'other' },
        { label: m.ch3.next, value: 'next', kind: 'primary' },
      ]);
      if (next === 'next') { markDone(3); return go(4); }
      yourMove = yourMove === 'X' ? 'I' : 'X';
    }
  }

  async function chapter4(e: number) {
    title.textContent = m.ch4.title;
    setText(m.ch4.intro);
    showScore(4);
    let losses = 0;
    const MOVES = [
      { label: m.ch4.moveFlip, value: 'X' as GateName, gate: 'X' as GateName },
      { label: m.ch4.moveLeave, value: 'I' as GateName, gate: 'I' as GateName },
      { label: m.ch4.moveH, value: 'H' as GateName, gate: 'H' as GateName, kind: 'quantum' as const },
    ];
    for (;;) {
      resetCoin();
      const slots: Slot[] = [{ gate: null, who: m.ui.whoYou, active: true }, { gate: null, who: m.ui.whoComputer }, { gate: null, who: m.ui.whoYou }];
      circuit(slots);
      say(losses >= 2 ? m.ch4.firstHint : m.ch4.first);
      const a1 = await ask(e, MOVES);
      actions.innerHTML = '';
      slots[0] = { gate: a1, who: m.ui.whoYou }; circuit(slots);
      await animateGate(a1, e);
      await wait(350, e);

      say(m.ch4.intoBox);
      cover(true); showProbs();
      await wait(500, e);
      const b = randomClassical(1, Math.random);
      slots[1] = { gate: '?', who: m.ui.whoComputer, active: true }; circuit(slots);
      await shake(e);
      await animateGate(b, e, false);
      slots[1].active = false; slots[2].active = true; circuit(slots);

      say(m.ch4.last);
      const a2 = await ask(e, MOVES);
      actions.innerHTML = '';
      slots[2] = { gate: a2, who: m.ui.whoYou }; circuit(slots);
      await shake(e);
      await animateGate(a2, e, false);

      say(m.round.lifting);
      await wait(400, e);
      const outcome = await reveal(e);
      slots[1].gate = b; circuit(slots);
      const youWin = outcome === 'heads';
      scores[4] = tally(scores[4], 'A', youWin ? 'A' : 'B');
      seen = { you: 'A', lastRound: { moves: [a1, b, a2], outcome, winner: youWin ? 'A' : 'B', youWin }, lastAction: 'round-finished' };
      logRound(4, 'A', seen.lastRound!);
      track('Portal: coin game round', { chapter: 4, result: youWin ? 'you win' : 'computer wins', strategy: a1 + a2 });
      if (!youWin) losses++;
      const sure = a1 === 'H' && a2 === 'H';
      say(youWin ? (sure ? m.ch4.sureWin : m.ch4.luckyWin(b === 'X')) : m.ch4.loss(b === 'X'));
      showScore(4);
      const next = await ask<'again' | 'next'>(e, [
        { label: m.round.playAgain, value: 'again', kind: sure ? undefined : 'primary' },
        { label: m.ch4.next, value: 'next', kind: sure ? 'primary' : undefined },
      ]);
      if (next === 'next') { markDone(4); return go(5); }
    }
  }

  async function chapter5(e: number) {
    title.textContent = m.ch5.title;
    setText(m.ch5.intro);
    const gates: GateName[] = [];
    resetCoin();
    const draw = () => {
      const slots: Slot[] = gates.map((g) => ({ gate: g, who: '' }));
      if (gates.length < 8) slots.push({ gate: null, who: '' });
      circuit(slots);
    };
    draw();
    say(m.ch5.addGate);
    scoreEl.textContent = '';
    for (;;) {
      const full = gates.length >= 8;
      const choice = await ask<GateName | 'undo' | 'reset' | 'measure' | 'many'>(e, [
        ...(['H', 'X', 'Z', 'S', 'I'] as GateName[]).map((g) => ({ label: m.gates.name[g], value: g, gate: g, kind: QUANTUM.has(g) ? ('quantum' as const) : undefined })),
        { label: m.ch5.measure, value: 'measure' as const, kind: 'primary' as const },
        { label: m.ch5.measureMany, value: 'many' as const },
        { label: m.ch5.undo, value: 'undo' as const },
        { label: m.ch5.reset, value: 'reset' as const },
      ].filter((o) => !(full && typeof o.value === 'string' && o.value.length === 1)),
      `<a href="https://qubins.org/launch/?image=2.1-xl-rise&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=Quantum-Coin-Game.ipynb&ui=rise-classic" target="_blank" rel="noopener" data-umami-event="Portal: notebook launch" data-umami-event-target="qubins" data-umami-event-image="2.1-xl-rise" data-umami-event-notebook="Quantum-Coin-Game.ipynb">${m.ch5.notebook}</a>`);
      seen = { sandbox: gates, lastAction: typeof choice === 'string' && choice.length > 1 ? choice : 'gate' };
      if (choice === 'reset') { gates.length = 0; resetCoin(); draw(); say(m.ch5.backToHeads); scoreEl.textContent = ''; continue; }
      if (choice === 'undo') {
        gates.pop(); resetCoin();
        for (const g of gates) { state = apply(g, state); coin.set(mul(axisAngle(GATE_ROTATIONS[g].axis, GATE_ROTATIONS[g].angle), coin.R)); }
        showProbs(); draw(); say(m.ch5.undone); continue;
      }
      if (choice === 'many') {
        let h = 0; for (let i = 0; i < 100; i++) if (measure(state) === 'heads') h++;
        scoreEl.textContent = m.ch5.many(h, 100 - h, Math.round(pHeads(state) * 100), Math.round((1 - pHeads(state)) * 100));
        track('Portal: coin game sandbox', { action: 'measure 100', gates: gates.join('') || '-' });
        continue;
      }
      if (choice === 'measure') {
        seen = { lastAction: 'measured' };
        const outcome = await reveal(e);
        say(m.ch5.measured(sideName(outcome)));
        gates.length = 0; draw();
        track('Portal: coin game sandbox', { action: 'measure', outcome });
        continue;
      }
      gates.push(choice);
      draw();
      await animateGate(choice, e);
      say(m.ch5.played(choice, m.gates.name[choice]));
    }
  }

  /** Chapter 6: the derivation of both cases; each choice plays H, your move, H on the coin. */
  async function chapter6(e: number) {
    title.textContent = m.ch6.title;
    resetCoin();
    circuit(null);
    setText(m.ch6.intro);
    say(m.ch6.pick);
    let last: 'I' | 'X' | null = null;
    for (;;) {
      const choice: 'I' | 'X' = await ask<'I' | 'X'>(e, [
        { label: m.ch6.leave, value: 'I', gate: 'I', kind: last === null ? 'primary' : undefined },
        { label: m.ch6.flip, value: 'X', gate: 'X', kind: last === 'I' ? 'primary' : undefined },
      ]);
      actions.innerHTML = '';
      last = choice;
      seen = { lastAction: choice === 'I' ? 'math-leave' : 'math-flip' };
      resetCoin();
      setText(m.ch6.intro + (choice === 'I' ? m.ch6.caseLeave : m.ch6.caseFlip) + m.ch6.conclusion);
      say('');
      const slots: Slot[] = [{ gate: 'H', who: m.ui.whoComputer }, { gate: choice, who: m.ui.whoYou }, { gate: 'H', who: m.ui.whoComputer }];
      for (let i = 0; i < 3; i++) {
        slots.forEach((s, k) => { s.active = k === i; });
        circuit(slots);
        await animateGate(slots[i].gate as GateName, e);
        await wait(350, e);
      }
      slots[2].active = false;
      circuit(slots);
      say(m.ch6.done);
      track('Portal: coin game math', { case: choice });
    }
  }

  /* ---- explanations on demand ---- */
  // Any element with data-term inside the game opens its explanation; "Explain" opens the index.
  // Links go to IBM Quantum Learning (in the player's language where IBM has it) and to the same
  // page on doQumentation, where the code runs.
  const dlg = root.querySelector<HTMLDialogElement>('.qc-explain')!;
  const dlgBody = dlg.querySelector<HTMLElement>('.qc-explain-body')!;
  const TERMS = Object.keys(m.glossary) as TermKey[];
  const isTerm = (x: string | undefined): x is TermKey => !!x && (TERMS as string[]).includes(x);
  function explain(term: TermKey | null) {
    if (term) {
      const g = m.glossary[term];
      dlgBody.innerHTML = `<button type="button" class="qc-back" data-term="">${m.ui.allTerms}</button>
        <h3 tabindex="-1">${g.title}</h3>
        <p>${rich(g.body)}</p>
        <p class="qc-more">
          <a href="${ibmLink(term, locale)}" target="_blank" rel="noopener" data-umami-event="Portal: coin game learn more" data-umami-event-site="ibm" data-umami-event-term="${term}">${m.ui.learnMoreIbm}</a><br>
          <a href="${doqLink(term, locale)}" target="_blank" rel="noopener" data-umami-event="Portal: coin game learn more" data-umami-event-site="doqumentation" data-umami-event-term="${term}">${m.ui.learnMoreDoq}</a>
        </p>`;
      track('Portal: coin game explain', { term, lang: locale });
    } else {
      dlgBody.innerHTML = `<h3 tabindex="-1">${m.ui.explainTitle}</h3>
        <ul class="qc-terms">${TERMS.map((t) => `<li><button type="button" class="qc-term" data-term="${t}">${m.glossary[t].title}</button></li>`).join('')}</ul>`;
    }
    if (!dlg.open) dlg.showModal();
    dlgBody.querySelector<HTMLElement>('h3')?.focus();
  }
  root.addEventListener('click', (ev) => {
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-term]');
    if (!el || !root.contains(el)) return;
    ev.preventDefault();
    explain(isTerm(el.dataset.term) ? el.dataset.term : null);
  });
  root.querySelector('.qc-explain-btn')?.addEventListener('click', () => explain(null));
  dlg.querySelector('.qc-close')?.addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (ev) => { // a click on the backdrop (outside the box) closes
    const r = dlg.getBoundingClientRect();
    if (ev.target === dlg && (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom)) dlg.close();
  });

  /* ---- navigation ---- */
  const CHAPTERS: Record<Chapter, (e: number) => Promise<void>> = { 1: chapter1, 2: chapter2, 3: chapter3, 4: chapter4, 5: chapter5, 6: chapter6 };
  const DONE_KEY = 'fwq-coin-done';
  const done = new Set<number>((() => { try { return JSON.parse(localStorage.getItem(DONE_KEY) ?? '[]'); } catch { return []; } })());
  function markDone(ch: Chapter) {
    done.add(ch);
    try { localStorage.setItem(DONE_KEY, JSON.stringify([...done])); } catch { /* private mode: fine */ }
    paintTabs(ch);
  }
  function paintTabs(current: Chapter) {
    for (const t of tabs) {
      const n = Number(t.dataset.chapter);
      t.setAttribute('aria-selected', String(n === current));
      const isDone = done.has(n) && n !== current;
      t.classList.toggle('done', isDone);
      const badge = t.querySelector('.n');
      if (badge) badge.textContent = isDone ? '✓' : String(n);
    }
  }
  let current: Chapter = 1;
  function go(ch: Chapter, initial = false) {
    const e = ++epoch;
    current = ch;
    seen = { lastAction: 'chapter-open' };
    paintTabs(ch);
    paintOrder(ch);
    actions.innerHTML = ''; scoreEl.textContent = ''; say('');
    resetCoin();
    if (!initial) track('Portal: coin game chapter', { chapter: ch }); // page views already count chapter 1
    CHAPTERS[ch](e).catch((err) => { if (!(err instanceof Abort)) console.error(err); });
  }
  tabs.forEach((t) => t.addEventListener('click', () => go(Number(t.dataset.chapter) as Chapter)));
  window.addEventListener('resize', () => coin.render());
  go(1, true);

  function snapshot(): CoinSnapshot {
    const snap: CoinSnapshot = { game: 'quantum-coin-game', chapter: current, lastAction: seen.lastAction };
    if (current === 1 || current === 2) { snap.starter = starter[current]; snap.you = youSeat(current); }
    if (current === 4) snap.you = 'A';
    if (seen.lastRound) snap.lastRound = { ...seen.lastRound, moves: [...seen.lastRound.moves] };
    if (roundLog[current].length) snap.rounds = roundLog[current].map((r) => ({ ...r, moves: [...r.moves] }));
    if (scores[current].rounds) snap.score = { ...scores[current] };
    const others = ([1, 2, 3, 4, 5, 6] as Chapter[]).filter((c) => c !== current && scores[c].rounds);
    if (others.length) snap.otherScores = Object.fromEntries(others.map((c) => [c, { ...scores[c] }]));
    if (current === 5 && seen.sandbox) snap.sandbox = [...seen.sandbox];
    if (!root.classList.contains('covered')) {
      const lbl = stateLabel(state);
      snap.facts = { pHeads: pHeads(state), ...(lbl ? { stateLabel: lbl } : {}) };
    }
    return snap;
  }
  return { snapshot };
}

function describe(s: State, lbl: string | null, m: Messages): string {
  const [x, y, z] = bloch(s);
  if (lbl === '|0⟩') return m.states.zero;
  if (lbl === '|1⟩') return m.states.one;
  if (lbl === '|+⟩') return m.states.plus;
  if (lbl === '|−⟩') return m.states.minus;
  return m.states.other(x.toFixed(2), y.toFixed(2), z.toFixed(2));
}
