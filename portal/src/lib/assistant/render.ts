/**
 * Turns an assistant answer (plain text with **bold**, `code`, [links](url) and bare URLs) into safe HTML: everything
 * is escaped first; then bold, paragraphs, and links — but only to sites we trust, the rest stay
 * plain text.
 */
const TRUSTED = /^https:\/\/((?:[a-z]{2}\.)?doqumentation\.org|quantum\.cloud\.ibm\.com|fun-with-quantum\.org|rasqberry\.org|github\.com\/JanLahmann)(\/|$)/;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const anchor = (url: string, text: string) => `<a href="${url}" target="_blank" rel="noopener">${text}</a>`;

/** Markdown links [text](url) and bare URLs; untrusted ones stay plain text. */
function linkify(escaped: string): string {
  return escaped.replace(/\[([^\]\n]+)\]\((https:\/\/[^\s)<]+)\)|https:\/\/[^\s<)\]]+/g, (raw, text?: string, target?: string) => {
    if (text !== undefined && target !== undefined) {
      return TRUSTED.test(target.replace(/&amp;/g, '&')) ? anchor(target, text) : `${text} (${target})`;
    }
    const url = raw.replace(/[.,;:!?'"]+$/, '');
    const tail = raw.slice(url.length);
    if (!TRUSTED.test(url.replace(/&amp;/g, '&'))) return raw;
    return `${anchor(url, url)}${tail}`;
  });
}

export function renderAnswer(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((para) => `<p>${linkify(esc(para))
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/** Parses the Worker's SSE stream: `delta` {t}, then `done` {id} or `error` {error}. */
export async function* readEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<{ event: string; data: any }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (value) buf = (buf + decoder.decode(value, { stream: true })).replace(/\r\n/g, '\n');
      let cut: number;
      while ((cut = buf.indexOf('\n\n')) >= 0) {
        const block = buf.slice(0, cut);
        buf = buf.slice(cut + 2);
        const event = /^event: (.*)$/m.exec(block)?.[1];
        const data = /^data: (.*)$/m.exec(block)?.[1];
        if (event && data) yield { event, data: JSON.parse(data) };
      }
      if (done) return;
    }
  } finally {
    reader.cancel().catch(() => {});
  }
}
