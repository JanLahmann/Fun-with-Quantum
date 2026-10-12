/**
 * The coin on screen: the animated 3D coin and the Bloch sphere next to it. Shared by the coin
 * game (ui.ts) and its redesign (v2/ui.ts). The coin's face normal IS the qubit's Bloch vector.
 */
import { GATE_ROTATIONS, type GateName } from './qubit';
import { IDENTITY, axisAngle, lift, mul, normalOf, shade, tipTo, toCss, toSphereView as toView, type Mat3 } from './rotation';

export const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeIn = (t: number) => t * t * t;

const NS = 'http://www.w3.org/2000/svg';

/** Names of the two poles, in the player's language. */
export interface PoleLabels { heads: string; tails: string }

/**
 * The Bloch sphere next to the coin, drawn from the same camera: outline, equator and the x–z
 * meridian (back halves dashed), the four game states labelled, and an arrow that is exactly the
 * coin's face normal. With `trail`, the arrow's tip leaves a faint line: the path of this round.
 */
class BlochView {
  private vec: SVGLineElement;
  private tip: SVGCircleElement;
  private axisLayer: SVGGElement;
  private trail: SVGPolylineElement | null = null;
  private points: [number, number][] = [];
  private C = 75;
  private r = 52;
  constructor(svg: SVGSVGElement, labels: PoleLabels, trail: boolean) {
    this.vec = svg.querySelector('.vec')!;
    this.tip = svg.querySelector('.tip')!;
    this.axisLayer = svg.querySelector('.axisline')!;
    const g = svg.querySelector('.sphere')!;
    const el = (tag: string, attrs: Record<string, string | number>, parent: Element = g) => {
      const e = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
      parent.appendChild(e);
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
    const poles: [readonly [number, number, number], string, number, number, string][] = [
      [[0, 0, 1], `|0⟩ ${labels.heads}`, 0, -7, 'lbl heads'], [[0, 0, -1], `|1⟩ ${labels.tails}`, 0, 13, 'lbl tails'],
      [[1, 0, 0], '|+⟩', -11, 10, 'lbl'], [[-1, 0, 0], '|−⟩', 11, -5, 'lbl'],
      [[0, 1, 0], '+i', 10, 3, 'lbl'], [[0, -1, 0], '−i', -10, 3, 'lbl'],
    ];
    for (const [v, text, dx, dy, cls] of poles) {
      const [x, y] = this.xy(toView(v));
      el('line', { class: 'axis', x1: this.C, y1: this.C, x2: x, y2: y });
      const t = el('text', { class: cls, x: x + dx, y: y + dy, 'text-anchor': 'middle' });
      t.textContent = text;
    }
    if (trail) this.trail = el('polyline', { class: 'trail', fill: 'none', points: '' }, svg) as SVGPolylineElement;
    if (this.trail) svg.insertBefore(this.trail, this.vec);
  }
  /** Dashed line through the sphere along a gate's rotation axis (null hides it). */
  showAxis(axis: readonly [number, number, number] | null) {
    const g = this.axisLayer;
    g.replaceChildren();
    if (!axis) return;
    const [x1, y1] = this.xy(toView([-axis[0] * 1.18, -axis[1] * 1.18, -axis[2] * 1.18]));
    const [x2, y2] = this.xy(toView([axis[0] * 1.18, axis[1] * 1.18, axis[2] * 1.18]));
    const line = document.createElementNS(NS, 'line');
    for (const [k, v] of Object.entries({ x1, y1, x2, y2, class: 'rotaxis' })) line.setAttribute(k, String(v));
    g.appendChild(line);
  }
  private xy(v: readonly number[]): [number, number] {
    return [this.C + this.r * v[0], this.C + this.r * v[1]];
  }
  /** Forget the path so far; the next `show` starts a new one. */
  clearTrail() {
    this.points = [];
    this.trail?.setAttribute('points', '');
  }
  show(R: Mat3, record: boolean) {
    const v = toView(normalOf(R));
    const [x, y] = this.xy(v);
    this.vec.setAttribute('x2', x.toFixed(2));
    this.vec.setAttribute('y2', y.toFixed(2));
    this.tip.setAttribute('cx', x.toFixed(2));
    this.tip.setAttribute('cy', y.toFixed(2));
    const behind = v[2] < -0.05; // pointing away from us: draw it fainter
    this.vec.classList.toggle('behind', behind);
    this.tip.classList.toggle('behind', behind);
    if (this.trail && record) {
      const last = this.points[this.points.length - 1];
      if (!last || Math.hypot(last[0] - x, last[1] - y) > 0.8) {
        this.points.push([x, y]);
        this.trail.setAttribute('points', this.points.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' '));
      }
    }
  }
}

export class CoinView {
  R: Mat3 = IDENTITY;
  /** While false (e.g. the coin is hidden in the box), moves leave no trail on the sphere. */
  recordTrail = true;
  private bloch: BlochView | null;
  private pos: HTMLElement;
  private coin: HTMLElement;
  private scene: HTMLElement;
  constructor(root: HTMLElement, labels: PoleLabels, opts: { trail?: boolean } = {}) {
    this.pos = root.querySelector('.qc-pos')!;
    this.coin = root.querySelector('.qc-coin')!;
    this.scene = root.querySelector('.qc-scene')!;
    const svg = root.querySelector<SVGSVGElement>('.qc-bloch svg');
    this.bloch = svg ? new BlochView(svg, labels, !!opts.trail) : null;
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
    this.bloch?.show(this.R, this.recordTrail);
  }
  set(R: Mat3) { this.R = R; this.render(); }
  clearTrail() { this.bloch?.clearTrail(); }
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
  /** Play a gate; `backwards` plays its inverse (every gate here is a rotation, so: the same axis, minus the angle). */
  gate(g: GateName, ms = 900, guard?: () => void, backwards = false) {
    if (g === 'I') return this.wobble(ms * 0.7, guard);
    const { axis, angle } = GATE_ROTATIONS[g];
    return this.rotate(axis, backwards ? -angle : angle, ms, easeInOut, guard);
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
