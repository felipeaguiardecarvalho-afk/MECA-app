import type { LoginPhase } from "@/lib/auth/login-phase";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
});

/**
 * Determines login UX: OTP step until first diagnostic is done; then magic link only.
 * Requires SUPABASE_SERVICE_ROLE_KEY; otherwise defaults to first_access (OTP step).
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  const email = parsed.data.email.trim();
  const service = createServiceRoleClient();

  if (!service) {
    return NextResponse.json({
      ok: true,
      phase: "first_access" satisfies LoginPhase,
    });
  }

  const { data, error } = await service.rpc("meca_email_login_phase", {
    p_email: email,
  });

  if (error) {
    console.error("[login-intent]", error.message);
    return NextResponse.json({
      ok: true,
      phase: "first_access" satisfies LoginPhase,
    });
  }

  const phase = (data as string | null) ?? "first_access";
  const allowed: LoginPhase[] = [
    "first_access",
    "returning_incomplete",
    "returning_done",
  ];
  const safe = allowed.includes(phase as LoginPhase)
    ? (phase as LoginPhase)
    : "first_access";

  return NextResponse.json({ ok: true, phase: safe });
}
