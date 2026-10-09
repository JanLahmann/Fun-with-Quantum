// Accessibility check of the built site (dist/) with axe-core in Chromium, in light and dark mode.
//   npm run build && npm run a11y        (first time: npx playwright install chromium)
// Checks every built page (also the unlisted previews) against WCAG 2.1 A and AA and fails on any
// violation. Redirect pages are skipped.
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4', '.json': 'application/json', '.xml': 'application/xml' };

const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try {
    const body = await readFile(join(DIST, path));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(0);
const base = `http://localhost:${server.address().port}`;

const pages = [];
for (const entry of await readdir(DIST, { recursive: true })) {
  if (!entry.endsWith('index.html')) continue;
  const html = await readFile(join(DIST, entry), 'utf8');
  if (/http-equiv="refresh"/.test(html)) continue;
  pages.push('/' + entry.replace(/index\.html$/, ''));
}
pages.sort();

const browser = await chromium.launch();
let failures = 0;
for (const scheme of ['light', 'dark']) {
  const context = await browser.newContext({ colorScheme: scheme, viewport: { width: 1280, height: 900 } });
  // external scripts (analytics, the 3D viewer) are not part of the check
  await context.route(/^https?:\/\/(?!localhost)/, (route) => route.abort());
  for (const path of pages) {
    const page = await context.newPage();
    await page.goto(base + path, { waitUntil: 'load' });
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    for (const v of violations) {
      failures++;
      console.log(`✗ ${path} (${scheme}) ${v.id}: ${v.help}`);
      for (const n of v.nodes.slice(0, 5)) console.log(`    ${n.target.join(' ')}  ${n.failureSummary?.split('\n')[1]?.trim() ?? ''}`);
    }
    await page.close();
  }
  await context.close();
}
await browser.close();
server.close();
console.log(`${pages.length} pages × light/dark: ${failures ? `${failures} violation(s)` : 'no violations'}`);
process.exit(failures ? 1 : 0);
