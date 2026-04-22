/**
 * Structured admin audit logging (server-side only).
 *
 * Canonical `action` values (snake_case, ≤64 chars):
 *   - `unlock_diagnostic` — POST /api/admin/unlock-diagnostic
 *   - `generate_report` — GET /api/report/generate
 *   - `view_user_data` — GET /api/admin/user-responses
 *   - `diagnostic_overview` — GET /api/admin/diagnostic-overview (aggregate listing)
 *
 * Two sinks, in priority order:
 *
 *   1. **Postgres** — `public.admin_audit_logs` (migration 0009). Authoritative,
 *      append-only, RLS-restricted to the master admin. Holds the un-masked
 *      record needed for forensics. Writes go through the service role.
 *
 *   2. **Structured stdout** — via `logger.info("[admin-audit]", …)`. Defense
 *      in-depth so an action is still observable when the DB write fails or
 *      the service role is unset (e.g. in dev). UUIDs and emails are passed
 *      through `logger`'s redactor — see `src/lib/logger.ts` — so no raw PII
 *      reaches the hosting provider's log retention.
 *
 * The function is **fail-open**: an audit-write failure must never block the
 * underlying admin action. Failures are surfaced via `logger.error` so they
 * remain alertable.
 */

import { logger } from "@/lib/logger";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export type AdminAuditPayload = {
  action: string;
  adminUserId: string;
  adminEmail?: string | null;
  targetUserId?: string | null;
  targetUserEmail?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Persist an admin action and emit a redacted console line.
 *
 * Always resolves; never throws. Callers may `await` to ensure the row is
 * flushed before the request handler returns (recommended in serverless
 * environments where execution may be frozen on response).
 */
export async function logAdminAction(payload: AdminAuditPayload): Promise<void> {
  const timestamp = new Date().toISOString();

  // 1. Console (redacted) — runs unconditionally so we always have a trace.
  logger.info("[admin-audit]", {
    action: payload.action,
    admin_user_id: payload.adminUserId,
    admin_email: payload.adminEmail ?? undefined,
    target_user_id: payload.targetUserId ?? undefined,
    target_user_email: payload.targetUserEmail ?? undefined,
    metadata: payload.metadata,
    timestamp,
  });

  // 2. Postgres — best-effort, fail-open.
  let service;
  try {
    service = createServiceRoleClient();
  } catch (err) {
    // Misconfiguration (e.g. NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY leaked).
    // Surface loudly but keep the request flowing.
    logger.error("[admin-audit] service role client init failed", {
      action: payload.action,
      err,
    });
    return;
  }

  if (!service) {
    // Service role not configured — common in dev. Console line above is the
    // only record. We intentionally do not error out here.
    logger.warn("[admin-audit] service role unavailable; DB row not written", {
      action: payload.action,
    });
    return;
  }

  if (!payload.adminEmail) {
    // adminEmail is required by the schema. If a caller omits it, log loudly
    // and skip the DB write rather than failing the action. New call sites
    // should always provide it (it lives on the auth user we just verified).
    logger.warn("[admin-audit] adminEmail missing; DB row not written", {
      action: payload.action,
      admin_user_id: payload.adminUserId,
    });
    return;
  }

  try {
    const { error } = await service.from("admin_audit_logs").insert({
      action: payload.action,
      admin_user_id: payload.adminUserId,
      admin_email: payload.adminEmail,
      target_user_id: payload.targetUserId ?? null,
      target_user_email: payload.targetUserEmail ?? null,
      // JSONB column: empty object when unspecified, so reads can rely on
      // metadata never being null.
      metadata: (payload.metadata ?? {}) as never,
    });
    if (error) {
      logger.error("[admin-audit] insert failed", {
        action: payload.action,
        admin_user_id: payload.adminUserId,
        target_user_id: payload.targetUserId ?? undefined,
        err: error,
      });
    }
  } catch (err) {
    logger.error("[admin-audit] insert threw", {
      action: payload.action,
      admin_user_id: payload.adminUserId,
      err,
    });
  }
}
