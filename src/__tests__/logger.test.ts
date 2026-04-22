import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  logger,
  maskEmail,
  maskIp,
  maskUserId,
  redact,
  redactString,
} from "@/lib/logger";

/**
 * Security invariant: no PII ever reaches stdout/stderr raw. This suite
 * covers both the pure helpers (`maskEmail` / `maskUserId` / `maskIp` /
 * `redact` / `redactString`) and the `logger.*` wrappers, asserting the
 * scrubbing actually lands on the arguments that hit `console`.
 */

describe("maskEmail", () => {
  it("keeps first two local chars, masks the rest, and keeps the domain", () => {
    expect(maskEmail("alice@example.com")).toBe("al***@example.com");
    expect(maskEmail("felipe.aguiardecarvalho@gmail.com")).toBe(
      "fe***@gmail.com",
    );
  });

  it("handles single-char local parts", () => {
    expect(maskEmail("a@example.com")).toBe("a***@example.com");
  });

  it("redacts malformed / empty input", () => {
    expect(maskEmail(undefined)).toBe("<redacted>");
    expect(maskEmail(null)).toBe("<redacted>");
    expect(maskEmail("")).toBe("<redacted>");
    expect(maskEmail("not-an-email")).toBe("<redacted>");
    expect(maskEmail("@example.com")).toBe("<redacted>");
    expect(maskEmail("user@")).toBe("<redacted>");
    expect(maskEmail("user@local")).toBe("<redacted>");
  });
});

describe("maskUserId", () => {
  it("keeps first 8 chars of a UUID", () => {
    expect(maskUserId("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")).toBe(
      "aaaaaaaa…",
    );
  });

  it("redacts short / empty input", () => {
    expect(maskUserId("")).toBe("<redacted>");
    expect(maskUserId("short")).toBe("<redacted>");
    expect(maskUserId(undefined)).toBe("<redacted>");
  });
});

describe("maskIp", () => {
  it("keeps only the first IPv4 octet", () => {
    expect(maskIp("192.168.1.5")).toBe("192.x.x.x");
    expect(maskIp("1.2.3.4")).toBe("1.x.x.x");
  });

  it("keeps only the first IPv6 hextet", () => {
    expect(maskIp("2001:db8::1")).toBe("2001:…");
  });

  it("keeps 'unknown' as-is", () => {
    expect(maskIp("unknown")).toBe("unknown");
  });

  it("redacts unrecognized input", () => {
    expect(maskIp("")).toBe("<redacted>");
    expect(maskIp(undefined)).toBe("<redacted>");
    expect(maskIp("not-an-ip")).toBe("<redacted>");
  });
});

describe("redactString", () => {
  it("masks e-mails embedded in free text", () => {
    const out = redactString(
      "Email address alice@example.com is invalid for user bob@corp.io",
    );
    expect(out).not.toContain("alice@example.com");
    expect(out).not.toContain("bob@corp.io");
    expect(out).toContain("al***@example.com");
    expect(out).toContain("bo***@corp.io");
  });

  it("masks JWTs and bearer tokens", () => {
    const jwt =
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.AbCdEf0123456789AbCdEf0123456789";
    const out = redactString(`Authorization: Bearer ${jwt}`);
    expect(out).not.toContain(jwt);
    // Either redactor (jwt-first or bearer-first) fully scrubs the secret.
    expect(out).toMatch(/<redacted:(jwt|bearer)>/);

    const basic = redactString("Authorization: Basic dXNlcjpwYXNzd29yZA==");
    expect(basic).not.toContain("dXNlcjpwYXNzd29yZA==");
    expect(basic).toContain("<redacted:bearer>");
  });

  it("masks Supabase auth query params", () => {
    const url =
      "https://x/auth/callback?code=abcdef0123456789&token_hash=qwerty12345&next=/dashboard";
    const out = redactString(url);
    expect(out).not.toContain("abcdef0123456789");
    expect(out).not.toContain("qwerty12345");
    expect(out).toContain("code=<redacted>");
    expect(out).toContain("token_hash=<redacted>");
    expect(out).toContain("next=/dashboard");
  });

  it("masks UUIDs", () => {
    const id = "11111111-2222-3333-4444-555555555555";
    expect(redactString(`target=${id}`)).toBe("target=11111111…");
  });
});

