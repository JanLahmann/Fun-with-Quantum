// @ts-check
import { defineConfig } from 'astro/config';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = 'https://fun-with-quantum.org';

/**
 * Writes dist/sitemap.xml after the build: every built page except 404, redirects and pages
 * marked noindex (the unlisted previews), at its canonical URL. A launched page joins the
 * sitemap automatically once it drops `noindex`.
 */
function sitemap() {
  return {
    name: 'fwq-sitemap',
    hooks: {
      /** @param {{ dir: URL }} options */
      'astro:build:done': async ({ dir }) => {
        const root = fileURLToPath(dir);
        const urls = [];
        for (const entry of await readdir(root, { recursive: true })) {
          if (!entry.endsWith('.html') || entry === '404.html') continue;
          const html = await readFile(join(root, entry), 'utf8');
          if (/<meta name="robots" content="[^"]*noindex/.test(html) || /http-equiv="refresh"/.test(html)) continue;
          const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
          urls.push(canonical ? canonical[1] : `${site}/${entry.replace(/index\.html$/, '')}`);
        }
        urls.sort();
        const body = urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n');
        await writeFile(join(root, 'sitemap.xml'),
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
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
