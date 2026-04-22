/**
 * Unit tests for src/lib/admin-audit-log.ts.
 *
 * The audit logger has two sinks (console + Postgres) and one strict
 * invariant: it must never throw, regardless of how the service-role client
 * misbehaves. These tests pin down the insert payload shape and verify the
 * fail-open contract.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockClient = {
  from: ReturnType<typeof vi.fn>;
  __insert: ReturnType<typeof vi.fn>;
};

function makeClient(insertResult: { error: unknown } = { error: null }): MockClient {
  const insert = vi.fn(async () => insertResult);
  const from = vi.fn(() => ({ insert }));
  return { from, __insert: insert } as MockClient;
}

vi.mock("@/lib/supabase/admin", () => ({
  createServiceRoleClient: vi.fn<() => MockClient | null>(() => null),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  maskEmail: (s: string) => s,
  maskUserId: (s: string) => s,
  maskIp: (s: string) => s,
}));

const ADMIN_ID = "11111111-1111-1111-1111-111111111111";
const TARGET_ID = "22222222-2222-2222-2222-222222222222";

async function importFresh() {
  vi.resetModules();
  return await import("@/lib/admin-audit-log");
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logAdminAction", () => {
  it("emits a redacted console line on every call", async () => {
    const { logAdminAction } = await importFresh();
    const { logger } = await import("@/lib/logger");

    await logAdminAction({
      action: "unlock_diagnostic",
      adminUserId: ADMIN_ID,
      adminEmail: "admin@example.com",
      targetUserId: TARGET_ID,
      targetUserEmail: "target@example.com",
    });

    expect(logger.info).toHaveBeenCalledWith(
      "[admin-audit]",
      expect.objectContaining({
        action: "unlock_diagnostic",
        admin_user_id: ADMIN_ID,
        target_user_id: TARGET_ID,
      }),
    );
  });

  it("skips DB write when service role is unavailable", async () => {
    const admin = await import("@/lib/supabase/admin");
    (admin.createServiceRoleClient as ReturnType<typeof vi.fn>).mockReturnValue(
      null,
    );
    const { logAdminAction } = await importFresh();
    const { logger } = await import("@/lib/logger");

    await expect(
      logAdminAction({
        action: "diagnostic_overview",
        adminUserId: ADMIN_ID,
        adminEmail: "admin@example.com",
      }),
    ).resolves.toBeUndefined();

    expect(logger.warn).toHaveBeenCalledWith(
      "[admin-audit] service role unavailable; DB row not written",
      expect.objectContaining({ action: "diagnostic_overview" }),
    );
  });

  it("inserts a row with the canonical payload shape when service role exists", async () => {
    const client = makeClient();
    const admin = await import("@/lib/supabase/admin");
    (admin.createServiceRoleClient as ReturnType<typeof vi.fn>).mockReturnValue(
      client,
    );
    const { logAdminAction } = await importFresh();

    await logAdminAction({
      action: "generate_report",
      adminUserId: ADMIN_ID,
      adminEmail: "admin@example.com",
      targetUserId: TARGET_ID,
      targetUserEmail: "target@example.com",
      metadata: { response_id: "abc", outcome: "success" },
    });

    expect(client.from).toHaveBeenCalledWith("admin_audit_logs");
    expect(client.__insert).toHaveBeenCalledTimes(1);
    expect(client.__insert).toHaveBeenCalledWith({
      action: "generate_report",
      admin_user_id: ADMIN_ID,
      admin_email: "admin@example.com",
      target_user_id: TARGET_ID,
      target_user_email: "target@example.com",
      metadata: { response_id: "abc", outcome: "success" },
    });
  });

  it("defaults metadata to {} so the column is never null", async () => {
    const client = makeClient();
    const admin = await import("@/lib/supabase/admin");
    (admin.createServiceRoleClient as ReturnType<typeof vi.fn>).mockReturnValue(
      client,
    );
    const { logAdminAction } = await importFresh();

    await logAdminAction({
      action: "diagnostic_overview",
      adminUserId: ADMIN_ID,
      adminEmail: "admin@example.com",
    });

    expect(client.__insert).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: {} }),
    );
  });

  it("normalizes optional fields to null in the insert payload", async () => {
    const client = makeClient();
    const admin = await import("@/lib/supabase/admin");
    (admin.createServiceRoleClient as ReturnType<typeof vi.fn>).mockReturnValue(
      client,
    );
    const { logAdminAction } = await importFresh();

    await logAdminAction({
      action: "diagnostic_overview",
      adminUserId: ADMIN_ID,
      adminEmail: "admin@example.com",
    });

    expect(client.__insert).toHaveBeenCalledWith(
      expect.objectContaining({
        target_user_id: null,
        target_user_email: null,
      }),
    );
  });

  it("skips DB write and warns when adminEmail is missing (NOT NULL column)", async () => {
    const client = makeClient();
    const admin = await import("@/lib/supabase/admin");
    (admin.createServiceRoleClient as ReturnType<typeof vi.fn>).mockReturnValue(
      client,
    );
    const { logAdminAction } = await importFresh();
    const { logger } = await import("@/lib/logger");

    await logAdminAction({
      action: "unlock_diagnostic",
      adminUserId: ADMIN_ID,
      targetUserId: TARGET_ID,
    });

    expect(client.__insert).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      "[admin-audit] adminEmail missing; DB row not written",
      expect.objectContaining({ action: "unlock_diagnostic" }),
    );
  });

  it("is fail-open when the insert errors", async () => {
    const client = makeClient({ error: { message: "boom", code: "23505" } });
    const admin = await import("@/lib/supabase/admin");
    (admin.createServiceRoleClient as ReturnType<typeof vi.fn>).mockReturnValue(
      client,
    );
    const { logAdminAction } = await importFresh();
    const { logger } = await import("@/lib/logger");

    await expect(
      logAdminAction({
        action: "unlock_diagnostic",
        adminUserId: ADMIN_ID,
        adminEmail: "admin@example.com",
        targetUserId: TARGET_ID,
      }),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      "[admin-audit] insert failed",
      expect.objectContaining({ action: "unlock_diagnostic" }),
    );
  });

  it("is fail-open when the insert throws", async () => {
    const insert = vi.fn(async () => {
      throw new Error("network down");
    });
    const client = {
      from: vi.fn(() => ({ insert })),
    };
    const admin = await import("@/lib/supabase/admin");
    (admin.createServiceRoleClient as ReturnType<typeof vi.fn>).mockReturnValue(
      client as unknown as MockClient,
    );
    const { logAdminAction } = await importFresh();
    const { logger } = await import("@/lib/logger");

    await expect(
      logAdminAction({
        action: "unlock_diagnostic",
        adminUserId: ADMIN_ID,
        adminEmail: "admin@example.com",
        targetUserId: TARGET_ID,
      }),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      "[admin-audit] insert threw",
      expect.objectContaining({ action: "unlock_diagnostic" }),
    );
  });

  it("is fail-open when service-role client construction throws", async () => {
    const admin = await import("@/lib/supabase/admin");
    (admin.createServiceRoleClient as ReturnType<typeof vi.fn>).mockImplementation(
      () => {
        throw new Error("misconfig");
      },
    );
    const { logAdminAction } = await importFresh();
    const { logger } = await import("@/lib/logger");

    await expect(
      logAdminAction({
        action: "diagnostic_overview",
        adminUserId: ADMIN_ID,
        adminEmail: "admin@example.com",
      }),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      "[admin-audit] service role client init failed",
      expect.objectContaining({ action: "diagnostic_overview" }),
    );
  });
});

describe("admin-audit-log call sites", () => {
  it("supports documented admin actions without throwing", async () => {
    const client = makeClient();
    const admin = await import("@/lib/supabase/admin");
    (admin.createServiceRoleClient as ReturnType<typeof vi.fn>).mockReturnValue(
      client,
    );
    const { logAdminAction } = await importFresh();

    for (const action of [
      "unlock_diagnostic",
      "generate_report",
      "diagnostic_overview",
      "view_user_data",
    ]) {
      await logAdminAction({
        action,
        adminUserId: ADMIN_ID,
        adminEmail: "admin@example.com",
      });
    }

    expect(client.__insert).toHaveBeenCalledTimes(4);
    const actions = client.__insert.mock.calls.map(
      (c) => (c[0] as { action: string }).action,
    );
    expect(actions).toEqual([
      "unlock_diagnostic",
      "generate_report",
      "diagnostic_overview",
      "view_user_data",
    ]);
  });
});
