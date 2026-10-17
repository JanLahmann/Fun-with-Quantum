import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { GUIDE_KNOWLEDGE } from '../src/contexts/fwq/guide.generated';
import { fwqGuide, GUIDE_PAGES } from '../src/contexts/fwq/guide';
import { contextFor } from '../src/contexts';
import { rules } from '../src/prompt';
// @ts-expect-error plain JS build script
import { buildGuideKnowledge, frontMatter, moduleText } from '../scripts/fwq-guide-knowledge.mjs';
import { LOCALES, MESSAGES, pagePath } from '../../portal/src/lib/qcoin/i18n';
import { renderAnswer } from '../../portal/src/lib/assistant/render';

const file = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url).href), 'utf8');
const family = JSON.parse(file('../../family/family.json'));
const gameIds = ['quantum-coin-game', 'ghz-game', 'chsh-game', 'mermin-peres-game', 'hardys-paradox', 'prisoners-dilemma', '3sat-grover', 'ghz-real-devices'];
/** The knowledge's section on one project or game: from its "#### <icon> <title>" line to the next heading. */
const section = (title: string) => {
  const m = new RegExp(`^#### \\S+ ${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\n[\\s\\S]*?(?=^###|(?![\\s\\S]))`, 'm').exec(GUIDE_KNOWLEDGE);
  if (!m) throw new Error(`no section for ${title}`);
  return m[0];
};

describe('guide knowledge', () => {
  it('is current: the committed module is what the script builds from family.json and portal/src/content', () => {
    const committed = file('../src/contexts/fwq/guide.generated.ts');
    expect(committed, 'run: node scripts/fwq-guide-knowledge.mjs').toBe(moduleText(buildGuideKnowledge()));
  });

  it('the script\'s --check passes (and is reachable as a command)', () => {
    expect(() => execFileSync('node', [fileURLToPath(new URL('../scripts/fwq-guide-knowledge.mjs', import.meta.url).href), '--check'], { stdio: 'pipe' })).not.toThrow();
  });

  it('never links an unlisted /preview/ page or a member hidden from the footers', () => {
    expect(GUIDE_KNOWLEDGE).not.toContain('/preview/');
    for (const m of family.members.filter((x: { footer: boolean }) => !x.footer)) {
      expect(GUIDE_KNOWLEDGE.toLowerCase()).not.toContain(m.name.toLowerCase());
      expect(GUIDE_KNOWLEDGE).not.toContain(new URL(m.url).hostname);
    }
  });

  it('knows every member shown in the footers, with its site', () => {
    for (const m of family.members.filter((x: { footer: boolean }) => x.footer)) expect(GUIDE_KNOWLEDGE).toContain(m.url);
  });

  it('lists every game with its page; only launched browser games "play right on the page"', () => {
    const games = gameIds.map((id) => frontMatter(file(`../../portal/src/content/games/${id}.md`), id).data);
    games.forEach((g: Record<string, unknown>, i: number) => {
      const s = section(g.title as string);
      expect(s).toContain(`- Page: https://fun-with-quantum.org/play/${gameIds[i]}/`);
      expect(s.includes('Plays right on its page'), gameIds[i]).toBe(g.webGame === true);
      expect(s).toContain(`level: ${g.level}`);
    });
    expect(GUIDE_KNOWLEDGE.match(/^- Page: /gm)).toHaveLength(gameIds.length);
  });

  it('gives the coin game\'s seven language pages, as the portal builds them', () => {
    const s = section('Quantum Coin Game');
    for (const l of LOCALES) expect(s).toContain(`${MESSAGES[l].langName} https://fun-with-quantum.org${pagePath(l)}`);
  });

  it('gives away no game\'s trick: no learning goals in the games list; the coin game\'s section names no gate', () => {
    const games = GUIDE_KNOWLEDGE.slice(GUIDE_KNOWLEDGE.indexOf('### The games'));
    expect(games).not.toMatch(/Hadamard|goals/i);
    expect(section('Quantum Coin Game')).not.toMatch(/(?<!\p{L})H(?!\p{L})/u);
  });

  it('marks IBM Quantum Learning as an outside recommendation, and only it', () => {
    expect(GUIDE_KNOWLEDGE.match(/Not a Fun with Quantum project/g)).toHaveLength(1);
    expect(section('IBM Quantum Learning')).toContain('Not a Fun with Quantum project');
    expect(section('Quantum Runner')).not.toContain('In short: Web quantum circuit composer');
  });

  it('every link in it becomes a link in the chat box (the renderer trusts its sites)', () => {
    const urls = [...new Set(GUIDE_KNOWLEDGE.match(/https:\/\/[^\s),]+/g)!.map((u) => u.replace(/[.:;]+$/, '')))];
    expect(urls.length).toBeGreaterThan(30);
    for (const u of urls) expect(renderAnswer(u), u).toContain(`<a href="${u}"`);
  });

  it('is long enough to be prompt-cached (≥ 1024 tokens; ~4 characters per token is a safe floor)', () => {
    expect(GUIDE_KNOWLEDGE.length).toBeGreaterThan(4 * 1024 * 2);
  });
});

