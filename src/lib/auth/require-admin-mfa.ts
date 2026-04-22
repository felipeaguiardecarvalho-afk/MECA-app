/**
 * Server-only guard for admin routes.
 *
 * Enforces two requirements, in order:
 *   1. Authenticated session whose email is the canonical master admin
 *      (`isAdmin`, via `CANONICAL_MASTER_EMAIL` / `MASTER_ADMIN_EMAIL`-equivalent).
 *   2. Supabase Auth Assurance Level 2 (AAL2) — i.e. the admin has completed a
 *      second factor (TOTP) in the current session.
 *
 * If any check fails, returns a ready-to-return `NextResponse` with a stable
 * machine-readable error code the client can act on:
 *   - `unauthorized`     → no session (401)
 *   - `forbidden`        → session exists but not the master admin (403)
 *   - `mfa_required`     → admin session, no AAL2 (403) — admin must enroll / verify TOTP
 *   - `mfa_check_failed` → Supabase mfa API error (503)
 *
 * In non-production, a single escape-hatch is honored to avoid blocking local
 * development before an admin has enrolled MFA:
 *   `ADMIN_MFA_ENFORCE=0` (only in NODE_ENV !== "production").
 * In production the check is unconditional.
 */
import { isAdmin } from "@/lib/auth/isAdmin";
import { logger } from "@/lib/logger";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export type AdminGuardSuccess = {
  ok: true;
  user: User;
  aal: "aal2";
};

export type AdminGuardFailure = {
  ok: false;
  response: NextResponse;
};

export type AdminGuardResult = AdminGuardSuccess | AdminGuardFailure;

function mfaEnforcementEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  const flag = process.env.ADMIN_MFA_ENFORCE;
  if (flag === "0" || flag === "false") return false;
  return true;
}

function forbidden(code: string, detail?: string, status = 403): NextResponse {
  return NextResponse.json(
    { ok: false, error: code, ...(detail ? { detail } : {}) },
    { status },
  );
}

/**
 * Require an authenticated master admin with AAL2 (MFA verified).
 * Caller must pass a server-bound `SupabaseClient` created from cookies.
 */
export async function requireAdminWithMfa(
  supabase: SupabaseClient,
): Promise<AdminGuardResult> {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user?.email) {
    return { ok: false, response: forbidden("unauthorized", undefined, 401) };
  }

  if (!isAdmin(user.email)) {
    return { ok: false, response: forbidden("forbidden") };
  }

  if (!mfaEnforcementEnabled()) {
    // Dev-only escape hatch (ADMIN_MFA_ENFORCE=0).
    return { ok: true, user, aal: "aal2" };
  }

  const { data: aalData, error: aalErr } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aalErr || !aalData) {
    logger.error("[auth] getAuthenticatorAssuranceLevel failed", aalErr);
    return {
      ok: false,
      response: forbidden("mfa_check_failed", undefined, 503),
    };
  }

  if (aalData.currentLevel !== "aal2") {
    return {
      ok: false,
      response: forbidden(
        "mfa_required",
        "Admin must complete a second factor (TOTP) before accessing admin APIs.",
      ),
    };
  }

  return { ok: true, user, aal: "aal2" };
}
