// Quality scan of the family sites, read-only: broken links on every sitemap page (lychee), axe on
// the home page and a few key pages (WCAG 2.1 A/AA, light scheme, desktop width) and Lighthouse
// mobile scores for the same pages. qamposer.org is left out (hands-off), and links to it are not checked.
//
//   node family/audit/quality-scan.mjs [--out DIR] [--links DIR] [--reuse FILE] [--skip-links] [--skip-lighthouse]
//
// Needs lychee (brew install lychee), the portal's node_modules (playwright, @axe-core/playwright;
// first time: cd portal && npm install && npx playwright install chromium) and network for
// npx lighthouse. Writes raw reports to DIR (default: a temp folder) and prints a Markdown summary;
// save that as results/quality-YYYY-MM-DD.md. --links DIR reuses lychee reports from an earlier run,
// --reuse FILE the axe and Lighthouse results of an earlier quality.json.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const require = createRequire(new URL('../../portal/package.json', import.meta.url));
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');

const LIGHTHOUSE = 'lighthouse@13.5.0';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

/** The pages that axe and Lighthouse check: the home page first, then 2–3 key pages. */
const SITES = {
  'fun-with-quantum.org': ['/', '/play/quantum-coin-game/', '/play/chsh-game/', '/teachers/'],
  'rasqberry.org': ['/', '/02-software/01-installation-overview/', '/03-quantum-computing-demos/01-demo-list/'],
  'rasqberry.one': ['/', '/documentation/RasQberry_Setup.html', '/documentation/RasQberry_Demos.html'],
  'quantego.org': ['/'],
  'qutie.org': ['/'],
  'qoffee-maker.org': ['/', '/Gates.html', '/Composer.html'],
  'entangible.org': ['/', '/?lang=de'],
  'certiq.dev': ['/', '/docs/intro', '/docs/flashcards', '/mock-exam'],
  'qubins.org': ['/', '/packages/'],
  'doqumentation.org': ['/', '/tutorials/chsh-inequality', '/learning/courses/basics-of-quantum-information/entanglement-in-action/chsh-game'],
  'de.doqumentation.org': ['/', '/tutorials/chsh-inequality'],
  'ja.doqumentation.org': ['/', '/tutorials/chsh-inequality'],
  'racetraq.org': ['/', '/?lang=de'],
};

const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
const OUT = arg('--out') ?? mkdtempSync(join(tmpdir(), 'family-quality-'));
const LINKS = arg('--links') ?? join(OUT, 'links');
for (const d of [OUT, LINKS]) mkdirSync(d, { recursive: true });

const get = async (url) => { try { const r = await fetch(url, { headers: { 'user-agent': UA } }); return r.ok ? await r.text() : ''; } catch { return ''; } };

/** Every page in a site's sitemaps (robots.txt Sitemap: lines, else /sitemap.xml; sitemap indexes followed). */
async function sitemapUrls(host) {
  const robots = await get(`https://${host}/robots.txt`);
  const maps = [...robots.matchAll(/^sitemap:\s*(\S+)/gim)].map((m) => m[1]);
  const urls = new Set();
  const walk = async (u, depth) => {
    const xml = await get(u);
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replaceAll('&amp;', '&'));
    if (/<sitemapindex/.test(xml) && depth < 2) for (const l of locs) await walk(l, depth + 1);
    else for (const l of locs) urls.add(l);
  };
  for (const m of maps.length ? maps : [`https://${host}/sitemap.xml`]) await walk(m, 0);
  return [...urls].sort();
}

// 1. Links
/** Answers that usually mean "no bots" or "too fast" rather than a dead link: listed apart, checked by hand. */
const isBlocked = (code) => [401, 403, 429, 999].includes(code) || /HTTP\/2 protocol error|Timeout/i.test(String(code));
const links = {};
for (const host of Object.keys(SITES)) {
  const report = join(LINKS, `${host}.json`);
  if (!process.argv.includes('--skip-links') && !existsSync(report)) {
    const urls = await sitemapUrls(host);
    writeFileSync(join(LINKS, `${host}.txt`), urls.join('\n') + '\n');
    console.error(`links: ${host} (${urls.length} pages)`);
    spawnSync('lychee', ['--no-progress', '--format', 'json', '--output', report, '--max-concurrency', '24', '--max-retries', '2',
      '--timeout', '30', '--user-agent', UA, '--exclude', 'qamposer\\.org', '--exclude', '^mailto:', '--exclude', '^tel:',
      '--cache', '--max-cache-age', '1d', '--files-from', join(LINKS, `${host}.txt`)], { cwd: LINKS, stdio: 'ignore' });
  }
  if (!existsSync(report)) continue;
  const r = JSON.parse(readFileSync(report, 'utf8'));
  const pages = existsSync(join(LINKS, `${host}.txt`)) ? readFileSync(join(LINKS, `${host}.txt`), 'utf8').trim().split('\n').length : 0;
  // broken target → status and the pages that link to it
  const broken = new Map();
  for (const [page, errs] of Object.entries(r.error_map ?? {}))
    for (const e of errs) {
      const b = broken.get(e.url) ?? { code: e.status?.code ?? e.status?.text ?? '?', pages: [] };
      b.pages.push(page);
      broken.set(e.url, b);
    }
  const all = [...broken].map(([url, b]) => ({ url, ...b, blocked: isBlocked(b.code) }));
  links[host] = { pages, checked: r.unique, broken: all.filter((b) => !b.blocked), blocked: all.filter((b) => b.blocked) };
}

