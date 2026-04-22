/**
 * Fixed-window rate limiter for API routes.
 *
 * Primary store: Upstash Redis (shared across serverless instances).
 * Fallback:      in-memory Map (per-process; good for local dev and a last
 *                resort if Redis is momentarily unreachable).
 *
 * Client IP: `X-Forwarded-For` / `X-Real-IP` are used **only** when
 * `TRUST_PROXY=true` (or `1`), i.e. behind a reverse proxy that sets or
 * overwrites them correctly. Otherwise they are ignored (spoofing bypass).
 * Without a trusted forwarded chain, the key falls back to `"unknown"` for
 * anonymous IP-based limits — set `TRUST_PROXY` in production behind Vercel,
 * nginx, ALB, etc.
 *
 * Algorithm: one counter key per `(route, subject, window)` with a server-side
 * TTL. `INCR` on every hit; when the returned count reaches 1 we set
 * `PEXPIRE` on the same key so it auto-expires at `windowMs`. This is the
 * canonical pattern for Redis-backed fixed windows and is atomic enough for
 * our use (login intent, magic link, score submission).
 *
 * Redis failure mode: any network/SDK error falls back to the in-memory
 * counter rather than 500-ing the request. That preserves availability at
 * the cost of briefly allowing more hits if Redis flaps — acceptable for
 * the endpoints we protect (none of them are money/abuse-critical beyond
 * e-mail flooding, which Supabase rate-limits separately).
 */

import { logger, maskIp } from "@/lib/logger";
import { getRedis } from "@/lib/redis";
import { NextResponse } from "next/server";

const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 10;

type Bucket = { count: number; resetAt: number };

const memoryStore = new Map<string, Bucket>();

/** True when deployment is behind a proxy that correctly sets forwarded headers. */
export function isTrustProxy(): boolean {
  const v = process.env.TRUST_PROXY?.trim().toLowerCase();
  return v === "true" || v === "1";
}

function firstForwardedClient(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first || null;
}

/**
 * Resolves a client IP for rate limiting. Does **not** trust `X-Forwarded-For`
 * or `X-Real-IP` unless `TRUST_PROXY` is enabled (prevents header spoofing).
 * Standard `Request` has no `socket` in the App Router — when nothing trusted
 * is available, returns `"unknown"`.
 */
export function getClientIp(request: Request): string {
  if (isTrustProxy()) {
    const fromXff = firstForwardedClient(request.headers.get("x-forwarded-for"));
    if (fromXff) return fromXff;
    const fromReal = request.headers.get("x-real-ip")?.trim();
    if (fromReal) return fromReal;
    return "unknown";
  }

  return "unknown";
}

/**
 * Rate-limit key segment: authenticated users by id, anonymous by client IP
 * (when trusted proxy or platform provides it) or `"unknown"`.
 */
export function rateLimitSubject(
  userId: string | null | undefined,
  request: Request,
): string {
  const id = userId?.trim();
  if (id) return id;
  return getClientIp(request);
}

export function rateLimitKey(route: string, subject: string): string {
  return `${route}:${subject}`;
}

function memoryIncrement(key: string, windowMs: number): Bucket {
  const now = Date.now();
  let bucket = memoryStore.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    memoryStore.set(key, bucket);
  }
  bucket.count += 1;
  return bucket;
}

async function redisIncrement(
  redis: NonNullable<ReturnType<typeof getRedis>>,
  key: string,
  windowMs: number,
): Promise<number> {
  const prefixed = `rl:${key}`;
  const count = await redis.incr(prefixed);
  if (count === 1) {
    // Only set the TTL on the first hit of the window so subsequent INCRs
    // keep the original expiry. Upstash returns the integer result of INCR,
    // so this comparison is reliable.
    await redis.pexpire(prefixed, windowMs);
  }
  return count;
}

/**
 * Returns true if `key` is over the limit for the current window.
 * Uses Redis when configured, memory otherwise. Never throws.
 */
