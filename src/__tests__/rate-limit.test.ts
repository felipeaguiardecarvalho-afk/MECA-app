import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the redis module BEFORE importing the rate-limit module, so the
// module-level `getRedis` reference picks up the mock (Vitest hoists
// `vi.mock` calls above imports automatically).
const getRedisMock = vi.fn();
vi.mock("@/lib/redis", () => ({
  getRedis: () => getRedisMock(),
  isRedisConfigured: () => Boolean(getRedisMock()),
  resetRedisClientForTesting: () => {
    /* no-op in tests; mock returns what tests configure */
  },
}));

const {
  rateLimitExceeded,
  jsonRateLimitOrNull,
  aiPremiumRateLimitOrNull,
  resetMemoryRateLimitStoreForTesting,
  getClientIp,
  rateLimitKey,
  rateLimitSubject,
} = await import("@/lib/rate-limit");

type FakeRedis = {
  incr: (key: string) => Promise<number>;
  pexpire: (key: string, ms: number) => Promise<number>;
};

function makeFakeRedis(opts: { failOn?: "incr" | "pexpire" } = {}): {
  redis: FakeRedis;
  counters: Map<string, number>;
  expires: Map<string, number>;
} {
  const counters = new Map<string, number>();
  const expires = new Map<string, number>();
  const redis: FakeRedis = {
    incr: vi.fn(async (key: string): Promise<number> => {
      if (opts.failOn === "incr") throw new Error("redis down");
      const next = (counters.get(key) ?? 0) + 1;
      counters.set(key, next);
      return next;
    }),
    pexpire: vi.fn(async (key: string, ms: number): Promise<number> => {
      if (opts.failOn === "pexpire") throw new Error("pexpire failed");
      expires.set(key, ms);
      return 1;
    }),
  };
  return { redis, counters, expires };
}

beforeEach(() => {
  resetMemoryRateLimitStoreForTesting();
  getRedisMock.mockReset();
});

afterEach(() => {
  resetMemoryRateLimitStoreForTesting();
  vi.unstubAllEnvs();
});

describe("getClientIp", () => {
  it("ignores x-forwarded-for when TRUST_PROXY is unset (spoofing-safe)", () => {
    vi.stubEnv("TRUST_PROXY", "");
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2" },
    });
    expect(getClientIp(req)).toBe("unknown");
  });

  it("ignores x-real-ip when TRUST_PROXY is unset", () => {
    vi.stubEnv("TRUST_PROXY", "0");
    const req = new Request("http://x", { headers: { "x-real-ip": "9.9.9.9" } });
    expect(getClientIp(req)).toBe("unknown");
  });

  it("uses the first entry of x-forwarded-for when TRUST_PROXY=true", () => {
    vi.stubEnv("TRUST_PROXY", "true");
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2" },
    });
    expect(getClientIp(req)).toBe("1.1.1.1");
  });

  it("falls back to x-real-ip when TRUST_PROXY=true and no x-forwarded-for", () => {
    vi.stubEnv("TRUST_PROXY", "1");
    const req = new Request("http://x", { headers: { "x-real-ip": "9.9.9.9" } });
    expect(getClientIp(req)).toBe("9.9.9.9");
  });

  it("returns 'unknown' when TRUST_PROXY=true but no forwarded headers", () => {
    vi.stubEnv("TRUST_PROXY", "true");
    expect(getClientIp(new Request("http://x"))).toBe("unknown");
  });

  it("returns 'unknown' when no headers and TRUST_PROXY off", () => {
    vi.stubEnv("TRUST_PROXY", "");
    expect(getClientIp(new Request("http://x"))).toBe("unknown");
  });
});

describe("rateLimitSubject", () => {
  it("uses user id when present", () => {
    vi.stubEnv("TRUST_PROXY", "");
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "8.8.8.8" },
    });
    expect(rateLimitSubject("user-abc", req)).toBe("user-abc");
  });

  it("falls back to getClientIp when user id is missing", () => {
    vi.stubEnv("TRUST_PROXY", "true");
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "8.8.8.8" },
    });
    expect(rateLimitSubject(null, req)).toBe("8.8.8.8");
  });
});

describe("rateLimitExceeded — memory fallback (no Redis)", () => {
  beforeEach(() => {
    getRedisMock.mockReturnValue(null);
  });

  it("allows up to the limit, blocks the next hit", async () => {
    const key = rateLimitKey("test/route", "1.1.1.1");
    for (let i = 1; i <= 3; i++) {
      expect(await rateLimitExceeded(key, 3)).toBe(false);
    }
    expect(await rateLimitExceeded(key, 3)).toBe(true);
  });

  it("keeps separate counters per IP", async () => {
    const k1 = rateLimitKey("test/route", "1.1.1.1");
    const k2 = rateLimitKey("test/route", "2.2.2.2");
    for (let i = 0; i < 10; i++) await rateLimitExceeded(k1, 2);
    expect(await rateLimitExceeded(k2, 2)).toBe(false);
  });
});

