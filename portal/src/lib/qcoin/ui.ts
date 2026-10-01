/**
 * Browser side of the Quantum Coin Game: the animated 3D coin and the five chapters.
 *
 *   1  A fair game          — you vs. a classical computer, coin hidden: 50:50.
 *   2  vs. a quantum computer — same rules, the computer wins every round.
 *   3  Look inside           — the same round, box off, step by step: H · your move · H.
 *   4  You be quantum        — you are A with I/X/H against a random classical B.
 *   5  Sandbox               — any gates, live coin, measure many times.
 *
 * Each chapter is a small async script; `ask()` waits for a button press, so the flow reads top
 * to bottom. Switching chapters bumps `epoch`, which makes every pending wait of the old chapter
 * throw `Abort` and end quietly.
 */
import { GATE_ROTATIONS, HEADS, apply, bloch, measure, pHeads, stateLabel, type GateName, type State } from './qubit';
import { emptyScore, quantumA, quantumB, randomClassical, tally, type Player, type Score, type Strategy } from './game';
import { IDENTITY, axisAngle, lift, mul, normalOf, shade, tipTo, toCss, toSphereView as toView, type Mat3 } from './rotation';

type Chapter = 1 | 2 | 3 | 4 | 5;
const QUANTUM: ReadonlySet<GateName> = new Set(['H', 'Z', 'S']);
const GATE_TEXT: Record<GateName, string> = { I: 'leave it', X: 'flip it', H: 'Hadamard', Z: 'phase flip', S: 'quarter phase' };