export async function rateLimitExceeded(
  key: string,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = WINDOW_MS,
): Promise<boolean> {
  const redis = getRedis();
  if (redis) {
    try {
      const count = await redisIncrement(redis, key, windowMs);
      return count > limit;
    } catch (err) {
      // Key format is `route:subject`; mask the tail before logging so the
      // error message doesn't become a PII source in hosting provider logs.
      const [route, ...rest] = key.split(":");
      const maskedKey = `${route}:${maskIp(rest.join(":"))}`;
      logger.warn(
        `[rate-limit] Redis error for key="${maskedKey}". Falling back to memory.`,
        err,
      );
      // Fall through to memory fallback.
    }
  }
  const bucket = memoryIncrement(key, windowMs);
  return bucket.count > limit;
}

export type JsonRateLimitOptions = {
  limit?: number;
  /** When set, rate limits by user id instead of IP. */
  userId?: string | null;
};

function normalizeJsonRateLimitArgs(
  limitOrOpts?: number | JsonRateLimitOptions,
): { limit: number; userId?: string | null } {
  if (limitOrOpts === undefined) return { limit: DEFAULT_LIMIT };
  if (typeof limitOrOpts === "number") return { limit: limitOrOpts };
  return {
    limit: limitOrOpts.limit ?? DEFAULT_LIMIT,
    userId: limitOrOpts.userId,
  };
}

/**
 * Returns 429 JSON if the client exceeded the limit; otherwise null.
 * Await this in route handlers:
 *   const limited = await jsonRateLimitOrNull(request, "api/route");
 *   if (limited) return limited;
 *
 * Optional `userId`: when the caller already resolved the session, limits by
 * user id; otherwise uses {@link getClientIp} (respecting `TRUST_PROXY`).
 */
export async function jsonRateLimitOrNull(
  request: Request,
  route: string,
  limitOrOpts?: number | JsonRateLimitOptions,
): Promise<NextResponse | null> {
  const { limit, userId } = normalizeJsonRateLimitArgs(limitOrOpts);
  const subject = rateLimitSubject(userId, request);
  const key = rateLimitKey(route, subject);
  if (await rateLimitExceeded(key, limit)) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }
  return null;
}

/** POST /api/diagnostic/premium — Claude API cost control (global + per user). */
const AI_PREMIUM_MINUTE_MS = 60_000;
const AI_PREMIUM_MINUTE_LIMIT = 5;
const AI_PREMIUM_DAY_MS = 86_400_000;
const AI_PREMIUM_DAY_LIMIT = 20;

/** Shared across all users; Redis key becomes `rl:global:ai:requests`. */
const AI_PREMIUM_GLOBAL_DAY_KEY = "global:ai:requests";
const AI_PREMIUM_GLOBAL_DAY_LIMIT = 1000;

function aiPremiumRedisKey(userId: string, window: "minute" | "day"): string {
  return `ai:${userId}:${window}`;
}

/**
 * Fixed windows on Upstash (fallback: memory):
 *   1. Global: 1000/day for all premium AI calls (`global:ai:requests`).
 *   2. Per subject: 5/min and 20/day (`ai:<subject>:minute` / `:day`).
 *
 * If the global cap is exceeded, returns 429 plain text
 * `Service temporarily unavailable` (per-user checks are skipped).
 */
export async function aiPremiumRateLimitOrNull(
  subject: string,
): Promise<NextResponse | null> {
  if (
    await rateLimitExceeded(
      AI_PREMIUM_GLOBAL_DAY_KEY,
      AI_PREMIUM_GLOBAL_DAY_LIMIT,
      AI_PREMIUM_DAY_MS,
    )
  ) {
    return new NextResponse("Service temporarily unavailable", {
      status: 429,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Retry-After": "86400",
      },
    });
  }

  if (
    await rateLimitExceeded(
      aiPremiumRedisKey(subject, "minute"),
      AI_PREMIUM_MINUTE_LIMIT,
      AI_PREMIUM_MINUTE_MS,
    )
  ) {
    return new NextResponse("Rate limit exceeded", {
      status: 429,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Retry-After": "60",
      },
    });
  }
  if (
    await rateLimitExceeded(
      aiPremiumRedisKey(subject, "day"),
      AI_PREMIUM_DAY_LIMIT,
      AI_PREMIUM_DAY_MS,
    )
  ) {
    return new NextResponse("Rate limit exceeded", {
      status: 429,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Retry-After": "86400",
      },
    });
  }
  return null;
}

/** Test-only: drop in-memory counters so each test starts fresh. */
export function resetMemoryRateLimitStoreForTesting(): void {
  memoryStore.clear();
}
