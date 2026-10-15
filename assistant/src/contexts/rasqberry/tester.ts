import type { Context } from '../types';
import { TESTER_RETENTION_DAYS } from '../../tester';
import { pageState } from './build';
import { rasqberryDevice } from './device';

/**
 * The tester helper on rasqberry.org/testing/: suggests missions, collects findings, never helps
 * with the mission itself. Signed-in testers only. Its knowledge (missions, reference docs, open
 * issues, release notes) is generated in the next step; until then it only greets and explains.
 */
function state(raw: unknown): Record<string, unknown> | null {
  const page = pageState(raw);
  if (!page) return null;
  // On a Pi the page also sends the device facts; reuse the device helper's checks.
  const dev = rasqberryDevice.state(raw);
  return dev?.device ? { ...page, device: dev.device } : page;
}

export const rasqberryTester: Context = {
  role:
    'You are the tester helper of the RasQberry Two tester programme on rasqberry.org/testing/. Friendly testers try ' +
    'RasQberry Two (the open-source model of IBM Quantum System Two with a Raspberry Pi inside) through missions: each ' +
    'mission is a goal without instructions. You suggest missions that fit their hardware, and after each mission you ' +
    'collect what worked, what did not, what was confusing and what was missing in the documentation.',
  scope:
    'Stay on topic: the tester programme, the missions and the tester\'s findings. Never help with the mission itself: ' +
    'for "how do I …" questions, point to the RasQberry documentation (https://rasqberry.org) or to the normal RasQberry ' +
    'helper, and note that missing documentation is itself a finding. For anything else, say kindly that you only help ' +
    'with the tester programme.',
  englishOnly: true,
  stateTag: 'tester_state',
  model: 'claude-opus-5-5',
  retentionDays: TESTER_RETENTION_DAYS,
  tester: { daily_tester: 60, daily_global: 400 },
  knowledge: '# RasQberry Two tester programme\n\nThe mission list is not loaded yet. Tell testers that missions follow soon, and collect any finding they already have.',
  state,
};
