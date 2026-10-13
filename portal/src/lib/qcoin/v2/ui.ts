/**
 * The redesigned Quantum Coin Game (v2), from testers' feedback and a look at similar learning
 * games (PhET, Hello Quantum, Nicky Case, Chris Ferrie's "… for Babies"):
 *
 *  - one short caption per step; the long text sits behind "Why?" (v1's chapter intros);
 *  - one primary action, big, right under the coin; the circuit strip doubles as the rules;
 *  - "Same round, other move": replays a round with the computer's moves fixed, side by side;
 *  - guess before the box comes off; a tally of small coins instead of a score line;
 *  - chapters 3 and 6 step forward and back, and tapping your box in the circuit changes your move;
 *  - the sandbox's circuit boxes show the coin at that point;
 *  - a bigger Bloch sphere that leaves a trail of the round's path.
 *
 * The flow is v1's (ui.ts): each chapter is an async script; `ask()` waits for a button (or a tap
 * on a circuit box); switching chapters bumps `epoch`, which aborts every pending wait.
 */
import { GATE_ROTATIONS, HEADS, apply, bloch, measure, pHeads, stateLabel, type GateName, type State } from '../qubit';
import { quantumA, quantumB, randomClassical, type Player, type Strategy } from '../game';
import { IDENTITY, axisAngle, mul } from '../rotation';
import { CoinView, reducedMotion } from '../view';
import { MESSAGES, doqLink, ibmLink, rich, type Messages, type TermKey } from '../i18n';
import { MESSAGES_V2, isLocaleV2, paint, plain, type LocaleV2, type MessagesV2 } from './index';
import { roundMoves } from './flow';

type Chapter = 1 | 2 | 3 | 4 | 5 | 6;
type Side = 'heads' | 'tails';
const QUANTUM: ReadonlySet<GateName> = new Set(['H', 'Z', 'S']);

class Abort extends Error {}

declare global {
  interface Window { umami?: { track: (name: string, data?: Record<string, string | number>) => void } }
}
function track(name: string, data: Record<string, string | number> = {}) {
  try { window.umami?.track(name, { ...data, v: 2 }); } catch { /* analytics is best-effort */ }
}

interface Slot { gate: GateName | '?' | null; who: string; active?: boolean; tap?: string }
interface Option<T> { label: string; value: T; kind?: 'primary' | 'quantum'; gate?: GateName }
interface Played { moves: GateName[]; shown: (GateName | '?')[]; computer: GateName[]; outcome: Side; youWin: boolean }

