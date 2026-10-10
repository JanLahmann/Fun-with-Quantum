import type { SystemBlock } from './prompt';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CallOptions {
  apiKey: string;
  model: string;
  maxTokens: number;
  system: SystemBlock[];
  messages: ChatMessage[];
}

/** Starts a streaming Messages API call; the caller checks `ok` before relaying the body. */
export function callClaude(o: CallOptions, fetchImpl: typeof fetch = fetch): Promise<Response> {
  return fetchImpl('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': o.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model: o.model, max_tokens: o.maxTokens, system: o.system, messages: o.messages, stream: true }),
  });
}

export interface StreamResult {
  text: string;
  stopReason: string | null;
  error: string | null;
  inTok: number | null;
  outTok: number | null;
  cacheReadTok: number | null;
  cacheWriteTok: number | null;
}

/** Parses an SSE byte stream into (event, data) pairs. */
export async function* sseEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<{ event: string; data: string }> {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      // Normalize on the whole buffer: a CRLF can be split across two chunks.
      if (value) buf = (buf + value).replace(/\r\n/g, '\n');
      let cut: number;
      while ((cut = buf.indexOf('\n\n')) >= 0) {
        const block = buf.slice(0, cut);
        buf = buf.slice(cut + 2);
        let event = 'message';
        const data: string[] = [];
        for (const line of block.split('\n')) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
        }
        if (data.length) yield { event, data: data.join('\n') };
      }
      if (done) return;
    }
  } finally {
    // Any early exit (client gone, parse error) cancels upstream, so Claude stops generating tokens nobody reads.
    reader.cancel().catch(() => {});
  }
}

/**
 * Relays Claude's text deltas to the widget (`send('delta', {t})`) and collects the full answer,
 * stop reason and token usage. The caller sends the closing `done` or `error` event.
 */
export async function relay(
  upstream: ReadableStream<Uint8Array>,
  send: (event: 'delta', data: { t: string }) => Promise<void>,
): Promise<StreamResult> {
  const r: StreamResult = { text: '', stopReason: null, error: null, inTok: null, outTok: null, cacheReadTok: null, cacheWriteTok: null };
  let complete = false;
  try {
    for await (const { event, data } of sseEvents(upstream)) {
      const d = JSON.parse(data);
      if (event === 'message_start') {
        const u = d.message?.usage ?? {};
        r.inTok = u.input_tokens ?? null;
        r.cacheReadTok = u.cache_read_input_tokens ?? null;
        r.cacheWriteTok = u.cache_creation_input_tokens ?? null;
      } else if (event === 'content_block_delta' && d.delta?.type === 'text_delta') {
        r.text += d.delta.text;
        await send('delta', { t: d.delta.text });
      } else if (event === 'message_delta') {
        r.stopReason = d.delta?.stop_reason ?? r.stopReason;
        r.outTok = d.usage?.output_tokens ?? r.outTok;
      } else if (event === 'message_stop') {
        complete = true;
      } else if (event === 'error') {
        r.error = d.error?.type ?? 'upstream_error';
      }
    }
  } catch (e) {
    r.error = `relay: ${e instanceof Error ? e.message : String(e)}`.slice(0, 200);
  }
  if (!r.error && !complete) r.error = 'truncated';
  return r;
}
