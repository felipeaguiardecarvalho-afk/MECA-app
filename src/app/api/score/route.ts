import { isAuthDisabled } from "@/lib/auth-mode";
import { isAdmin } from "@/lib/auth/isAdmin";
import { computeDiagnostic } from "@/lib/diagnostic-engine";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const answersSchema = z.record(z.string(), z.number().min(1).max(5));

function devAnonymousUserId(): string | null {
  const id = process.env.DEV_ANONYMOUS_USER_ID?.trim();
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  return id;
}

/**
 * Authoritative scoring + persistence. user_id comes only from the session (never from body).
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = z.object({ answers: answersSchema }).safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  let diagnostic;
  try {
    diagnostic = computeDiagnostic(parsed.data.answers);
  } catch (e) {
    const message = e instanceof Error ? e.message : "compute_error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const service = createServiceRoleClient();

  let effectiveUserId: string | null = null;
  let emailForAdminFlag: string | null = user?.email ?? null;

  if (isAuthDisabled()) {
    const devId = devAnonymousUserId();
    if (!service || !devId) {
      return NextResponse.json({
        ok: true,
        id: crypto.randomUUID(),
        diagnostic,
        persisted: false,
      });
    }
    effectiveUserId = devId;
    emailForAdminFlag = null;
  } else {
    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
    }

    const { data: grant } = await supabase
      .from("access_grants")
      .select("user_id, can_take_diagnostic")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!grant) {
      return NextResponse.json({ ok: false, error: "no_access" }, { status: 403 });
    }
    if (grant.can_take_diagnostic !== true) {
      return NextResponse.json(
        { ok: false, error: "diagnostic_not_allowed" },
        { status: 403 },
      );
    }
    effectiveUserId = user.id;
  }

  if (!effectiveUserId) {
    return NextResponse.json({ ok: false, error: "no_user" }, { status: 500 });
  }

  const rowPayload = {
    user_id: effectiveUserId,
    answers: parsed.data.answers,
    // Compatibilidade com schema legado (snd...): colunas NOT NULL score_*
    score_m: diagnostic.mentalidade,
    score_e: diagnostic.engajamento,
    score_c: diagnostic.cultura,
    score_a: diagnostic.performance,
    completed_at: new Date().toISOString(),
    mentalidade: diagnostic.mentalidade,
    engajamento: diagnostic.engajamento,
    cultura: diagnostic.cultura,
    performance: diagnostic.performance,
    direction: diagnostic.direction,
    capacity: diagnostic.capacity,
    archetype: diagnostic.archetype,
    is_admin: emailForAdminFlag ? isAdmin(emailForAdminFlag) : false,
  };

  const client = isAuthDisabled() ? service! : (service ?? supabase);

  const { data: row, error } = await client
    .from("responses")
    .insert(rowPayload)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  if (!isAuthDisabled() && user && effectiveUserId === user.id) {
    const { error: lockErr } = await supabase
      .from("access_grants")
      .update({ can_take_diagnostic: false })
      .eq("user_id", user.id);
    if (lockErr) {
      return NextResponse.json(
        { ok: false, error: "grant_lock_failed", detail: lockErr.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true, id: row.id, diagnostic, persisted: true });
}
