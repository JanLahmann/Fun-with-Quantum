import { coinGame } from './coin-game';
import { rasqberryBuild } from './rasqberry/build';
import { rasqberryDevice } from './rasqberry/device';
import type { Context } from './types';

/** Every context the Worker serves, keyed `<site>/<context>`. */
export const CONTEXTS: Record<string, Context> = {
  'fwq/coin-game': coinGame,
  'rasqberry/build': rasqberryBuild,
  'rasqberry/device': rasqberryDevice,
};

export function contextFor(site: unknown, context: unknown): Context | null {
  if (typeof site !== 'string' || typeof context !== 'string') return null;
  return Object.hasOwn(CONTEXTS, `${site}/${context}`) ? CONTEXTS[`${site}/${context}`] : null;
}
