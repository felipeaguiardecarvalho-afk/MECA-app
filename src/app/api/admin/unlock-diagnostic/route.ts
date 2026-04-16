import { isAuthDisabled } from "@/lib/auth-mode";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  user_id: z.string().uuid(),
});

/**
 * Master admin only: set can_take_diagnostic = true for a user with an existing grant.
 */
export async function POST(request: Request) {
  if (isAuthDisabled()) {
    return NextResponse.json(
      { ok: false, error: "admin_unlock_disabled_in_dev_auth_off" },
      { status: 403 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAdmin(user.email)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
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

  const service = createServiceRoleClient();
  if (!service) {
    return NextResponse.json(
      {
        ok: false,
        error: "service_role_required",
        detail: "Set SUPABASE_SERVICE_ROLE_KEY on the server.",
      },
      { status: 503 },
    );
  }

  const { data: existing, error: selErr } = await service
    .from("access_grants")
    .select("user_id")
    .eq("user_id", parsed.data.user_id)
    .maybeSingle();

  if (selErr) {
    return NextResponse.json(
      { ok: false, error: selErr.message },
      { status: 500 },
    );
  }

  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "no_grant_for_user" },
      { status: 400 },
    );
  }

  const { error: updErr } = await service
    .from("access_grants")
    .update({ can_take_diagnostic: true })
    .eq("user_id", parsed.data.user_id);

  if (updErr) {
    return NextResponse.json(
      { ok: false, error: updErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
