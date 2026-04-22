import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/rate-limit", () => ({
  jsonRateLimitOrNull: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/email/send-magic-link", () => ({
  sendMagicLinkEmail: vi.fn().mockResolvedValue({ ok: false, error: "skip" }),
}));

const createServiceRoleClientMock = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createServiceRoleClient: () => createServiceRoleClientMock(),
}));

const { POST: loginIntentPost } = await import(
  "@/app/api/auth/login-intent/route"
);
const { handleServiceMagicLinkPost } = await import(
  "@/lib/auth/service-magic-link"
);

function asNextRequest(req: Request): NextRequest {
  return req as unknown as NextRequest;
}

describe("POST /api/auth/login-intent — anti-enumeration", () => {
  beforeEach(() => {
    createServiceRoleClientMock.mockReset();
    createServiceRoleClientMock.mockReturnValue(null);
  });

  it("returns 200 { success: true } for invalid JSON", async () => {
    const req = new Request("http://localhost/api/auth/login-intent", {
      method: "POST",
      body: "not-json{{{",
    });
    const res = await loginIntentPost(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });

  it("returns 200 { success: true } for invalid email shape", async () => {
    const req = new Request("http://localhost/api/auth/login-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    const res = await loginIntentPost(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });

  it("returns 200 { success: true } when RPC returns error", async () => {
    createServiceRoleClientMock.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "rpc_failed" },
      }),
    });
    const req = new Request("http://localhost/api/auth/login-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com" }),
    });
    const res = await loginIntentPost(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });

  it("returns 200 { success: true } when RPC succeeds", async () => {
    createServiceRoleClientMock.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({ data: "returning_done", error: null }),
    });
    const req = new Request("http://localhost/api/auth/login-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@example.com" }),
    });
    const res = await loginIntentPost(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });
});

describe("handleServiceMagicLinkPost — anti-enumeration", () => {
  beforeEach(() => {
    createServiceRoleClientMock.mockReset();
  });

  it("returns 200 { success: true } when service role is missing", async () => {
    createServiceRoleClientMock.mockReturnValue(null);
    const req = new Request("http://localhost/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "any@example.com", next: "/" }),
    });
    const res = await handleServiceMagicLinkPost(asNextRequest(req));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });

  it("returns 200 { success: true } when generateLink fails", async () => {
    createServiceRoleClientMock.mockReturnValue({
      auth: {
        admin: {
          generateLink: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "User not found" },
          }),
        },
      },
    });
    const req = new Request("http://localhost/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ghost@example.com", next: "/" }),
    });
    const res = await handleServiceMagicLinkPost(asNextRequest(req));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });
});
