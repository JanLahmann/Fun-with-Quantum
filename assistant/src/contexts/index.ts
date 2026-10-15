import { coinGame } from './coin-game';
import { cleanjibeHelp } from './cleanjibe/help';
import { rasqberryBuild } from './rasqberry/build';
import { rasqberryDevice } from './rasqberry/device';
import { rasqberryTester } from './rasqberry/tester';
import type { Context } from './types';

/** Every context the Worker serves, keyed `<site>/<context>`. */
export const CONTEXTS: Record<string, Context> = {
  'fwq/coin-game': coinGame,
  'rasqberry/build': rasqberryBuild,
  'rasqberry/device': rasqberryDevice,
  'rasqberry/tester': rasqberryTester,
  'cleanjibe/help': cleanjibeHelp,
};

export function contextFor(site: unknown, context: unknown): Context | null {
  if (typeof site !== 'string' || typeof context !== 'string') return null;
  return Object.hasOwn(CONTEXTS, `${site}/${context}`) ? CONTEXTS[`${site}/${context}`] : null;
}
