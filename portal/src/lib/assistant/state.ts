/**
 * Where the widget gets the live page state from: a game registers a function that returns what
 * the player can see right now; the widget calls it when a question is sent.
 */
const providers = new Map<string, () => unknown>();

export function registerState(context: string, get: () => unknown): void {
  providers.set(context, get);
}

export function currentState(context: string): unknown {
  return providers.get(context)?.() ?? null;
}
