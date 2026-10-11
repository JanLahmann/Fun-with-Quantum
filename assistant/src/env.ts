export interface Env {
  ANTHROPIC_API_KEY: string;
  /** Per site: who may embed the widget, and its daily budgets ([vars.SITES.<site>] in wrangler.toml). */
  SITES: Record<string, SiteConfig>;
  MODEL: string;
  MAX_TOKENS: string;
  MAX_HISTORY_TURNS: string;
  RETENTION_DAYS: string;
  DB: D1Database;
  RL: RateLimit;
}

export interface SiteConfig {
  origins: string[];
  /** Requests per visitor per UTC day, and for all visitors of this site together. */
  daily_visitor: number;
  daily_global: number;
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
