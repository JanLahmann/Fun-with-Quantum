// Renders the family icons from glyphs.mjs into family/icons/<id>/:
//   icon.svg (scalable; arc follows the color scheme), favicon-32.png, favicon.ico (16/32/48),
//   apple-touch-icon.png (180, solid paper), icon-512.png (solid paper), plus sheet.png (all of them).
// Run from the repo root:  node family/icons/build.mjs   (uses Playwright from portal/node_modules)
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GLYPHS } from './glyphs.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(join(here, '../../portal/package.json'))('playwright');
const manifest = JSON.parse(readFileSync(join(here, '../family.json'), 'utf8'));
const PAPER = '#F6F7FA';

// rounder frame for Qutie (as on qutie.org)
const radius = (id) => (id === 'qutie' ? 14 : 10);

function svg(id, { background = false, scheme = true } = {}) {
  const name = manifest.members.find((m) => m.id === id)?.name ?? id;
  const g = `g-${id}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <title>${name}</title>
${scheme ? `  <style>
    .arc { stroke: #1C1D27; }
    @media (prefers-color-scheme: dark) { .arc { stroke: #E9EAF1; } }
  </style>
` : ''}  <defs>
    <linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0E7C9C"/>
      <stop offset="1" stop-color="#C22F6E"/>
    </linearGradient>
  </defs>
${background ? `  <rect width="64" height="64" fill="${PAPER}"/>\n` : ''}  <path class="arc" d="M9 12 A 24 24 0 0 1 19 6" fill="none"${scheme ? '' : ' stroke="#1C1D27"'} stroke-width="3.5" stroke-linecap="round" opacity="0.5"/>
  <g transform="rotate(-12 32 32)">
    <rect x="14" y="14" width="36" height="36" rx="${radius(id)}" fill="none" stroke="url(#${g})" stroke-width="6"/>
    ${GLYPHS[id]}
  </g>
</svg>
`;
}

/** ICO container holding PNG images (supported by every current browser and Windows Vista+). */
function ico(pngs) {
  const head = Buffer.alloc(6 + 16 * pngs.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  let offset = head.length;
  pngs.forEach(([size, buf], i) => {
    const e = 6 + 16 * i;
    head.writeUInt8(size % 256, e); head.writeUInt8(size % 256, e + 1);
    head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(buf.length, e + 8); head.writeUInt32LE(offset, e + 12);
    offset += buf.length;
  });
  return Buffer.concat([head, ...pngs.map(([, b]) => b)]);
}

const browser = await chromium.launch();
const page = await browser.newPage();
async function png(markup, size, inset = 0) {
  await page.setViewportSize({ width: size, height: size });
  const pad = Math.round(size * inset);
  await page.setContent(`<html><body style="margin:0;background:transparent">
    <div style="width:${size}px;height:${size}px;box-sizing:border-box;padding:${pad}px;background:${inset ? PAPER : 'transparent'}">
    ${markup.replace('<svg ', `<svg width="${size - 2 * pad}" height="${size - 2 * pad}" `)}</div></body></html>`);
  return page.locator('div').screenshot({ omitBackground: !inset });
}

const ids = Object.keys(GLYPHS);
for (const id of ids) {
  const dir = join(here, id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'icon.svg'), svg(id));
  const flat = svg(id, { scheme: false });
  writeFileSync(join(dir, 'favicon-32.png'), await png(flat, 32));
  writeFileSync(join(dir, 'favicon.ico'), ico([[16, await png(flat, 16)], [32, await png(flat, 32)], [48, await png(flat, 48)]]));
  writeFileSync(join(dir, 'apple-touch-icon.png'), await png(flat, 180, 0.08));
  writeFileSync(join(dir, 'icon-512.png'), await png(flat, 512, 0.08));
}

// contact sheet: every icon at 16, 32 and 128 px, light and dark
const cell = (id, bg, fg) => `<div style="background:${bg};color:${fg};padding:12px;text-align:center;font:12px system-ui">
  ${[16, 32, 128].map((s) => `<img src="data:image/svg+xml;base64,${Buffer.from(svg(id, { scheme: false }).replace(/stroke="#1C1D27"/, `stroke="${bg === PAPER ? '#1C1D27' : '#E9EAF1'}"`)).toString('base64')}" width="${s}" height="${s}" style="margin:4px;vertical-align:middle">`).join('')}
  <div>${manifest.members.find((m) => m.id === id)?.name ?? id}</div></div>`;
await page.setViewportSize({ width: 1200, height: 400 });
await page.setContent(`<body style="margin:0;display:grid;grid-template-columns:repeat(4,1fr);align-content:start">${ids.map((id, i) => cell(id, i % 2 ? '#14151D' : PAPER, i % 2 ? '#E9EAF1' : '#1C1D27')).join('')}</body>`);
writeFileSync(join(here, 'sheet.png'), await page.screenshot({ fullPage: true }));
await browser.close();
console.log(`${ids.length} icons → family/icons/<id>/`);
