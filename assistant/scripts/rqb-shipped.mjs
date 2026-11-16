// What the beta and prod images of RasQberry Two ship, by RasQberry's own trimmer (rq_demo_level.py apply,
// the step its image build runs) on a copy of a local RasQberry-Two checkout's config. It runs RasQberry's
// code, so it is for local checks only (test/rasqberry.test.ts compares it with the mirrored rules in
// rasqberry-knowledge.mjs); never run it in CI.
// Usage: node scripts/rqb-shipped.mjs <RasQberry-Two checkout> <out.json>
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const IMAGE_LEVELS = ['beta', 'prod'];
/** A learning-path step as the trimmer leaves it: a demo step, a web step (url) or a command. */
export const stepKey = (st) => (st.demo ? `demo:${st.demo}/${st.variant ?? ''}` : st.url ? `url:${st.url}` : `cmd:${st.command}`);

/** What an image of each level keeps: { beta|prod: { demos: {id: [variant ids]}, paths: {id: {steps: [keys], next: [path ids]}} } }. */
export function shippedAt(dev) {
  const out = {};
  for (const lvl of IMAGE_LEVELS) {
    const tmp = mkdtempSync(join(tmpdir(), 'rqb-level-'));
    try {
      const config = join(tmp, 'RQB2-config');
      cpSync(join(dev, 'RQB2-config'), config, { recursive: true });
      execFileSync('python3', ['-I', join(dev, 'RQB2-bin/rq_demo_level.py'), 'apply', config, lvl], { stdio: ['ignore', 'ignore', 'inherit'], env: { PATH: process.env.PATH } });
      const dir = join(config, 'demo-manifests');
      const read = (f) => JSON.parse(readFileSync(join(dir, f), 'utf8'));
      const demos = Object.fromEntries(readdirSync(dir).filter((f) => /^rq_demo_.*\.json$/.test(f) && f !== 'rq_demo_schema.json')
        .map(read).map((m) => [m.id, (m.variants ?? []).map((v) => v.id)]));
      const paths = Object.fromEntries((read('learning-paths.json').paths ?? [])
        .map((pa) => [pa.id, { steps: pa.steps.map(stepKey), next: (pa.next ?? []).map((n) => n.path).filter(Boolean) }]));
      out[lvl] = { demos, paths };
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [dev, out] = process.argv.slice(2);
  writeFileSync(out, `${JSON.stringify(shippedAt(dev), null, 1)}\n`);
}
