import { describe, expect, it } from "vitest";

describe("isAdmin", () => {
  it("does not treat arbitrary emails as admin", async () => {
    const { isAdmin } = await import("@/lib/auth/isAdmin");
    expect(isAdmin("admin@example.com")).toBe(false);
    expect(isAdmin("  admin@example.com  ")).toBe(false);
    expect(isAdmin("other@example.com")).toBe(false);
  });

  it("always treats canonical master email as admin", async () => {
    const { isAdmin } = await import("@/lib/auth/isAdmin");
    expect(isAdmin("felipe.aguiardecarvalho@gmail.com")).toBe(true);
    expect(isAdmin("Felipe.Aguiardecarvalho@gmail.com")).toBe(true);
  });

  it("returns false for null / undefined / empty", async () => {
    const { isAdmin } = await import("@/lib/auth/isAdmin");
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
    expect(isAdmin("")).toBe(false);
  });
});

describe("isMasterAccountEmail", () => {
  it("matches the canonical master email case-insensitively", async () => {
    const { isMasterAccountEmail } = await import("@/lib/auth/master-login");
    expect(isMasterAccountEmail("FELIPE.AGUIARDECARVALHO@GMAIL.COM")).toBe(true);
    expect(isMasterAccountEmail("felipe.aguiardecarvalho@gmail.com")).toBe(true);
  });

  it("does not match unrelated emails", async () => {
    const { isMasterAccountEmail } = await import("@/lib/auth/master-login");
    expect(isMasterAccountEmail("user@test.com")).toBe(false);
  });
});
