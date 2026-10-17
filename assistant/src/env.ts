export interface Env {
  ANTHROPIC_API_KEY: string;
  /** Per site: who may embed the widget, and its daily budgets ([vars.SITES.<site>] in wrangler.toml). */
  SITES: Record<string, SiteConfig>;
  MODEL: string;
  MAX_TOKENS: string;
  MAX_HISTORY_TURNS: string;
  RETENTION_DAYS: string;
  /** RasQberry tester programme: the shared passphrase (Jan sets it; never logged) and the triage export token. */
  TESTER_PASSPHRASE?: string;
  TESTER_EXPORT_TOKEN?: string;
  /** The eval runner's pass for app-only contexts (header X-Eval-Pass, no Origin), in place of an App Attest token. */
  APP_EVAL_PASS?: string;
  DB: D1Database;
  RL: RateLimit;
}

export interface SiteConfig {
  origins: string[];
  /** Requests per visitor per UTC day, and for all visitors of this site together. */
  daily_visitor: number;
  daily_global: number;
  /** Contexts with a budget of their own, apart from the rest of the site (the portal's family guide). */
  budgets?: Record<string, { daily_visitor: number; daily_global: number }>;
}

/** The rate-limiting binding ([[ratelimits]] in wrangler.toml). */
export interface RateLimit {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

/** A positive integer from a [vars] string, else the fallback. */
export function intVar(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}
