import { isAuthDisabled } from "@/lib/auth-mode";
import { requireAdminWithMfa } from "@/lib/auth/require-admin-mfa";
import { logger } from "@/lib/logger";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getArchetype, ARCHETYPE_NAMES, type MECAScores } from "@/lib/archetypes";
import { getActionPlan } from "@/lib/action-plan";
import { NextResponse } from "next/server";

type ResponseRow = {
  id: string;
  mentalidade: number;
  engajamento: number;
  cultura: number;
  performance: number;
  archetype: string;
  answers: Record<string, number> | null;
};

function toMECA(row: ResponseRow): MECAScores {
  return {
    M: Math.round(Number(row.mentalidade)),
    E: Math.round(Number(row.engajamento)),
    C: Math.round(Number(row.cultura)),
    A: Math.round(Number(row.performance)),
  };
}

/**
 * GET /api/admin/validate-archetypes
 *
 * Runs the 14-archetype engine against every response in the DB and returns
 * a consistency report: distribution, transitions from old → new archetype,
 * action-plan pillar distribution, and any processing errors.
 *
 * Requires admin + MFA session. Uses service role to bypass RLS.
 */
export async function GET() {
  try {
    if (isAuthDisabled()) {
      return NextResponse.json(
        { ok: false, error: "disabled_in_dev_auth_off" },
        { status: 403 },
      );
    }

    let supabase;
    try {
      supabase = await createClient();
    } catch (err) {
      logger.error("[api/admin/validate-archetypes] Supabase client", err);
      return NextResponse.json({ ok: false, error: "supabase_env_missing" }, { status: 503 });
    }

    const guard = await requireAdminWithMfa(supabase);
    if (!guard.ok) return guard.response;

    let service;
    try {
      service = createServiceRoleClient();
    } catch (err) {
      logger.error("[api/admin/validate-archetypes] service role client", err);
      return NextResponse.json({ ok: false, error: "service_client_config_invalid" }, { status: 503 });
    }
    if (!service) {
      return NextResponse.json(
        { ok: false, error: "service_role_required", detail: "Set SUPABASE_SERVICE_ROLE_KEY on the server." },
        { status: 503 },
      );
    }

    const { data: rows, error } = await service
      .from("responses")
      .select("id, mentalidade, engajamento, cultura, performance, archetype, answers")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const total = rows?.length ?? 0;
    if (total === 0) {
      return NextResponse.json({ ok: true, total: 0, message: "No responses found." });
    }

    let errors = 0;
    let archetypeChanged = 0;
    const newDist: Record<string, number> = {};
    const oldDist: Record<string, number> = {};
    const changePairMap: Record<string, number> = {};
    const pillarDist: Record<string, number> = {};
    const invalidKeys: string[] = [];
    const errorDetails: Array<{ id: string; error: string }> = [];

    for (const row of rows as ResponseRow[]) {
      try {
        const scores = toMECA(row);
        const result = getArchetype(scores);
        const plan = getActionPlan(scores, row.answers ?? null);

        newDist[result.name] = (newDist[result.name] ?? 0) + 1;

        const oldName = row.archetype ?? "—";
        oldDist[oldName] = (oldDist[oldName] ?? 0) + 1;

        if (result.name !== oldName) {
          archetypeChanged++;
          const pairKey = `${oldName} → ${result.name}`;
          changePairMap[pairKey] = (changePairMap[pairKey] ?? 0) + 1;
        }

        if (!ARCHETYPE_NAMES.includes(result.name)) {
          invalidKeys.push(`${row.id}: "${result.name}"`);
        }

        pillarDist[plan.pillar] = (pillarDist[plan.pillar] ?? 0) + 1;
      } catch (err) {
        errors++;
        errorDetails.push({ id: row.id, error: String(err) });
      }
    }

    const changePairs = Object.entries(changePairMap)
      .map(([pair, count]) => {
        const arrow = " → ";
        const idx = pair.indexOf(arrow);
        return { from: pair.slice(0, idx), to: pair.slice(idx + arrow.length), count };
      })
      .sort((a, b) => b.count - a.count);

    const LEGACY_8 = [
      "Executor Isolado", "Útil Sem Direção", "Estrategista Estagnado",
      "Protagonista Desalinhado", "Profissional Invisível", "Performático Exausto",
      "Bem-Quisto Estagnado", "Acelerado MECA",
    ];
    const newArchetypesHit = Object.keys(newDist).filter(n => !LEGACY_8.includes(n));

    return NextResponse.json({
      ok: true,
      total,
      stable: total - archetypeChanged - errors,
      archetypeChanged,
      errors,
      invalidKeys,
      errorDetails: errorDetails.slice(0, 10),
      newDist: Object.entries(newDist)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count, pct: +((count / total) * 100).toFixed(1) })),
      oldDist: Object.entries(oldDist)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({
          name,
          count,
          pct: +((count / total) * 100).toFixed(1),
          legacy: !ARCHETYPE_NAMES.includes(name),
        })),
      changePairs,
      pillarDist: Object.entries(pillarDist)
        .sort((a, b) => b[1] - a[1])
        .map(([pillar, count]) => ({ pillar, count, pct: +((count / total) * 100).toFixed(1) })),
      newArchetypesHit,
    });
  } catch (err) {
    logger.error("[api/admin/validate-archetypes] GET", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
