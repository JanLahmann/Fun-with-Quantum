// public/favicon.ico (16, 32 and 48 px) from public/favicon.svg, for browsers and crawlers that ask
// for /favicon.ico. Rerun when the mark changes:  node scripts/favicon-ico.mjs
// The light-scheme colors, as in favicon-16.png and favicon-32.png; each size is a PNG inside the ICO.
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const PUBLIC = new URL('../public/', import.meta.url);
const SIZES = [16, 32, 48];
const svg = await readFile(new URL('favicon.svg', PUBLIC), 'utf8');

const browser = await chromium.launch();
const pngs = [];
for (const size of SIZES) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, colorScheme: 'light' });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  pngs.push(await page.screenshot({ omitBackground: true }));
  await page.close();
}
await browser.close();

// ICO: 6-byte header, one 16-byte entry per image, then the PNG data
const header = Buffer.alloc(6 + 16 * SIZES.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(SIZES.length, 4);
let offset = header.length;
SIZES.forEach((size, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(size, e);
  header.writeUInt8(size, e + 1);
  header.writeUInt16LE(1, e + 4); // color planes
  header.writeUInt16LE(32, e + 6); // bits per pixel
  header.writeUInt32LE(pngs[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += pngs[i].length;
});
await writeFile(new URL('favicon.ico', PUBLIC), Buffer.concat([header, ...pngs]));
console.log(`public/favicon.ico: ${SIZES.join(', ')} px, ${offset} bytes`);
