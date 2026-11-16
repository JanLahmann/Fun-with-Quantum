import { describe, expect, it } from 'vitest';
import { KNOWLEDGE, SOURCE_COMMIT } from '../src/contexts/rasqberry/knowledge.generated';
import { rasqberryBuild } from '../src/contexts/rasqberry/build';
import { systemPrompt, userMessage } from '../src/prompt';
// @ts-expect-error — plain .mjs script without types
import { BUILD_PAGES, clean, demoLevel, demoSection, pageUrl, pathLevel, pathSection, preinstalled, variantLevel } from '../scripts/rasqberry-knowledge.mjs';

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
    expect(pathSection(path, [m])).toContain('variant `local`, downloads on first start, needs internet once');
    expect(DEVICE_KNOWLEDGE).toContain('(`web`, on the image, ships in ');
  });

  it('says which images ship a demo, variant or learning-path step (RasQberry #371, rq_demo_level.py)', () => {
    const fwq = { id: 'fwq', name: 'Fun with Quantum', description: 'Games', group: 'play', install: { preinstalled: true },
      variants: [{ id: 'coin', name: 'Coin', maturity: 'beta' }, { id: 'ghz', name: 'GHZ', maturity: 'dev' }, { id: 'x', name: 'X' }] };
    const old = { id: 'old', name: 'Old', maturity: 'stable', variants: [{ id: 'a', name: 'A', maturity: 'dev' }] };
    // a demo with variants ships where its best variant does; a missing level is dev, "stable" is prod
    expect(demoLevel(fwq)).toBe('beta and development images');
    expect(demoLevel(old)).toBe('development images only');
    expect(demoLevel({ maturity: 'stable' })).toBe('every image');
    expect(demoLevel({})).toBe('development images only');
    // a variant without a level (or an unknown one) takes its demo's
    expect(variantLevel({ maturity: 'beta', variants: [{ id: 'v' }, { id: 'w', maturity: 'odd' }] }, 'v')).toBe('beta and development images');
    expect(variantLevel({ maturity: 'beta', variants: [{ id: 'w', maturity: 'odd' }] }, 'w')).toBe('beta and development images');
    const text = demoSection(fwq, [{ id: 'play', title: 'Play' }]);
    expect(text).toContain('Ships in: beta and development images.');
    expect(text).toContain('GHZ (`ghz`, on the image, ships in development images only)');
    // a path ships where at least two of its steps do; a step with its material online becomes a web step
    const step = (variant, extra = {}) => ({ demo: 'fwq', variant, try: 't', notice: 'n', ...extra });
    const path = { title: 'P', minutes: 5, audience: 'all', goal: 'g', steps: [step('coin'), step('ghz'), { command: 'rq_help', try: 't', notice: 'n' }] };
    expect(pathLevel(path, [fwq])).toBe('beta and development images');
    const p = pathSection(path, [fwq]);
    expect(p).toContain('Ships in: beta and development images.');
    expect(p.match(/this step is left out/g)).toHaveLength(1);
    const online = { ...path, steps: [step('ghz', { name: 'GHZ', online: 'https://example.org/ghz' }), { url: 'https://example.org', try: 't', notice: 'n' }] };
    expect(pathLevel(online, [fwq])).toBe('every image');
    expect(pathSection(online, [fwq])).toContain('on images without it this step opens https://example.org/ghz');
    expect(pathLevel({ ...path, steps: [step('ghz'), step('x')] }, [fwq])).toBe('development images only');
    expect(pathLevel({ ...path, steps: [step('ghz'), step('missing')] }, [fwq])).toMatch(/^no image/);
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
