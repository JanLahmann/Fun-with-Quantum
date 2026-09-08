#!/usr/bin/env node
// Render the family footer as a static HTML fragment for plain-HTML member sites.
// Usage: node html-snippet.mjs <family.json> <self-id>  > family-footer.html
import { loadManifest, footerLinks } from './lib.mjs';

const [manifestPath, selfId] = process.argv.slice(2);
if (!manifestPath || !selfId) { console.error('usage: html-snippet.mjs <family.json> <self-id>'); process.exit(2); }
const m = loadManifest(manifestPath);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const links = footerLinks(m, selfId)
  .map((x) => `    <a href="${esc(x.url)}">${esc(x.name)}</a>`)
  .join(' ·\n');
process.stdout.write(`<!-- FWQ-FAMILY:START — generated from family.json, do not edit by hand -->
<footer class="family-footer">
  <div class="family-footer-tagline">${esc(m.brand.tagline.l)}</div>
  <div><strong>${esc(m.brand.footer_lead)}</strong>
${links}
  </div>
  <div>${esc(m.brand.credit).replace('Jan-R. Lahmann', `<a href="${esc(m.brand.credit_url)}">Jan-R. Lahmann</a>`)}</div>
</footer>
<!-- FWQ-FAMILY:END -->
`);
