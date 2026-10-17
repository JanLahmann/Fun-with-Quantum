#!/usr/bin/env node
/**
 * Builds the knowledge of Ket's family guide on fun-with-quantum.org (context fwq/guide).
 *
 *   node scripts/fwq-guide-knowledge.mjs          # writes src/contexts/fwq/guide.generated.ts
 *   node scripts/fwq-guide-knowledge.mjs --check  # exits 1 if the committed module is out of date
 *
 * Sources, all in this repository, so the guide knows what the portal shows:
 * - src/contexts/fwq/guide.summary.md: how to guide, situations, requirements (written by hand, reviewed);
 * - portal/src/content/projects/*.md: the projects behind the three doors (Play, Build, Learn);
 * - family/family.json: the family roster; members hidden from the footers (footer: false) stay out;
 * - portal/src/content/games/*.md: the games list, with level and prerequisites (not the learning
 *   goals: some name a game's trick, e.g. the coin game's; teachers find them on /teachers/).
 * Browser versions that aren't launched yet (portal /preview/ pages) are never part of it: a game
 * plays "on its page" only with webGame: true, and the build fails if "/preview/" appears anywhere.
 * Run it after changing any of them: Assistant CI (test/guide.test.ts) fails while the committed
 * module is out of date.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url);
const OUT = new URL('../src/contexts/fwq/guide.generated.ts', import.meta.url);
const PORTAL = 'https://fun-with-quantum.org';
const DOORS = [['play', 'Play'], ['build', 'Build'], ['learn', 'Learn']];

const read = (path) => readFileSync(new URL(path, ROOT), 'utf8');

/** A YAML scalar as the content files write it: "double", 'single' or plain. */
function scalar(v) {
  if (v.startsWith('"')) return JSON.parse(v);
  if (v.startsWith("'")) {
    if (!v.endsWith("'")) throw new Error(`unterminated string: ${v}`);
    return v.slice(1, -1).replace(/''/g, "'");
  }
  if (v === 'true' || v === 'false') return v === 'true';
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

/**
 * Front matter and body of a content file. Only the YAML the content files use (key: value,
 * key: followed by "  - item" lines, # comments); anything else is an error, not a guess.
 */
export function frontMatter(text, name = 'file') {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
  if (!m) throw new Error(`${name}: no front matter`);
  const data = {};
  let list = null;
  for (const line of m[1].split('\n')) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && list) { list.push(scalar(item[1].trim())); continue; }
    const kv = /^([A-Za-z_][\w-]*):(?:\s+(.*))?$/.exec(line);
    if (!kv) throw new Error(`${name}: unsupported front matter line: ${line}`);
    if (kv[2] === undefined || kv[2] === '') { list = data[kv[1]] = []; continue; }
    list = null;
    data[kv[1]] = scalar(kv[2].trim());
  }
  return { data, body: m[2].trim() };
}

const collection = (dir) =>
  readdirSync(new URL(dir, ROOT)).filter((f) => f.endsWith('.md')).sort()
    .map((f) => ({ id: f.replace(/\.md$/, ''), ...frontMatter(read(`${dir}/${f}`), f) }))
    .sort((a, b) => a.data.order - b.data.order);

const host = (url) => new URL(url).hostname.replace(/^www\./, '');
const root = (url) => { const u = new URL(url); return `${host(url)}${u.pathname.replace(/\/$/, '')}`; };

/** The coin game's languages and their page paths, read from its i18n (portal/src/lib/qcoin/i18n). */
export function coinLanguages() {
  const index = read('portal/src/lib/qcoin/i18n/index.ts');
  const locales = /export const LOCALES = \[([^\]]+)\]/.exec(index)?.[1].match(/'([a-z]{2})'/g)?.map((s) => s.slice(1, -1));
  if (!locales?.includes('en')) throw new Error('coin game LOCALES not found');
  return locales.map((l) => {
    const name = /langName:\s*'([^']+)'/.exec(read(`portal/src/lib/qcoin/i18n/${l}.ts`))?.[1];
    if (!name) throw new Error(`coin game ${l}: langName not found`);
    return { locale: l, name, url: `${PORTAL}${l === 'en' ? '' : `/${l}`}/play/quantum-coin-game/` };
  });
}

const STATUS = { 'coming-soon': ' (coming soon: not available yet)', legacy: ' (the original, kept for reference)' };

/** `member`: the family member the project is (same site); `family`: whether its site is a family site at all. */
function projectSection(p, member, family) {
  const d = p.data;
  const lines = [`#### ${d.icon} ${d.title}${STATUS[d.status] ?? ''}`, '', d.tagline, ''];
  if (d.url) lines.push(`- Link: ${d.url}`);
  if (d.repoUrl) lines.push(`- Source code: ${d.repoUrl}`);
  if (member?.short) lines.push(`- In short: ${member.short}`);
  for (const f of d.facts ?? []) lines.push(`- ${f}`);
  if (!family && d.url) lines.push('- Not a Fun with Quantum project: an outside recommendation.');
  return [...lines, '', p.body].join('\n');
}

