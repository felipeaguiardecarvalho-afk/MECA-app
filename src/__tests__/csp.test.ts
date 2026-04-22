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
  NEXT_PUBLIC_IMG_CSP_HOSTS: ENV.NEXT_PUBLIC_IMG_CSP_HOSTS,
  NEXT_PUBLIC_SUPABASE_URL: ENV.NEXT_PUBLIC_SUPABASE_URL,
};

const TEST_NONCE = "abcdef0123456789_-AZ";

beforeEach(() => {
  ENV.NODE_ENV = "production";
  delete ENV.NEXT_PUBLIC_IMG_CSP_HOSTS;
  ENV.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
});

afterEach(() => {
  ENV.NODE_ENV = saved.NODE_ENV;
  if (saved.NEXT_PUBLIC_IMG_CSP_HOSTS === undefined) {
    delete ENV.NEXT_PUBLIC_IMG_CSP_HOSTS;
  } else {
    ENV.NEXT_PUBLIC_IMG_CSP_HOSTS = saved.NEXT_PUBLIC_IMG_CSP_HOSTS;
  }
  if (saved.NEXT_PUBLIC_SUPABASE_URL === undefined) {
    delete ENV.NEXT_PUBLIC_SUPABASE_URL;
  } else {
    ENV.NEXT_PUBLIC_SUPABASE_URL = saved.NEXT_PUBLIC_SUPABASE_URL;
  }
  vi.restoreAllMocks();
});

describe("CSP img-src hardening", () => {
  it("default allow-list is exactly 'self' + data:", async () => {
    const { buildImgSrc } = await loadCsp();
    expect(buildImgSrc()).toBe("img-src 'self' data:");
  });

  it("never contains a wildcard https: token", async () => {
    const { buildCsp, buildImgSrc } = await loadCsp();
    const imgSrc = buildImgSrc();
    const directives = buildCsp(TEST_NONCE)
      .split(";")
      .map((d) => d.trim());
    const imgDirective = directives.find((d) => d.startsWith("img-src "));
    expect(imgDirective).toBeDefined();
    expect(imgSrc.split(/\s+/)).not.toContain("https:");
    expect(imgSrc.split(/\s+/)).not.toContain("*");
    expect(imgSrc.split(/\s+/)).not.toContain("http:");
    expect(imgSrc.split(/\s+/)).not.toContain("blob:");
    expect(imgDirective).toBe(imgSrc);
  });

  it("appends extra https hosts from NEXT_PUBLIC_IMG_CSP_HOSTS", async () => {
    ENV.NEXT_PUBLIC_IMG_CSP_HOSTS =
      "https://cdn.meca.app, https://example.supabase.co";
    const { buildImgSrc } = await loadCsp();
    expect(buildImgSrc()).toBe(
      "img-src 'self' data: https://cdn.meca.app https://example.supabase.co",
    );
  });

  it("drops wildcard-like entries with a warning instead of merging them", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    ENV.NEXT_PUBLIC_IMG_CSP_HOSTS =
      "https: https://* http://insecure.example.com data: blob: https://ok.example.com *";
    const { buildImgSrc } = await loadCsp();
    expect(buildImgSrc()).toBe("img-src 'self' data: https://ok.example.com");
    const warnCalls = warn.mock.calls.map((c) =>
      c.map((a) => String(a)).join(" "),
    );
    for (const bad of [
      "https:",
      "https://*",
      "http://insecure.example.com",
      "data:",
      "blob:",
      "*",
    ]) {
      expect(
        warnCalls.some((line) => line.includes(bad)),
        `expected warning about "${bad}"`,
      ).toBe(true);
    }
  });

  it("preserves data: for Supabase MFA QR enrollment", async () => {
    const { buildImgSrc } = await loadCsp();
    expect(buildImgSrc().split(/\s+/)).toContain("data:");
  });
});