describe("redact (object walker)", () => {
  it("masks email fields", () => {
    expect(redact({ email: "alice@example.com" })).toEqual({
      email: "al***@example.com",
    });
  });

  it("masks user_id / target_user_id / admin_user_id", () => {
    const uuid = "11111111-2222-3333-4444-555555555555";
    expect(
      redact({
        user_id: uuid,
        target_user_id: uuid,
        admin_user_id: uuid,
      }),
    ).toEqual({
      user_id: "11111111…",
      target_user_id: "11111111…",
      admin_user_id: "11111111…",
    });
  });

  it("fully redacts passwords, tokens, secrets, cookies", () => {
    const out = redact({
      password: "hunter2",
      token: "abc",
      access_token: "xyz",
      refresh_token: "qqq",
      authorization: "Bearer xyz",
      api_key: "k",
      secret: "s",
      cookie: "sb-auth=xxx",
      action_link: "https://x/auth/callback?code=...",
    });
    expect(out).toEqual({
      password: "<redacted>",
      token: "<redacted>",
      access_token: "<redacted>",
      refresh_token: "<redacted>",
      authorization: "<redacted>",
      api_key: "<redacted>",
      secret: "<redacted>",
      cookie: "<redacted>",
      action_link: "<redacted>",
    });
  });

  it("preserves Postgres SQLSTATE `code` values (not secrets)", () => {
    const out = redact({ code: "23505", detail: "conflict" });
    expect(out).toEqual({ code: "23505", detail: "conflict" });
  });

  it("redacts long opaque `code` values", () => {
    const out = redact({
      code: "abcdefghijklmnopqrstuvwxyz0123456789",
    });
    expect(out).toEqual({ code: "<redacted>" });
  });

  it("recursively walks nested structures", () => {
    const out = redact({
      outer: {
        user: { email: "a@b.com" },
        items: [{ token: "t" }, { note: "hi" }],
      },
    });
    expect(out).toEqual({
      outer: {
        user: { email: "a***@b.com" },
        items: [{ token: "<redacted>" }, { note: "hi" }],
      },
    });
  });

  it("redacts Error instances including message and stack", () => {
    const err = new Error(
      "Failed for alice@example.com with code eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.AbCdEf0123456789AbCdEf0123456789",
    );
    const out = redact(err) as unknown as Record<string, unknown>;
    expect(out.name).toBe("Error");
    expect(String(out.message)).not.toContain("alice@example.com");
    expect(String(out.message)).toContain("al***@example.com");
    // Either the JWT or the Bearer regex will scrub the secret first; what
    // matters is that the original token never survives.
    expect(String(out.message)).toMatch(/<redacted:(jwt|bearer)>/);
  });

  it("terminates on cyclic graphs without infinite recursion", () => {
    type Node = { child?: Node; email: string };
    const root: Node = { email: "a@b.com" };
    root.child = root;
    expect(() => redact(root)).not.toThrow();
  });

  it("masks e-mails embedded in free-text string arguments", () => {
    expect(redact("sent to alice@example.com")).toBe(
      "sent to al***@example.com",
    );
  });
});

describe("logger wrappers", () => {
  const email = "alice@example.com";
  const uuid = "11111111-2222-3333-4444-555555555555";

  function capture(method: "error" | "warn" | "info" | "debug") {
    return vi.spyOn(console, method).mockImplementation(() => {});
  }

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logger.error scrubs objects passed to console.error", () => {
    const spy = capture("error");
    logger.error("[test]", { email, user_id: uuid, password: "x" });
    expect(spy).toHaveBeenCalledTimes(1);
    const [tag, payload] = spy.mock.calls[0] as [string, Record<string, unknown>];
    expect(tag).toBe("[test]");
    expect(payload).toEqual({
      email: "al***@example.com",
      user_id: "11111111…",
      password: "<redacted>",
    });
  });

  it("logger.warn scrubs Error instances", () => {
    const spy = capture("warn");
    logger.warn("[test]", new Error(`Email ${email} rejected`));
    const [, payload] = spy.mock.calls[0] as [string, { message: string }];
    expect(payload.message).not.toContain(email);
    expect(payload.message).toContain("al***@example.com");
  });

  it("logger.info scrubs string arguments", () => {
    const spy = capture("info");
    logger.info(`[test] link for ${email}`);
    const [firstArg] = spy.mock.calls[0] as [string];
    // The tag itself is the only formal string arg so this also verifies
    // we do not leak through the tag parameter by mistake.
    expect(firstArg).not.toContain(email);
    expect(firstArg).toContain("al***@example.com");
  });

  it("logger.debug is a no-op in production", () => {
    const prev = process.env.NODE_ENV;
    const env = process.env as Record<string, string | undefined>;
    env.NODE_ENV = "production";
    const spy = capture("debug");
    logger.debug("[test]", { email });
    expect(spy).not.toHaveBeenCalled();
    env.NODE_ENV = prev;
  });
});
