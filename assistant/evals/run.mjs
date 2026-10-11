#!/usr/bin/env node
/**
 * Runs the eval set against a running assistant Worker and prints a Markdown report.
 *
 *   node evals/run.mjs --url https://fwq-assistant.<account>.workers.dev [--only <id>] [--file evals/coin-game.jsonl]
 *
 * Each case: question + state (+ history, level) and heuristic checks — `any`/`any2` (each list needs
 * one match), `none` (no match allowed), `lang` (the answer's language). Patterns are
 * case-insensitive Unicode regexes; a leading "=" makes one case-sensitive (e.g. the gate H:
 * `=(?<!\p{L})H(?!\p{L})`, since \b doesn't know ä or ö). The checks catch
 * regressions; every answer is printed in full for a human read as well. Requests are paced
 * (7 s apart) to stay under the Worker's burst limit of 10 a minute.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const url = arg('url');
if (!url) { console.error('usage: node evals/run.mjs --url <worker url> [--only id] [--out report.md]'); process.exit(2); }
const file = arg('file', new URL('./coin-game.jsonl', import.meta.url));
const only = arg('only');
const origin = arg('origin', 'https://fun-with-quantum.org');
const cases = readFileSync(file, 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((c) => !only || c.id === only);

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

async function askOnce(c, t0) {
  const res = await fetch(`${url.replace(/\/$/, '')}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ site: 'fwq', context: 'coin-game', locale: c.locale, level: c.level, question: c.question, state: c.state, history: c.history }),
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
  if (c.lang && !LANG[c.lang].test(answer)) fails.push(`lang: not ${c.lang}`);
  return fails;
}

const lines = [`# Assistant eval — ${new Date().toISOString()}`, '', `Worker: ${url}`, ''];
let passed = 0;
for (const [i, c] of cases.entries()) {
  if (i) await sleep(7000);
  const r = await ask(c);
  const fails = r.error ? [r.error] : r.end?.ev !== 'done' ? [`stream ended with ${JSON.stringify(r.end)}`, ...check(c, r.answer)] : check(c, r.answer);
  if (!fails.length) passed++;
  lines.push(`## ${fails.length ? '❌' : '✅'} ${c.id}`, '', `*${c.note}* · chapter ${c.state.chapter} · ${c.locale} · ${c.level ?? 'normal'} · ${r.ms} ms`, '', `> **Q:** ${c.question}`, '');
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
