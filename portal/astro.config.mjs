// @ts-check
import { defineConfig } from 'astro/config';
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = 'https://fun-with-quantum.org';

/**
 * A page's content fingerprint for <lastmod>: its title, meta description and <main>, without scripts,
 * styles and Astro's scoped-style attributes, so a change of what the page says or shows counts (images
 * included: their /_astro/ names are content hashes) and a change of the code behind it doesn't.
 * @param {string} html
 */
function fingerprint(html) {
  const head = [/<title>[\s\S]*?<\/title>/, /<meta name="description"[^>]*>/].map((re) => html.match(re)?.[0] ?? '');
  const main = html.match(/<main[^>]*>([\s\S]*)<\/main>/)?.[1] ?? html;
  const text = main
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/\sdata-astro-cid-[\w-]+(="[^"]*")?/g, '');
  return createHash('sha256').update([...head, text].join('\n')).digest('hex').slice(0, 16);
}

/**
 * Writes dist/sitemap.xml after the build: every built page except 404, redirects and pages
 * marked noindex (the unlisted previews), at its canonical URL. A launched page joins the
 * sitemap automatically once it drops `noindex`.
 *
 * <lastmod> is the day a page's content last changed: dist/sitemap-state.json keeps each page's
 * fingerprint and date, and the deploy hands the live copy back in (FWQ_SITEMAP_PREV, a file path).
 * An unchanged fingerprint keeps its date; a new or changed page gets the build day (UTC). Without a
 * previous state (a local build) every page gets the build day. The state also lists the pages that
 * changed in this build (`changed`); the deploy sends just those to IndexNow (family/indexnow/).
 */
function sitemap() {
  return {
    name: 'fwq-sitemap',
    hooks: {
      /** @param {{ dir: URL }} options */
      'astro:build:done': async ({ dir }) => {
        const root = fileURLToPath(dir);
        /** @type {Record<string, { hash: string, lastmod: string }>} */
        let prev = {};
        if (process.env.FWQ_SITEMAP_PREV) {
          try { prev = JSON.parse(await readFile(process.env.FWQ_SITEMAP_PREV, 'utf8')).pages ?? {}; }
          catch { console.warn('fwq-sitemap: no previous sitemap state, every page gets today\'s date'); }
        }
        const today = new Date().toISOString().slice(0, 10);
        /** @type {Record<string, { hash: string, lastmod: string }>} */
        const pages = {};
        /** @type {string[]} */
        const changed = [];
        for (const entry of await readdir(root, { recursive: true })) {
          if (!entry.endsWith('.html') || entry === '404.html') continue;
          const html = await readFile(join(root, entry), 'utf8');
          if (/<meta name="robots" content="[^"]*noindex/.test(html) || /http-equiv="refresh"/.test(html)) continue;
          const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
          const url = canonical ? canonical[1] : `${site}/${entry.replace(/index\.html$/, '')}`;
          const hash = fingerprint(html);
          const same = prev[url]?.hash === hash;
          pages[url] = { hash, lastmod: same ? prev[url].lastmod : today };
          if (!same) changed.push(url);
        }
        const urls = Object.keys(pages).sort();
        const body = urls.map((u) => `  <url><loc>${u}</loc><lastmod>${pages[u].lastmod}</lastmod></url>`).join('\n');
        await writeFile(join(root, 'sitemap.xml'),
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
        await writeFile(join(root, 'sitemap-state.json'),
          JSON.stringify({ changed: changed.sort(), pages: Object.fromEntries(urls.map((u) => [u, pages[u]])) }, null, 1) + '\n');
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site,
  // the offline build for RasQberry Two (src/data/offline.ts) goes to its own folder
  outDir: process.env.PUBLIC_FWQ_OFFLINE === '1' ? './dist-offline' : './dist',
  trailingSlash: 'ignore',
  redirects: {
    // the coin game left its unlisted preview (launched 2026-10)
    '/preview/coin-game': '/play/quantum-coin-game/',
    '/de/preview/coin-game': '/de/play/quantum-coin-game/',
    '/ja/preview/coin-game': '/ja/play/quantum-coin-game/',
    '/es/preview/coin-game': '/es/play/quantum-coin-game/',
    '/uk/preview/coin-game': '/uk/play/quantum-coin-game/',
    '/it/preview/coin-game': '/it/play/quantum-coin-game/',
    '/fr/preview/coin-game': '/fr/play/quantum-coin-game/',
    // launched 2026-10
    '/preview/ghz-game': '/play/ghz-game/',
    '/preview/chsh-game': '/play/chsh-game/',
  },
  integrations: [sitemap()],
});
