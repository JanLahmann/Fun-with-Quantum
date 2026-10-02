/**
 * Browser side of the magic square game (markup: components/MagicSquareGame.astro).
 *
 *   1  Find a magic square    — click a square that obeys all six rules; it can't be done.
 *   2  The best classical team — one disagreement left: 8 of 9; try all 4096 strategies.
 *   3  The quantum team        — two Bell pairs: every round won.
 *   4  How it works            — the square of measurements, commuting, Bell pairs, basis changes.
 */
import { mountShell, track, type Shell } from '../games/shell';
import { circuitSvg } from '../games/circuit';
import {
  BEST_STRATEGY, BEST_SQUARE, IDX, OBSERVABLES, bestClassical, checkSquare, gameSteps,
  playClassical, playQuantum, randomIdx, type Grid, type Idx, type Round,
} from './square';
import { CH1, CH2, CH3, CH4, TERMS, UI, pickHint, round } from './messages';

type Mode = 'edit' | 'pick' | 'explain' | 'off';
interface View {
  values: (string | number | null)[][];
  faint?: boolean;
  strong?: boolean[][];
  badges?: (string | null)[][];
  col?: Idx | null;
  row?: Idx | null;
  cross?: 'win' | 'lose' | null;
  checks?: { cols: boolean[]; rows: boolean[] } | null;
}

const empty = (): (string | number | null)[][] => [[null, null, null], [null, null, null], [null, null, null]];

