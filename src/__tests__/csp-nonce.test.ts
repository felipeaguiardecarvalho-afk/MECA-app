import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type EnvAlias = Record<string, string | undefined>;
const ENV = process.env as unknown as EnvAlias;

type CspModule = typeof import("@/lib/security/csp");

async function loadCsp(): Promise<CspModule> {
  vi.resetModules();
  return (await import("@/lib/security/csp")) as CspModule;
}

const saved = {
  NODE_ENV: ENV.NODE_ENV,
  NEXT_PUBLIC_SUPABASE_URL: ENV.NEXT_PUBLIC_SUPABASE_URL,
};

const NONCE = "abcdef0123456789_-AZ";

function directives(csp: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const raw of csp.split(";")) {
    const d = raw.trim();
    if (!d) continue;
    const [name, ...tokens] = d.split(/\s+/);
    map.set(name.toLowerCase(), tokens);
  }
  return map;
}

beforeEach(() => {
  ENV.NODE_ENV = "production";
  ENV.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
});

afterEach(() => {
  ENV.NODE_ENV = saved.NODE_ENV;
  if (saved.NEXT_PUBLIC_SUPABASE_URL === undefined) {
    delete ENV.NEXT_PUBLIC_SUPABASE_URL;
  } else {
    ENV.NEXT_PUBLIC_SUPABASE_URL = saved.NEXT_PUBLIC_SUPABASE_URL;
  }
  vi.restoreAllMocks();
});

describe("CSP nonce-based styles", () => {
  it("generateNonce produces a base64url string with ≥128 bits of entropy", async () => {
    const { generateNonce } = await loadCsp();
    const n = generateNonce();
    expect(n).toMatch(/^[A-Za-z0-9_-]+$/);
    // 16 random bytes base64url-encoded without padding → 22 chars.
    expect(n.length).toBeGreaterThanOrEqual(22);
    // Uniqueness across 200 draws (probabilistic, collision prob ≈ 0).
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add((await loadCsp()).generateNonce());
    expect(seen.size).toBe(200);
  });

  it("buildCsp embeds the nonce in script-src and style-src-elem (prod)", async () => {
    const { buildCsp } = await loadCsp();
    const csp = buildCsp(NONCE, { isProd: true });
    const d = directives(csp);
    expect(d.get("script-src")).toContain(`'nonce-${NONCE}'`);
    expect(d.get("style-src")).toContain(`'nonce-${NONCE}'`);
    expect(d.get("style-src-elem")).toContain(`'nonce-${NONCE}'`);
  });

  it("production style-src-elem has NO 'unsafe-inline'", async () => {
    const { buildCsp } = await loadCsp();
    const csp = buildCsp(NONCE, { isProd: true });
    const d = directives(csp);
    expect(d.get("style-src-elem")).not.toContain("'unsafe-inline'");
    expect(d.get("style-src")).not.toContain("'unsafe-inline'");
    // script-src also must not carry unsafe-inline / unsafe-eval in prod.
    expect(d.get("script-src")).not.toContain("'unsafe-inline'");
    expect(d.get("script-src")).not.toContain("'unsafe-eval'");
  });

  it("style-src-attr keeps 'unsafe-inline' (React style={{}} props)", async () => {
    const { buildCsp } = await loadCsp();
    const d = directives(buildCsp(NONCE, { isProd: true }));
    // CSP L3 split: style attributes stay permissive; <style> elements don't.
    expect(d.get("style-src-attr")).toEqual(["'unsafe-inline'"]);
  });

  it("development still carries the nonce AND keeps unsafe-inline for HMR", async () => {
    const { buildCsp } = await loadCsp();
    const d = directives(buildCsp(NONCE, { isProd: false }));
    expect(d.get("script-src")).toContain(`'nonce-${NONCE}'`);
    expect(d.get("script-src")).toContain("'unsafe-inline'");
    expect(d.get("script-src")).toContain("'unsafe-eval'");
    expect(d.get("style-src-elem")).toContain(`'nonce-${NONCE}'`);
    expect(d.get("style-src-elem")).toContain("'unsafe-inline'");
  });

  it("production emits upgrade-insecure-requests; dev does not", async () => {
    const { buildCsp } = await loadCsp();
    expect(buildCsp(NONCE, { isProd: true })).toContain(
      "upgrade-insecure-requests",
    );
    expect(buildCsp(NONCE, { isProd: false })).not.toContain(
      "upgrade-insecure-requests",
    );
  });

  it("frame-ancestors, object-src and base-uri stay locked down", async () => {
    const { buildCsp } = await loadCsp();
    const d = directives(buildCsp(NONCE, { isProd: true }));
    expect(d.get("frame-ancestors")).toEqual(["'none'"]);
    expect(d.get("frame-src")).toEqual(["'none'"]);
    expect(d.get("object-src")).toEqual(["'none'"]);
    expect(d.get("base-uri")).toEqual(["'self'"]);
    expect(d.get("form-action")).toEqual(["'self'"]);
  });

  it("connect-src uses the concrete Supabase host (no wildcard) when env is set", async () => {
    const { buildCsp } = await loadCsp();
    const d = directives(buildCsp(NONCE, { isProd: true }));
    const tokens = d.get("connect-src") ?? [];
    expect(tokens).toContain("'self'");
    expect(tokens).toContain("https://example.supabase.co");
    expect(tokens).toContain("wss://example.supabase.co");
    expect(tokens).not.toContain("https://*.supabase.co");
  });

  it("refuses to emit CSP with a malformed nonce", async () => {
    const { buildCsp } = await loadCsp();
    for (const bad of [
      "",
      "short",
      "has space",
      "'nonce-injection'",
      "invalid\nchar",
      "a".repeat(200),
    ]) {
      expect(() => buildCsp(bad)).toThrow(/invalid nonce/i);
    }
  });

  it("next.config.ts no longer emits a static Content-Security-Policy header", async () => {
    const { promises: fs } = await import("node:fs");
    const path = await import("node:path");
    const text = await fs.readFile(
      path.resolve(__dirname, "..", "..", "next.config.ts"),
      "utf8",
    );
    // The ONLY legit occurrences of "Content-Security-Policy" must be in comments.
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      if (!line.includes("Content-Security-Policy")) continue;
      const trimmed = line.trim();
      const isComment =
        trimmed.startsWith("//") ||
        trimmed.startsWith("*") ||
        trimmed.startsWith("/*");
      expect(
        isComment,
        `next.config.ts still sets CSP statically: ${line}`,
      ).toBe(true);
    }
  });

  it("middleware forwards the nonce via x-nonce and attaches the CSP header", async () => {
    const { promises: fs } = await import("node:fs");
    const path = await import("node:path");
    const mw = await fs.readFile(
      path.resolve(__dirname, "..", "middleware.ts"),
      "utf8",
    );
    expect(mw).toMatch(/generateNonce\(\)/);
    expect(mw).toMatch(/request\.headers\.set\(["']x-nonce["'],\s*nonce\)/);
    expect(mw).toMatch(
      /response\.headers\.set\(\s*["']content-security-policy["'],\s*buildCsp\(nonce\)\s*\)/,
    );
  });
});
