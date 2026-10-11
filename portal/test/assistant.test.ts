import { describe, expect, it } from 'vitest';
import { readEvents, renderAnswer } from '../src/lib/assistant/render';
import { ASSISTANT_TEXTS } from '../src/lib/assistant/i18n';
import { LOCALES } from '../src/lib/qcoin/i18n';

describe('assistant answer rendering', () => {
  it('escapes HTML, keeps bold and paragraphs', () => {
    expect(renderAnswer('<img src=x onerror=alert(1)> **H** stands it\n\nNext')).toBe(
      '<p>&lt;img src=x onerror=alert(1)&gt; <strong>H</strong> stands it</p><p>Next</p>');
  });
  it('links only trusted sites, keeps trailing punctuation outside the link', () => {
    const html = renderAnswer('See https://de.doqumentation.org/learning/x#y. Or https://evil.example/a and https://github.com/JanLahmannX/z');
    expect(html).toContain('<a href="https://de.doqumentation.org/learning/x#y" target="_blank" rel="noopener">https://de.doqumentation.org/learning/x#y</a>.');
    expect(html).not.toContain('href="https://evil.example');
    expect(html).not.toContain('href="https://github.com/JanLahmannX');
  });
  it('cannot break out of the href attribute', () => {
    expect(renderAnswer('https://quantum.cloud.ibm.com/"onmouseover="x')).not.toMatch(/href="[^"]*"onmouseover/);
    expect(renderAnswer('See the [Bill of Materials](https://rasqberry.org/01-3d-model/01-bill-of-materials/).')).toBe(
      '<p>See the <a href="https://rasqberry.org/01-3d-model/01-bill-of-materials/" target="_blank" rel="noopener">Bill of Materials</a>.</p>',
    );
    expect(renderAnswer('[click](https://evil.example/x)')).toBe('<p>click (https://evil.example/x)</p>');
    expect(renderAnswer('Run `sudo rq_clear_leds.sh --stop` <b>')).toBe('<p>Run <code>sudo rq_clear_leds.sh --stop</code> &lt;b&gt;</p>');
  });
  it('reads the Worker stream across chunk boundaries', async () => {
    const text = 'event: delta\ndata: {"t":"Hal"}\n\nevent: delta\r\ndata: {"t":"lo"}\r\n\r\nevent: done\ndata: {"id":"abc"}\n\n';
    const bytes = new TextEncoder().encode(text);
    let i = 0;
    const body = new ReadableStream<Uint8Array>({ pull(c) { if (i >= bytes.length) c.close(); else { c.enqueue(bytes.slice(i, i + 5)); i += 5; } } });
    const out = [];
    for await (const e of readEvents(body)) out.push(e);
    expect(out).toEqual([{ event: 'delta', data: { t: 'Hal' } }, { event: 'delta', data: { t: 'lo' } }, { event: 'done', data: { id: 'abc' } }]);
  });
  it('has every text in every coin-game language', () => {
    const keys = Object.keys(ASSISTANT_TEXTS.en).sort();
    for (const l of LOCALES) {
      expect(Object.keys(ASSISTANT_TEXTS[l]).sort()).toEqual(keys);
      const { levels, ...plain } = ASSISTANT_TEXTS[l];
      for (const v of [...Object.values(plain), ...Object.values(levels)]) expect(v.trim()).not.toBe('');
    }
  });
});
