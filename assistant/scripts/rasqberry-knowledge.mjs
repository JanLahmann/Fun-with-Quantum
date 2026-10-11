#!/usr/bin/env node
/**
 * Builds the RasQberry helper's knowledge module from the RasQberry-Two website sources.
 *
 *   node scripts/rasqberry-knowledge.mjs <RasQberry-Two gh-pages checkout> <RasQberry-Two development checkout>
 *
 * Writes two modules in src/contexts/rasqberry/:
 * - knowledge.generated.ts (the build helper, rasqberry.org): the summary written at build time
 *   (build.summary.md, committed and reviewed) and the website pages as published, cleaned to
 *   plain Markdown (no images or HTML, links absolute);
 * - device.generated.ts (the demo helper on the Pi): device.summary.md, the demos from their
 *   manifests and the learning paths (development branch, the files the Pi itself reads), the
 *   demo and setup pages of the website, and the build summary for setup questions.
 * The deploy workflow runs this against the current gh-pages branch, so the live helper always
 * has today's pages; the committed copy is the snapshot the tests and local runs use.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://rasqberry.org';
/** Pages the build helper knows verbatim, in this order. Demo detail pages belong to the device helper. */
export const BUILD_PAGES = [
  'index.md',
  '01-3d-model/01-bill-of-materials.md',
  '01-3d-model/02-hardware-assembly-guide.md',
  '02-software/01-installation-overview.md',
  '02-software/02-system-options.md',
  '02-software/03-ab-boot.md',
  '03-quantum-computing-demos/led-display.md',
  '03-quantum-computing-demos/00-overview.md',
  '03-quantum-computing-demos/01-demo-list.md',
  '04-jans-corner/tips-and-tricks.md',
  'workshops.md',
  '05-contributing/index.md',
];

/** Website pages the demo helper on the Pi knows verbatim. */
export const DEVICE_PAGES = [
  '03-quantum-computing-demos/00-overview.md',
  '03-quantum-computing-demos/bloch-sphere.md',
  '03-quantum-computing-demos/fractals.md',
  '03-quantum-computing-demos/led-display.md',
  '03-quantum-computing-demos/qoffee-maker.md',
  '03-quantum-computing-demos/quantum-lights-out.md',
  '03-quantum-computing-demos/raspberry-tie.md',
  '02-software/01-installation-overview.md',
  '02-software/02-system-options.md',
  '02-software/03-ab-boot.md',
];

const MANIFESTS = 'RQB2-config/demo-manifests';

const TOKEN = {
  none: 'no IBM Quantum account needed',
  prefer: 'an IBM Quantum account is optional (used when one is saved on the Pi)',
  required: 'needs an IBM Quantum account',
};
const DISPLAY = { none: 'runs without a screen', optional: 'a screen is optional', required: 'needs a screen' };
const RUNS = { jupyter: 'opens as a Jupyter notebook in the browser', docker: 'runs in a Docker container', browser: 'opens in the browser', python: 'opens its own window', 'web-static': 'opens in the browser' };

/** One demo manifest → a short Markdown section. Only facts the manifest states. */
export function demoSection(m, groups) {
  const group = groups.find((g) => g.id === m.group)?.title ?? m.group;
  const where = [];
  if (m.desktop?.show) where.push(`desktop folder "${group}" → "${m.name}"`);
  if (m.menu?.show) where.push(`\`sudo raspi-config\` → 0 RasQberry → Quantum Demos → ${group} → "${m.name}"`);
  where.push(`terminal: \`rq_demo_run.sh ${m.id}\`${m.variants?.length ? ' <variant>' : ''}`);
  const hw = m.needs_hw ?? {};
  const facts = [
    m.entrypoint?.type && RUNS[m.entrypoint.type],
    hw.leds ? 'uses the LED panel' : 'does not need the LED panel',
    DISPLAY[hw.display],
    hw.network ? 'needs internet while it runs' : null,
    TOKEN[m.needs_ibm_token ?? 'none'],
    m.loop_ok ? 'can run in the Demo Loop' : null,
  ].filter(Boolean);
  const dl = m.install?.download;
  const install = m.install?.preinstalled
    ? 'Installed on the image.'
    : `Downloaded on first start${dl ? ` (${[dl.what, dl.download_mb && `about ${dl.download_mb} MB`, dl.time].filter(Boolean).join(', ')})` : ''}; that needs internet once.`;
  const variants = (m.variants ?? []).map((v) => `${v.name} (\`${v.id}\`${v.maturity === 'beta' ? ', beta' : ''})`);
  return [
    `### ${m.name}${m.maturity === 'beta' ? ' (beta)' : ''} — id \`${m.id}\`, group "${group}"`,
    `${m.description.replace(/\.?$/, '.')} ${install}`,
    `Start: ${where.join('; ')}.`,
    `It ${facts.join(', ')}.`,
    variants.length ? `Variants: ${variants.join('; ')}.` : '',
  ].filter(Boolean).join('\n');
}