const reuse = arg('--reuse') ? JSON.parse(readFileSync(arg('--reuse'), 'utf8')) : null;

// 2. axe
const browser = await chromium.launch();
const axe = {};
for (const [host, paths] of Object.entries(SITES)) {
  if (reuse?.axe[host]) { axe[host] = reuse.axe[host]; continue; }
  axe[host] = [];
  for (const path of paths) {
    const context = await browser.newContext({ colorScheme: 'light', viewport: { width: 1280, height: 900 }, userAgent: UA });
    const page = await context.newPage();
    try {
      await page.goto(`https://${host}${path}`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => page.waitForLoadState('load'));
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      axe[host].push({ path, violations: violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) })) });
    } catch (e) {
      axe[host].push({ path, error: String(e).split('\n')[0] });
    }
    await context.close();
  }
  console.error(`axe: ${host}`);
}
await browser.close();

// 3. Lighthouse (mobile, the default form factor; one run per page, so performance varies by a few points)
const npx = join(dirname(process.execPath), 'npx');
const lighthouse = {};
for (const [host, paths] of Object.entries(SITES)) {
  if (reuse?.lighthouse[host]?.length) { lighthouse[host] = reuse.lighthouse[host]; continue; }
  lighthouse[host] = [];
  if (process.argv.includes('--skip-lighthouse')) continue;
  for (const path of paths) {
    try {
      const json = execFileSync(npx, ['-y', LIGHTHOUSE, `https://${host}${path}`, '--output=json', '--output-path=stdout', '--quiet',
        '--only-categories=performance,accessibility,best-practices,seo', '--chrome-flags=--headless=new'], { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] });
      const lr = JSON.parse(json);
      const score = (c) => Math.round(100 * (lr.categories[c]?.score ?? NaN));
      const failed = Object.values(lr.audits).filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'manual' && a.scoreDisplayMode !== 'notApplicable');
      lighthouse[host].push({ path, perf: score('performance'), a11y: score('accessibility'), bp: score('best-practices'), seo: score('seo'),
        lcp: lr.audits['largest-contentful-paint']?.displayValue, cls: lr.audits['cumulative-layout-shift']?.displayValue,
        failed: failed.map((a) => a.id) });
    } catch (e) {
      lighthouse[host].push({ path, error: String(e).split('\n')[0] });
    }
  }
  console.error(`lighthouse: ${host}`);
}

writeFileSync(join(OUT, 'quality.json'), JSON.stringify({ links, axe, lighthouse }, null, 1));

// Summary
const uniq = (xs) => [...new Set(xs)];
const date = new Date().toISOString().slice(0, 10);
const md = [`# Family quality scan ${date}`, '', `Raw reports: quality.json and links/ in the scan's output folder. qamposer.org not scanned.`, '',
  '| site | sitemap pages | broken links (+ blocked) | axe violations (pages) | Lighthouse mobile, home: perf / a11y / best pr. / SEO |', '|---|---|---|---|---|'];
for (const host of Object.keys(SITES)) {
  const l = links[host];
  const a = axe[host];
  const nViol = a.reduce((s, p) => s + (p.violations?.length ?? 0), 0);
  const h = lighthouse[host][0];
  md.push(`| ${host} | ${l?.pages ?? '–'} | ${l ? `${l.broken.length} (+${l.blocked.length})` : '–'} | ${nViol} (${a.length}) | ${h ? (h.error ? 'error' : `${h.perf} / ${h.a11y} / ${h.bp} / ${h.seo}`) : '–'} |`);
}
md.push('', '## Details');
for (const host of Object.keys(SITES)) {
  md.push('', `### ${host}`);
  const on = (b) => `on ${b.pages.length} page${b.pages.length > 1 ? 's' : ''}, e.g. ${b.pages[0]}`;
  for (const b of links[host]?.broken ?? []) md.push(`- link ${String(b.code).slice(0, 60)}: ${b.url} (${on(b)})`);
  const blocked = links[host]?.blocked ?? [];
  if (blocked.length) md.push(`- blocked (${uniq(blocked.map((b) => String(b.code).replace(/^Network error: (HTTP\/2).*/, '$1'))).join(', ')}): ${blocked.length} link${blocked.length > 1 ? 's' : ''} on ${uniq(blocked.map((b) => new URL(b.url).host)).join(', ')}`);
  for (const p of axe[host]) {
    if (p.error) md.push(`- axe ${p.path}: ${p.error}`);
    for (const v of p.violations ?? []) md.push(`- axe ${p.path}: ${v.id} (${v.impact}, ${v.nodes}×) ${v.help} — ${v.targets.join(' | ')}`);
  }
  for (const p of lighthouse[host]) md.push(p.error ? `- Lighthouse ${p.path}: ${p.error}` : `- Lighthouse ${p.path}: ${p.perf} / ${p.a11y} / ${p.bp} / ${p.seo}, LCP ${p.lcp}, CLS ${p.cls}; below 0.9: ${p.failed.join(', ') || 'none'}`);
}
console.log(md.join('\n'));
