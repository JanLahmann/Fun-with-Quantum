#!/usr/bin/env node
/**
 * Builds the web content the iOS app bundles, into ios/FunWithQuantum/Web/ (not committed):
 *
 *   node ios/scripts/build-web.mjs [--skip-portal]
 *
 * - site/: the portal's app build (PUBLIC_FWQ_APP=1 → portal/dist-app: no analytics, no CDN, no Ket),
 *   for the browser games. Unlisted /preview/ pages and the scripts and styles only they use are left
 *   out (only assets the kept pages reach are copied); the build fails if a page would load anything
 *   from the internet or a preview game's code would ship.
 * - models/: the Build tab's 3D viewers — the family's own viewers and models, fetched from their
 *   repositories at the commits pinned in ios/web/sources.json (cached in ios/web/.cache/), each
 *   bundled with the three.js version it uses on the web.
 * - golf/: Quantum Golf, Entangible's golf-only build (its `npm run build:golf`), from the release asset pinned in
 *   ios/web/sources.json and checked against its sha256. It loads nothing from the internet (checked here too).
 * - catalog.json: what the native lists show (games, projects, models, Quantum Golf), from portal/src/content, and the
 *   texts of the native Ket guide sheet (portal/src/lib/assistant/i18n.ts).
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { frontMatter } from '../../assistant/scripts/fwq-guide-knowledge.mjs';
import { ASSISTANT_TEXTS, GUIDE_TEXTS } from '../../portal/src/lib/assistant/i18n.ts';
import { TRUSTED } from '../../portal/src/lib/assistant/render.ts';
import { DOORS, HERO } from '../../portal/src/data/home.ts';

const IOS = fileURLToPath(new URL('..', import.meta.url));
const ROOT = join(IOS, '..');
const WEB = join(IOS, 'web');
const CACHE = join(WEB, '.cache');
const OUT = join(IOS, 'FunWithQuantum', 'Web');
const SOURCES = JSON.parse(readFileSync(join(WEB, 'sources.json'), 'utf8'));
/** --skip-portal: reuse portal/dist-app from an earlier run. */
const skipPortal = process.argv.includes('--skip-portal');

/** The models of the Build tab: which viewer, which file, and the native AR file if there is one. */
export const MODELS = [
  { id: 'rasqberry-two', title: 'RasQberry Two', viewer: 'rasqberry', src: 'rasqberry-two.glb', from: 'rasqberry-two', project: 'rasqberry-two',
    blurb: 'Every printed part: explode it, tap a part, or watch it assemble in order.' },
  { id: 'quantego-one', title: 'Quantego One', viewer: 'quantego', src: 'quantego-one.mpd', from: 'quantego', ar: 'quantego-one.usdz', project: 'quantego',
    blurb: 'The small LEGO model: build it step by step, explode it, list its bricks.' },
  { id: 'quantego-two', title: 'Quantego Two', viewer: 'quantego', src: 'quantego-two.mpd', from: 'quantego', ar: 'quantego-two.usdz', project: 'quantego',
    blurb: 'A LEGO model of IBM Quantum System Two: build it step by step, explode it, list its bricks.' },
  { id: 'quantego-two-1024', title: 'Quantego Two 1024', viewer: 'quantego', src: 'quantego-two-1024.mpd', from: 'quantego', project: 'quantego', smooth: false,
    blurb: 'The large display model, brick by brick.' },
  // Looks as on qutie.org's showroom stage (Qutie site/src/pages/index.astro, `looks`, at the pinned commit).
  { id: 'qutie-system-one', title: 'Qutie System One', viewer: 'qutie', src: 'qutie-system-one.stl', from: 'qutie', project: 'qutie',
    look: { color: '#26272d', metalness: 0.15, roughness: 0.45, rotate: 180 }, blurb: 'Palm-sized, prints in one piece: spin it.' },
  { id: 'qutie-system-two', title: 'Qutie System Two', viewer: 'qutie', src: 'qutie-system-two.stl', from: 'qutie', project: 'qutie',
    look: { color: '#c7ccd6', metalness: 0.45, roughness: 0.35, rotate: 0 }, blurb: 'Palm-sized, prints in one piece: spin it.' },
];

