/**
 * A context is one place the widget is embedded: a game, a doQumentation page, the RasQberry
 * build guide. The pipeline is the same for all of them; a context only adds its role, its
 * static knowledge (cached) and a validator for the live state the page sends along.
 */
export interface Context {
  /** Who the assistant is here, in one or two sentences. */
  role: string;
  /** Static knowledge block: identical on every request, so it is prompt-cached. */
  knowledge: string;
  /** The "stay on topic" rule: what this assistant talks about, and what it does with the rest. */
  scope: string;
  /** Offers the Kids / Normal / With math switch (the games). */
  levels?: boolean;
  /** Answers in English whatever the question's language (sites that are English only). */
  englishOnly?: boolean;
  /** Tag the page state is wrapped in (default game_state). */
  stateTag?: string;
  /** Checks and trims the page state; returns null when it is unusable. */
  state(raw: unknown): Record<string, unknown> | null;
}
