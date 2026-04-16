import { isAuthDisabled } from "@/lib/auth-mode";
import { isAdmin } from "@/lib/auth/isAdmin";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type HistoryViewer = { role: "admin" | "user" };

function devAnonymousUserId(): string | null {
  const id = process.env.DEV_ANONYMOUS_USER_ID?.trim();
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  return id;
}

/**
 * Diagnostic history: own rows for normal users; all rows for master admin (service role only).
 * Email is taken exclusively from the Supabase session — never from the client.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAuthDisabled()) {
    const service = createServiceRoleClient();
    const devId = devAnonymousUserId();
    if (!service || !devId) {
      const viewer: HistoryViewer = { role: "user" };
      return NextResponse.json({
        ok: true,
        viewer,
        rows: [],
        offline: true,
      });
    }
    const { data: rows, error } = await service
      .from("responses")
      .select("*")
      .eq("user_id", devId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    const viewer: HistoryViewer = { role: "user" };
    return NextResponse.json({
      ok: true,
      viewer,
      rows: rows ?? [],
    });
  }

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const admin = isAdmin(user.email);

  if (admin) {
    const service = createServiceRoleClient();
    if (!service) {
      return NextResponse.json(
        {
          ok: false,
          error: "admin_requires_service_role",
          detail:
            "Set SUPABASE_SERVICE_ROLE_KEY on the server to enable cross-tenant history.",
        },
        { status: 503 },
      );
    }

    const { data: rows, error } = await service
      .from("responses")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    const viewer: HistoryViewer = { role: "admin" };
    return NextResponse.json({
      ok: true,
      viewer,
      rows: rows ?? [],
    });
  }

  const { data: rows, error } = await supabase
    .from("responses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  const viewer: HistoryViewer = { role: "user" };
  return NextResponse.json({
    ok: true,
    viewer,
    rows: rows ?? [],
  });
}
