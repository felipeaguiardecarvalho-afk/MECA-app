import { sendMagicLinkEmail } from "@/lib/email/send-magic-link";
import { sanitizeNextParam } from "@/lib/auth/post-login-redirect";
import { getSiteOrigin } from "@/lib/env";
import { logger, maskEmail } from "@/lib/logger";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { NextResponse, type NextRequest } from "next/server";

function uniformAuthSuccess(): NextResponse {
  return NextResponse.json({ success: true }, { status: 200 });
}

/**
 * Handles magic link requests for all users.
 *
 * Uses the Supabase Admin API (`auth.admin.generateLink`) to mint a one-time
 * magic link, then ships the link to the user's mailbox via Resend / Gmail.
 *
 * SECURITY INVARIANTS — do not relax without a security review:
 *   1. The `action_link` (which contains a single-use auth token) is NEVER
 *      placed in the HTTP response. The client always receives the same JSON
 *      `{ "success": true }` so callers cannot infer whether the address exists.
 *   2. The `redirectTo` URL is built from the trusted server-side origin
 *      (`getSiteOrigin()`), not from request headers — preventing host header
 *      injection that could redirect tokens to an attacker-controlled domain.
 *   3. There is no "skip-email / return-link" branch. To keep the link out of
 *      browsers, the only delivery channel is the e-mail transport. In dev
 *      (NODE_ENV !== 'production'), without configured SMTP/Resend, the link
 *      falls back to the server console — never the HTTP response.
 *
 * Failures (invalid body, generateLink, e-mail transport, missing service role)
 * are logged; the HTTP response remains `{ success: true }` (anti-enumeration).
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY + (RESEND_API_KEY or GMAIL_USER/PASS) in production.
 */
export async function handleServiceMagicLinkPost(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    let body: { email?: string; next?: string };
    try {
      body = await request.json();
    } catch {
      logger.warn("[magic-link] invalid JSON body");
      return uniformAuthSuccess();
    }

    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!email) {
      logger.warn("[magic-link] missing email");
      return uniformAuthSuccess();
    }

    const next = sanitizeNextParam(
      typeof body.next === "string" ? body.next : null,
    );

    const admin = createServiceRoleClient();
    if (!admin) {
      logger.error("[magic-link] service role client unavailable");
      return uniformAuthSuccess();
    }

    /**
     * Use the canonical server-side origin instead of `request.nextUrl.origin`
     * — defends against Host / X-Forwarded-Host injection that would otherwise
     * cause the magic link's redirectTo to point at an attacker domain.
     */
    const redirectTo = new URL(
      `/auth/callback?next=${encodeURIComponent(next)}`,
      getSiteOrigin(),
    ).href;

    const { data, error: genError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (genError || !data?.properties?.action_link) {
      logger.error("[magic-link] generateLink failed", {
        recipient: maskEmail(email),
        err: genError,
      });
      return uniformAuthSuccess();
    }

    const result = await sendMagicLinkEmail(email, data.properties.action_link);

    if (!result.ok) {
      logger.error("[magic-link] email send failed", {
        recipient: maskEmail(email),
        err: result.error,
      });
      return uniformAuthSuccess();
    }

    logger.info("[magic-link] email sent", { recipient: maskEmail(email) });
    return uniformAuthSuccess();
  } catch (e) {
    logger.error("[magic-link] unhandled", e);
    return uniformAuthSuccess();
  }
}