export function mountMagicSquare(root: HTMLElement) {
  const cells = Array.from(root.querySelectorAll<HTMLButtonElement>('.ms-cell'));
  const colHeads = Array.from(root.querySelectorAll<HTMLButtonElement>('.ms-colh'));
  const rowHeads = Array.from(root.querySelectorAll<HTMLButtonElement>('.ms-rowh'));
  const colChecks = Array.from(root.querySelectorAll<HTMLElement>('.ms-check.col'));
  const rowChecks = Array.from(root.querySelectorAll<HTMLElement>('.ms-check.row'));
  const board = root.querySelector<HTMLElement>('.ms-board')!;
  const cellAt = (r: Idx, c: Idx) => cells[(r - 1) * 3 + (c - 1)];

  let mode: Mode = 'off';
  const puzzle: Grid = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; // chapter 1's square survives chapter switches
  let pick: { col: Idx | null; row: Idx | null; resolve: ((v: 'pick') => void) | null } = { col: null, row: null, resolve: null };
  let explainCell: { row: Idx; col: Idx } | null = null;

  function paint(v: View) {
    board.dataset.mode = mode;
    for (const r of IDX) for (const c of IDX) {
      const el = cellAt(r, c);
      const val = v.values[r - 1][c - 1];
      el.querySelector('.v')!.textContent = val === null ? '' : String(val);
      el.querySelector('.ms-badge')!.textContent = v.badges?.[r - 1][c - 1] ?? '';
      el.classList.toggle('faint', !!v.faint && !v.strong?.[r - 1][c - 1]);
      el.classList.toggle('in-col', v.col === c);
      el.classList.toggle('in-row', v.row === r);
      const cross = v.col === c && v.row === r;
      el.classList.toggle('win', cross && v.cross === 'win');
      el.classList.toggle('lose', cross && v.cross === 'lose');
      el.classList.toggle('obs', typeof val === 'string' && val.length > 1);
      el.disabled = mode !== 'edit' && mode !== 'explain';
    }
    colHeads.forEach((h, i) => { h.setAttribute('aria-pressed', String(v.col === i + 1)); h.disabled = mode !== 'pick' && mode !== 'explain'; });
    rowHeads.forEach((h, i) => { h.setAttribute('aria-pressed', String(v.row === i + 1)); h.disabled = mode !== 'pick' && mode !== 'explain'; });
    colChecks.forEach((el, i) => { el.textContent = v.checks ? (v.checks.cols[i] ? '✓' : '✗') : ''; el.classList.toggle('bad', !!v.checks && !v.checks.cols[i]); });
    rowChecks.forEach((el, i) => { el.textContent = v.checks ? (v.checks.rows[i] ? '✓' : '✗') : ''; el.classList.toggle('bad', !!v.checks && !v.checks.rows[i]); });
  }

  const puzzleView = (): View => ({ values: puzzle.map((r) => [...r]), checks: checkSquare(puzzle) });
  const rulesObeyed = () => { const { cols, rows } = checkSquare(puzzle); return [...cols, ...rows].filter(Boolean).length; };

  /** The grid after a round: Alice's column and Bob's row filled in, the shared square judged. */
  function roundView(r: Round, base: View): View {
    const values = base.values.map((row) => [...row]);
    const strong = [[false, false, false], [false, false, false], [false, false, false]];
    const badges: (string | null)[][] = base.badges ? base.badges.map((row) => [...row]) : [[null, null, null], [null, null, null], [null, null, null]];
    for (let i = 0; i < 3; i++) {
      values[i][r.col - 1] = r.alice[i]; strong[i][r.col - 1] = true;
      values[r.row - 1][i] = r.bob[i]; strong[r.row - 1][i] = true;
    }
    const a = r.alice[r.row - 1], b = r.bob[r.col - 1];
    values[r.row - 1][r.col - 1] = a === b ? a : `${a}≠${b}`;
    badges[r.row - 1][r.col - 1] = null;
    return { ...base, values, strong, badges, col: r.col, row: r.row, cross: r.win ? 'win' : 'lose' };
  }

  /* ---- stage clicks ---- */
  root.querySelector('.ms-board')!.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;
    const cell = t.closest<HTMLButtonElement>('.ms-cell');
    const ch = t.closest<HTMLButtonElement>('.ms-colh');
    const rh = t.closest<HTMLButtonElement>('.ms-rowh');
    if (cell && mode === 'edit') {
      const r = Number(cell.dataset.row) - 1, c = Number(cell.dataset.col) - 1;
      puzzle[r][c] ^= 1;
      paint(puzzleView());
      shell.say(CH1.count(rulesObeyed()));
      return;
    }
    if (mode === 'pick' && (ch || rh)) {
      if (ch) pick.col = Number(ch.dataset.col) as Idx;
      if (rh) pick.row = Number(rh.dataset.row) as Idx;
      colHeads.forEach((h, i) => h.setAttribute('aria-pressed', String(pick.col === i + 1)));
      rowHeads.forEach((h, i) => h.setAttribute('aria-pressed', String(pick.row === i + 1)));
      if (pick.col && pick.row) pick.resolve?.('pick');
      else shell.say(pickHint(pick.col, pick.row));
      return;
    }
    if (mode === 'explain') {
      if (cell) {
        const row = Number(cell.dataset.row) as Idx, col = Number(cell.dataset.col) as Idx;
        explainCell = { row, col };
        paint({ values: OBSERVABLES.map((r) => [...r]), col, row });
        shell.say(CH4.cell(row, col, OBSERVABLES[row - 1][col - 1]));
        shell.circuit(circuitSvg(UI.qubits, gameSteps(col, row), UI.circuitTitle));
      } else if (ch || rh) {
        const key = ch ? `c${ch.dataset.col}` : `r${rh!.dataset.row}`;
        explainCell = null;
        paint({ values: OBSERVABLES.map((r) => [...r]), col: ch ? (Number(ch.dataset.col) as Idx) : null, row: rh ? (Number(rh.dataset.row) as Idx) : null });
        shell.say(CH4.product(key));
      }
    }
  });

  /* ---- chapters ---- */
  async function chapter1(e: number) {
    mode = 'edit';
    shell.setTitle(CH1.title);
    shell.setText(CH1.intro);
    paint(puzzleView());
    shell.say(`${CH1.start} ${CH1.count(rulesObeyed())}`);
    const v = await shell.ask(e, [{ label: CH1.why, value: 'why' }, { label: CH1.next, value: 'next' }]);
    if (v === 'why') {
      shell.setText(CH1.proof);
      shell.say(CH1.proofSaid);
      track('Portal: magic square proof');
      await shell.ask(e, [{ label: CH1.next, value: 'next', kind: 'primary' }]);
    }
    shell.markDone(1);
    shell.go(2);
  }

  async function playRounds(e: number, ch: 2 | 3) {
    const M = ch === 2 ? CH2 : CH3;
    const base = (): View => (ch === 2
      ? { values: BEST_SQUARE.map((r) => [...r]), faint: true, badges: [[null, null, null], [null, null, null], [null, null, CH2.aliceDiffers]] }
      : { values: empty() });
    let won = 0, n = 0;
    mode = 'pick';
    shell.setTitle(M.title);
    shell.setText(M.intro);
    paint(base());
    for (;;) {
      pick = { col: null, row: null, resolve: null };
      const options = ch === 2
        ? [{ label: CH2.ask, value: 'ask' as const, kind: 'primary' as const }, { label: CH2.many, value: 'many' as const }, { label: CH2.all, value: 'all' as const }, { label: CH2.next, value: 'next' as const }]
        : [{ label: CH3.ask, value: 'ask' as const, kind: 'primary' as const }, { label: CH3.many, value: 'many' as const }, { label: CH3.next, value: 'next' as const }];
      const v = await shell.askOr<'ask' | 'many' | 'all' | 'next' | 'pick'>(e, options, (resolve) => { pick.resolve = resolve; });
      if (v === 'next') { shell.markDone(ch); return shell.go(ch + 1); }
      if (v === 'all') {
        const { tried, best } = bestClassical();
        shell.say(CH2.allResult(tried, best));
        track('Portal: magic square all strategies');
        continue;
      }
      if (v === 'many') {
        let w = 0;
        for (let i = 0; i < 1000; i++) {
          const c = randomIdx(), r = randomIdx();
          if ((ch === 2 ? playClassical(BEST_STRATEGY, c, r) : playQuantum(c, r)).win) w++;
        }
        shell.say(M.manyResult(w, 1000));
        track('Portal: magic square 1000 rounds', { chapter: ch, won: w });
        continue;
      }
      const col = v === 'pick' ? pick.col! : randomIdx(), row = v === 'pick' ? pick.row! : randomIdx();
      const r = ch === 2 ? playClassical(BEST_STRATEGY, col, row) : playQuantum(col, row);
      if (ch === 3) {
        shell.circuit(circuitSvg(UI.qubits, gameSteps(col, row), UI.circuitTitle));
        mode = 'off';
        const partial: View = { values: empty(), col, row };
        paint(partial);
        for (let i = 0; i < 3; i++) { partial.values[i][col - 1] = r.alice[i]; paint(partial); await shell.wait(160, e); }
        for (let i = 0; i < 3; i++) { if (i !== col - 1) { partial.values[row - 1][i] = r.bob[i]; paint(partial); await shell.wait(160, e); } }
        mode = 'pick';
      }
      paint(roundView(r, base()));
      n++; if (r.win) won++;
      shell.say(round(col, row, r.alice, r.bob, r.win) + (ch === 3 && n === 3 ? `<br><small>${CH3.again}</small>` : ''));
      shell.score(M.score(won, n));
      track('Portal: magic square round', { chapter: ch, result: r.win ? 'win' : 'lost', question: `c${col}r${row}` });
    }
  }

  async function chapter4(e: number) {
    mode = 'explain';
    explainCell = null;
    shell.setTitle(CH4.title);
    paint({ values: OBSERVABLES.map((r) => [...r]) });
    let s = 0;
    for (;;) {
      shell.setText(CH4.texts[s]);
      if (s === 3 && !explainCell) shell.circuit(circuitSvg(UI.qubits, gameSteps(3, 3), UI.circuitTitle));
      const v = await shell.ask(e, CH4.sections.map((label, i) => ({ label, value: i, kind: i === s ? ('current' as const) : undefined })));
      s = v;
      track('Portal: magic square explain section', { section: s + 1 });
    }
  }

  const shell: Shell = mountShell(root, [chapter1, (e) => playRounds(e, 2), (e) => playRounds(e, 3), chapter4], {
    game: 'magic square',
    storageKey: 'fwq-magic-done',
    terms: TERMS,
    labels: UI,
    locale: root.dataset.locale ?? 'en',
    onEnter: () => { mode = 'off'; pick = { col: null, row: null, resolve: null }; },
  });
}
