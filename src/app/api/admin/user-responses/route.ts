import { logAdminAction } from "@/lib/admin-audit-log";
import { requireAdminWithMfa } from "@/lib/auth/require-admin-mfa";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export interface UserResponseRow {
  id: string;
  created_at: string;
  mentalidade: number;
  engajamento: number;
  cultura: number;
  performance: number;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const guard = await requireAdminWithMfa(supabase);
  if (!guard.ok) return guard.response;
  const { user: adminUser } = guard;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json({ ok: false, error: "user_id required" }, { status: 400 });
  }

  const service = createServiceRoleClient();
  if (!service) {
    return NextResponse.json({ ok: false, error: "service_role_required" }, { status: 503 });
  }

  const { data, error } = await service
    .from("responses")
    .select("id, created_at, mentalidade, engajamento, cultura, performance")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Snapshot the target email for the audit row; lookup is best-effort.
  let targetEmail: string | null = null;
  try {
    const { data: targetUser } = await service.auth.admin.getUserById(userId);
    targetEmail = targetUser?.user?.email ?? null;
  } catch {
    targetEmail = null;
  }

  await logAdminAction({
    action: "view_user_data",
    adminUserId: adminUser.id,
    adminEmail: adminUser.email ?? null,
    targetUserId: userId,
    targetUserEmail: targetEmail,
    metadata: { row_count: data?.length ?? 0 },
  });

  return NextResponse.json({ ok: true, rows: (data ?? []) as UserResponseRow[] });
}
