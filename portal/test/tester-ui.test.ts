import { describe, expect, it } from 'vitest';
import { cardLines, visibleText } from '../src/lib/assistant/tester-ui';

describe('tester helper cards', () => {
  const answer = 'Two missions fit:\n\nMISSION: first-start\nMISSION: demo-entangible\n\nThanks!\nFINDING: {"kind":"docs","severity":"minor","title":"No page on X"}';

  it('hides card lines from the text, also a card line still streaming in', () => {
    expect(visibleText(answer)).toBe('Two missions fit:\n\nThanks!');
    expect(visibleText('Try this:\nMISS')).toBe('Try this:');
    expect(visibleText('Try this:\nMISSION: first-st')).toBe('Try this:');
    expect(visibleText('Fine.\nFINDING: {"kind":')).toBe('Fine.');
    expect(visibleText('Mission accomplished')).toBe('Mission accomplished');
  });

  it('turns mission and finding lines into cards; ignores malformed ones', () => {
    expect(cardLines(answer)).toEqual([
      { kind: 'mission', id: 'first-start' },
      { kind: 'mission', id: 'demo-entangible' },
      { kind: 'finding', finding: { kind: 'docs', severity: 'minor', title: 'No page on X' } },
    ]);
    expect(cardLines('MISSION: Bad Id\nFINDING: {not json}\nFINDING: {"title":"no kind"}\nFINDING: [1]')).toEqual([]);
  });

  it('tolerates a bullet, bold or backticks around a card line', () => {
    expect(cardLines('- MISSION: wifi\n**MISSION:** help\n`MISSION: touch`\n> FINDING: {"kind":"idea","title":"T"}')).toEqual([
      { kind: 'mission', id: 'wifi' }, { kind: 'mission', id: 'help' }, { kind: 'mission', id: 'touch' },
      { kind: 'finding', finding: { kind: 'idea', title: 'T' } },
    ]);
    expect(visibleText('Try:\n- MISSION: wifi\n**MISSION:** help\nDone.')).toBe('Try:\nDone.');
    expect(visibleText('Try:\n- MISS')).toBe('Try:');
  });
});