function gameSection(g, langs) {
  const d = g.data;
  const page = `${PORTAL}/play/${g.id}/`;
  const lines = [
    `#### ${d.icon} ${d.title}`,
    '',
    d.tagline,
    '',
    `- Page: ${page}`,
    d.webGame
      ? '- Plays right on its page in the browser (nothing to install); the page also has the Jupyter notebook with the Qiskit code.'
      : '- A Jupyter notebook (no browser version): the page has the button that opens it in a free online session.',
    `- Concept: ${d.concept}; shows ${d.shows}`,
    `- Time: ${d.duration}; for ${d.audience}; level: ${d.level}`,
    `- Prerequisites: ${d.prerequisites}`,
  ];
  if (g.id === 'quantum-coin-game') lines.push(`- Languages: ${langs.map((l) => `${l.name} ${l.url}`).join(', ')}`);
  return lines.join('\n');
}

export function buildGuideKnowledge() {
  const family = JSON.parse(read('family/family.json'));
  const shown = family.members.filter((m) => m.footer);
  const hidden = family.members.filter((m) => !m.footer);
  const projects = collection('portal/src/content/projects');
  const games = collection('portal/src/content/games');
  // A project is a member when it is the member's site (Quantum Runner lives on qamposer.org, but isn't QAMPoser).
  const memberFor = (p) => (p.data.url ? shown.find((m) => root(m.url) === root(p.data.url)) : undefined);
  const onFamilySite = (p) => Boolean(p.data.url && family.members.some((m) => host(m.url) === host(p.data.url)));
  for (const p of projects) {
    const h = p.data.url && hidden.find((m) => host(m.url) === host(p.data.url));
    if (h) throw new Error(`projects/${p.id}.md links ${h.name}, which family.json hides (footer: false)`);
  }
  const listed = new Set(projects.map(memberFor).filter(Boolean).map((m) => m.id));
  const others = shown.filter((m) => m.id !== family.brand.id && !listed.has(m.id));

  const parts = [
    '# Fun with Quantum — what you know',
    readFileSync(new URL('../src/contexts/fwq/guide.summary.md', import.meta.url), 'utf8').trim(),
    `## The family (${family.brand.name}, ${family.brand.url})`,
    `${family.brand.credit} The portal fun-with-quantum.org is the family's front door: quantum games you play in the browser, quantum computer models you 3D-print or build from LEGO, and hands-on ways to learn and teach. Its three doors list the projects below.`,
    ...DOORS.flatMap(([door, title]) => [
      `### ${title}: ${PORTAL}/${door}/`,
      ...projects.filter((p) => p.data.door === door).map((p) => projectSection(p, memberFor(p), onFamilySite(p))),
    ]),
    ...(others.length ? ['### More family members', ...others.map((m) => `#### ${m.name}\n\n${m.tagline}\n\n- Link: ${m.url}`)] : []),
    `### The games: ${PORTAL}/play/ (notebook games) and ${PORTAL}/teachers/ (for teachers)`,
    'Each game is an interactive Jupyter notebook: one click, no account; it opens a free session on mybinder.org (via QuBins), so starting it can take a few minutes. The games marked as playing on their page also run right in the browser.',
    ...games.map((g) => gameSection(g, coinLanguages())),
  ];
  const text = `${parts.join('\n\n')}\n`;
  if (text.includes('/preview/')) throw new Error('the guide knowledge must not link unlisted /preview/ pages');
  for (const m of hidden) {
    if (text.toLowerCase().includes(m.name.toLowerCase()) || text.includes(host(m.url))) throw new Error(`the guide knowledge mentions ${m.name}, which family.json hides`);
  }
  return text;
}

export const moduleText = (knowledge) =>
  `// Generated by scripts/fwq-guide-knowledge.mjs from family/family.json, portal/src/content and guide.summary.md. Don't edit.\nexport const GUIDE_KNOWLEDGE = ${JSON.stringify(knowledge)};\n`;

if (import.meta.url === `file://${process.argv[1]}`) {
  const text = moduleText(buildGuideKnowledge());
  if (process.argv.includes('--check')) {
    let current = '';
    try { current = readFileSync(OUT, 'utf8'); } catch { /* missing = out of date */ }
    if (current !== text) { console.error('src/contexts/fwq/guide.generated.ts is out of date: run node scripts/fwq-guide-knowledge.mjs'); process.exit(1); }
  } else {
    writeFileSync(OUT, text);
  }
}
