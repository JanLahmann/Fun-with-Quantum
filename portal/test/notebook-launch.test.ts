import { describe, expect, it } from 'vitest';
import { NOTEBOOK_DOWN, QUBINS_DOWN, notebookHref, notebookTarget, qubinsLaunch } from '../src/lib/notebook-launch';
import { LOCALES } from '../src/lib/qcoin/i18n';
import { GAME_LOCALES } from '../src/lib/games/locale';

describe('notebook links while qubins.org is down', () => {
  const launch = qubinsLaunch('CHSH-Game.ipynb');

  it('builds the QuBins launch link with classic RISE', () => {
    expect(launch).toBe('https://qubins.org/launch/?image=2.5-xl&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=CHSH-Game.ipynb&ui=rise-classic');
  });

  it('sends every link to the notebook on GitHub while QUBINS_DOWN, else to the launch link', () => {
    expect(notebookHref(launch, 'CHSH-Game.ipynb')).toBe(
      QUBINS_DOWN ? 'https://github.com/JanLahmann/Fun-with-Quantum/blob/master/CHSH-Game.ipynb' : launch);
    expect(notebookTarget(launch)).toBe(QUBINS_DOWN ? 'github' : 'qubins');
  });

  it('has the note in every language of the game pages, with the link text it names', () => {
    for (const l of new Set<string>([...LOCALES, ...GAME_LOCALES])) {
      const t = NOTEBOOK_DOWN[l];
      expect(t, l).toBeDefined();
      expect(t.note.length, l).toBeGreaterThan(t.noteNoWeb.length);
      expect(t.link, l).toContain('GitHub');
      expect(t.note, l).toContain('GitHub');
    }
  });
});
