import { describe, expect, it } from 'vitest';
import { fits, hasNeed, imageTag, progress, started, suggest, versionCheck, type Mission } from '../src/contexts/rasqberry/missions';
import { MISSIONS, TESTER_KNOWLEDGE, TESTER_SOURCE } from '../src/contexts/rasqberry/tester.generated';
import { rasqberryTester } from '../src/contexts/rasqberry/tester';
import { systemPrompt } from '../src/prompt';
// @ts-expect-error — plain .mjs script without types
import { knownIssues, missionLine, releaseSection } from '../scripts/rasqberry-knowledge.mjs';

const all = MISSIONS as Mission[];
const full = { 'led-panel': true, touchscreen: true, 'bluetooth-speaker': true, camera: true, 'ibm-account': true, display: true, image: 'ab' };

describe('mission picker', () => {
  it('matches needs: image is one choice, a touchscreen counts as a screen', () => {
    expect(hasNeed({ image: 'ab' }, 'ab-image')).toBe(true);
    expect(hasNeed({ image: 'ab' }, 'single-image')).toBe(false);
    expect(hasNeed({ touchscreen: true }, 'display')).toBe(true);
    expect(hasNeed({ 'led-panel': 'yes' }, 'led-panel')).toBe(false);
    expect(hasNeed({}, 'internet')).toBe(true); // internet is the default
    expect(hasNeed({ offline: true }, 'internet')).toBe(false);
    expect(hasNeed({ offline: true, 'ibm-account': true }, 'ibm-account')).toBe(false);
    expect(hasNeed({ 'ibm-account': true }, 'ibm-account')).toBe(true);
    expect(hasNeed({}, 'big-card')).toBe(true); // 32 GB or more unless the tester says smaller
    expect(hasNeed({ 'small-card': true }, 'big-card')).toBe(false);
    expect(hasNeed({ version: 'dev' }, 'dev-image')).toBe(true);
    expect(hasNeed({ version: 'beta' }, 'dev-image')).toBe(false);
    expect(hasNeed({}, 'dev-image')).toBe(false);
  });

  it('never suggests a mission whose needs the tester lacks, or one that is coming', () => {
    // An offline tester with no hardware gets only missions whose needs hold by default (e.g. big-card).
    for (const m of suggest({ offline: true }, {}, {}, 99)) for (const n of all.find((x) => x.id === m.id)!.needs) expect(hasNeed({ offline: true }, n), `${m.id}: ${n}`).toBe(true);
    const ids = suggest(full, {}, {}, 99).map((m) => m.id);
    for (const m of all.filter((m) => m.status === 'coming')) expect(ids).not.toContain(m.id);
    expect(ids.length).toBe(all.filter((m) => fits(m, full)).length);
  });

  it('least tried first, then interests, then group order; leaves out started, done and skipped', () => {
    const first = suggest({}, {}, {})[0].id;
    expect(first).toBe(all[0].id);
    expect(suggest({}, {}, { [first]: 2 })[0].id).not.toBe(first);
    expect(suggest({ interests: ['games'] }, {}, {})[0].id).toMatch(/^demo-fun-with-quantum-/);
    expect(suggest({ interests: ['core'] }, {}, {})[0].id).toBe(all.find((m) => m.group === 'core')!.id);
    const states = { [all[0].id]: 'done', [all[1].id]: 'skipped', [all[2].id]: 'started' };
    expect(suggest({}, states, {}, 99).map((m) => m.id)).not.toEqual(expect.arrayContaining([all[0].id, all[1].id, all[2].id]));
    expect(started(states)).toEqual([{ id: all[2].id, title: all[2].title }]);
  });

  it('progress per group counts done of the missions that fit', () => {
    const core = all.filter((m) => m.group === 'core' && fits(m, {}));
    const p = progress({}, Object.fromEntries(core.map((m) => [m.id, 'done'])));
    expect(p['Core RasQberry']).toBe(`all ${core.length} done`);
    expect(p['LED demos']).toBeUndefined(); // no LED panel, no LED missions
  });
});

