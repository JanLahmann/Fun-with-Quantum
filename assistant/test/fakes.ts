/** Test doubles: D1 backed by node:sqlite (real SQL, real migration), a scripted rate limiter, a fake Claude. */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Env } from '../src/env';

class Stmt {
  args: unknown[] = [];
  constructor(private db: DatabaseSync, readonly sql: string) {}
  bind(...args: unknown[]) { this.args = args; return this; }
  exec() {
    const st = this.db.prepare(this.sql);
    if (/\bRETURNING\b|^\s*SELECT/i.test(this.sql)) {
      const results = st.all(...(this.args as never[]));
      return { results, meta: { changes: results.length }, success: true };
    }
    const r = st.run(...(this.args as never[]));
    return { results: [], meta: { changes: Number(r.changes) }, success: true };
  }
  async run() { return this.exec(); }
  async all() { return this.exec(); }
  async first() { return this.exec().results[0] ?? null; }
}

export class FakeD1 {
  db = new DatabaseSync(':memory:');
  constructor() {
    this.db.exec('PRAGMA foreign_keys = ON');
    for (const m of ['0001_init.sql', '0002_level.sql']) {
      this.db.exec(readFileSync(fileURLToPath(new URL(`../migrations/${m}`, import.meta.url).href), 'utf8'));
    }
  }
  prepare(sql: string) { return new Stmt(this.db, sql); }
  async batch(stmts: Stmt[]) {
    this.db.exec('BEGIN');
    try { const out = stmts.map((s) => s.exec()); this.db.exec('COMMIT'); return out; }
    catch (e) { this.db.exec('ROLLBACK'); throw e; }
  }
  rows(sql: string) { return this.db.prepare(sql).all() as Record<string, unknown>[]; }
}

export function makeEnv(over: Partial<Record<keyof Env, unknown>> = {}) {
  const db = new FakeD1();
  const rl = { allow: true, calls: 0, async limit() { this.calls++; return { success: this.allow }; } };
  const env = {
    ANTHROPIC_API_KEY: 'test-key',
    ALLOWED_ORIGINS: 'https://fun-with-quantum.org,http://localhost:4321',
    MODEL: 'claude-sonnet-5-5',
    MAX_TOKENS: '600',
    MAX_HISTORY_TURNS: '5',
    DAILY_VISITOR_LIMIT: '50',
    DAILY_GLOBAL_LIMIT: '2000',
    RETENTION_DAYS: '30',
    DB: db,
    RL: rl,
    ...over,
  } as unknown as Env;
  return { env, db, rl };
}

export function makeCtx() {
  const pending: Promise<unknown>[] = [];
  return {
    ctx: { waitUntil: (p: Promise<unknown>) => { pending.push(p); }, passThroughOnException() {}, props: {} } as unknown as ExecutionContext,
    settle: () => Promise.all(pending),
  };
}

/** SSE text as Claude streams it, split into awkward chunks to exercise the parser. */
export function claudeStream(parts: string[], opts: { error?: boolean; truncate?: boolean } = {}): string {
  const ev = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  let s = ev('message_start', { type: 'message_start', message: { usage: { input_tokens: 120, cache_read_input_tokens: 2048, cache_creation_input_tokens: 0, output_tokens: 1 } } });
  s += ev('content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } });
  for (const p of parts) s += ev('content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: p } });
  if (opts.error) return s + ev('error', { type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } });
  if (opts.truncate) return s;
  s += ev('content_block_stop', { type: 'content_block_stop', index: 0 });
  s += ev('message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 42 } });
  return s + ev('message_stop', { type: 'message_stop' });
}

export function chunked(text: string, size = 7, probe: { cancelled?: boolean } = {}): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(text);
  let i = 0;
  return new ReadableStream({
    pull(c) { if (i >= bytes.length) c.close(); else { c.enqueue(bytes.slice(i, i + size)); i += size; } },
    cancel() { probe.cancelled = true; },
  });
}

export function fakeClaude(respond: () => Response) {
  const calls: { url: string; init: RequestInit; body: Record<string, any> }[] = [];
  const f = (async (url: string, init: RequestInit) => {
    calls.push({ url, init, body: JSON.parse(String(init.body)) });
    return respond();
  }) as unknown as typeof fetch;
  return { fetch: f, calls };
}