/** The learning paths, as the Pi shows them. */
export function pathSection(p, manifests) {
  const steps = p.steps.map((st, i) => {
    const name = st.name ?? manifests.find((m) => m.id === st.demo)?.name ?? st.demo ?? st.command ?? st.url;
    const how = st.demo ? `demo \`${st.demo}\`${st.variant ? ` variant \`${st.variant}\`` : ''}` : st.command ? `\`${st.command}\`` : st.url;
    return `${i + 1}. ${name} (${how}): ${st.try} ${st.notice}`;
  });
  const next = (p.next ?? []).map((n) => `${n.path ? `path "${n.path}"` : `${n.name} ${n.url}`}: ${n.why.replace(/\.$/, '')}`);
  return [`### ${p.title}${p.maturity === 'beta' ? ' (beta)' : ''} — ${p.minutes} minutes, for: ${p.audience}`, `Goal: ${p.goal}`, ...steps,
    next.length ? `Keep going: ${next.join('; ')}.` : ''].filter(Boolean).join('\n');
}

export const pageUrl = (path) => {
  const p = path.replace(/\.md$/, '').replace(/(^|\/)index$/, '');
  return `${SITE}/${p ? `${p}/` : ''}`;
};

/** Website Markdown → plain Markdown for the prompt. */
export function clean(md) {
  return md
    .replace(/^---\n[\s\S]*?\n---\n/, '') // front matter
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '') // MDX comments
    .replace(/<[A-Z]\w*\b[^>]*\/>/g, '') // MDX components such as <ModelViewer />
    .replace(/<li\b[^>]*>/gi, '- ')
    .replace(/<\/li>|<\/?(ul|ol)\b[^>]*>/gi, '')
    .replace(/<\/?b>/gi, '**')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|span|em|strong|b|i|center|sup|sub|small|details|summary|figure|figcaption|picture|source|video|iframe)\b[^>]*>/gi, '')
    .replace(/<a\s[^>]*href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/\]\((\/[^)\s]*)\)/g, (_, p) => `](${SITE}${p.replace(/^\/([^#?]*?)\/?(#|\?|$)/, (_m, a, b) => `/${a}${a && !a.includes('.') ? '/' : ''}${b}`)})`)
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/^[ \t]{2,}(?![-*+] |\d+\. |```)/gm, '') // indentation left over from HTML blocks (keeps nested lists)
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function main() {
  const [repo, dev] = process.argv.slice(2);
  if (!repo || !dev) { console.error('usage: node scripts/rasqberry-knowledge.mjs <gh-pages checkout> <development checkout>'); process.exit(2); }
  const here = new URL('../src/contexts/rasqberry/', import.meta.url);
  const sha = (dir) => execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const commit = sha(repo);
  const devCommit = sha(dev);
  const read = (f) => readFileSync(new URL(f, here), 'utf8').trim();
  const page = (p) => `### Page: ${pageUrl(p)}\n\n${clean(readFileSync(join(repo, 'content', p), 'utf8'))}`;
  const write = (file, header, consts) => {
    const body = Object.entries(consts).map(([k, v]) => `export const ${k} = ${JSON.stringify(v)};`).join('\n');
    writeFileSync(new URL(file, here), `// Generated by scripts/rasqberry-knowledge.mjs from ${header}. Don't edit.\n${body}\n`);
  };

  const build = `# RasQberry Two — what you know\n\n${read('build.summary.md')}\n\n## The website pages (rasqberry.org, as published)\n\n${BUILD_PAGES.map(page).join('\n\n')}\n`;
  write('knowledge.generated.ts', `JanLahmann/RasQberry-Two gh-pages ${commit.slice(0, 12)}`, { SOURCE_COMMIT: commit, KNOWLEDGE: build });

  const json = (f) => JSON.parse(readFileSync(join(dev, MANIFESTS, f), 'utf8'));
  const groups = json('demo-groups.json').groups;
  const manifests = readdirSync(join(dev, MANIFESTS)).filter((f) => /^rq_demo_.*\.json$/.test(f) && f !== 'rq_demo_schema.json').sort().map(json);
  const order = (m) => groups.findIndex((g) => g.id === m.group);
  manifests.sort((a, b) => order(a) - order(b) || (a.menu?.order ?? 99) - (b.menu?.order ?? 99));
  const device = [
    '# RasQberry Two on this Pi — what you know',
    read('device.summary.md'),
    `## Demo groups\n\n${groups.map((g) => `- ${g.title}: ${g.description ?? g.menu ?? ''}`).join('\n')}`,
    `## The demos (from the demo manifests on the Pi)\n\n${manifests.map((m) => demoSection(m, groups)).join('\n\n')}`,
    `## Learning paths (Quantum Demos → Learning paths, or \`rq_learning_paths.sh\`)\n\n${json('learning-paths.json').paths.map((p) => pathSection(p, manifests)).join('\n\n')}`,
    `## Setting up and fixing the Pi\n\n${read('build.summary.md').replace(/^(#+) /gm, '#$1 ')}`,
    `## Website pages (rasqberry.org, as published)\n\n${DEVICE_PAGES.map(page).join('\n\n')}`,
  ].join('\n\n') + '\n';
  write('device.generated.ts', `JanLahmann/RasQberry-Two gh-pages ${commit.slice(0, 12)} + development ${devCommit.slice(0, 12)}`,
    { DEVICE_SOURCE: { pages: commit, development: devCommit }, DEVICE_KNOWLEDGE: device, DEMO_IDS: manifests.map((m) => m.id) });
  console.error(`knowledge.generated.ts ${(build.length / 1024).toFixed(0)} KB, device.generated.ts ${(device.length / 1024).toFixed(0)} KB (${manifests.length} demos)`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
