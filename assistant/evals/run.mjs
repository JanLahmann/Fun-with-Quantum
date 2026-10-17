#!/usr/bin/env node
/**
 * Runs the eval set against a running assistant Worker and prints a Markdown report.
 *
 *   node evals/run.mjs --url https://fwq-assistant.<account>.workers.dev [--only <id>] [--file evals/rasqberry-build.jsonl]
 *
 * Each case: question + state (+ history, level) and heuristic checks — `any`/`any2` (each list needs
 * one match), `none` (no match allowed), `lang` (the answer's language). Patterns are
 * case-insensitive Unicode regexes; a leading "=" makes one case-sensitive (e.g. the gate H:
 * `=(?<!\p{L})H(?!\p{L})`, since \b doesn't know ä or ö). The checks catch
 * regressions; every answer is printed in full for a human read as well. Requests are paced
 * (7 s apart) to stay under the Worker's burst limit of 10 a minute.
 *
 * Tester cases (context "tester") sign in with TESTER_PASSPHRASE from the environment, as a fresh
 * tester per case (eval-<run>-<n>: the Worker leaves eval- testers out of coverage and the export),
 * after saving the case's `setup` ({preferences, missions}) through the tester endpoints.
 *
 * App-only contexts (CleanJibe "session") ask like the app: no Origin, with APP_EVAL_PASS from the
 * environment as X-Eval-Pass; `--via app` does the same for every context of an app site (CleanJibe
 * help too), so large sets don't use up a visitor's budget. `stateFile` loads the case's state from a
 * file, relative to the set.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const url = arg('url');
if (!url) { console.error('usage: node evals/run.mjs --url <worker url> [--only id] [--out report.md]'); process.exit(2); }
const file = arg('file', new URL('./coin-game.jsonl', import.meta.url));
/** Each case may name its site and context (default: the coin game); the Origin follows the site. */
const ORIGINS = { fwq: 'https://fun-with-quantum.org', rasqberry: 'https://rasqberry.org', cleanjibe: 'https://cleanjibe.org' };
const APP_ONLY = new Set(['cleanjibe/session']);
/** Sites with an app: `--via app` asks their app contexts like the app (eval pass, its own budget), e.g. fwq coin-game and guide. */
const APP_SITES = new Set(['cleanjibe', 'fwq']);
const only = arg('only');
const cases = readFileSync(file, 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((c) => !only || c.id === only)
  .map((c) => (c.stateFile ? { ...c, state: JSON.parse(readFileSync(new URL(c.stateFile, file instanceof URL ? file : pathToFileURL(resolve(file))), 'utf8')) } : c));

const LANG = { de: /\b(der|die|das|und|ist|nicht|du)\b/i, en: /\b(the|and|is|you)\b/i, ja: /[぀-ヿ一-鿿]/ };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ask(c) {
  const t0 = Date.now();
  try {
    return await askOnce(c, t0);
  } catch (e) {
    return { error: `request failed: ${e instanceof Error ? e.message : String(e)}`, ms: Date.now() - t0 };
  }
}

const RUN = Date.now().toString(36).slice(-6);
let testerN = 0;

/** A fresh tester for this case, with the case's setup saved the way the widget saves it. */
async function testerFor(c, headers) {
  const tester = `eval-${RUN}-${testerN++}`;
  const post = (path, body) => fetch(`${url.replace(/\/$/, '')}${path}`, { method: 'POST', headers, body: JSON.stringify({ site: c.site, tester, ...body }) });
  const prefs = await post('/tester/prefs', { preferences: c.setup?.preferences ?? {} });
  if (!prefs.ok) throw new Error(`tester setup: HTTP ${prefs.status}`);
  for (const [mission_id, state] of Object.entries(c.setup?.missions ?? {})) await post('/tester/status', { mission_id, state });
  return tester;
}

async function askOnce(c, t0) {
  const headers = { 'Content-Type': 'application/json', Origin: arg('origin') ?? ORIGINS[c.site ?? 'fwq'] };
  if (APP_ONLY.has(`${c.site}/${c.context}`) || (arg('via') === 'app' && APP_SITES.has(c.site))) {
    if (!process.env.APP_EVAL_PASS) return { error: 'APP_EVAL_PASS is not set', ms: 0 };
    delete headers.Origin;
    headers['X-Eval-Pass'] = process.env.APP_EVAL_PASS;
  }
  let tester;
  if (c.context === 'tester') {
    if (!process.env.TESTER_PASSPHRASE) return { error: 'TESTER_PASSPHRASE is not set', ms: 0 };
    headers['X-Tester-Pass'] = process.env.TESTER_PASSPHRASE;
    tester = await testerFor(c, headers);
  }
  const res = await fetch(`${url.replace(/\/$/, '')}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ site: c.site ?? 'fwq', context: c.context ?? 'coin-game', locale: c.locale, level: c.level, question: c.question, state: c.state, history: c.history, tester }),
  });
  if (!res.ok) return { error: `HTTP ${res.status} ${await res.text()}`, ms: Date.now() - t0 };
  const text = await res.text();
  let answer = '', end = null;
  for (const block of text.split('\n\n')) {
    const ev = /^event: (.*)$/m.exec(block)?.[1];
    const data = /^data: (.*)$/m.exec(block)?.[1];
    if (!ev || !data) continue;
    if (ev === 'delta') answer += JSON.parse(data).t;
    else end = { ev, ...JSON.parse(data) };
  }
  return { answer, end, ms: Date.now() - t0 };
}

function check(c, answer) {
  const fails = [];
  const re = (s) => (s.startsWith('=') ? new RegExp(s.slice(1), 'su') : new RegExp(s, 'isu'));
  for (const key of ['any', 'any2']) if (c[key] && !c[key].some((p) => re(p).test(answer))) fails.push(`${key}: none of ${c[key].join(' | ')}`);
  for (const p of c.none ?? []) if (re(p).test(answer)) fails.push(`none: matched ${p}`);
  if (c.lang && !LANG[c.lang]) fails.push(`lang: no check for "${c.lang}" (known: ${Object.keys(LANG).join(', ')})`);
  else if (c.lang && !LANG[c.lang].test(answer)) fails.push(`lang: not ${c.lang}`);
  return fails;
}

const lines = [`# Assistant eval — ${new Date().toISOString()}`, '', `Worker: ${url}`, ''];
let passed = 0;
for (const [i, c] of cases.entries()) {
  if (i) await sleep(7000);
  const r = await ask(c);
  const fails = r.error ? [r.error] : r.end?.ev !== 'done' ? [`stream ended with ${JSON.stringify(r.end)}`, ...check(c, r.answer)] : check(c, r.answer);
  if (r.end?.stop === 'max_tokens') fails.unshift('cut off: stop_reason max_tokens');
  if (!fails.length) passed++;
  lines.push(`## ${fails.length ? '❌' : '✅'} ${c.id}`, '', `*${c.note}* · ${c.context ?? `chapter ${c.state.chapter}`} · ${c.locale} · ${c.level ?? 'normal'} · ${r.ms} ms · ${r.end?.stop ?? '-'}`, '', `> **Q:** ${c.question}`, '');
  lines.push((r.answer || '(no answer)').split('\n').map((l) => `> ${l}`).join('\n'), '');
  if (fails.length) lines.push(...fails.map((f) => `- ${f}`), '');
  console.error(`${fails.length ? 'FAIL' : 'ok  '} ${c.id}${fails.length ? ' — ' + fails.join('; ') : ''}`);
}
lines.splice(4, 0, `**${passed} / ${cases.length} passed**`, '');
const report = lines.join('\n');
const out = arg('out');
if (out) writeFileSync(out, report);
else console.log(report);
process.exit(passed === cases.length ? 0 : 1);
