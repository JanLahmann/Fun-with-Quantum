# fwq-assistant — runtime assistant Worker

A Cloudflare Worker between the chat widget and the Claude Messages API. It holds the API key
(as a Worker secret), builds the prompt, streams the answer back, logs it to D1 and enforces the
limits. One Worker serves every *context*: the Quantum Coin Game first, later other games,
doQumentation and the RasQberry build guide.

```
widget ──POST /chat {site, context, locale, question, state, history}──► Worker ──► Claude (stream)
       ◄── SSE: delta {t} … done {id, stop} | error {error} ─────────────┘   └─► D1 (log, 30 days)
widget ──POST /feedback {id, vote: 1 | -1}──► Worker ──► D1
```

## Where things live

| File | What |
|---|---|
| `src/index.ts` | Routing, request validation, the `/chat` stream, `/feedback`, daily `purge` |
| `src/guard.ts` | Origin allow-list + CORS, burst limiter, daily counters per visitor and overall |
| `src/prompt.ts` | Shared answering rules; system prompt = role + rules + knowledge (cache breakpoint) |
| `src/anthropic.ts` | Messages API call (`stream: true`), SSE parser, relay to the widget |
| `src/contexts/` | One file per context: role, static knowledge, validator for the live state |
| `migrations/` | D1 schema: `messages`, `feedback`, `quota` |

The system prompt is identical on every request of a context, so it is prompt-cached (once the
knowledge block passes the model's minimum cacheable length, ~1024 tokens); the live
state and the question go into the user message. A context only sees what the player sees (the
coin game sends the quantum computer's hidden moves as `?`).

## Limits and privacy

- Origin must be in `ALLOWED_ORIGINS`; anything else gets 403 (non-browser clients can fake the
  header, so the limits below are the real protection, with the spend limit in the Anthropic console).
- 10 requests a minute per visitor (`[[ratelimits]]`), then — only for valid requests —
  `DAILY_VISITOR_LIMIT` per visitor and `DAILY_GLOBAL_LIMIT` overall per UTC day. Only requests
  within a visitor's own limit count towards the global one, so one visitor can't lock out everyone.
- "Visitor" = HMAC of (day, IPv4 address or IPv6 /64) under a key derived from the Worker secret:
  it changes daily, can't be traced back to an address without the secret, and is stored only in
  the `quota` table, never with a message.
- When the player closes the widget mid-answer, the Claude stream is cancelled (no tokens for nobody).
- Logged: question, answer, page state, language, token usage — no IP, no cookie. Deleted after
  `RETENTION_DAYS` (30) by the daily cron.
- History: the widget sends earlier question/answer pairs; the Worker keeps the last
  `MAX_HISTORY_TURNS` (5, at most 10).

## Develop

```sh
npm install
npm test          # vitest; D1 is node:sqlite with the real migration, Claude is faked
npm run check     # tsc
npx wrangler deploy --dry-run --outdir /tmp/worker   # validates wrangler.toml, no account needed
```

## Set up (Jan, once)

```sh
npx wrangler login
npx wrangler d1 create fwq-assistant               # put the id into wrangler.toml
npx wrangler d1 migrations apply fwq-assistant --remote
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler deploy                                # → https://fwq-assistant.<account>.workers.dev
```

For local runs with the real API: `npx wrangler d1 migrations apply fwq-assistant --local`, the
key in `.dev.vars` (`ANTHROPIC_API_KEY=…`, gitignored), then `npm run dev`.
