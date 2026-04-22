/**
 * Upstash Redis wrapper.
 *
 * Reads `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` and returns a
 * cached REST client. If either var is missing we intentionally return `null`
 * so callers can degrade gracefully (in-memory fallback for rate limiting,
 * etc.). Never throws from module load — that would take down the whole
 * server for a non-fatal dependency.
 *
 * Both env vars are server-only (no `NEXT_PUBLIC_` prefix) — the REST token
 * must never reach the browser bundle.
 */
import { Redis } from "@upstash/redis";

type CachedRedis = {
  client: Redis | null;
  reason: string | null;
};

let cached: CachedRedis | null = null;
let warnedMissingInProd = false;

function readEnv(): { url?: string; token?: string } {
  return {
    url: process.env.UPSTASH_REDIS_REST_URL?.trim(),
    token: process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  };
}

export function isRedisConfigured(): boolean {
  const { url, token } = readEnv();
  return Boolean(url && token);
}

/**
 * Returns a cached Upstash Redis REST client, or `null` if env is missing.
 * Safe to call on the hot path — first call lazily constructs the client,
 * subsequent calls return the same instance (the Upstash client itself
 * handles HTTP pooling internally).
 */
export function getRedis(): Redis | null {
  if (cached) return cached.client;

  const { url, token } = readEnv();
  if (!url || !token) {
    if (
      process.env.NODE_ENV === "production" &&
      !warnedMissingInProd &&
      typeof window === "undefined"
    ) {
      warnedMissingInProd = true;
      console.warn(
        "[redis] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — " +
          "rate limiting falls back to in-memory (per-instance only). " +
          "Provision Upstash or an equivalent Redis for production.",
      );
    }
    cached = { client: null, reason: "missing_env" };
    return null;
  }

  try {
    const client = new Redis({ url, token });
    cached = { client, reason: null };
    return client;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[redis] Failed to build Upstash client:", message);
    cached = { client: null, reason: message };
    return null;
  }
}

/** Test-only: drop the memoised client so env changes take effect. */
export function resetRedisClientForTesting(): void {
  cached = null;
  warnedMissingInProd = false;
}
