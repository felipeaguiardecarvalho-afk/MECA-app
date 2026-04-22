import { isAuthDisabled } from "@/lib/auth-mode";
import { jsonRateLimitOrNull } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  code: z.string().min(1),
});

/**
 * Server-side access code validation (Supabase RPC). Sensitive logic stays on the server.
 */
export async function POST(request: Request) {
  if (isAuthDisabled()) {
    const limited = await jsonRateLimitOrNull(request, "api/access-code");
    if (limited) return limited;
    return NextResponse.json({ ok: true, already_granted: true });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const limited = await jsonRateLimitOrNull(request, "api/access-code", {
    userId: user?.id ?? null,
  });
  if (limited) return limited;

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

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

  const { data, error } = await supabase.rpc("validate_access_code", {
    p_code: parsed.data.code,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: "rpc_error", detail: error.message },
      { status: 500 },
    );
  }

  const payload = data as {
    ok?: boolean;
    error?: string;
    already_granted?: boolean;
  };

  if (!payload?.ok) {
    return NextResponse.json(
      { ok: false, error: payload?.error ?? "invalid" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    already_granted: payload.already_granted === true,
  });
}
