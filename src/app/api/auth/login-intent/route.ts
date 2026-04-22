import { logger, maskEmail } from "@/lib/logger";
import { jsonRateLimitOrNull } from "@/lib/rate-limit";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
});

/**
 * Anti-enumeration: HTTP body is always `{ "success": true }` (except 429 rate limit).
 * Real outcomes are logged server-side only.
 */
export async function POST(request: Request) {
  const limited = await jsonRateLimitOrNull(request, "api/auth/login-intent");
  if (limited) return limited;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    logger.warn("[login-intent] invalid JSON body");
    return NextResponse.json({ success: true });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    logger.warn("[login-intent] validation failed");
    return NextResponse.json({ success: true });
  }

  const email = parsed.data.email.trim();
  const service = createServiceRoleClient();

  if (!service) {
    logger.warn("[login-intent] service role unavailable; skipping RPC");
    return NextResponse.json({ success: true });
  }

  const { data, error } = await service.rpc("meca_email_login_phase", {
    p_email: email,
  });

  if (error) {
    logger.error("[login-intent] rpc failed", {
      recipient: maskEmail(email),
      message: error.message,
    });
  } else {
    logger.info("[login-intent] rpc ok", {
      recipient: maskEmail(email),
      phase: data ?? null,
    });
  }

  return NextResponse.json({ success: true });
}
