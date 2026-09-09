#!/usr/bin/env node
// Render (or refresh) the Fun with Quantum family block in any text file between
//   <!-- FWQ-FAMILY:START format=<fmt> -->  and  <!-- FWQ-FAMILY:END -->
// Usage: node render-block.mjs <family.json> <self-id> <file> [--format=list|table|html]
//   list   — one Markdown line of links                       (READMEs)
//   table  — Markdown | Project | What it is | from taglines   (READMEs with a descriptive table)
//   html   — <footer class="family-footer"> with name + short  (static-HTML / Jekyll sites)
// The format is remembered in the START marker, so a re-render keeps whatever the file chose.
// A file without markers gets the block appended (list/table) — for html, add the markers by hand
// where the footer should live.
import { readFileSync, writeFileSync } from 'node:fs';
import { loadManifest, footerLinks } from './lib.mjs';

const args = process.argv.slice(2);
const fmtArg = args.find((a) => a.startsWith('--format='));
const [manifestPath, selfId, filePath] = args.filter((a) => !a.startsWith('--'));
if (!manifestPath || !selfId || !filePath) {
  console.error('usage: render-block.mjs <family.json> <self-id> <file> [--format=list|table|html]');
  process.exit(2);
}
const m = loadManifest(manifestPath);
const members = footerLinks(m, selfId);
const isHome = selfId === m.brand.id;
const sentenceCase = (t) => t.toLowerCase().replace(/(^|\. )([a-z])/g, (_, p, c) => p + c.toUpperCase());
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const START = '<!-- FWQ-FAMILY:START', END = '<!-- FWQ-FAMILY:END -->';
let text = readFileSync(filePath, 'utf8');
const s = text.indexOf(START), e = text.indexOf(END);
const existingFmt = s !== -1 ? (text.slice(s, text.indexOf('-->', s)).match(/format=(\w+)/) || [])[1] : undefined;
const format = fmtArg ? fmtArg.split('=')[1] : (existingFmt || 'list');
if (!['list', 'table', 'html'].includes(format)) { console.error(`unknown format ${format}`); process.exit(2); }
if (format === 'html' && s === -1) { console.error('html format needs the markers placed in the file first'); process.exit(2); }

const lead = isHome
  ? `These games are the home of [**${m.brand.name}**](${m.brand.url}), a family of open-source quantum outreach projects:`
  : `This project is part of [**${m.brand.name}**](${m.brand.url}), a family of open-source quantum outreach projects:`;
const marker = `<!-- FWQ-FAMILY:START format=${format} — generated from family.json in JanLahmann/Fun-with-Quantum, do not edit by hand -->`;

let lines;
if (format === 'html') {
  const credit = esc(m.brand.credit).replace('Jan-R. Lahmann', `<a href="${esc(m.brand.credit_url)}">Jan-R. Lahmann</a>`);
  lines = [
    marker,
    '<footer class="family-footer">',
    `  <div class="family-footer-tagline">${esc(m.brand.tagline.l)}</div>`,
    `  <div class="family-footer-lead"><strong>${esc(m.brand.footer_lead)}</strong></div>`,
    '  <div class="family-footer-members">',
    ...members.map((x) =>
      `    <a class="member" href="${esc(x.url)}" data-umami-event="family-footer" data-umami-event-to="${esc(x.id)}"><span>${esc(x.name)}</span>${x.short ? `<small>${esc(x.short)}</small>` : ''}</a>`),
    '  </div>',
    `  <div class="family-footer-credit">${credit}</div>`,
    '</footer>',
    END,
  ];
} else {
  const body = format === 'table'
    ? [lead.replace(/:$/, '.'), '', '| Project | What it is |', '|---|---|',
       ...members.map((x) => `| [${x.name}](${x.url}) | ${x.tagline ?? ''} |`)]
    : [`${lead} ${members.map((x) => `[${x.name}](${x.url})`).join(' · ')}.`];
  lines = [marker, `## Part of the ${m.brand.name} family`, '', ...body, '', `*${sentenceCase(m.brand.tagline.l)}*`, END];
}
const block = lines.join('\n');
text = (s === -1 || e === -1)
  ? text.replace(/\s*$/, '\n\n') + block + '\n'
  : text.slice(0, s) + block + text.slice(e + END.length);
writeFileSync(filePath, text);
console.log(`family block rendered into ${filePath} (${format}, ${members.length} members)`);
