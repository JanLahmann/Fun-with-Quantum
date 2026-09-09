#!/usr/bin/env node
// Render (or refresh) the family block in a README between
// <!-- FWQ-FAMILY:START --> and <!-- FWQ-FAMILY:END --> markers.
// Usage: node readme-block.mjs <family.json> <self-id> <README.md> [--format=list|table]
//   list  (default) — one line of links
//   table           — a | Project | What it is | table using each member's tagline
// The format is remembered in the START marker, so a re-render keeps whatever the README chose.
import { readFileSync, writeFileSync } from 'node:fs';
import { loadManifest, footerLinks } from './lib.mjs';

const args = process.argv.slice(2);
const fmtArg = args.find((a) => a.startsWith('--format='));
const [manifestPath, selfId, readmePath] = args.filter((a) => !a.startsWith('--'));
if (!manifestPath || !selfId || !readmePath) {
  console.error('usage: readme-block.mjs <family.json> <self-id> <README.md> [--format=list|table]');
  process.exit(2);
}
const m = loadManifest(manifestPath);
const sentenceCase = (t) => t.toLowerCase().replace(/(^|\. )([a-z])/g, (_, p, c) => p + c.toUpperCase());
const members = footerLinks(m, selfId);
const isHome = selfId === m.brand.id;

const START = '<!-- FWQ-FAMILY:START', END = '<!-- FWQ-FAMILY:END -->';
let readme = readFileSync(readmePath, 'utf8');
const s = readme.indexOf(START), e = readme.indexOf(END);
const existingFmt = s !== -1 ? (readme.slice(s, readme.indexOf('-->', s)).match(/format=(\w+)/) || [])[1] : undefined;
const format = fmtArg ? fmtArg.split('=')[1] : (existingFmt || 'list');

const lead = isHome
  ? `These games are the home of [**${m.brand.name}**](${m.brand.url}), a family of open-source quantum outreach projects:`
  : `This project is part of [**${m.brand.name}**](${m.brand.url}), a family of open-source quantum outreach projects:`;
let body;
if (format === 'table') {
  body = [
    lead.replace(/:$/, '.'),
    '',
    '| Project | What it is |',
    '|---|---|',
    ...members.map((x) => `| [${x.name}](${x.url}) | ${x.tagline ?? ''} |`),
  ];
} else {
  body = [`${lead} ${members.map((x) => `[${x.name}](${x.url})`).join(' · ')}.`];
}
const block = [
  `<!-- FWQ-FAMILY:START format=${format} — generated from family.json, do not edit by hand -->`,
  `## Part of the ${m.brand.name} family`,
  '',
  ...body,
  '',
  `*${sentenceCase(m.brand.tagline.l)}*`,
  END,
].join('\n');

if (s === -1 || e === -1) {
  readme = readme.replace(/\s*$/, '\n\n') + block + '\n';
} else {
  readme = readme.slice(0, s) + block + readme.slice(e + END.length);
}
writeFileSync(readmePath, readme);
console.log(`family block rendered into ${readmePath} (${format}, ${members.length} members)`);
