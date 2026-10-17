#!/usr/bin/env node
/**
 * Builds the web content the iOS app bundles, into ios/FunWithQuantum/Web/ (not committed):
 *
 *   node ios/scripts/build-web.mjs [--skip-portal]
 *
 * - site/: the portal (portal/dist, built here without analytics and without Ket), for the browser
 *   games. Unlisted /preview/ pages are left out; the build fails if one would ship.
 * - models/: the Build tab's 3D viewers — the family's own viewers and models, fetched from their
 *   repositories at the commits pinned in ios/web/sources.json (cached in ios/web/.cache/), each
 *   bundled with the three.js version it uses on the web.
 * - catalog.json: what the native lists show (games, projects, models), from portal/src/content.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { frontMatter } from '../../assistant/scripts/fwq-guide-knowledge.mjs';

const IOS = fileURLToPath(new URL('..', import.meta.url));
const ROOT = join(IOS, '..');
const WEB = join(IOS, 'web');
const CACHE = join(WEB, '.cache');
const OUT = join(IOS, 'FunWithQuantum', 'Web');
const SOURCES = JSON.parse(readFileSync(join(WEB, 'sources.json'), 'utf8'));
const skipPortal = process.argv.includes('--skip-portal');

/** The models of the Build tab: which viewer, which file, and the native AR file if there is one. */
export const MODELS = [
  { id: 'rasqberry-two', title: 'RasQberry Two', viewer: 'rasqberry', src: 'rasqberry-two.glb', from: 'rasqberry-two', project: 'rasqberry-two',
    blurb: 'Every printed part: explode it, tap a part, or watch it assemble in order.' },
  { id: 'quantego-one', title: 'Quantego One', viewer: 'quantego', src: 'quantego-one.mpd', from: 'quantego', ar: 'quantego-one.usdz', project: 'quantego',
    blurb: 'The small LEGO model: build it step by step, explode it, list its bricks.' },
  { id: 'quantego-two', title: 'Quantego Two', viewer: 'quantego', src: 'quantego-two.mpd', from: 'quantego', ar: 'quantego-two.usdz', project: 'quantego',
    blurb: 'IBM Quantum System Two in LEGO: build it step by step, explode it, list its bricks.' },
  { id: 'quantego-two-1024', title: 'Quantego Two 1024', viewer: 'quantego', src: 'quantego-two-1024.mpd', from: 'quantego', project: 'quantego', smooth: false,
    blurb: 'The large display model, brick by brick.' },
  { id: 'qutie-system-one', title: 'Qutie System One', viewer: 'qutie', src: 'qutie-system-one.stl', from: 'qutie', project: 'qutie',
    blurb: 'Palm-sized, prints in one piece: spin it.' },
  { id: 'qutie-system-two', title: 'Qutie System Two', viewer: 'qutie', src: 'qutie-system-two.stl', from: 'qutie', project: 'qutie',
    blurb: 'Palm-sized, prints in one piece: spin it.' },
];

const THREE = { quantego: 'three-160', rasqberry: 'three-169', qutie: 'three-169' };

/**
 * Changes to a fetched viewer for the app, each an exact text replacement that fails the build when
 * the source no longer contains it (then check whether it is still needed).
 * - Quantego frames a model by its height only, which cuts off the sides on a portrait phone screen;
 *   the app moves the camera back when the view is narrower than 4:5 (suggested upstream, 2026-10-17).
 */
const PATCHES = {
  'quantego/ldraw-viewer.js': [[
    'const dist = ( maxDim / 2 ) / Math.tan( ( camera.fov / 2 ) * Math.PI / 180 ) * 1.6;',
    'const dist = ( maxDim / 2 ) / Math.tan( ( camera.fov / 2 ) * Math.PI / 180 ) * 1.6 * Math.max( 1, 0.8 / camera.aspect );',
  ]],
};

