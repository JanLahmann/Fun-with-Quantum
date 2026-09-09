#!/usr/bin/env node
// Render (or refresh) the family block in a README between
// <!-- FWQ-FAMILY:START --> and <!-- FWQ-FAMILY:END --> markers.
// Usage: node readme-block.mjs <family.json> <self-id> <README.md>
import { readFileSync, writeFileSync } from 'node:fs';
import { loadManifest, footerLinks } from './lib.mjs';

const [manifestPath, selfId, readmePath] = process.argv.slice(2);
if (!manifestPath || !selfId || !readmePath) {
  console.error('usage: readme-block.mjs <family.json> <self-id> <README.md>');
  process.exit(2);
}
const m = loadManifest(manifestPath);
const sentenceCase = (t) => t.toLowerCase().replace(/(^|\. )([a-z])/g, (_, p, c) => p + c.toUpperCase());
const links = footerLinks(m, selfId).map((x) => `[${x.name}](${x.url})`).join(' · ');
const isHome = selfId === m.brand.id;
const lead = isHome
  ? `These games are the home of [**${m.brand.name}**](${m.brand.url}), a family of open-source quantum outreach projects:`
  : `This project is part of [**${m.brand.name}**](${m.brand.url}), a family of open-source quantum outreach projects:`;
const block = [
  '<!-- FWQ-FAMILY:START — generated from family.json, do not edit by hand -->',
  `## Part of the ${m.brand.name} family`,
  '',
  `${lead} ${links}.`,
  '',
  `*${sentenceCase(m.brand.tagline.l)}*`,
  '<!-- FWQ-FAMILY:END -->',
].join('\n');

const START = '<!-- FWQ-FAMILY:START', END = '<!-- FWQ-FAMILY:END -->';
let readme = readFileSync(readmePath, 'utf8');
const s = readme.indexOf(START), e = readme.indexOf(END);
if (s === -1 || e === -1) {
  readme = readme.replace(/\s*$/, '\n\n') + block + '\n';
} else {
  readme = readme.slice(0, s) + block + readme.slice(e + END.length);
}
writeFileSync(readmePath, readme);
console.log(`family block rendered into ${readmePath} (${links.split(' · ').length} links)`);
