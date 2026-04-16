import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Fallback when `ensure_email_access_grant` RPC is missing from the database:
 * creates the same row using the service role (server-only).
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const service = createServiceRoleClient();
  if (!service) {
    return NextResponse.json(
      { ok: false, error: "no_service_role" },
      { status: 503 },
    );
  }

  const { data: existing } = await service
    .from("access_grants")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, created: false });
  }

  const { count, error: countErr } = await service
    .from("responses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countErr) {
    return NextResponse.json(
      { ok: false, error: countErr.message },
      { status: 500 },
    );
  }

  const canTake = (count ?? 0) === 0;

  const { error: insErr } = await service.from("access_grants").insert({
    user_id: user.id,
    code: "email-login",
    can_take_diagnostic: canTake,
  });

  if (insErr) {
    if (insErr.code === "23505") {
      return NextResponse.json({ ok: true, created: false });
    }
    return NextResponse.json(
      { ok: false, error: insErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, created: true });
}