describe('version check', () => {
  const latest = { beta: 'beta-2026-10-10-053754', dev: 'development-2026-10-15-094105' };
  it('reads release tags', () => {
    expect(imageTag('beta-2026-10-10-053754')).toEqual({ stream: 'beta', stamp: '2026-10-10-053754' });
    expect(imageTag('development-2026-10-15-094105')).toEqual({ stream: 'dev', stamp: '2026-10-15-094105' });
    expect(imageTag('dev-ledfix-2026-10-01')).toBeNull();
  });
  it('a Pi on an older image of its stream must update; the newest (or newer) is fine', () => {
    expect(versionCheck({ version: 'beta' }, 'beta-2026-10-01-000000', latest)).toMatchObject({ update_needed: true });
    expect(versionCheck({ version: 'beta' }, latest.beta, latest)).toMatchObject({ update_needed: false });
    expect(versionCheck({}, 'development-2026-10-16-000000', latest)).toMatchObject({ update_needed: false });
    expect(versionCheck({ version: 'beta' }, 'development-2026-10-14-000000', latest).reason).toContain('newest dev image');
  });
  it("without a Pi: the tester's choice decides; older-or-not-sure or no choice means update first", () => {
    expect(versionCheck({ version: 'dev' }, undefined, latest).update_needed).toBe(false);
    expect(versionCheck({ version: 'older' }, undefined, latest).update_needed).toBe(true);
    expect(versionCheck({}, undefined, latest).update_needed).toBe(true);
  });
});

describe('tester knowledge', () => {
  it('has the rules, every mission, known issues, releases, the docs map and the reference pages', () => {
    expect(TESTER_SOURCE.development).toMatch(/^[0-9a-f]{40}$/);
    for (const h of ['## How the tester programme works', '## All missions', '## Known issues', "## Releases and what's new", '## The user documentation', '## Reference pages']) {
      expect(TESTER_KNOWLEDGE).toContain(h);
    }
    for (const m of all) expect(TESTER_KNOWLEDGE).toContain(`\`${m.id}\``);
    expect(TESTER_KNOWLEDGE.length).toBeLessThan(240_000); // about 60k tokens
    expect(systemPrompt(rasqberryTester)[1].text).toBe(TESTER_KNOWLEDGE);
    const head = systemPrompt(rasqberryTester)[0].text;
    expect(head).toContain("Answer in the language of the tester's own latest message");
    expect(head).not.toContain('Answer in English, even');
    expect(TESTER_KNOWLEDGE).toContain('**Findings stay in English**');
  });

  it('formats missions, issues and releases', () => {
    expect(missionLine({ id: 'x', title: 'X', goal: 'Do x.', needs: ['led-panel'], maturity: 'beta' }, { 'led-panel': 'LED panel' }))
      .toBe('- `x` **X** — Do x. (needs: LED panel; early beta, not yet tested by people)');
    expect(missionLine({ id: 'h', title: 'H', goal: 'G.', needs: [], status: 'coming' }, {})).toContain('COMING');
    const issues = [
      { number: 9, title: 'Bug ', labels: [{ name: 'bug' }], milestone: { title: 'M1' } },
      { number: 3, title: 'Q', labels: [{ name: 'question' }] },
      { number: 5, title: 'No label', labels: [], author: { login: 'JanLahmann' } },
      { number: 7, title: 'Tester helper: say findings save themselves', labels: [], author: { login: 'stranger' } },
      { number: 8, title: 'x'.repeat(200), labels: [{ name: 'enhancement' }], author: { login: 'stranger' } },
    ];
    expect(knownIssues(issues)).toEqual([
      '- #5 No label — https://github.com/JanLahmann/RasQberry-Two/issues/5',
      `- #8 ${'x'.repeat(120)} [enhancement] — https://github.com/JanLahmann/RasQberry-Two/issues/8`,
      '- #9 Bug [bug] (milestone M1) — https://github.com/JanLahmann/RasQberry-Two/issues/9',
    ]);
    const rel = releaseSection({ streams: { stable: { tag: null, message: 'None yet.' }, beta: { tag: 'b1', release_date: '2026-10-10', highlights: ['own'] }, dev: { tag: 'd1', highlights: ['dev line', 'Bump version to 1.2'] } } }, { beta: ['curated'] });
    expect(rel).not.toContain('Bump');
    expect(rel).toContain('### stable\n\nNone yet.');
    expect(rel).toContain('### beta: b1, 2026-10-10\n\n- curated');
    expect(rel).toContain('### dev: d1\n\n- dev line');
  });
});
