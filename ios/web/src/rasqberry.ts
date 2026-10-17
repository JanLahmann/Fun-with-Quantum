/**
 * RasQberry Two: rasqberry.org's own viewer (src/components/ModelViewer/viewer.ts, fetched at the
 * pinned commit, three.js 0.169 as on the web) with the controls of its React wrapper (index.tsx),
 * rewritten without React: reset, explode, assemble, and the parts list (tap a part to select it).
 */
import { ModelViewer, type PartInfo } from '../.cache/rasqberry-two/viewer';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const stage = $('stage');
const status = $('status');
const info = $('info');
const stepEl = $('step');
const explode = $<HTMLInputElement>('explode');
const assembleBtn = $<HTMLButtonElement>('assemble');
const resetBtn = $<HTMLButtonElement>('reset');
const partsBtn = $<HTMLButtonElement>('parts-btn');
const partsPanel = $('parts');

let parts: PartInfo[] = [];
let selected: string | null = null;
let isolate = false;
let assembling = false;

const viewer = new ModelViewer(stage, {
  onSelect: (key) => { selected = key; showInfo(); markList(); },
  onStep: (s) => {
    stepEl.hidden = !s;
    stepEl.textContent = s?.label ?? '';
    if (!s) setAssembling(false);
  },
});

function setAssembling(on: boolean) {
  assembling = on;
  assembleBtn.textContent = on ? 'Stop' : 'Assemble';
  assembleBtn.setAttribute('aria-pressed', String(on));
}

function showInfo() {
  const p = parts.find((x) => x.key === selected);
  info.hidden = !p;
  if (!p) return;
  info.replaceChildren();
  const name = document.createElement('strong');
  name.textContent = `${p.label}${p.count > 1 ? ` (${p.count}×)` : ''}`;
  const only = document.createElement('label');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = isolate;
  box.addEventListener('change', () => { isolate = box.checked; viewer.setIsolate(isolate); });
  only.append(box, ' Show only this');
  const all = document.createElement('button');
  all.type = 'button';
  all.textContent = 'Show all';
  all.addEventListener('click', () => { isolate = false; viewer.setIsolate(false); viewer.select(null); });
  info.append(name);
  if (p.source) { const s = document.createElement('span'); s.textContent = p.source; info.append(s); }
  info.append(only, all);
}

function markList() {
  for (const b of partsPanel.querySelectorAll<HTMLButtonElement>('button[data-key]')) b.setAttribute('aria-pressed', String(b.dataset.key === selected));
}

function buildList() {
  const total = parts.reduce((n, p) => n + p.count, 0);
  const head = document.createElement('h3');
  head.textContent = `Parts (${total})`;
  partsPanel.replaceChildren(head);
  for (const g of [...new Set(parts.map((p) => p.group))]) {
    const h = document.createElement('h4');
    h.textContent = g;
    const ul = document.createElement('ul');
    for (const p of parts.filter((x) => x.group === g)) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.key = p.key;
      b.textContent = `${p.label}${p.count > 1 ? ` ×${p.count}` : ''}`;
      b.addEventListener('click', () => viewer.select(selected === p.key ? null : p.key));
      li.append(b);
      ul.append(li);
    }
    partsPanel.append(h, ul);
  }
}

resetBtn.addEventListener('click', () => {
  viewer.stopAssembly(); setAssembling(false);
  isolate = false; viewer.setIsolate(false); viewer.select(null);
  explode.value = '0'; viewer.setExplode(0); viewer.resetView();
});
explode.addEventListener('input', () => { setAssembling(false); viewer.setExplode(Number(explode.value)); });
assembleBtn.addEventListener('click', () => {
  if (assembling) { viewer.stopAssembly(); setAssembling(false); return; }
  isolate = false; explode.value = '0'; setAssembling(true);
  viewer.playAssembly();
});
partsBtn.addEventListener('click', () => {
  partsPanel.hidden = !partsPanel.hidden;
  partsBtn.setAttribute('aria-expanded', String(!partsPanel.hidden));
});

viewer.load(stage.dataset.src!).then((list) => {
  parts = list;
  buildList();
  status.remove();
  for (const el of [explode, assembleBtn, resetBtn, partsBtn]) el.disabled = false;
}).catch((e) => { console.error('3D viewer:', e); status.textContent = 'The 3D model could not be loaded.'; });
