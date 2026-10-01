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
import { emptyScore, play, quantumA, randomClassical, tally, type Score, type Strategy } from './game';
import { IDENTITY, axisAngle, lift, mul, shade, tipTo, toCss, type Mat3 } from './rotation';

type Chapter = 1 | 2 | 3 | 4 | 5;
const QUANTUM: ReadonlySet<GateName> = new Set(['H', 'Z', 'S']);
const GATE_TEXT: Record<GateName, string> = { I: 'leave it', X: 'flip it', H: 'Hadamard', Z: 'phase flip', S: 'quarter phase' };

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

class CoinView {
  R: Mat3 = IDENTITY;
  private pos: HTMLElement;
  private coin: HTMLElement;
  private scene: HTMLElement;
  constructor(private root: HTMLElement) {
    this.pos = root.querySelector('.qc-pos')!;
    this.coin = root.querySelector('.qc-coin')!;
    this.scene = root.querySelector('.qc-scene')!;
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
  }
  set(R: Mat3) { this.R = R; this.render(); }
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

  async function animateGate(g: GateName, e: number, visible = true) {
    state = apply(g, state);
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
    coin.set(IDENTITY);
    cover(false);
    showProbs();
  }

  /* ---- chapters ---- */

  /** One round where you are B: computer moves, you flip or not, computer moves, reveal. */
  async function roundAsB(e: number, ch: 1 | 2, computer: Strategy) {
    resetCoin();
    const slots: Slot[] = [{ gate: null, who: 'computer' }, { gate: null, who: 'you' }, { gate: null, who: 'computer' }];
    circuit(slots);
    say('The coin starts <strong>heads</strong>. Into the box it goes…');
    await wait(900, e);
    cover(true); showProbs();
    await wait(600, e);

    const a1 = computer(0, Math.random);
    slots[0] = { gate: '?', who: 'computer', active: true };
    circuit(slots);
    say('The computer makes its first move — you can’t see it.');
    await shake(e);
    await animateGate(a1, e, false);
    slots[0].active = false;

    slots[1] = { gate: null, who: 'you', active: true };
    circuit(slots);
    say('Your move. Turn the coin over, or leave it as it is?');
    const b = await ask<GateName>(e, [
      { label: 'Flip it', value: 'X', gate: 'X', kind: 'primary' },
      { label: 'Leave it', value: 'I', gate: 'I' },
    ]);
    actions.innerHTML = '';
    slots[1] = { gate: b, who: 'you' };
    circuit(slots);
    await shake(e);
    await animateGate(b, e, false);

    const a2 = computer(2, Math.random);
    slots[2] = { gate: '?', who: 'computer', active: true };
    circuit(slots);
    say('The computer makes its final move…');
    await shake(e);
    await animateGate(a2, e, false);
    slots[2].active = false;
    circuit(slots);

    say('Lifting the box!');
    await wait(500, e);
    const outcome = await reveal(e);
    if (ch === 1) { slots[0].gate = a1; slots[2].gate = a2; circuit(slots); } // classical moves aren't secret
    const youWin = outcome === 'tails';
    scores[ch] = tally(scores[ch], 'B', youWin ? 'B' : 'A');
    if (ch === 2) lastQuantumRound = b;
    track('Portal: coin game round', { chapter: ch, result: youWin ? 'you win' : 'computer wins' });
    return youWin;
  }

  const LOSS_LINES = [
    'Heads. The quantum computer wins.',
    'Heads again. Bad luck?',
    'Heads. Three in a row — that’s not luck any more.',
    'Heads. Every. Single. Time.',
    'Heads. It doesn’t matter what you do, does it?',
  ];

  async function chapter1(e: number) {
    title.textContent = '1 · A fair game';
    setText(`<p>You and the computer share one coin, hidden in a box. It starts <strong>heads</strong>. The computer moves, then you, then the computer again — each move is <em>flip it</em> or <em>leave it</em>, and nobody sees the others' moves.</p>
      <p><strong>Tails: you win. Heads: the computer wins.</strong> Can either side do better than a coin toss?</p>`);
    showScore(1, 'you');
    for (;;) {
      const youWin = await roundAsB(e, 1, randomClassical);
      say(youWin ? '<strong>Tails — you win!</strong> The computer was guessing too.' : '<strong>Heads — the computer wins.</strong> It had no secret, just luck.');
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
    setText(`<p>Same box, same coin, same rules: tails, you win; heads, the computer wins. Only your opponent has changed — it now runs on a <strong>quantum computer</strong>.</p>
      <p>Play a few rounds. Try everything.</p>`);
    showScore(2, 'you');
    for (;;) {
      const youWin = await roundAsB(e, 2, quantumA);
      const n = scores[2].computer;
      say(youWin ? 'Tails?! (This should be impossible — tell us how you did it.)' : `<strong>${LOSS_LINES[Math.min(n - 1, LOSS_LINES.length - 1)]}</strong>`);
      showScore(2, 'you');
      const opts: { label: string; value: 'again' | 'peek'; kind?: 'primary' }[] = [{ label: 'Play again', value: 'again', kind: n < 3 ? 'primary' : undefined }];
      if (n >= 2) opts.push({ label: 'How does it do that? Look inside →', value: 'peek', kind: n >= 3 ? 'primary' : undefined });
      const next = await ask(e, opts);
      if (next === 'peek') { markDone(2); track('Portal: coin game peek'); return go(3); }
    }
  }

  async function chapter3(e: number) {
    title.textContent = '3 · Look inside the box';
    let yourMove: GateName = lastQuantumRound;
    for (;;) {
      resetCoin();
      const slots: Slot[] = [{ gate: 'H', who: 'computer' }, { gate: yourMove, who: 'you' }, { gate: 'H', who: 'computer' }];
      circuit(slots);
      const intro = `<p>Here is the round again — box off, one step at a time. The quantum computer's secret is one move a normal coin doesn't have: the <strong>Hadamard gate, H</strong>.</p>`;
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
  function go(ch: Chapter, initial = false) {
    const e = ++epoch;
    paintTabs(ch);
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
