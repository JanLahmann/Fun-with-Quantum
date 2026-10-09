/**
 * Draws a small quantum circuit as an SVG string: one wire per qubit, gates placed in the earliest
 * free column, two-qubit gates as dots / ⊕ / × joined by a line, a barrier, then the meters.
 * Colors come from CSS classes (`tone-…`), so it follows the page's light/dark theme.
 */
import type { Op } from '../qsim';

export type Step = (Op & { tone?: string }) | { g: 'barrier' } | { g: 'measure'; tone?: string }
  /** A named block over qubits from…to, e.g. Grover's oracle. */
  | { g: 'box'; label: string; from: number; to: number; tone?: string };

const COL = 46, ROW = 44, LEFT = 92, TOP = 26, BOX = 30;
const NAME: Record<string, string> = { h: 'H', x: 'X', y: 'Y', z: 'Z', s: 'S', sdg: 'S†', ry: 'Ry', rz: 'Rz' };
/** An Ry angle in degrees, as written above the gate: −45°. */
const degrees = (t: number) => `${Math.round((t * 180) / Math.PI)}°`.replace('-', '−');

export function circuitSvg(labels: readonly string[], steps: readonly Step[], title = ''): string {
  const n = labels.length;
  const next = new Array<number>(n).fill(0);
  const placed: { step: Step; col: number }[] = [];
  for (const step of steps) {
    let qs: number[];
    if (step.g === 'barrier' || step.g === 'measure') qs = labels.map((_, q) => q);
    else if (step.g === 'box') qs = Array.from({ length: step.to - step.from + 1 }, (_, k) => step.from + k);
    else if ('q' in step) qs = [step.q];
    else { const lo = Math.min(step.a, step.b), hi = Math.max(step.a, step.b); qs = Array.from({ length: hi - lo + 1 }, (_, k) => lo + k); }
    const col = Math.max(...qs.map((q) => next[q]));
    for (const q of qs) next[q] = col + 1;
    placed.push({ step, col });
  }
  const cols = Math.max(1, ...next);
  const width = LEFT + cols * COL + 12, height = TOP + (n - 1) * ROW + 30;
  const y = (q: number) => TOP + q * ROW;
  const x = (col: number) => LEFT + col * COL + COL / 2;
  const out: string[] = [];
  out.push(`<svg class="qg-circuit-svg" viewBox="0 0 ${width} ${height}" style="max-width:${width}px;min-width:${Math.min(width, 420)}px" role="img" aria-label="${title}">`);
  labels.forEach((l, q) => {
    out.push(`<text class="wl" x="${LEFT - 10}" y="${y(q) + 4}" text-anchor="end">${l}</text>`);
    out.push(`<line class="wire" x1="${LEFT - 4}" y1="${y(q)}" x2="${width - 8}" y2="${y(q)}"/>`);
  });
  for (const { step, col } of placed) {
    const cx = x(col), tone = 'tone' in step && step.tone ? ` tone-${step.tone}` : '';
    if (step.g === 'barrier') {
      out.push(`<line class="barrier" x1="${cx}" y1="${TOP - 14}" x2="${cx}" y2="${y(n - 1) + 14}"/>`);
    } else if (step.g === 'measure') {
      for (let q = 0; q < n; q++) {
        const cy = y(q);
        out.push(`<g class="gate meter${tone}"><rect x="${cx - BOX / 2}" y="${cy - BOX / 2}" width="${BOX}" height="${BOX}" rx="5"/>`
          + `<path d="M${cx - 9} ${cy + 6} A 10 10 0 0 1 ${cx + 9} ${cy + 6}"/><line x1="${cx}" y1="${cy + 6}" x2="${cx + 7}" y2="${cy - 8}"/></g>`);
      }
    } else if (step.g === 'box') {
      const top = y(step.from) - BOX / 2, h = y(step.to) - y(step.from) + BOX, w = COL - 8;
      out.push(`<g class="gate box${tone}"><rect x="${cx - w / 2}" y="${top}" width="${w}" height="${h}" rx="6"/>`
        + `<text x="${cx}" y="${top + h / 2 + 4}" text-anchor="middle"${step.label.length > 2 ? ` transform="rotate(-90 ${cx} ${top + h / 2})"` : ''}>${h < 70 && step.label.length > 2 ? step.label[0].toUpperCase() : step.label}</text></g>`);
    } else if ('q' in step) {
      const cy = y(step.q);
      out.push(`<g class="gate${tone}"><rect x="${cx - BOX / 2}" y="${cy - BOX / 2}" width="${BOX}" height="${BOX}" rx="5"/>`
        + `<text x="${cx}" y="${cy + 5}" text-anchor="middle">${NAME[step.g]}</text>`
        + (step.g === 'ry' || step.g === 'rz' ? `<text class="ang" x="${cx}" y="${cy - BOX / 2 - 3}" text-anchor="middle">${degrees(step.t)}</text>` : '') + '</g>');
    } else {
      const ya = y(step.a), yb = y(step.b);
      out.push(`<g class="gate two${tone}"><line class="link" x1="${cx}" y1="${ya}" x2="${cx}" y2="${yb}"/>`);
      if (step.g === 'ryy') { // one tall box over both qubits
        const top = Math.min(ya, yb) - BOX / 2, h = Math.abs(yb - ya) + BOX;
        out.push(`<rect x="${cx - BOX / 2}" y="${top}" width="${BOX}" height="${h}" rx="5"/><text x="${cx}" y="${top + h / 2 + 4}" text-anchor="middle">Ryy</text>`);
      } else if (step.g === 'cry') { // control dot, then an Ry box on the target
        out.push(`<circle class="dot" cx="${cx}" cy="${ya}" r="5"/><rect x="${cx - BOX / 2}" y="${yb - BOX / 2}" width="${BOX}" height="${BOX}" rx="5"/>`
          + `<text x="${cx}" y="${yb + 5}" text-anchor="middle">Ry</text><text class="ang" x="${cx}" y="${yb + BOX / 2 + 11}" text-anchor="middle">${degrees(step.t)}</text>`);
      } else if (step.g === 'cx') {
        out.push(`<circle class="dot" cx="${cx}" cy="${ya}" r="5"/><circle class="plus" cx="${cx}" cy="${yb}" r="11"/>`
          + `<line class="link" x1="${cx - 11}" y1="${yb}" x2="${cx + 11}" y2="${yb}"/><line class="link" x1="${cx}" y1="${yb - 11}" x2="${cx}" y2="${yb + 11}"/>`);
      } else if (step.g === 'cz') {
        out.push(`<circle class="dot" cx="${cx}" cy="${ya}" r="5"/><circle class="dot" cx="${cx}" cy="${yb}" r="5"/>`);
      } else {
        for (const yy of [ya, yb]) out.push(`<path class="link" d="M${cx - 7} ${yy - 7} L${cx + 7} ${yy + 7} M${cx + 7} ${yy - 7} L${cx - 7} ${yy + 7}"/>`);
      }
      out.push('</g>');
    }
  }
  out.push('</svg>');
  return out.join('');
}