describe('front matter', () => {
  it('reads the YAML the content files use', () => {
    const { data, body } = frontMatter('---\ntitle: A: b\nn: 3\nflag: true\n# note\nq: "x \\"y\\""\ns: \'it\'\'s\'\nlist:\n  - "one"\n  - two\n---\n\nBody\n');
    expect(data).toEqual({ title: 'A: b', n: 3, flag: true, q: 'x "y"', s: "it's", list: ['one', 'two'] });
    expect(body).toBe('Body');
  });

  it('fails on YAML it doesn\'t know instead of guessing', () => {
    expect(() => frontMatter('---\ntext: >\n  folded\n---\n')).toThrow(/unsupported/);
    expect(() => frontMatter('---\ntext: >\n---\n')).toThrow(/unsupported/);
    expect(() => frontMatter('no front matter')).toThrow(/no front matter/);
  });
});

describe('guide context', () => {
  it('is served as fwq/guide, answers in the question\'s language, without levels', () => {
    expect(contextFor('fwq', 'guide')).toBe(fwqGuide);
    expect(contextFor('rasqberry', 'guide')).toBeNull();
    expect(fwqGuide.levels).toBeFalsy();
    expect(rules(fwqGuide)).toContain("Answer in the language the user's question is written in");
  });

  it('GUIDE_PAGES are exactly the portal pages with the guide box', () => {
    const files: Record<string, string> = { '/': 'index', '/play/': 'play/index', '/build/': 'build', '/learn/': 'learn', '/teachers/': 'teachers/index', '/workshops/': 'workshops' };
    expect(Object.keys(files).sort()).toEqual([...GUIDE_PAGES].sort());
    const pages = (readdirSync(fileURLToPath(new URL('../../portal/src/pages/', import.meta.url).href), { recursive: true }) as string[])
      .filter((f) => f.endsWith('.astro')).map((f) => f.replace(/\.astro$/, ''));
    expect(pages.length).toBeGreaterThan(10);
    const withBox = pages.filter((f) => file(`../../portal/src/pages/${f}.astro`).includes('KetGuide'));
    expect(withBox.sort()).toEqual(Object.values(files).sort());
  });

  it('keeps only a known page from the state', () => {
    for (const page of GUIDE_PAGES) expect(fwqGuide.state({ page })).toEqual({ page });
    expect(fwqGuide.state({ page: '/preview/magic-square/', title: 'x', extra: 1 })).toEqual({});
    expect(fwqGuide.state(null)).toEqual({});
    expect(fwqGuide.state('/')).toBeNull();
    expect(fwqGuide.state([])).toBeNull();
  });
});

describe('RasQberry Two demos in the guide', () => {
  it('carries every demo and learning path the Pi\'s helper knows, without its setup and website sections', async () => {
    const { rasqberryDemos } = await import('../src/contexts/fwq/guide');
    const { DEMO_IDS } = await import('../src/contexts/rasqberry/device.generated');
    const demos = rasqberryDemos();
    expect(demos).toContain('\n### Demo groups');
    expect(demos).toContain('\n### Learning paths');
    for (const id of DEMO_IDS) expect(demos, id).toContain(`id \`${id}\``);
    expect(demos).not.toContain('Setting up and fixing the Pi');
    expect(fwqGuide.knowledge).toContain(demos);
    expect(rasqberryDemos('no such sections')).toBe('');
  });

  it('names nothing unlisted or hidden', async () => {
    const { rasqberryDemos } = await import('../src/contexts/fwq/guide');
    const demos = rasqberryDemos().toLowerCase();
    expect(demos).not.toContain('/preview/');
    for (const m of family.members.filter((x: { footer: boolean }) => !x.footer)) expect(demos).not.toContain(m.name.toLowerCase());
  });
});
