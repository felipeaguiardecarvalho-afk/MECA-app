import { ensureEmailAccessGrantIfNeeded } from "@/lib/auth/ensure-email-access";
import { isAuthDisabled } from "@/lib/auth-mode";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function devAnonymousUserId(): string | null {
  const id = process.env.DEV_ANONYMOUS_USER_ID?.trim();
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  return id;
}

/**
 * Server-side access flags for UI: diagnostic eligibility, completion, admin.
 */
export async function GET() {
  if (isAuthDisabled()) {
    const devId = devAnonymousUserId();
    const service = createServiceRoleClient();
    let hasResponse = false;
    if (service && devId) {
      const { count } = await service
        .from("responses")
        .select("*", { count: "exact", head: true })
        .eq("user_id", devId);
      hasResponse = (count ?? 0) > 0;
    }
    return NextResponse.json({
      ok: true,
      can_take_diagnostic: true,
      has_completed_diagnostic: hasResponse,
      is_admin: false,
      has_access_grant: true,
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  await ensureEmailAccessGrantIfNeeded(supabase, user.id);

  const admin = isAdmin(user.email);

  const { data: grant, error: grantErr } = await supabase
    .from("access_grants")
    .select("can_take_diagnostic")
    .eq("user_id", user.id)
    .maybeSingle();

  if (grantErr) {
    return NextResponse.json(
      { ok: false, error: grantErr.message },
      { status: 500 },
    );
  }

  if (!grant) {
    return NextResponse.json({
      ok: true,
      can_take_diagnostic: false,
      has_completed_diagnostic: false,
      is_admin: admin,
      has_access_grant: false,
    });
  }

  const { count, error: countErr } = await supabase
    .from("responses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countErr) {
    return NextResponse.json(
      { ok: false, error: countErr.message },
      { status: 500 },
    );
  }

  const hasCompleted = (count ?? 0) > 0;

  return NextResponse.json({
    ok: true,
    can_take_diagnostic: grant.can_take_diagnostic === true,
    has_completed_diagnostic: hasCompleted,
    is_admin: admin,
    has_access_grant: true,
  });
}
