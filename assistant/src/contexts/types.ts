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
  /** Who the assistant is, when asked (default: Ket, the Fun with Quantum family's helper). */
  identity?: string;
  /** Its own language rule instead of the default (the tester helper). */
  language?: string;
  /** Tag the page state is wrapped in (default game_state). */
  stateTag?: string;
  /** Model for this context instead of the Worker's MODEL. */
  model?: string;
  /** Days its messages are kept instead of RETENTION_DAYS. */
  retentionDays?: number;
  /** Only for signed-in testers (passphrase + tester ID), with budgets per tester instead of per visitor. */
  tester?: { daily_tester: number; daily_global: number };
  /** Checks and trims the page state; returns null when it is unusable. */
  state(raw: unknown): Record<string, unknown> | null;
}
