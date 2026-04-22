import { isAuthDisabled } from "@/lib/auth-mode";
import { isAdmin } from "@/lib/auth/isAdmin";
import { requireAdminWithMfa } from "@/lib/auth/require-admin-mfa";
import {
  buildGlobalInsights,
  type ResponseMetricsRow,
} from "@/lib/benchmark-insights";
import { BENCHMARK_SCORES } from "@/lib/benchmark";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const revalidate = 0;

/**
 * Reference benchmarks + optional global aggregates.
 * - User: public reference scores only (no cross-user raw data).
 * - Admin: reference scores + aggregated global insights (requires service role).
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAuthDisabled()) {
    return NextResponse.json(
      {
        ok: true,
        viewer: "user" as const,
        scores: BENCHMARK_SCORES,
        aggregated: {
          scope: "reference_only" as const,
          note:
            "Valores de referência agregados do setor. Estatísticas por utilizador não são expostas.",
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=300",
        },
      },
    );
  }

  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  if (!isAdmin(user.email)) {
    return NextResponse.json(
      {
        ok: true,
        viewer: "user" as const,
        scores: BENCHMARK_SCORES,
        aggregated: {
          scope: "reference_only" as const,
          note:
            "Valores de referência agregados do setor. Estatísticas por utilizador não são expostas.",
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=300",
        },
      },
    );
  }

  const guard = await requireAdminWithMfa(supabase);
  if (!guard.ok) return guard.response;

  const service = createServiceRoleClient();
  if (!service) {
    return NextResponse.json(
      {
        ok: false,
        error: "admin_requires_service_role",
        detail:
          "Set SUPABASE_SERVICE_ROLE_KEY on the server for global benchmark aggregates.",
      },
      { status: 503 },
    );
  }

  const { data: rows, error } = await service
    .from("responses")
    .select(
      "user_id, mentalidade, engajamento, cultura, performance, direction, capacity, archetype",
    );

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  const metricsRows = (rows ?? []) as ResponseMetricsRow[];
  const globalInsights = buildGlobalInsights(metricsRows);

  return NextResponse.json(
    {
      ok: true,
      viewer: "admin" as const,
      scores: BENCHMARK_SCORES,
      globalInsights,
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
