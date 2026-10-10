import { describe, expect, it } from 'vitest';
import { KNOWLEDGE } from '../src/contexts/coin-game.knowledge';
import en from '../../portal/src/lib/qcoin/i18n/en';

describe('coin-game knowledge', () => {
  it('states the computed chapter-4 result: only H … H always wins, every other pair 50%', () => {
    const rows = KNOWLEDGE.match(/^- A plays .*$/gm)!;
    expect(rows).toHaveLength(9);
    for (const r of rows) {
      expect(r).toMatch(r.startsWith('- A plays H … H') ? /heads \(A wins\) 100% against/ : /heads \(A wins\) 50% against/);
    }
  });

  it('chapter 2: 0% for the player when the quantum computer starts, 50% when the player starts', () => {
    expect(KNOWLEDGE).toContain('you win 0% with "leave it", 0% with "flip it"');
    expect(KNOWLEDGE.match(/^- you [IX] … [IX], computer H: heads \(you win\) 50%$/gm)).toHaveLength(4);
  });

  it('sandbox references match the game text (H Z H tails, H S H 50:50, H S S H tails)', () => {
    expect(KNOWLEDGE).toContain('- H Z H: heads 0%');
    expect(KNOWLEDGE).toContain('- H S H: heads 50%');
    expect(KNOWLEDGE).toContain('- H S S H: heads 0%');
  });

  it('carries every glossary entry as plain text', () => {
    for (const g of Object.values(en.glossary)) expect(KNOWLEDGE).toContain(`### ${g.title}`);
    expect(KNOWLEDGE).not.toMatch(/\]\(#[a-z]+\)|<\/?(b|strong|em)>/);
  });

  it('link paths are relative to /learning/ (no doubled prefix)', () => {
    expect(KNOWLEDGE).not.toContain('/learning/learning');
    expect(KNOWLEDGE).toMatch(/^- the Bloch sphere: modules\/quantum-mechanics\//m);
  });

  it('is long enough to be prompt-cached (≥ 1024 tokens; ~4 characters per token is a safe floor)', () => {
    expect(KNOWLEDGE.length).toBeGreaterThan(4 * 1024 * 2);
  });
});
