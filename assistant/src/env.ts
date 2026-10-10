export interface Env {
  ANTHROPIC_API_KEY: string;
  ALLOWED_ORIGINS: string;
  MODEL: string;
  MAX_TOKENS: string;
  MAX_HISTORY_TURNS: string;
  DAILY_VISITOR_LIMIT: string;
  DAILY_GLOBAL_LIMIT: string;
  RETENTION_DAYS: string;
  DB: D1Database;
  RL: RateLimit;
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