function applyPatches() {
  for (const [file, list] of Object.entries(PATCHES)) {
    let text = readFileSync(join(CACHE, file), 'utf8');
    for (const [from, to] of list) {
      if (text.split(from).length !== 2) throw new Error(`patch for ${file} no longer applies: ${from}`);
      text = text.replace(from, to);
    }
    writeFileSync(join(CACHE, file.replace(/\.js$/, '.app.js')), text);
  }
}

const run = (cmd, args, cwd, env = {}) => execFileSync(cmd, args, { cwd, stdio: 'inherit', env: { ...process.env, ...env } });

/** Fetches every pinned file once per commit; refuses Git LFS pointers and empty files. */
async function fetchSources() {
  for (const [name, s] of Object.entries(SOURCES)) {
    if (name.startsWith('$')) continue;
    const dir = join(CACHE, name);
    const marker = join(dir, '.ref');
    if (existsSync(marker) && readFileSync(marker, 'utf8') === s.ref) continue;
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    for (const [file, path] of Object.entries(s.files)) {
      const url = `https://raw.githubusercontent.com/${s.repo}/${s.ref}/${path.split('/').map(encodeURIComponent).join('/')}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 200 || buf.subarray(0, 40).toString().startsWith('version https://git-lfs')) throw new Error(`${url}: not the real file (${buf.length} bytes)`);
      writeFileSync(join(dir, file), buf);
      console.log(`fetched ${s.repo}@${s.ref.slice(0, 8)} ${path} (${(buf.length / 1e6).toFixed(1)} MB)`);
    }
    writeFileSync(marker, s.ref);
  }
}

function buildPortal() {
  const portal = join(ROOT, 'portal');
  if (!skipPortal) run('npm', ['run', 'build'], portal, { PUBLIC_FWQ_ASSISTANT_URL: '', PUBLIC_FWQ_OFFLINE: '' });
  const dist = join(portal, 'dist');
  if (!existsSync(join(dist, 'index.html'))) throw new Error('portal/dist is missing: build the portal first');
  cpSync(dist, join(OUT, 'site'), { recursive: true, filter: (src) => !relative(dist, src).split('/').includes('preview') });
  // Unlisted games must never ship: no /preview/ page, and no page that links one.
  const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
  for (const f of walk(join(OUT, 'site')).filter((f) => f.endsWith('.html'))) {
    if (readFileSync(f, 'utf8').includes('/preview/')) throw new Error(`${relative(OUT, f)} links an unlisted /preview/ page`);
  }
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function page(m) {
  const head = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(m.title)}</title><link rel="stylesheet" href="app.css">`;
  if (m.viewer === 'quantego') {
    return `${head}<link rel="stylesheet" href="quantego/viewer.css"><link rel="stylesheet" href="quantego-app.css"></head>
<body><div class="viewer" data-model="quantego/${m.src}"${m.smooth === false ? ' data-smooth-normals="false"' : ''}></div>
<script type="module" src="quantego.js"></script></body></html>\n`;
  }
  if (m.viewer === 'rasqberry') {
    return `${head}<link rel="stylesheet" href="rasqberry.css"></head>
<body><div id="stage" data-src="rasqberry-two/${m.src}" role="img" aria-label="Interactive 3D model of the RasQberry Two: drag to rotate, pinch to zoom, tap a part to select it">
<p class="status" id="status">Loading the 3D model…</p><div class="overlay" id="info" hidden aria-live="polite"></div><div class="overlay" id="step" hidden aria-live="polite"></div></div>
<div class="bottom"><div id="parts" hidden></div>
<div class="toolbar"><button type="button" id="reset" disabled>Reset</button>
<label><span>Exploded</span><input type="range" id="explode" min="0" max="1" step="0.01" value="0" disabled aria-label="Exploded"></label>
<button type="button" id="assemble" aria-pressed="false" disabled>Assemble</button>
<button type="button" id="parts-btn" aria-expanded="false" aria-controls="parts" disabled>Parts</button></div></div>
<script type="module" src="rasqberry.js"></script></body></html>\n`;
  }
  return `${head}<style>#stage{position:fixed;inset:0}</style></head>
<body><div id="stage" data-src="qutie/${m.src}" role="img" aria-label="Interactive 3D model of ${esc(m.title)}: drag to spin, pinch to zoom"><p class="status" id="status">Loading the 3D model…</p></div>
<script type="module" src="qutie.js"></script></body></html>\n`;
}

function buildModels() {
  const dir = join(OUT, 'models');
  mkdirSync(dir, { recursive: true });
  const esbuild = join(WEB, 'node_modules', '.bin', 'esbuild');
  for (const viewer of ['quantego', 'rasqberry', 'qutie']) {
    run(esbuild, [`src/${viewer}.ts`, '--bundle', '--minify', '--format=esm', '--target=safari16', `--alias:three=${THREE[viewer]}`,
      '--external:./qsim.js', '--log-level=warning', `--outfile=${join(dir, `${viewer}.js`)}`], WEB);
  }
  cpSync(join(WEB, 'src', 'app.css'), join(dir, 'app.css'));
  cpSync(join(WEB, 'src', 'rasqberry.css'), join(dir, 'rasqberry.css'));
  cpSync(join(WEB, 'src', 'quantego-app.css'), join(dir, 'quantego-app.css'));
  for (const name of ['rasqberry-two', 'quantego', 'qutie']) {
    const files = readdirSync(join(CACHE, name)).filter((f) => !f.startsWith('.') && !/\.(ts|js)$/.test(f));
    mkdirSync(join(dir, name), { recursive: true });
    for (const f of files) cpSync(join(CACHE, name, f), join(dir, name, f));
  }
  for (const m of MODELS) writeFileSync(join(dir, `${m.id}.html`), page(m));
}

const collection = (dir) => readdirSync(join(ROOT, dir)).filter((f) => f.endsWith('.md')).sort()
  .map((f) => ({ id: f.replace(/\.md$/, ''), ...frontMatter(readFileSync(join(ROOT, dir, f), 'utf8'), f).data }))
  .sort((a, b) => a.order - b.order);

function catalog() {
  const family = JSON.parse(readFileSync(join(ROOT, 'family', 'family.json'), 'utf8'));
  const hidden = family.members.filter((m) => !m.footer).map((m) => new URL(m.url).hostname);
  const games = collection('portal/src/content/games').map((g) => ({
    id: g.id, title: g.title, tagline: g.tagline, icon: g.icon, concept: g.concept, duration: g.duration, level: g.level,
    audience: g.audience, webGame: Boolean(g.webGame), page: `/play/${g.id}/`, notebookUrl: g.binderUrl,
  }));
  const projects = collection('portal/src/content/projects')
    .filter((p) => p.url && !hidden.includes(new URL(p.url).hostname) && (p.status ?? 'live') === 'live')
    .map((p) => ({ id: p.id, door: p.door, title: p.title, tagline: p.tagline, icon: p.icon, url: p.url }));
  const models = MODELS.map(({ id, title, blurb, ar, project }) => ({
    id, title, blurb, page: `/models/${id}.html`, ...(ar ? { ar: `/models/${MODELS.find((m) => m.id === id).from}/${ar}` } : {}),
    ...(projects.find((p) => p.id === project) ? { project } : {}),
  }));
  const credits = Object.entries(SOURCES).filter(([k]) => !k.startsWith('$')).map(([name, s]) => ({ name, repo: s.repo, ref: s.ref }));
  writeFileSync(join(OUT, 'catalog.json'), `${JSON.stringify({ games, projects, models, credits }, null, 1)}\n`);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
await fetchSources();
applyPatches();
buildPortal();
buildModels();
catalog();
console.log(`web content → ${relative(ROOT, OUT)}`);
