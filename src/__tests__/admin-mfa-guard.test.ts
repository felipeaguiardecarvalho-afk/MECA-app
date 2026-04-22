import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireAdminWithMfa } from "@/lib/auth/require-admin-mfa";

const MASTER = "felipe.aguiardecarvalho@gmail.com";

type MfaResp = {
  data: { currentLevel: string | null; nextLevel: string | null } | null;
  error: { message: string } | null;
};

type UserResp = {
  data: { user: { id: string; email: string } | null };
  error: { message: string } | null;
};

function makeSupabase(opts: {
  user?: { id: string; email: string } | null;
  userError?: string;
  mfa?: MfaResp;
}): unknown {
  return {
    auth: {
      getUser: vi.fn(async (): Promise<UserResp> => ({
        data: { user: opts.user ?? null },
        error: opts.userError ? { message: opts.userError } : null,
      })),
      mfa: {
        getAuthenticatorAssuranceLevel: vi.fn(
          async (): Promise<MfaResp> =>
            opts.mfa ?? {
              data: { currentLevel: "aal1", nextLevel: "aal2" },
              error: null,
            },
        ),
      },
    },
  };
}

async function readBody(res: Response): Promise<Record<string, unknown>> {
  return (await res.json()) as Record<string, unknown>;
}

// `NODE_ENV` is typed read-only by @types/node; use a loose index reference.
const env = process.env as Record<string, string | undefined>;

const ORIG_ENFORCE = env.ADMIN_MFA_ENFORCE;
const ORIG_NODE_ENV = env.NODE_ENV;

beforeEach(() => {
  env.ADMIN_MFA_ENFORCE = "1";
  env.NODE_ENV = "development";
});

afterEach(() => {
  if (ORIG_ENFORCE === undefined) delete env.ADMIN_MFA_ENFORCE;
  else env.ADMIN_MFA_ENFORCE = ORIG_ENFORCE;
  env.NODE_ENV = ORIG_NODE_ENV;
});

describe("requireAdminWithMfa", () => {
  it("returns 401 unauthorized when there is no user", async () => {
    const supabase = makeSupabase({ user: null });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await requireAdminWithMfa(supabase as any);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      const body = await readBody(result.response);
      expect(body.error).toBe("unauthorized");
    }
  });

  it("returns 403 forbidden for non-admin users", async () => {
    const supabase = makeSupabase({
      user: { id: "u1", email: "random@example.com" },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await requireAdminWithMfa(supabase as any);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
      const body = await readBody(result.response);
      expect(body.error).toBe("forbidden");
    }
  });

  it("returns 403 mfa_required when admin has no AAL2", async () => {
    const supabase = makeSupabase({
      user: { id: "u1", email: MASTER },
      mfa: {
        data: { currentLevel: "aal1", nextLevel: "aal2" },
        error: null,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await requireAdminWithMfa(supabase as any);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
      const body = await readBody(result.response);
      expect(body.error).toBe("mfa_required");
    }
  });

  it("returns 503 mfa_check_failed when Supabase MFA errors", async () => {
    const supabase = makeSupabase({
      user: { id: "u1", email: MASTER },
      mfa: { data: null, error: { message: "boom" } },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await requireAdminWithMfa(supabase as any);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(503);
      const body = await readBody(result.response);
      expect(body.error).toBe("mfa_check_failed");
    }
  });

  it("allows admin with AAL2", async () => {
    const supabase = makeSupabase({
      user: { id: "u1", email: MASTER },
      mfa: {
        data: { currentLevel: "aal2", nextLevel: "aal2" },
        error: null,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await requireAdminWithMfa(supabase as any);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.email).toBe(MASTER);
      expect(result.aal).toBe("aal2");
    }
  });

  it("honors ADMIN_MFA_ENFORCE=0 in development (admin without AAL2 allowed)", async () => {
    env.ADMIN_MFA_ENFORCE = "0";
    const supabase = makeSupabase({
      user: { id: "u1", email: MASTER },
      mfa: {
        data: { currentLevel: "aal1", nextLevel: "aal2" },
        error: null,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await requireAdminWithMfa(supabase as any);
    expect(result.ok).toBe(true);
  });

  it("ignores ADMIN_MFA_ENFORCE=0 in production (MFA still enforced)", async () => {
    env.ADMIN_MFA_ENFORCE = "0";
    env.NODE_ENV = "production";
    const supabase = makeSupabase({
      user: { id: "u1", email: MASTER },
      mfa: {
        data: { currentLevel: "aal1", nextLevel: "aal2" },
        error: null,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await requireAdminWithMfa(supabase as any);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = await readBody(result.response);
      expect(body.error).toBe("mfa_required");
    }
  });
});