/** Quantum Golf: Entangible's golf-only bundle (sources.json `quantum-golf`), a game of the Play tab. */
export const GOLF = {
  id: 'quantum-golf', title: 'Quantum Golf', icon: '⛳', project: 'entangible', page: '/golf/index.html',
  tagline: 'Build the target state in as few moves as you can: 18 holes, from one qubit on the Bloch sphere to five entangled qubits.',
  concept: 'Gates, superposition, entanglement, phase',
};

const THREE = { quantego: 'three-160', rasqberry: 'three-169', qutie: 'three-169' };

/**
 * Changes to a fetched viewer for the app, each an exact text replacement that fails the build when
 * the source no longer contains it (then check whether it is still needed).
 * - Quantego frames a model by its height only, which cuts off the sides on a portrait phone screen;
 *   the app moves the camera back when the view is narrower than 4:5 (suggested upstream, 2026-10-17).
 * - Its web AR loads <model-viewer> from a CDN; the app has native AR and loads nothing from the
 *   internet, so that import is cut (it is only reached with data-ar, which the app's pages don't set).
 */
const PATCHES = {
  'quantego/ldraw-viewer.js': [[
    'const dist = ( maxDim / 2 ) / Math.tan( ( camera.fov / 2 ) * Math.PI / 180 ) * 1.6;',
    'const dist = ( maxDim / 2 ) / Math.tan( ( camera.fov / 2 ) * Math.PI / 180 ) * 1.6 * Math.max( 1, 0.8 / camera.aspect );',
  ], [
    "import( 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js' )",
    "Promise.reject( new Error( 'AR is native in the app' ) )",
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

/** Downloads a pinned release asset (a .tar.gz), checks its sha256 and unpacks it into dir. */
async function fetchRelease(s, dir) {
  const url = `https://github.com/${s.repo}/releases/download/${encodeURIComponent(s.release)}/${encodeURIComponent(s.asset)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const sha = createHash('sha256').update(buf).digest('hex');
  if (sha !== s.sha256) throw new Error(`${url}: sha256 ${sha}, expected ${s.sha256}`);
  const tgz = join(CACHE, `${s.asset}`);
  writeFileSync(tgz, buf);
  try {
    // only plain files and folders, inside the archive: no absolute paths, no `..`, no links
    const entries = execFileSync('tar', ['-tzf', tgz], { encoding: 'utf8' }).split('\n').filter(Boolean);
    const bad = entries.find((e) => e.startsWith('/') || e.split('/').includes('..'));
    if (bad) throw new Error(`${s.asset}: unsafe path ${bad}`);
    const link = execFileSync('tar', ['-tvzf', tgz], { encoding: 'utf8' }).split('\n').filter(Boolean).find((l) => !/^[-d]/.test(l));
    if (link) throw new Error(`${s.asset}: not a plain file or folder: ${link}`);
    run('tar', ['-xzf', tgz, '-C', dir], CACHE);
  } finally {
    rmSync(tgz, { force: true });
  }
  console.log(`fetched ${s.repo} ${s.release}/${s.asset} (${(buf.length / 1e6).toFixed(1)} MB, sha256 ok)`);
}

/** Fetches each source entry once (cached by its pinned fields): a release asset, or files at a commit (refusing Git LFS pointers and empty files). */
async function fetchSources() {
  for (const [name, s] of Object.entries(SOURCES)) {
    if (name.startsWith('$')) continue;
    const dir = join(CACHE, name);
    const marker = join(dir, '.key');
    const key = createHash('sha256').update(JSON.stringify(s)).digest('hex');
    if (existsSync(marker) && readFileSync(marker, 'utf8') === key) continue;
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    if (s.asset) await fetchRelease(s, dir);
    else for (const [file, path] of Object.entries(s.files)) {
      const url = `https://raw.githubusercontent.com/${s.repo}/${s.ref}/${path.split('/').map(encodeURIComponent).join('/')}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 200 || buf.subarray(0, 40).toString().startsWith('version https://git-lfs')) throw new Error(`${url}: not the real file (${buf.length} bytes)`);
      writeFileSync(join(dir, file), buf);
      console.log(`fetched ${s.repo}@${s.ref.slice(0, 8)} ${path} (${(buf.length / 1e6).toFixed(1)} MB)`);
    }
    writeFileSync(marker, key);
  }
}

const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));

/** The browser code of the unlisted games (portal/src/components): none of it may ship. */
const PREVIEW_CODE = /(HardyGame|MagicSquareGame|PrisonersDilemmaGame|SatGame|CoinGame2|GamePreviewPage)/;

