import { describe, expect, it } from 'vitest';
import { KNOWLEDGE, SOURCE_COMMIT } from '../src/contexts/rasqberry/knowledge.generated';
import { rasqberryBuild } from '../src/contexts/rasqberry/build';
import { systemPrompt, userMessage } from '../src/prompt';
// @ts-expect-error — plain .mjs script without types
import { BUILD_PAGES, clean, pageUrl } from '../scripts/rasqberry-knowledge.mjs';

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
