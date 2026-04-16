import { isAuthDisabled } from "@/lib/auth-mode";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { DiagnosticOverviewRow } from "@/types/admin-diagnostic";
import { NextResponse } from "next/server";

/**
 * Master admin: list access_grants with emails and response counts.
 */
export async function GET() {
  if (isAuthDisabled()) {
    return NextResponse.json(
      { ok: false, error: "admin_overview_disabled_in_dev_auth_off" },
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

  const { data: grants, error: gErr } = await service
    .from("access_grants")
    .select("user_id, can_take_diagnostic, code, created_at")
    .order("created_at", { ascending: false });

  if (gErr) {
    return NextResponse.json(
      { ok: false, error: gErr.message },
      { status: 500 },
    );
  }

  const { data: allResponses, error: rErr } = await service
    .from("responses")
    .select("user_id");

  if (rErr) {
    return NextResponse.json(
      { ok: false, error: rErr.message },
      { status: 500 },
    );
  }

  const countByUser = new Map<string, number>();
  for (const row of allResponses ?? []) {
    const uid = row.user_id as string;
    countByUser.set(uid, (countByUser.get(uid) ?? 0) + 1);
  }

  let listUsers: { id: string; email?: string }[] = [];
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data: authData, error: listErr } =
      await service.auth.admin.listUsers({ page, perPage });
    if (listErr) {
      return NextResponse.json(
        { ok: false, error: listErr.message },
        { status: 500 },
      );
    }
    const batch = authData?.users ?? [];
    listUsers = listUsers.concat(
      batch.map((u) => ({ id: u.id, email: u.email })),
    );
    if (batch.length < perPage) break;
    page += 1;
    if (page > 100) break;
  }

  const emailById = new Map(listUsers.map((u) => [u.id, u.email ?? null]));

  const rows: DiagnosticOverviewRow[] = (grants ?? []).map((g) => ({
    user_id: g.user_id as string,
    email: emailById.get(g.user_id as string) ?? null,
    can_take_diagnostic: g.can_take_diagnostic === true,
    code: g.code as string,
    grant_created_at: g.created_at as string,
    response_count: countByUser.get(g.user_id as string) ?? 0,
  }));

  return NextResponse.json({ ok: true, rows });
}