/** What each gate does on the Bloch sphere — shown while the gate plays. */
const GATE_FX: Record<GateName, string> = {
  I: '<b>I</b> · no rotation — the arrow stays where it is.',
  X: '<b>X</b> · half turn (180°) about the <b>x axis</b> (through |+⟩ and |−⟩): heads ↔ tails, while |+⟩ and |−⟩ stay put.',
  H: '<b>H</b> · half turn (180°) about the <b>diagonal between x and z</b>: |0⟩ ↔ |+⟩ and |1⟩ ↔ |−⟩ — flat ↔ on its edge.',
  Z: '<b>Z</b> · half turn (180°) about the <b>z axis</b> (through |0⟩ and |1⟩): |+⟩ ↔ |−⟩, while heads and tails stay put.',
  S: '<b>S</b> · quarter turn (90°) about the <b>z axis</b>: |+⟩ → |+i⟩ — a phase only an H can turn into heads or tails.',
};

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
  constructor(svg: SVGSVGElement) {
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
      [[0, 0, 1], '|0⟩ heads', 0, -7], [[0, 0, -1], '|1⟩ tails', 0, 13],
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
  constructor(private root: HTMLElement) {
    this.pos = root.querySelector('.qc-pos')!;
    this.coin = root.querySelector('.qc-coin')!;
    this.scene = root.querySelector('.qc-scene')!;
    const svg = root.querySelector<SVGSVGElement>('.qc-bloch svg');
    this.bloch = svg ? new BlochView(svg) : null;
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

export function mountCoinGame(root: HTMLElement) {
  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const coin = new CoinView(root);
  const title = $('.qc-title'), text = $('.qc-text'), status = $('.qc-status');
  const actions = $('.qc-actions'), scoreEl = $('.qc-score'), circuitEl = $('.qc-circuit'), stateEl = $('.qc-state');
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('.qc-chapters button'));

  let state: State = HEADS;
  let epoch = 0;
  const scores: Record<Chapter, Score> = { 1: emptyScore(), 2: emptyScore(), 3: emptyScore(), 4: emptyScore(), 5: emptyScore() };
  let lastQuantumRound: GateName = 'X'; // your move in the last chapter-2 round, replayed in chapter 3

  const guardFor = (e: number) => () => { if (e !== epoch) throw new Abort(); };
  const wait = (ms: number, e: number) => new Promise<void>((res, rej) =>
    setTimeout(() => (e === epoch ? res() : rej(new Abort())), reducedMotion() ? Math.min(ms, 150) : ms));

  /* ---- small renderers ---- */
  const setText = (html: string) => { text.innerHTML = html; };
  const say = (html: string) => { status.innerHTML = html; };
  const showScore = (ch: Chapter, youAre: string) => {
    const s = scores[ch];
    scoreEl.textContent = s.rounds ? `Score — ${youAre}: ${s.you} · computer: ${s.computer} · rounds: ${s.rounds}` : '';
  };
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
    stateEl.textContent = covered ? 'hidden in the box' : describe(state, lbl);
  };
  const circuit = (slots: Slot[] | null, label = 'coin') => {
    if (!slots) { circuitEl.innerHTML = ''; return; }
    const parts = [`<span class="qc-wire-label">${label} |0⟩</span>`];
    for (const s of slots) {
      const g = s.gate;
      const cls = g === null ? 'empty' : g === '?' ? 'secret' : QUANTUM.has(g) ? 'quantum' : 'classical';
      parts.push('<span class="qc-seg"></span>');
      parts.push(`<span class="qc-gate ${cls}${s.active ? ' active' : ''}"><b>${g ?? ''}</b><i>${s.who}</i></span>`);
    }
    parts.push('<span class="qc-seg"></span><span class="qc-gate qc-meter"><b>⌒↗</b><i>look</i></span>');
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
    gatefx.innerHTML = g ? GATE_FX[g] : '';
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
      say('The coin is on its edge — heads <em>and</em> tails. Looking forces a choice…');
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
    const slots: Slot[] = [0, 1, 2].map((i) => ({ gate: null, who: seat(i as 0 | 1 | 2) }));
    circuit(slots);
    say('The coin starts <strong>heads</strong>. Into the box it goes…');
    await wait(900, e);
    cover(true); showProbs();
    await wait(600, e);

    const moves: GateName[] = [];
    const prompts = you === 'B'
      ? ['', 'Your move. Turn the coin over, or leave it as it is?', '']
      : ['You start. Turn the coin over, or leave it?', '', 'Your last move — still blind. Flip it, or leave it?'];
    const computerLines = you === 'B'
      ? ['The computer makes its first move — you can’t see it.', '', 'The computer makes its final move…']
      : ['', 'The computer makes its move — you can’t see it.', ''];
    for (const i of [0, 1, 2] as const) {
      if (seat(i) === 'you') {
        slots[i] = { gate: null, who: 'you', active: true };
        circuit(slots);
        say(prompts[i]);
        const m = await ask<GateName>(e, [
          { label: 'Flip it', value: 'X', gate: 'X', kind: 'primary' },
          { label: 'Leave it', value: 'I', gate: 'I' },
        ]);
        actions.innerHTML = '';
        moves.push(m);
        slots[i] = { gate: m, who: 'you' };
        circuit(slots);
        await shake(e);
        await animateGate(m, e, false);
      } else {
        const m = computer(i, Math.random);
        moves.push(m);
        slots[i] = { gate: '?', who: 'computer', active: true };
        circuit(slots);
        say(computerLines[i]);
        await shake(e);
        await animateGate(m, e, false);
        slots[i].active = false;
        circuit(slots);
      }
    }

    say('Lifting the box!');
    await wait(500, e);
    const outcome = await reveal(e);
    // The classical computer's moves aren't secret; the quantum computer's stay hidden until chapter 3.
    if (ch === 1) { moves.forEach((m, i) => { slots[i].gate = m; }); circuit(slots); }
    const winner: Player = outcome === 'heads' ? 'A' : 'B';
    const youWin = winner === you;
    scores[ch] = tally(scores[ch], you, winner);
    if (ch === 2 && you === 'B') lastQuantumRound = moves[1];
    track('Portal: coin game round', { chapter: ch, result: youWin ? 'you win' : 'computer wins', starts: you === 'A' ? 'you' : 'computer' });
    return { youWin, outcome };
  }

  const LOSS_LINES = [
    'Heads. The quantum computer wins.',
    'Heads again. Bad luck?',
    'Heads. Three in a row — that’s not luck any more.',
    'Heads. Every. Single. Time.',
    'Heads. It doesn’t matter what you do, does it?',
  ];

  /** Who starts in chapters 1–2: the starter is player A (first and last move). */
  const starter: Record<1 | 2, 'computer' | 'you'> = { 1: 'computer', 2: 'computer' };
  const orderEl = root.querySelector<HTMLElement>('.qc-order')!;
  const youSeat = (ch: 1 | 2): Player => (starter[ch] === 'you' ? 'A' : 'B');
  const rulesLine = (ch: 1 | 2) => starter[ch] === 'computer'
    ? 'The computer moves, then you, then the computer again.'
    : 'You move, then the computer, then you again.';
  const winLine = (ch: 1 | 2) => starter[ch] === 'computer'
    ? '<strong>Tails: you win. Heads: the computer wins.</strong>'
    : '<strong>Heads: you win. Tails: the computer wins.</strong> (Whoever starts wins on heads.)';

  async function chapter1(e: number) {
    title.textContent = '1 · A fair game';
    setText(`<p>You and the computer share one coin, hidden in a box. It starts <strong>heads</strong>. ${rulesLine(1)} Each move is <em>flip it</em> or <em>leave it</em>, and nobody sees the other's moves.</p>
      <p>${winLine(1)} Can either side do better than a coin toss?</p>`);
    showScore(1, 'you');
    for (;;) {
      const { youWin, outcome } = await roundVs(e, 1, youSeat(1), randomClassical);
      const side = outcome === 'heads' ? 'Heads' : 'Tails';
      say(youWin ? `<strong>${side} — you win!</strong> The computer was guessing too.` : `<strong>${side} — the computer wins.</strong> It had no secret, just luck.`);
      showScore(1, 'you');
      const s = scores[1];
      const next = await ask<'again' | 'next'>(e, [
        { label: 'Play again', value: 'again', kind: s.rounds >= 3 ? undefined : 'primary' },
        { label: 'Now play a quantum computer →', value: 'next', kind: s.rounds >= 3 ? 'primary' : undefined },
      ]);
      if (next === 'next') { markDone(1); return go(2); }
    }
  }

  async function chapter2(e: number) {
    title.textContent = '2 · Against a quantum computer';
    const youStart = starter[2] === 'you';
    setText(youStart
      ? `<p>This time <strong>you start</strong>, so you get the first and the last move; the <strong>quantum computer</strong> only gets the move in the middle. ${winLine(2)}</p>
         <p>Does quantum power still help it?</p>`
      : `<p>Same box, same coin, same rules: ${rulesLine(2)} ${winLine(2)} Only your opponent has changed — it now runs on a <strong>quantum computer</strong>.</p>
         <p>Play a few rounds. Try everything.</p>`);
    showScore(2, 'you');
    for (;;) {
      const { youWin, outcome } = await roundVs(e, 2, youSeat(2), youStart ? quantumB : quantumA);
      const s = scores[2];
      if (youStart) {
        say(youWin
          ? '<strong>Heads — you win!</strong> With only the middle move, the quantum computer’s H can’t steer anything.'
          : `<strong>${outcome === 'heads' ? 'Heads' : 'Tails'} — the computer wins this one.</strong> Pure luck: from the middle, quantum power is worth nothing.`);
      } else {
        say(youWin ? 'Tails?! (This should be impossible — tell us how you did it.)' : `<strong>${LOSS_LINES[Math.min(s.computer - 1, LOSS_LINES.length - 1)]}</strong>`);
      }
      showScore(2, 'you');
      const opts: { label: string; value: 'again' | 'peek' | 'swap'; kind?: 'primary' }[] = [
        { label: 'Play again', value: 'again', kind: s.rounds < 3 ? 'primary' : undefined },
      ];
      if (s.rounds >= 2) opts.push({ label: youStart ? 'Why? Look inside →' : 'How does it do that? Look inside →', value: 'peek', kind: s.rounds >= 3 ? 'primary' : undefined });
      if (s.rounds >= 3) opts.push({ label: youStart ? 'Let the computer start' : 'Let me start instead', value: 'swap' });
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
    track('Portal: coin game order', { chapter: ch, starts: who });
    go(ch);
  }
  orderEl.querySelectorAll<HTMLButtonElement>('button').forEach((b) =>
    b.addEventListener('click', () => {
      const ch = current;
      if (ch === 1 || ch === 2) setStarter(ch, b.dataset.order as 'computer' | 'you');
    }));

  async function chapter3(e: number) {
    title.textContent = '3 · Look inside the box';
    let yourMove: GateName = lastQuantumRound;
    for (;;) {
      resetCoin();
      const slots: Slot[] = [{ gate: 'H', who: 'computer' }, { gate: yourMove, who: 'you' }, { gate: 'H', who: 'computer' }];
      circuit(slots);
      const intro = `<p>Here is the round again — box off, one step at a time. The quantum computer's secret is one move a normal coin doesn't have: the <strong>Hadamard gate, H</strong> — played <em>before and after</em> your move. That's why it must start: with only the middle move (try “You start” in chapter 2), H gives no edge at all.</p>`;
      const math = (m: string) => setText(intro + `<p class="math">${m}</p>`);
      setText(intro);
      say('Start: the coin lies <strong>heads</strong> up. In quantum terms: |0⟩, all chances on heads.');
      await ask(e, [{ label: 'Next: the computer’s move ▸', value: 1, kind: 'primary' }]);

      slots[0].active = true; circuit(slots);
      await animateGate('H', e);
      say('<strong>H stands the coin on its edge.</strong> It is now heads <em>and</em> tails at once — a superposition, 50:50 if you looked now.');
      math('|0⟩ → H → (|0⟩ + |1⟩)/√2');
      await ask(e, [{ label: yourMove === 'X' ? 'Next: you flip it ▸' : 'Next: you leave it ▸', value: 1, kind: 'primary' }]);

      slots[0].active = false; slots[1].active = true; circuit(slots);
      await animateGate(yourMove, e);
      say(yourMove === 'X'
        ? '<strong>You flipped it — and nothing changed.</strong> Turning over a coin that is heads and tails at once just swaps the two: it is still heads-and-tails.'
        : '<strong>You left it.</strong> Still standing on its edge: heads and tails at once.');
      math(yourMove === 'X' ? 'X: (|0⟩ + |1⟩)/√2 → (|1⟩ + |0⟩)/√2 — the same state' : 'I: (|0⟩ + |1⟩)/√2 stays (|0⟩ + |1⟩)/√2');
      await ask(e, [{ label: 'Next: the computer’s second move ▸', value: 1, kind: 'primary' }]);

      slots[1].active = false; slots[2].active = true; circuit(slots);
      await animateGate('H', e);
      say('<strong>The second H lays it back down — heads, with certainty.</strong> The two ways of ending up tails cancel each other out; the two ways to heads add up. That is <em>interference</em>.');
      math('H: (|0⟩ + |1⟩)/√2 → ½(|0⟩+|1⟩) + ½(|0⟩−|1⟩) = |0⟩');
      slots[2].active = false; circuit(slots);
      const next = await ask<'other' | 'next'>(e, [
        { label: yourMove === 'X' ? 'Try it with “leave it”' : 'Try it with “flip it”', value: 'other' },
        { label: 'Now you be the quantum computer →', value: 'next', kind: 'primary' },
      ]);
      if (next === 'next') { markDone(3); return go(4); }
      yourMove = yourMove === 'X' ? 'I' : 'X';
    }
  }

  async function chapter4(e: number) {
    title.textContent = '4 · You be the quantum computer';
    setText(`<p>Swap seats: <strong>you are A</strong> now, with three moves — <em>flip</em> (X), <em>leave</em> (I) and the quantum <strong>H</strong>. The computer plays B, flipping or not at random, in secret.</p>
      <p>Heads wins for you. Can you win every round?</p>`);
    showScore(4, 'you');
    let losses = 0;
    const MOVES = [
      { label: 'Flip', value: 'X' as GateName, gate: 'X' as GateName },
      { label: 'Leave', value: 'I' as GateName, gate: 'I' as GateName },
      { label: 'Hadamard', value: 'H' as GateName, gate: 'H' as GateName, kind: 'quantum' as const },
    ];
    for (;;) {
      resetCoin();
      const slots: Slot[] = [{ gate: null, who: 'you', active: true }, { gate: null, who: 'computer' }, { gate: null, who: 'you' }];
      circuit(slots);
      say(losses >= 2 ? 'Your first move. (Hint: what made the coin stand on its edge in chapter 3?)' : 'Your first move — you can watch this one.');
      const a1 = await ask(e, MOVES);
      actions.innerHTML = '';
      slots[0] = { gate: a1, who: 'you' }; circuit(slots);
      await animateGate(a1, e);
      await wait(350, e);

      say('Into the box — now the computer moves in secret.');
      cover(true); showProbs();
      await wait(500, e);
      const b = randomClassical(1, Math.random);
      slots[1] = { gate: '?', who: 'computer', active: true }; circuit(slots);
      await shake(e);
      await animateGate(b, e, false);
      slots[1].active = false; slots[2].active = true; circuit(slots);

      say('Your last move — blind, the coin stays in the box.');
      const a2 = await ask(e, MOVES);
      actions.innerHTML = '';
      slots[2] = { gate: a2, who: 'you' }; circuit(slots);
      await shake(e);
      await animateGate(a2, e, false);

      say('Lifting the box!');
      await wait(400, e);
      const outcome = await reveal(e);
      slots[1].gate = b; circuit(slots);
      const youWin = outcome === 'heads';
      scores[4] = tally(scores[4], 'A', youWin ? 'A' : 'B');
      track('Portal: coin game round', { chapter: 4, result: youWin ? 'you win' : 'computer wins', strategy: a1 + a2 });
      if (!youWin) losses++;
      const sure = a1 === 'H' && a2 === 'H';
      say(youWin
        ? (sure ? '<strong>Heads — and it always will be.</strong> H, anything, H: you just became the quantum computer.' : '<strong>Heads — you win!</strong> But was that skill or luck? The computer flipped ' + (b === 'X' ? 'the coin.' : 'nothing.'))
        : `<strong>Tails — the computer wins.</strong> It ${b === 'X' ? 'flipped the coin' : 'left the coin alone'}.`);
      showScore(4, 'you');
      const next = await ask<'again' | 'next'>(e, [
        { label: 'Play again', value: 'again', kind: sure ? undefined : 'primary' },
        { label: 'Open the sandbox →', value: 'next', kind: sure ? 'primary' : undefined },
      ]);
      if (next === 'next') { markDone(4); return go(5); }
    }
  }

  async function chapter5(e: number) {
    title.textContent = '5 · Sandbox';
    setText(`<p>Your coin, your gates. Add moves and watch the coin: lying flat is heads or tails, standing on its edge is a superposition. <strong>Z</strong> and <strong>S</strong> turn a standing coin around — invisible to a measurement until an H brings it back.</p>`);
    const gates: GateName[] = [];
    resetCoin();
    const draw = () => {
      const slots: Slot[] = gates.map((g) => ({ gate: g, who: '' }));
      if (gates.length < 8) slots.push({ gate: null, who: '' });
      circuit(slots);
    };
    draw();
    say('Add a gate.');
    scoreEl.textContent = '';
    for (;;) {
      const full = gates.length >= 8;
      const choice = await ask<GateName | 'undo' | 'reset' | 'measure' | 'many'>(e, [
        ...(['H', 'X', 'Z', 'S', 'I'] as GateName[]).map((g) => ({ label: GATE_TEXT[g], value: g, gate: g, kind: QUANTUM.has(g) ? ('quantum' as const) : undefined })),
        { label: 'Look (measure)', value: 'measure' as const, kind: 'primary' as const },
        { label: 'Measure 100×', value: 'many' as const },
        { label: 'Undo', value: 'undo' as const },
        { label: 'Reset', value: 'reset' as const },
      ].filter((o) => !(full && typeof o.value === 'string' && o.value.length === 1)),
      `<a href="https://qubins.org/launch/?image=2.1-xl-rise&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=Quantum-Coin-Game.ipynb&ui=rise-classic" target="_blank" rel="noopener" data-umami-event="Portal: notebook launch" data-umami-event-target="qubins" data-umami-event-image="2.1-xl-rise" data-umami-event-notebook="Quantum-Coin-Game.ipynb">The real Qiskit notebook ↗</a>`);
      if (choice === 'reset') { gates.length = 0; resetCoin(); draw(); say('Back to heads.'); scoreEl.textContent = ''; continue; }
      if (choice === 'undo') {
        gates.pop(); resetCoin();
        for (const g of gates) { state = apply(g, state); coin.set(mul(axisAngle(GATE_ROTATIONS[g].axis, GATE_ROTATIONS[g].angle), coin.R)); }
        showProbs(); draw(); say('Undone.'); continue;
      }
      if (choice === 'many') {
        let h = 0; for (let i = 0; i < 100; i++) if (measure(state) === 'heads') h++;
        scoreEl.textContent = `100 measurements: ${h}× heads, ${100 - h}× tails (expected ${Math.round(pHeads(state) * 100)} : ${Math.round((1 - pHeads(state)) * 100)})`;
        track('Portal: coin game sandbox', { action: 'measure 100', gates: gates.join('') || '-' });
        continue;
      }
      if (choice === 'measure') {
        const outcome = await reveal(e);
        say(`<strong>${outcome === 'heads' ? 'Heads' : 'Tails'}.</strong> Looking collapsed the coin — add more gates, or reset.`);
        gates.length = 0; draw();
        track('Portal: coin game sandbox', { action: 'measure', outcome });
        continue;
      }
      gates.push(choice);
      draw();
      await animateGate(choice, e);
      say(`${choice}: ${GATE_TEXT[choice]}.`);
    }
  }

  /* ---- navigation ---- */
  const CHAPTERS: Record<Chapter, (e: number) => Promise<void>> = { 1: chapter1, 2: chapter2, 3: chapter3, 4: chapter4, 5: chapter5 };
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
}

function describe(s: State, lbl: string | null): string {
  const [x, , z] = bloch(s);
  if (lbl === '|0⟩') return '|0⟩ · heads, lying flat';
  if (lbl === '|1⟩') return '|1⟩ · tails, lying flat';
  if (lbl === '|+⟩') return '|+⟩ = (|0⟩+|1⟩)/√2 · on its edge, heads side out';
  if (lbl === '|−⟩') return '|−⟩ = (|0⟩−|1⟩)/√2 · on its edge, tails side out';
  return `on its edge, turned · Bloch (${x.toFixed(2)}, ${bloch(s)[1].toFixed(2)}, ${z.toFixed(2)})`;
}