export function mountCoinGameV2(root: HTMLElement) {
  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const lang = root.dataset.locale ?? 'en';
  const locale: LocaleV2 = isLocaleV2(lang) ? lang : 'en';
  const m: Messages = MESSAGES[locale];
  const t: MessagesV2 = MESSAGES_V2[locale];
  const coin = new CoinView(root, { heads: m.ui.heads, tails: m.ui.tails }, { trail: true });
  const status = $('.qc-status'), mathEl = $('.qc-math'), actions = $('.qc-actions'), circuitEl = $('.qc-circuit');
  const goalEl = $('.qc-goal'), compareEl = $('.qc-compare'), tallyEl = $('.qc-tally'), stateEl = $('.qc-state');
  const why = $<HTMLDetailsElement>('.qc-why'), whyText = $('.qc-text'), gatefx = $('.qc-gatefx');
  const strip = $('.qc-chapters');
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('.qc-chapters button'));

  let state: State = HEADS;
  let epoch = 0;
  let current: Chapter = 1;
  let lastQuantumRound: GateName = 'X'; // your move in the last chapter-2 round, shown again in chapter 3
  /** Rounds per chapter (what the tally shows) and guesses. What-if replays count in neither. */
  const rounds: Record<Chapter, { outcome: Side; youWin: boolean }[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  const guesses: Record<Chapter, { right: number; total: number }> = { 1: { right: 0, total: 0 }, 2: { right: 0, total: 0 }, 3: { right: 0, total: 0 }, 4: { right: 0, total: 0 }, 5: { right: 0, total: 0 }, 6: { right: 0, total: 0 } };

  const guardFor = (e: number) => () => { if (e !== epoch) throw new Abort(); };
  const wait = (ms: number, e: number) => new Promise<void>((res, rej) =>
    setTimeout(() => (e === epoch ? res() : rej(new Abort())), reducedMotion() ? Math.min(ms, 150) : ms));

  /* ---- small renderers ---- */
  const side = (o: Side) => `{${o === 'heads' ? 'h' : 't'}:${o === 'heads' ? m.ui.heads : m.ui.tails}}`;
  const say = (...lines: string[]) => { status.innerHTML = lines.filter(Boolean).map((l) => `<span>${paint(l)}</span>`).join(' '); };
  const setMath = (html: string) => { mathEl.innerHTML = rich(html); };
  const setWhy = (html: string, open = false) => { whyText.innerHTML = rich(html); why.hidden = !html; why.open = open; };
  const setGoal = (s: Side | null) => { goalEl.innerHTML = s ? paint(t.ui.goal(side(s))) : ''; };
  const cover = (on: boolean) => { root.classList.toggle('covered', on); coin.recordTrail = !on; };
  const shake = async (e: number) => { root.classList.remove('shake'); void root.offsetWidth; root.classList.add('shake'); await wait(520, e); root.classList.remove('shake'); };
  const showProbs = () => {
    const p = pHeads(state);
    $('.fill.heads').style.width = `${p * 100}%`;
    $('.fill.tails').style.width = `${(1 - p) * 100}%`;
    const covered = root.classList.contains('covered');
    $('[data-p="heads"]').textContent = covered ? '?' : `${Math.round(p * 100)}%`;
    $('[data-p="tails"]').textContent = covered ? '?' : `${Math.round((1 - p) * 100)}%`;
    stateEl.textContent = covered ? m.ui.hiddenInBox : describe(state, m);
  };

  const circuit = (s: Slot[] | null, start = '|0⟩') => {
    if (!s) { circuitEl.innerHTML = ''; return; }
    const parts = [`<span class="qc-wire-label">${m.ui.coin} ${start}</span>`];
    s.forEach((x, i) => {
      const g = x.gate;
      const cls = `qc-gate ${g === null ? 'empty' : g === '?' ? 'secret' : QUANTUM.has(g) ? 'quantum' : 'classical'}${x.active ? ' active' : ''}${x.tap ? ' tap' : ''}`;
      parts.push('<span class="qc-seg"></span>');
      const inner = `<b>${g ?? ''}</b><i>${x.who}</i>`;
      parts.push(x.tap
        ? `<button type="button" class="${cls}" data-slot="${i}" aria-label="${x.tap}">${inner}</button>`
        : `<span class="${cls}">${inner}</span>`);
    });
    parts.push(`<span class="qc-seg"></span><span class="qc-gate qc-meter"><b>⌒↗</b><i>${m.ui.look}</i></span>`);
    circuitEl.innerHTML = parts.join('');
  };

  /** Set once the player has answered something here; only then do new questions take the focus. */
  let playing = false;
  root.addEventListener('click', (ev) => { if ((ev.target as HTMLElement).closest('.qc-actions, .qc-circuit')) playing = true; });
  /** The pending question: buttons, and (optionally) circuit boxes that answer it too. */
  let pending: { e: number; resolve: (v: unknown) => void; taps: Record<number, unknown> } | null = null;
  function ask<T>(e: number, options: Option<T>[], opts: { taps?: Record<number, T>; extra?: string; nudge?: boolean } = {}): Promise<T> {
    actions.innerHTML = '';
    return new Promise<T>((resolve, reject) => {
      const done = (v: T) => {
        if (e !== epoch) { reject(new Abort()); return; }
        pending = null;
        actions.querySelectorAll('button').forEach((x) => (x.disabled = true));
        resolve(v);
      };
      pending = { e, resolve: done as (v: unknown) => void, taps: opts.taps ?? {} };
      for (const o of options) {
        const b = document.createElement('button');
        b.type = 'button';
        if (o.kind) b.classList.add(o.kind);
        if (opts.nudge && o.kind === 'primary') b.classList.add('nudge');
        b.innerHTML = o.gate ? `<span class="g">${o.gate}</span>${paint(o.label)}` : paint(o.label);
        b.addEventListener('click', () => done(o.value));
        actions.appendChild(b);
      }
      if (opts.extra) actions.insertAdjacentHTML('beforeend', opts.extra);
      // keyboard and screen-reader users keep their place: the answered button is gone, focus the next question
      if (playing) (actions.querySelector<HTMLElement>('button.primary') ?? actions.querySelector<HTMLElement>('button'))?.focus({ preventScroll: true });
    });
  }
  circuitEl.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-slot]');
    if (!b || !pending) return;
    const i = Number(b.dataset.slot);
    if (i in pending.taps) pending.resolve(pending.taps[i]);
  });

  function explainGate(g: GateName | null) {
    gatefx.innerHTML = g ? rich(m.gates.fx[g]) : '';
    coin.showAxis(g && g !== 'I' ? GATE_ROTATIONS[g].axis : null);
  }

  async function animateGate(g: GateName, e: number, opts: { visible?: boolean; ms?: number; backwards?: boolean } = {}) {
    const { visible = true, ms = 950, backwards = false } = opts;
    state = apply(g, state); // every gate in the game is its own inverse, so "backwards" lands on the same state
    if (visible) { explainGate(g); await coin.gate(g, ms, guardFor(e), backwards); }
    else coin.set(mul(axisAngle(GATE_ROTATIONS[g].axis, GATE_ROTATIONS[g].angle), coin.R));
    showProbs();
  }

  async function reveal(e: number): Promise<Side> {
    cover(false);
    coin.clearTrail(); // the hidden moves leave no path; the fall does
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
    cover(false);
    coin.set(IDENTITY);
    coin.clearTrail();
    coin.set(IDENTITY); // again, so the new trail starts at heads
    showProbs();
  }

  /* ---- tally, guesses, what-if ---- */
  const mini = (o: Side, extra = '') => `<span class="mini ${o === 'heads' ? 'hd' : 'tl'}${extra}" title="${o === 'heads' ? m.ui.heads : m.ui.tails}">${o === 'heads' ? t.ui.headsShort : t.ui.tailsShort}</span>`;
  function showTally(ch: Chapter) {
    const r = rounds[ch], g = guesses[ch];
    if (!r.length && !g.total) { tallyEl.innerHTML = ''; return; }
    const you = r.filter((x) => x.youWin).length;
    tallyEl.innerHTML = `<div class="coins" aria-hidden="true">${r.slice(-12).map((x) => mini(x.outcome, x.youWin ? ' won' : '')).join('')}</div>
      <div>${r.length ? t.ui.tally(you, r.length - you) : ''}${g.total ? ` · ${t.ui.guesses(g.right, g.total)}` : ''}</div>`;
  }
  function showCompare(rows: { label: string; p: Played }[], verdict: string) {
    if (!rows.length) { compareEl.innerHTML = ''; return; }
    compareEl.innerHTML = `<div class="qc-compare-title">${t.ui.whatIf}</div>` + rows.map(({ label, p }) =>
      `<div class="row"><span class="lbl">${label}</span><span class="mv">${p.shown.map((g) => `<b class="${g === '?' ? 'secret' : QUANTUM.has(g) ? 'quantum' : 'classical'}">${g}</b>`).join('')}</span><span class="arrow">→</span>${mini(p.outcome)}</div>`).join('')
      + `<p class="verdict">${paint(verdict)}</p>`;
  }
  async function guess(e: number): Promise<Side> {
    say(t.ui.guess);
    return ask<Side>(e, [{ label: side('heads'), value: 'heads' }, { label: side('tails'), value: 'tails' }]);
  }

  /* ---- chapters 1 and 2: a hidden round against the computer ---- */

  /**
   * One hidden-coin round. Whoever starts is player A and moves first and last; the other (B)
   * gets the middle move. Heads → A wins. `fixed` replays the computer's moves of an earlier round.
   */
  async function roundVs(e: number, ch: 1 | 2, you: Player, strategy: Strategy, fixed?: GateName[]): Promise<Played & { guessed: Side }> {
    resetCoin();
    const seatYou = (i: number) => (i === 1) === (you === 'B');
    const who = (i: number) => (seatYou(i) ? m.ui.whoYou : m.ui.whoComputer);
    const s: Slot[] = [0, 1, 2].map((i) => ({ gate: null, who: who(i) }));
    circuit(s);
    say(t.round.startsHeads);
    await wait(1000, e);
    cover(true); showProbs();
    say(t.round.intoBox);
    await wait(700, e);

    const moves: GateName[] = [], yours: GateName[] = [], computer: GateName[] = [];
    for (const i of [0, 1, 2]) {
      if (seatYou(i)) {
        s[i] = { gate: null, who: m.ui.whoYou, active: true }; circuit(s);
        say(you === 'B' ? t.round.yourMove : i === 0 ? t.round.youStart : t.round.yourLast);
        const mv = await ask<GateName>(e, [
          { label: t.round.flipIt, value: 'X', gate: 'X', kind: 'primary' },
          { label: t.round.leaveIt, value: 'I', gate: 'I', kind: 'primary' },
        ], { nudge: rounds[ch].length === 0 && !fixed });
        actions.innerHTML = '';
        moves.push(mv); yours.push(mv);
        s[i] = { gate: mv, who: m.ui.whoYou }; circuit(s);
        await shake(e);
        await animateGate(mv, e, { visible: false });
      } else {
        const mv = fixed ? fixed[computer.length] : strategy(i as 0 | 1 | 2, Math.random);
        moves.push(mv); computer.push(mv);
        s[i] = { gate: '?', who: m.ui.whoComputer, active: true }; circuit(s);
        say(computer.length === 2 ? t.round.computerAgain : t.round.computerMoves);
        await shake(e);
        await animateGate(mv, e, { visible: false });
        s[i].active = false; circuit(s);
      }
    }

    const guessed = await guess(e);
    actions.innerHTML = '';
    say(t.round.lifting);
    await wait(450, e);
    const outcome = await reveal(e);
    // The classical computer's moves aren't secret; the quantum computer's stay hidden until chapter 3.
    if (ch === 1) { moves.forEach((mv, i) => { s[i].gate = mv; }); circuit(s); }
    const shown = s.map((x) => x.gate ?? '?');
    const winner: Player = outcome === 'heads' ? 'A' : 'B';
    if (!fixed) { const g = guesses[ch]; g.total++; if (guessed === outcome) g.right++; }
    if (ch === 2 && you === 'B') lastQuantumRound = yours[0];
    track('Portal: coin game round', { chapter: ch, result: winner === you ? 'you win' : 'computer wins', starts: you === 'A' ? 'you' : 'computer', replay: fixed ? 'yes' : 'no' });
    return { moves, shown, computer, outcome, youWin: winner === you, guessed };
  }

  const starter: Record<1 | 2, 'computer' | 'you'> = { 1: 'computer', 2: 'computer' };
  const orderEl = $('.qc-order');
  const youSeat = (ch: 1 | 2): Player => (starter[ch] === 'you' ? 'A' : 'B');
  const rulesLine = (ch: 1 | 2) => (starter[ch] === 'computer' ? m.ch1.rulesComputerFirst : m.ch1.rulesYouFirst);
  const winLine = (ch: 1 | 2) => (starter[ch] === 'computer' ? m.ch1.winComputerFirst : m.ch1.winYouFirst);
  const guessLine = (r: { guessed: Side; outcome: Side }) => (r.guessed === r.outcome ? t.ui.guessRight : t.ui.guessWrong);

  /** Chapters 1 and 2 share the loop: play, then play again, replay with another move, or move on. */
  async function vsChapter(e: number, ch: 1 | 2) {
    const you = youSeat(ch);
    const quantum = ch === 2;
    const strategy = quantum ? (you === 'A' ? quantumB : quantumA) : randomClassical;
    setGoal(you === 'A' ? 'heads' : 'tails');
    setWhy(quantum ? (you === 'A' ? m.ch2.introYouFirst(winLine(2)) : m.ch2.introComputerFirst(rulesLine(2), winLine(2))) : m.ch1.intro(rulesLine(1), winLine(1)));
    showTally(ch);
    if (quantum) { say(you === 'A' ? t.ch2.introYouFirst : t.ch2.intro); await wait(1600, e); }

    const resultLine = (r: Played) => {
      if (!quantum) return r.youWin ? t.round.youWin(side(r.outcome)) : t.round.computerWins(side(r.outcome));
      if (you === 'A') return r.youWin ? t.ch2.youStartWin : t.ch2.youStartLoss(side(r.outcome));
      const losses = rounds[2].filter((x) => !x.youWin).length;
      return r.youWin ? t.ch2.impossible : t.ch2.lossLines[Math.min(Math.max(losses - 1, 0), t.ch2.lossLines.length - 1)];
    };

    let base = await roundVs(e, ch, you, strategy);
    rounds[ch].push({ outcome: base.outcome, youWin: base.youWin });
    showCompare([], '');
    say(resultLine(base), guessLine(base));
    showTally(ch);
    for (;;) {
      const n = rounds[ch].length;
      const opts: Option<'again' | 'replay' | 'next' | 'swap'>[] = [
        { label: t.round.playAgain, value: 'again', kind: n < 3 ? 'primary' : undefined },
        { label: you === 'A' ? t.ui.replayMoves : t.ui.replay, value: 'replay' },
      ];
      if (!quantum) opts.push({ label: t.ch1.next, value: 'next', kind: n >= 3 ? 'primary' : undefined });
      if (quantum && n >= 2) opts.push({ label: you === 'A' ? t.ch2.peekYouFirst : t.ch2.peek, value: 'next', kind: n >= 3 ? 'primary' : undefined });
      if (quantum && n >= 3) opts.push({ label: you === 'A' ? t.ch2.swapToComputer : t.ch2.swapToYou, value: 'swap' });
      const next = await ask(e, opts);
      if (next === 'next') { markDone(ch); if (quantum) track('Portal: coin game peek'); return go((ch + 1) as Chapter); }
      if (next === 'swap') { setStarter(2, you === 'A' ? 'computer' : 'you'); return; }
      if (next === 'again') {
        base = await roundVs(e, ch, you, strategy);
        rounds[ch].push({ outcome: base.outcome, youWin: base.youWin });
        showCompare([], '');
        say(resultLine(base), guessLine(base));
        showTally(ch);
        continue;
      }
      // What if: the same round, the computer's moves fixed, your move(s) chosen again.
      const other = await roundVs(e, ch, you, strategy, base.computer);
      const same = other.outcome === base.outcome;
      const lesson = quantum
        ? (you === 'A' ? t.ch2.replayYouFirst : same ? t.ch2.replaySame : '')
        : (same ? '' : you === 'A' ? t.ch1.replayDiffMoves : t.ch1.replayDiff);
      showCompare([{ label: t.ui.compareFirst, p: base }, { label: t.ui.compareOther, p: other }],
        `${quantum && you === 'B' && same ? '' : same ? t.ui.compareSame : t.ui.compareDiff} ${lesson}`.trim());
      say(other.youWin ? t.round.youWin(side(other.outcome)) : t.round.computerWins(side(other.outcome)), guessLine(other));
      showTally(ch);
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
    rounds[ch] = []; guesses[ch] = { right: 0, total: 0 }; // a different game: count afresh
    track('Portal: coin game order', { chapter: ch, starts: who });
    go(ch);
  }
  orderEl.querySelectorAll<HTMLButtonElement>('button').forEach((b) =>
    b.addEventListener('click', () => {
      if (current === 1 || current === 2) setStarter(current, b.dataset.order as 'computer' | 'you');
    }));

  /* ---- chapters 3 and 6: H · your move · H, step by step, forward and back ---- */

  async function stepper(e: number, ch: 3 | 6) {
    const steps = ch === 3 ? t.ch3.steps : t.ch6.steps;
    let move: GateName = ch === 3 ? lastQuantumRound : 'I';
    let k = 0; // moves played so far
    const gates = () => ['H', move, 'H'] as GateName[];
    setGoal(null);
    if (ch === 3) setWhy(m.ch3.intro); else setWhy(m.ch6.intro, true);
    const moveName = (g: GateName) => (g === 'X' ? t.round.flipIt : t.round.leaveIt);
    const caption = () => [steps.start, steps.h1, move === 'X' ? steps.flip : steps.leave, steps.h2][k];
    const math = () => {
      if (ch === 6) return k === 3 ? (move === 'X' ? m.ch6.caseFlip : m.ch6.caseLeave) + m.ch6.conclusion : '';
      return [`<span>|0⟩</span>`, m.ch3.mathH, move === 'X' ? m.ch3.mathFlip : m.ch3.mathLeave, m.ch3.mathH2][k];
    };
    const draw = () => {
      circuit(gates().map((g, i) => ({
        gate: g, who: i === 1 ? m.ui.whoYou : m.ui.whoComputer, active: i === k - 1,
        tap: i === 1 ? plain(t.ui.yourBox(moveName(move))) : undefined,
      })));
      say(caption(), k === 0 ? (ch === 3 ? t.ch3.tapHint : '') : '');
      setMath(math());
    };
    resetCoin();
    draw();
    for (;;) {
      const opts: Option<'back' | 'next' | 'toggle' | 'done'>[] = [];
      if (k > 0) opts.push({ label: t.ui.back, value: 'back' });
      if (k < 3) opts.push({ label: t.ui.next, value: 'next', kind: 'primary' });
      opts.push({ label: move === 'X' ? t.ch3.leaveInstead : t.ch3.flipInstead, value: 'toggle', gate: move === 'X' ? 'I' : 'X' });
      if (k === 3 && ch === 3) opts.push({ label: t.ch3.next, value: 'done', kind: 'primary' });
      const a = await ask(e, opts, { taps: { 1: 'toggle' }, nudge: k === 0 });
      if (a === 'done') { markDone(3); return go(4); }
      if (a === 'next') { await animateGate(gates()[k], e); k++; }
      else if (a === 'back') { k--; await animateGate(gates()[k], e, { backwards: true }); }
      else {
        move = move === 'X' ? 'I' : 'X';
        track(ch === 3 ? 'Portal: coin game step' : 'Portal: coin game math', { action: 'toggle', move, step: k });
        if (k >= 2) { // your move was played already: play the round again with the other move, step by step
          const target = k;
          k = 0; resetCoin(); draw();
          while (k < target) { await animateGate(gates()[k], e, { ms: 600 }); k++; draw(); }
        }
      }
      if (k === 0) explainGate(null);
      draw();
    }
  }

  /* ---- chapter 4: you are the quantum computer ---- */

  async function chapter4(e: number) {
    setGoal('heads');
    setWhy(m.ch4.intro);
    showTally(4);
    say(t.ch4.intro);
    const MOVES: Option<GateName>[] = [
      { label: t.ch4.moveFlip, value: 'X', gate: 'X' },
      { label: t.ch4.moveLeave, value: 'I', gate: 'I' },
      { label: t.ch4.moveH, value: 'H', gate: 'H', kind: 'quantum' },
    ];
    await wait(1400, e);
    const play = async (fixedB?: GateName): Promise<Played & { guessed: Side }> => {
      resetCoin();
      const s: Slot[] = [{ gate: null, who: m.ui.whoYou, active: true }, { gate: null, who: m.ui.whoComputer }, { gate: null, who: m.ui.whoYou }];
      circuit(s);
      const losses = rounds[4].filter((x) => !x.youWin).length;
      say(t.ch4.first, losses >= 2 ? t.ch4.hint : '');
      const a1 = await ask(e, MOVES);
      actions.innerHTML = '';
      s[0] = { gate: a1, who: m.ui.whoYou }; circuit(s);
      await animateGate(a1, e);
      await wait(400, e);
      say(t.ch4.intoBox);
      cover(true); showProbs();
      await wait(600, e);
      const b = fixedB ?? randomClassical(1, Math.random);
      s[1] = { gate: '?', who: m.ui.whoComputer, active: true }; circuit(s);
      await shake(e);
      await animateGate(b, e, { visible: false });
      s[1].active = false; s[2].active = true; circuit(s);
      say(t.ch4.last);
      const a2 = await ask(e, MOVES);
      actions.innerHTML = '';
      s[2] = { gate: a2, who: m.ui.whoYou }; circuit(s);
      await shake(e);
      await animateGate(a2, e, { visible: false });
      const guessed = await guess(e);
      actions.innerHTML = '';
      say(t.round.lifting);
      await wait(400, e);
      const outcome = await reveal(e);
      s[1].gate = b; circuit(s);
      const youWin = outcome === 'heads';
      if (!fixedB) { const g = guesses[4]; g.total++; if (guessed === outcome) g.right++; }
      track('Portal: coin game round', { chapter: 4, result: youWin ? 'you win' : 'computer wins', strategy: a1 + a2, replay: fixedB ? 'yes' : 'no' });
      const moves = roundMoves('A', [a1, a2], [b]);
      return { moves, shown: moves, computer: [b], outcome, youWin, guessed };
    };
    const result = (r: Played) => {
      const sure = r.moves[0] === 'H' && r.moves[2] === 'H';
      return r.youWin ? (sure ? t.ch4.sureWin : t.ch4.luckyWin(r.computer[0] === 'X')) : t.ch4.loss(r.computer[0] === 'X');
    };
    let base = await play();
    rounds[4].push({ outcome: base.outcome, youWin: base.youWin });
    showCompare([], '');
    say(result(base), guessLine(base));
    showTally(4);
    for (;;) {
      const sure = base.moves[0] === 'H' && base.moves[2] === 'H';
      const next = await ask<'again' | 'replay' | 'next'>(e, [
        { label: t.round.playAgain, value: 'again', kind: sure ? undefined : 'primary' },
        { label: t.ui.replayMoves, value: 'replay' },
        { label: t.ch4.next, value: 'next', kind: sure ? 'primary' : undefined },
      ]);
      if (next === 'next') { markDone(4); return go(5); }
      if (next === 'again') {
        base = await play();
        rounds[4].push({ outcome: base.outcome, youWin: base.youWin });
        showCompare([], '');
        say(result(base), guessLine(base));
        showTally(4);
        continue;
      }
      const other = await play(base.computer[0]);
      const same = other.outcome === base.outcome;
      showCompare([{ label: t.ui.compareFirst, p: base }, { label: t.ui.compareOther, p: other }], same ? t.ui.compareSame : t.ui.compareDiff);
      say(result(other), guessLine(other));
      showTally(4);
    }
  }

  /* ---- chapter 5: sandbox ---- */

  async function chapter5(e: number) {
    setGoal(null);
    setWhy(m.ch5.intro);
    const gates: GateName[] = [];
    let inspecting: number | null = null;
    /** Where the circuit starts: heads, or what the last "Look" showed (the coin stays where it fell). */
    let start: { state: State; R: typeof IDENTITY } = { state: HEADS, R: IDENTITY };
    resetCoin();
    const draw = () => {
      const s: Slot[] = gates.map((g, i) => ({ gate: g, who: '', active: inspecting === i, tap: plain(inspecting === i ? t.ch5.inspect(i + 1, g) : t.ch5.inspectTap(i + 1, g)) }));
      if (gates.length < 8) s.push({ gate: null, who: '' });
      circuit(s, pHeads(start.state) === 1 ? '|0⟩' : '|1⟩');
    };
    /** Put the coin where it is after the first `n` gates — instantly, without a trail. */
    const jumpTo = (n: number) => {
      state = start.state; let R = start.R;
      for (const g of gates.slice(0, n)) { state = apply(g, state); R = mul(axisAngle(GATE_ROTATIONS[g].axis, GATE_ROTATIONS[g].angle), R); }
      coin.recordTrail = false; coin.set(R); coin.recordTrail = true;
      showProbs();
    };
    draw();
    say(t.ch5.start, t.ch5.tapHint);
    tallyEl.innerHTML = '';
    const nb = `<a href="https://qubins.org/launch/?image=2.5-xl&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=Quantum-Coin-Game.ipynb&ui=rise-classic" target="_blank" rel="noopener" data-umami-event="Portal: notebook launch" data-umami-event-target="qubins" data-umami-event-image="2.5-xl" data-umami-event-notebook="Quantum-Coin-Game.ipynb">${t.ch5.notebook}</a>`;
    for (;;) {
      const full = gates.length >= 8;
      const taps: Record<number, string> = {};
      gates.forEach((_, i) => { taps[i] = `inspect:${i}`; });
      const choice = await ask<string>(e, [
        ...(['H', 'X', 'Z', 'S', 'I'] as GateName[]).filter(() => !full).map((g) => ({ label: m.gates.name[g], value: g as string, gate: g, kind: QUANTUM.has(g) ? ('quantum' as const) : undefined })),
        { label: t.ch5.look, value: 'measure', kind: 'primary' as const },
        { label: t.ch5.lookMany, value: 'many' },
        ...(gates.length ? [{ label: t.ch5.undo, value: 'undo' }, { label: t.ch5.reset, value: 'reset' }] : []),
      ], { taps, extra: nb });
      if (choice.startsWith('inspect:')) {
        const i = Number(choice.slice(8));
        inspecting = inspecting === i ? null : i;
        jumpTo(inspecting === null ? gates.length : i + 1);
        explainGate(inspecting === null ? null : gates[i]);
        draw();
        say(inspecting === null ? t.ch5.start : t.ch5.inspect(i + 1, gates[i]));
        continue;
      }
      if (inspecting !== null) { inspecting = null; jumpTo(gates.length); explainGate(null); draw(); say(t.ch5.start); }
      if (choice === 'reset') { gates.length = 0; start = { state: HEADS, R: IDENTITY }; resetCoin(); draw(); say(t.ch5.backToHeads); tallyEl.innerHTML = ''; continue; }
      if (choice === 'undo') { gates.pop(); coin.clearTrail(); jumpTo(gates.length); explainGate(null); draw(); say(t.ch5.undone); continue; }
      if (choice === 'many') {
        let h = 0; for (let i = 0; i < 100; i++) if (measure(state) === 'heads') h++;
        const p = pHeads(state);
        tallyEl.innerHTML = `<div class="hist"><span class="hd" style="width:${h}%"></span><span class="tl" style="width:${100 - h}%"></span></div>
          <div>${t.ch5.many(h, 100 - h, Math.round(p * 100), Math.round((1 - p) * 100))}</div>`;
        track('Portal: coin game sandbox', { action: 'measure 100', gates: gates.join('') || '-' });
        continue;
      }
      if (choice === 'measure') {
        const outcome = await reveal(e);
        say(t.ch5.measured(side(outcome)));
        gates.length = 0; start = { state, R: coin.R }; draw();
        track('Portal: coin game sandbox', { action: 'measure', outcome });
        continue;
      }
      const g = choice as GateName;
      gates.push(g);
      draw();
      await animateGate(g, e);
      say(t.ch5.played(g, m.gates.name[g]));
    }
  }

  /* ---- explanations on demand (as v1) ---- */
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
        <ul class="qc-terms">${TERMS.map((x) => `<li><button type="button" class="qc-term" data-term="${x}">${m.glossary[x].title}</button></li>`).join('')}</ul>`;
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
  dlg.addEventListener('click', (ev) => {
    const r = dlg.getBoundingClientRect();
    if (ev.target === dlg && (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom)) dlg.close();
  });
  why.addEventListener('toggle', () => { if (why.open) track('Portal: coin game why', { chapter: current }); });

  /* ---- navigation ---- */
  const CHAPTERS: Record<Chapter, (e: number) => Promise<void>> = {
    1: (e) => vsChapter(e, 1), 2: (e) => vsChapter(e, 2), 3: (e) => stepper(e, 3), 4: chapter4, 5: chapter5, 6: (e) => stepper(e, 6),
  };
  const DONE_KEY = 'fwq-coin-done';
  const done = new Set<number>((() => { try { return JSON.parse(localStorage.getItem(DONE_KEY) ?? '[]'); } catch { return []; } })());
  function markDone(ch: Chapter) {
    done.add(ch);
    try { localStorage.setItem(DONE_KEY, JSON.stringify([...done])); } catch { /* private mode: fine */ }
    paintTabs(ch);
  }
  function paintTabs(ch: Chapter) {
    for (const tab of tabs) {
      const n = Number(tab.dataset.chapter);
      tab.setAttribute('aria-selected', String(n === ch));
      const isDone = done.has(n) && n !== ch;
      tab.classList.toggle('done', isDone);
      const badge = tab.querySelector('.n');
      if (badge) badge.textContent = isDone ? '✓' : String(n);
    }
    const active = tabs[ch - 1];
    if (active && strip.scrollWidth > strip.clientWidth) // phones: keep the current chapter in view, without scrolling the page
      strip.scrollTo({ left: active.offsetLeft - strip.offsetLeft - 12, behavior: reducedMotion() ? 'auto' : 'smooth' });
  }
  function go(ch: Chapter, initial = false) {
    const e = ++epoch;
    current = ch;
    pending = null;
    paintTabs(ch);
    paintOrder(ch);
    actions.innerHTML = ''; tallyEl.innerHTML = ''; compareEl.innerHTML = ''; setMath(''); say('');
    root.dataset.chapter = String(ch);
    resetCoin();
    if (!initial) track('Portal: coin game chapter', { chapter: ch });
    CHAPTERS[ch](e).catch((err) => { if (!(err instanceof Abort)) console.error(err); });
  }
  tabs.forEach((tab) => tab.addEventListener('click', () => go(Number(tab.dataset.chapter) as Chapter)));
  window.addEventListener('resize', () => coin.render());
  go(1, true);
}

function describe(s: State, m: Messages): string {
  const lbl = stateLabel(s);
  if (lbl === '|0⟩') return m.states.zero;
  if (lbl === '|1⟩') return m.states.one;
  if (lbl === '|+⟩') return m.states.plus;
  if (lbl === '|−⟩') return m.states.minus;
  const [x, y, z] = bloch(s);
  return m.states.other(x.toFixed(2), y.toFixed(2), z.toFixed(2));
}
