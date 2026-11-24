import { describe, expect, it } from 'vitest';
import { KNOWLEDGE, SOURCE_COMMIT } from '../src/contexts/rasqberry/knowledge.generated';
import { rasqberryBuild } from '../src/contexts/rasqberry/build';
import { systemPrompt, userMessage } from '../src/prompt';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-expect-error — plain .mjs script without types
import { BUILD_PAGES, clean, extraPages, published, demoLevel, demoSection, pageUrl, pathLevel, pathSection, preinstalled, shippedFromRules, variantLevel } from '../scripts/rasqberry-knowledge.mjs';
// @ts-expect-error — plain .mjs script without types
import { shippedAt } from '../scripts/rqb-shipped.mjs';

/** A RasQberry-Two checkout (its development branch) for the trimmer cross-check; skipped without one. */
const RQB_DEV = process.env.RQB_DEV_DIR ?? '';

describe('rasqberry build knowledge', () => {
  it('has the summary and every page, from a known commit', () => {
    expect(SOURCE_COMMIT).toMatch(/^[0-9a-f]{40}$/);
    expect(KNOWLEDGE).toContain('# RasQberry Two — what you know');
    for (const p of BUILD_PAGES) expect(KNOWLEDGE).toContain(`### Page: ${pageUrl(p)}`);
  });

  it('is plain Markdown: no images, no HTML tags, site links absolute', () => {
    const pages = KNOWLEDGE.slice(KNOWLEDGE.indexOf('## The website pages'));
    expect(pages).not.toMatch(/!\[[^\]]*\]\(/);
    expect(pages).not.toMatch(/<(img|p|div|a|br)\b/i);
    expect(pages).not.toMatch(/\]\(\//);
  });

  it('stays a reasonable size for the cached prompt', () => {
    expect(KNOWLEDGE.length).toBeLessThan(200_000);
  });

  it('reads the FAQ and the detail pages when they exist, only published ones', () => {
    const repo = mkdtempSync(join(tmpdir(), 'rqb-'));
    try {
      expect(extraPages(repo)).toEqual([]);
      mkdirSync(join(repo, 'content', 'details'), { recursive: true });
      const put = (p: string, md: string) => writeFileSync(join(repo, 'content', p), md);
      put('faq.md', '# FAQ');
      put('details/b-hotspot.md', '# Hotspot');
      put('details/a-led.md', '---\ntitle: LED\n---\n# LED');
      put('details/draft.md', '---\ndraft: true\n---\n# Draft');
      put('details/off.md', '---\npublished: false\n---\n# Off');
      put('details/game.md', 'Try [it](https://fun-with-quantum.org/preview/hardys-paradox/).');
      put('details/notes.txt', 'not a page');
      expect(extraPages(repo)).toEqual(['faq.md', 'details/a-led.md', 'details/b-hotspot.md']);
      expect(pageUrl('details/a-led.md')).toBe('https://rasqberry.org/details/a-led/');
    } finally { rmSync(repo, { recursive: true, force: true }); }
    expect(published('---\nunlisted: "yes"\n---\n# x')).toBe(false);
    expect(published('---\ntitle: Draft notes\n---\n# x')).toBe(true);
  });

  it('has no unlisted preview games', () => {
    expect(KNOWLEDGE).not.toMatch(/\/preview\//);
  });

  it('cleans website Markdown', () => {
    expect(clean('{/* note */}<ul><li>One</li></ul> &amp; <ModelViewer />')).toBe('- One &');
    expect(clean('A ![x](/a.png) <img src="/b.png"/> [Guide](/02-software/03-ab-boot#go-back) <p align="center">c</p>'))
      .toBe('A   [Guide](https://rasqberry.org/02-software/03-ab-boot/#go-back) c');
    expect(pageUrl('index.md')).toBe('https://rasqberry.org/');
    expect(pageUrl('05-contributing/index.md')).toBe('https://rasqberry.org/05-contributing/');
  });
});

describe('rasqberry build context', () => {
  it('answers in English only, without levels, with the page as state', () => {
    const [head] = systemPrompt(rasqberryBuild);
    expect(head.text).toContain('Answer in English');
    expect(head.text).not.toContain('<level>');
    const msg = userMessage('en', null, { page: '/' }, 'Which Pi?', rasqberryBuild.stateTag);
    expect(msg).toContain('<page_state>{"page":"/"}</page_state>');
    expect(msg).not.toContain('<level>');
  });

  it('keeps only a page path and a title', () => {
    expect(rasqberryBuild.state({ page: '/02-software/03-ab-boot/', title: 'A/B', extra: 1 })).toEqual({ page: '/02-software/03-ab-boot/', title: 'A/B' });
    expect(rasqberryBuild.state({ page: 'javascript:alert(1)' })).toEqual({});
    expect(rasqberryBuild.state([])).toBeNull();
  });
});

describe('rasqberry device context (the Pi)', async () => {
  const { rasqberryDevice } = await import('../src/contexts/rasqberry/device');
  const { DEVICE_KNOWLEDGE, DEMO_IDS } = await import('../src/contexts/rasqberry/device.generated');

  it('knows every demo from the manifests, and the learning paths', () => {
    expect(DEMO_IDS.length).toBeGreaterThan(10);
    for (const id of DEMO_IDS) expect(DEVICE_KNOWLEDGE).toContain(`id \`${id}\``);
    expect(DEVICE_KNOWLEDGE).toContain('## Learning paths');
    expect(DEVICE_KNOWLEDGE).toContain('## Setting up and fixing the Pi');
  });

  it('says per variant and per learning-path step whether it is on the image', () => {
    const m = { id: 'grok-bloch', name: 'Grokking the Bloch Sphere', install: { preinstalled: false },
      variants: [{ id: 'local', name: 'On this Pi' }, { id: 'web', name: 'Online', install: { preinstalled: true } }] };
    expect(preinstalled(m)).toBe(false);
    expect(preinstalled(m, 'local')).toBe(false);
    expect(preinstalled(m, 'web')).toBe(true);
    const path = { title: 'First 15 minutes', minutes: 15, audience: 'everyone', goal: 'g',
      steps: [{ demo: 'grok-bloch', variant: 'local', try: 'Press H.', notice: 'Look.' }] };
    const none = { beta: { demos: {}, paths: {} }, prod: { demos: {}, paths: {} } };
    expect(pathSection({ id: 'x', ...path }, [m], none)).toContain('variant `local`, downloads on first start, needs internet once');
    expect(DEVICE_KNOWLEDGE).toContain('(`web`, on the image, ships in ');
  });

  it('says which images ship a demo, variant or learning-path step, from what RasQberry\'s trimmer kept', () => {
    const fwq = { id: 'fwq', name: 'Fun with Quantum', description: 'Games', group: 'play', install: { preinstalled: true },
      variants: [{ id: 'coin', name: 'Coin' }, { id: 'ghz', name: 'GHZ' }] };
    const led = { id: 'led', name: 'LED', description: 'LEDs', group: 'play' };
    const step = (demo: string, variant?: string, extra = {}) => ({ demo, variant, try: 't', notice: 'n', ...extra });
    const path = { id: 'p', title: 'P', minutes: 5, audience: 'all', goal: 'g',
      steps: [step('fwq', 'coin'), step('fwq', 'ghz', { name: 'GHZ', online: 'https://example.org/ghz' }), step('led')],
      next: [{ path: 'q', why: 'More.' }] };
    // as rq_demo_level.py apply leaves them: beta keeps Coin, the GHZ step as a web step, the LED demo;
    // prod keeps the LED demo only, so no path
    const shipped = {
      beta: { demos: { fwq: ['coin'], led: [] }, paths: { p: { steps: ['demo:fwq/coin', 'url:https://example.org/ghz', 'demo:led/'], next: [] } } },
      prod: { demos: { led: [] }, paths: {} },
    };
    expect(demoLevel(fwq, shipped)).toBe('beta and development images');
    expect(demoLevel(led, shipped)).toBe('every image');
    expect(variantLevel(fwq, 'ghz', shipped)).toBe('development images only');
    expect(demoSection(fwq, [{ id: 'play', title: 'Play' }], shipped)).toContain('GHZ (`ghz`, on the image, ships in development images only)');
    expect(pathLevel(path, shipped)).toBe('beta and development images');
    const text = pathSection(path, [fwq, led], shipped);
    expect(text).toContain('Ships in: beta and development images.');
    expect(text).toContain('on beta images this step opens https://example.org/ghz');
    expect(text).not.toContain('leave this step out');
    expect(text).toContain('path "q" (not on beta images): More');
    const dropped = { ...shipped, beta: { ...shipped.beta, paths: { p: { steps: ['demo:fwq/coin', 'demo:led/'], next: ['q'] } } } };
    expect(pathSection(path, [fwq, led], dropped)).toContain('beta images leave this step out');
  });

  // Runs RasQberry's own trimmer (its code): local only, never in CI. Run it at every summary refresh:
  // RQB_DEV_DIR=<RasQberry-Two development checkout> npx vitest run test/rasqberry.test.ts
  it.skipIf(!process.env.RQB_DEV_DIR || !existsSync(RQB_DEV))('mirrors rq_demo_level.py exactly (needs RQB_DEV_DIR)', () => {
    const dir = join(RQB_DEV, 'RQB2-config/demo-manifests');
    const manifests = readdirSync(dir).filter((f) => /^rq_demo_.*\.json$/.test(f) && f !== 'rq_demo_schema.json')
      .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
    const paths = JSON.parse(readFileSync(join(dir, 'learning-paths.json'), 'utf8')).paths;
    expect(shippedFromRules(manifests, paths)).toEqual(shippedAt(RQB_DEV));
  });

  it('keeps the Pi facts only when they look right', () => {
    expect(rasqberryDevice.state({ page: '/', device: { version: 'beta-2026-10-10-053754', model: 'pi5', led: 'quad-4x12', x: 1 } }))
      .toEqual({ page: '/', device: { version: 'beta-2026-10-10-053754', model: 'pi5', led: 'quad-4x12' } });
    expect(rasqberryDevice.state({ page: '/', device: { version: '<script>', model: 'pi3', led: 'A B' } })).toEqual({ page: '/' });
    expect(rasqberryDevice.state({ page: '/', device: { led: 'single-24x8', ledcheck: 'false' } })).toEqual({ page: '/', device: { led: 'single-24x8', ledcheck: 'false' } });
    expect(rasqberryDevice.state({ page: '/', device: { ledcheck: 'maybe' } })).toEqual({ page: '/' });
  });

  it('answers in English only, without levels', () => {
    const [head] = systemPrompt(rasqberryDevice);
    expect(head.text).toContain('Answer in English');
    expect(head.text).not.toContain('<level>');
  });
});