describe("rateLimitExceeded — Redis primary path", () => {
  it("uses INCR and sets PEXPIRE on the first hit only", async () => {
    const { redis, expires } = makeFakeRedis();
    getRedisMock.mockReturnValue(redis);

    const key = rateLimitKey("test/route", "3.3.3.3");
    expect(await rateLimitExceeded(key, 5)).toBe(false);
    expect(await rateLimitExceeded(key, 5)).toBe(false);
    expect(await rateLimitExceeded(key, 5)).toBe(false);

    expect(redis.incr).toHaveBeenCalledTimes(3);
    expect(redis.pexpire).toHaveBeenCalledTimes(1);
    expect(expires.get("rl:test/route:3.3.3.3")).toBe(60_000);
  });

  it("returns true once the Redis counter exceeds the limit", async () => {
    const { redis } = makeFakeRedis();
    getRedisMock.mockReturnValue(redis);

    const key = rateLimitKey("test/route", "4.4.4.4");
    for (let i = 1; i <= 2; i++) {
      expect(await rateLimitExceeded(key, 2)).toBe(false);
    }
    expect(await rateLimitExceeded(key, 2)).toBe(true);
    expect(await rateLimitExceeded(key, 2)).toBe(true);
  });

  it("falls back to in-memory counter if Redis throws", async () => {
    const { redis } = makeFakeRedis({ failOn: "incr" });
    getRedisMock.mockReturnValue(redis);

    const key = rateLimitKey("test/route", "5.5.5.5");
    // Memory store is independent — first hit is allowed, subsequent hits
    // still respected after Redis fails.
    for (let i = 1; i <= 2; i++) {
      expect(await rateLimitExceeded(key, 2)).toBe(false);
    }
    expect(await rateLimitExceeded(key, 2)).toBe(true);
  });
});

describe("jsonRateLimitOrNull", () => {
  beforeEach(() => {
    getRedisMock.mockReturnValue(null);
  });

  it("returns null when under the limit (by userId, ignores spoofed XFF)", async () => {
    vi.stubEnv("TRUST_PROXY", "");
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "6.6.6.6" },
    });
    expect(
      await jsonRateLimitOrNull(req, "test/unused", {
        limit: 3,
        userId: "u-fixed",
      }),
    ).toBeNull();
  });

  it("returns a 429 NextResponse with Retry-After when exceeded", async () => {
    vi.stubEnv("TRUST_PROXY", "");
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "7.7.7.7" },
    });
    for (let i = 0; i < 3; i++) {
      await jsonRateLimitOrNull(req, "test/limited", {
        limit: 3,
        userId: "u-seven",
      });
    }
    const res = await jsonRateLimitOrNull(req, "test/limited", {
      limit: 3,
      userId: "u-seven",
    });
    expect(res).not.toBeNull();
    expect(res?.status).toBe(429);
    expect(res?.headers.get("Retry-After")).toBe("60");
    const body = await res?.json();
    expect(body.error).toBe("rate_limited");
  });

  it("still accepts numeric limit as third argument", async () => {
    vi.stubEnv("TRUST_PROXY", "true");
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "10.0.0.1" },
    });
    expect(await jsonRateLimitOrNull(req, "test/legacy-limit", 5)).toBeNull();
  });
});

describe("aiPremiumRateLimitOrNull", () => {
  beforeEach(() => {
    getRedisMock.mockReturnValue(null);
  });

  it("returns Service temporarily unavailable when global daily cap is exceeded", async () => {
    resetMemoryRateLimitStoreForTesting();
    const globalKey = "global:ai:requests";
    for (let i = 0; i < 1000; i++) {
      expect(await rateLimitExceeded(globalKey, 1000, 86_400_000)).toBe(false);
    }
    const uid = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
    const res = await aiPremiumRateLimitOrNull(uid);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(429);
    expect(res?.headers.get("Retry-After")).toBe("86400");
    expect(await res?.text()).toBe("Service temporarily unavailable");
  });

  it("allows 5 calls per minute then returns 429 plain text", async () => {
    const uid = "11111111-1111-1111-1111-111111111111";
    for (let i = 0; i < 5; i++) {
      expect(await aiPremiumRateLimitOrNull(uid)).toBeNull();
    }
    const res = await aiPremiumRateLimitOrNull(uid);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(429);
    expect(res?.headers.get("Retry-After")).toBe("60");
    expect(await res?.text()).toBe("Rate limit exceeded");
  });

  it("uses separate buckets per user id", async () => {
    const a = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const b = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    for (let i = 0; i < 5; i++) {
      expect(await aiPremiumRateLimitOrNull(a)).toBeNull();
    }
    expect(await aiPremiumRateLimitOrNull(a)).not.toBeNull();
    expect(await aiPremiumRateLimitOrNull(b)).toBeNull();
  });

  it("returns daily Retry-After when the day window is already at 20", async () => {
    const uid = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const dayKey = `ai:${uid}:day`;
    for (let i = 0; i < 20; i++) {
      expect(await rateLimitExceeded(dayKey, 20, 86_400_000)).toBe(false);
    }
    const res = await aiPremiumRateLimitOrNull(uid);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(429);
    expect(res?.headers.get("Retry-After")).toBe("86400");
    expect(await res?.text()).toBe("Rate limit exceeded");
  });
});