/** Tags that load something by themselves: a src on a media or script element, or a stylesheet, preload, icon or manifest link. */
export function remoteLoads(html) {
  const found = [];
  for (const m of html.matchAll(/<(script|img|iframe|video|audio|source|track|embed|model-viewer|image)\b[^>]*?\s(?:src|poster|srcset)\s*=\s*["']\s*(https?:)?\/\/[^"']*/gi)) found.push(m[0]);
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    if (/\brel\s*=\s*["'][^"']*(stylesheet|preload|modulepreload|icon|manifest|prefetch)/i.test(m[0]) && /\bhref\s*=\s*["']\s*(https?:)?\/\//i.test(m[0])) found.push(m[0]);
  }
  return found;
}

/** /_astro/ files the given text refers to: absolute paths, and (in scripts and styles) ./sibling imports. */
const astroRefs = (text, inAstro) => [
  ...[...text.matchAll(/\/_astro\/([\w.@~-]+)/g)].map((m) => m[1]),
  ...(inAstro ? [...text.matchAll(/["'(]\.\/([\w.@~-]+\.(?:js|mjs|css|woff2?|ttf|webp|png|jpe?g|avif|svg|gif))["')]/g)].map((m) => m[1]) : []),
];

function buildPortal() {
  const portal = join(ROOT, 'portal');
  const dist = join(portal, 'dist-app');
  // Ket's chat under the coin game talks to fwq://app/__ket, which the app forwards to the Worker with its App Attest token.
  if (!skipPortal) run('npx', ['astro', 'build', '--outDir', dist], portal, { PUBLIC_FWQ_APP: '1', PUBLIC_FWQ_ASSISTANT_URL: 'fwq://app/__ket', PUBLIC_FWQ_OFFLINE: '' });
  if (!existsSync(join(dist, 'index.html'))) throw new Error('portal/dist-app is missing: run without --skip-portal');
  const site = join(OUT, 'site');
  const isPreview = (src) => relative(dist, src).split('/').includes('preview');
  const html = walk(dist).filter((f) => f.endsWith('.html') && !isPreview(f));
  // Only the /_astro/ assets the kept pages reach (with what those import): never the preview games' bundles.
  const needed = new Set();
  const queue = html.flatMap((f) => astroRefs(readFileSync(f, 'utf8'), false));
  while (queue.length) {
    const name = queue.pop();
    if (needed.has(name) || !existsSync(join(dist, '_astro', name))) continue;
    needed.add(name);
    if (/\.(js|mjs|css)$/.test(name)) queue.push(...astroRefs(readFileSync(join(dist, '_astro', name), 'utf8'), true));
  }
  cpSync(dist, site, {
    recursive: true,
    filter: (src) => {
      const rel = relative(dist, src).split('/');
      if (rel.includes('preview')) return false;
      return rel[0] !== '_astro' || rel.length === 1 || needed.has(rel.slice(1).join('/'));
    },
  });
  for (const f of walk(site)) {
    const rel = relative(OUT, f);
    if (PREVIEW_CODE.test(rel)) throw new Error(`${rel}: an unlisted game's code would ship`);
    if (!/\.(html|js|mjs|css)$/.test(f)) continue;
    const text = readFileSync(f, 'utf8');
    if (text.includes('/preview/')) throw new Error(`${rel} links an unlisted /preview/ page`);
    if (f.endsWith('.html') && remoteLoads(text).length) throw new Error(`${rel} would load from the internet: ${remoteLoads(text)[0]}`);
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
<body><div id="stage" data-src="rasqberry-two/${m.src}" data-label="Interactive 3D model of the RasQberry Two: drag to rotate, pinch to zoom, tap a part to select it">
<p class="status" id="status">Loading the 3D model…</p><div class="overlay" id="info" hidden aria-live="polite"></div><div class="overlay" id="step" hidden aria-live="polite"></div></div>
<div class="bottom"><div id="parts" hidden></div>
<div class="toolbar"><button type="button" id="reset" disabled>Reset</button>
<label><span>Exploded</span><input type="range" id="explode" min="0" max="1" step="0.01" value="0" disabled aria-label="Exploded"></label>
<button type="button" id="assemble" aria-pressed="false" disabled>Assemble</button>
<button type="button" id="parts-btn" aria-expanded="false" aria-controls="parts" disabled>Parts</button></div></div>
<script type="module" src="rasqberry.js"></script></body></html>\n`;
  }
  return `${head}<style>#stage{position:fixed;inset:0}</style></head>
<body><div id="stage" data-src="qutie/${m.src}" data-color="${m.look.color}" data-metalness="${m.look.metalness}" data-roughness="${m.look.roughness}" data-rotate="${m.look.rotate}" role="img" aria-label="Interactive 3D model of ${esc(m.title)}: drag to spin, pinch to zoom"><p class="status" id="status">Loading the 3D model…</p></div>
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
    const files = readdirSync(join(CACHE, name)).filter((f) => !f.startsWith('.') && !/\.(ts|js|txt)$/.test(f));
    mkdirSync(join(dir, name), { recursive: true });
    for (const f of files) cpSync(join(CACHE, name, f), join(dir, name, f));
  }
  for (const m of MODELS) writeFileSync(join(dir, `${m.id}.html`), page(m));
  for (const f of walk(dir).filter((f) => /\.(html|js|css)$/.test(f))) {
    const text = readFileSync(f, 'utf8');
    if (/import\(\s*["'`]https?:|from\s*["']https?:/.test(text) || (f.endsWith('.html') && remoteLoads(text).length)) throw new Error(`${relative(OUT, f)} would load from the internet`);
  }
}

/**
 * The web addresses Quantum Golf's code may contain: XML namespaces, React's error-decoder text and the link to
 * entangible.org (which opens in Safari). Any other address fails the build, whatever would use it.
 */
const GOLF_URLS = /^https?:\/\/(www\.w3\.org\/|reactjs\.org\/docs\/error-decoder\.html|entangible\.org\/)/;

/** Quantum Golf as the release built it, after checking that nothing in it reaches the internet. */
function buildGolf() {
  const src = join(CACHE, 'quantum-golf');
  if (!existsSync(join(src, 'index.html'))) throw new Error('quantum-golf: the release has no index.html at its root');
  const dir = join(OUT, 'golf');
  cpSync(src, dir, { recursive: true, filter: (f) => !f.endsWith('/.key') });
  for (const f of walk(dir).filter((f) => /\.(html|js|mjs|css)$/.test(f))) {
    const text = readFileSync(f, 'utf8');
    const rel = relative(OUT, f);
    if (f.endsWith('.html') && remoteLoads(text).length) throw new Error(`${rel} would load from the internet: ${remoteLoads(text)[0]}`);
    if (/import\(\s*["'`]https?:|from\s*["']https?:|@import\s+(url\()?["']?https?:|url\(\s*["']?https?:/.test(text)) throw new Error(`${rel} would load from the internet`);
    if (/new WebSocket\(|serviceWorker\.register|navigator\.sendBeacon/.test(text)) throw new Error(`${rel} opens a connection or registers a service worker`);
    const url = (text.match(/https?:\/\/[^\s"'`)<>\\]+/g) ?? []).find((u) => !GOLF_URLS.test(u));
    if (url) throw new Error(`${rel} contains a web address the app doesn't expect: ${url}`);
  }
}

/** The notices the app shows under About → Licenses: everything it bundles that isn't Jan's own text. */
function licenses() {
  const three = readFileSync(join(WEB, 'node_modules', 'three-169', 'LICENSE'), 'utf8').trim();
  const apache = readFileSync(join(CACHE, 'quantego', 'LICENSE-Apache-2.0.txt'), 'utf8').trim();
  const golfNotices = readFileSync(join(CACHE, 'quantum-golf', 'THIRD_PARTY_NOTICES.txt'), 'utf8').trim();
  const text = `Fun with Quantum bundles these works. Thank you to their authors.

THE FAMILY'S PROJECTS
The games and pages of fun-with-quantum.org (github.com/JanLahmann/Fun-with-Quantum), the 3D viewers and models of
RasQberry Two (github.com/JanLahmann/RasQberry-Two), Quantego (github.com/JanLahmann/Quantego) and Qutie
(github.com/JanLahmann/Qutie), and Quantum Golf from Entangible (github.com/JanLahmann/entangible): Apache License 2.0,
text below.

LDRAW PARTS
The Quantego models contain parts from the LDraw Parts Library (ldraw.org), by the LDraw.org contributors,
licensed under Creative Commons Attribution 4.0 (CC BY 4.0, creativecommons.org/licenses/by/4.0/); some parts
also under CC BY 2.0. LDraw is a trademark of the Estate of James Jessiman.

THREE.JS (versions 0.160 and 0.169)
${three}

MESHOPTIMIZER (meshopt decoder, part of three.js)
MIT License. Copyright (C) 2016-2022, by Arseny Kapoulkine (arseny.kapoulkine@gmail.com). The permission notice
is the same as three.js's above.

QUANTUM GOLF: THIRD-PARTY NOTICES (from Entangible's golf bundle)
${golfNotices}

TRADEMARKS
This app is not affiliated with or endorsed by IBM, the LEGO Group or BrickLink. IBM, IBM Quantum and Qiskit are
trademarks of International Business Machines Corporation. LEGO and BrickLink are trademarks of the LEGO Group.

APACHE LICENSE 2.0
${apache}
`;
  writeFileSync(join(OUT, 'licenses.txt'), text);
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
  if (!projects.find((p) => p.id === GOLF.project)) throw new Error(`catalog: Quantum Golf's project ${GOLF.project} is not listed`);
  const golf = { ...GOLF, repo: SOURCES['quantum-golf'].repo, release: SOURCES['quantum-golf'].release };
  const models = MODELS.map(({ id, title, blurb, ar, project }) => ({
    id, title, blurb, page: `/models/${id}.html`, ...(ar ? { ar: `/models/${MODELS.find((m) => m.id === id).from}/${ar}` } : {}),
    ...(projects.find((p) => p.id === project) ? { project } : {}),
  }));
  // The app trusts this file: every field it reads must be there, and every link must be https.
  const https = (u, what) => { if (!/^https:\/\/[^\s]+$/.test(u ?? '')) throw new Error(`catalog: ${what} has no https link: ${u}`); };
  for (const g of games) {
    for (const k of ['id', 'title', 'tagline', 'icon', 'concept', 'duration', 'level', 'audience', 'page']) if (typeof g[k] !== 'string' || !g[k]) throw new Error(`catalog: game ${g.id} lacks ${k}`);
    https(g.notebookUrl, `game ${g.id}`);
  }
  for (const p of projects) {
    for (const k of ['id', 'door', 'title', 'tagline', 'icon']) if (typeof p[k] !== 'string' || !p[k]) throw new Error(`catalog: project ${p.id} lacks ${k}`);
    https(p.url, `project ${p.id}`);
  }
  const credits = Object.entries(SOURCES).filter(([k]) => !k.startsWith('$') && k !== 'quantum-golf').map(([name, s]) => ({ name, repo: s.repo, ref: s.ref }));
  // The native guide sheet's texts: the portal's guide box (KetGuide.astro), so app and site say the same.
  const t = { ...ASSISTANT_TEXTS.en, ...GUIDE_TEXTS };
  const ket = Object.fromEntries(['open', 'title', 'intro', 'privacy', 'placeholder', 'send', 'thinking', 'you', 'explainer', 'helpful', 'notHelpful', 'thanks', 'errRate', 'errBusy', 'errNetwork']
    .map((k) => { if (typeof t[k] !== 'string' || !t[k]) throw new Error(`catalog: Ket text ${k} missing`); return [k, t[k]]; }));
  // The welcome page: the homepage's hero and three doors (portal/src/data/home.ts), photos resized for the app.
  mkdirSync(join(OUT, 'welcome'), { recursive: true });
  const welcome = {
    title: HERO.title,
    lead: HERO.lead,
    doors: DOORS.map((d) => {
      const out = join(OUT, 'welcome', `${d.key}.jpg`);
      run('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '80', '-Z', '900', join(ROOT, 'portal', 'src', 'assets', d.image), '--out', out], ROOT);
      return { key: d.key, title: d.title, text: d.text, image: `/welcome/${d.key}.jpg`, imageAlt: d.imageAlt, fit: d.fit };
    }),
  };
  ket.trusted = TRUSTED.source; // links in an answer become tappable only to these sites, as on the web
  writeFileSync(join(OUT, 'catalog.json'), `${JSON.stringify({ games, golf, projects, models, credits, ket, welcome }, null, 1)}\n`);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
await fetchSources();
applyPatches();
buildPortal();
buildModels();
buildGolf();
licenses();
catalog();
console.log(`web content → ${relative(ROOT, OUT)}`);
