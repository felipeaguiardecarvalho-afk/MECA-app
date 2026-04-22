import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { generatePremiumDiagnostic } from "@/lib/claude";
import { isAuthDisabled } from "@/lib/auth-mode";
import { logger } from "@/lib/logger";
import {
  aiPremiumRateLimitOrNull,
  rateLimitSubject,
} from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { PillarScoresRaw } from "@/lib/claude";

function devAnonymousUserId(): string | null {
  const id = process.env.DEV_ANONYMOUS_USER_ID?.trim();
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  return id;
}

export async function POST(request: NextRequest) {
  try {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }

    const { responseId } = json as { responseId?: string };
    if (!responseId) {
      return NextResponse.json({ ok: false, error: "responseId_required" }, { status: 400 });
    }

    const supabase = await createClient();
    const service = createServiceRoleClient();
    if (!service) {
      return NextResponse.json({ ok: false, error: "service_unavailable" }, { status: 503 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let userId: string | null = null;
    let userEmail = "usuario";

    if (isAuthDisabled()) {
      userId = devAnonymousUserId();
    } else {
      if (!user) {
        return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
      }
      userId = user.id;
      userEmail = user.email ?? "usuario";
    }

    const limited = await aiPremiumRateLimitOrNull(
      rateLimitSubject(userId, request),
    );
    if (limited) return limited;

    const { data: row, error } = await service
      .from("responses")
      .select("id, user_id, mentalidade, engajamento, cultura, performance, archetype, answers")
      .eq("id", responseId)
      .single();

    if (error || !row) {
      return NextResponse.json({ ok: false, error: "response_not_found" }, { status: 404 });
    }

    if (!isAuthDisabled() && row.user_id !== userId) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const answers = (row.answers ?? {}) as Record<string, number>;

    const pillarScores: PillarScoresRaw = {
      mentalidade: Number(row.mentalidade),
      engajamento: Number(row.engajamento),
      cultura: Number(row.cultura),
      performance: Number(row.performance),
    };

    const diagnostic = await generatePremiumDiagnostic(answers, userEmail, pillarScores);

    return NextResponse.json({ ok: true, diagnostic });
  } catch (err) {
    logger.error("[api/diagnostic/premium] POST error", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
