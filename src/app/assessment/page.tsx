import { isAuthDisabled } from "@/lib/auth-mode";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AssessmentClient } from "./AssessmentClient";

export const dynamic = "force-dynamic";

/**
 * E2E/UAT: com E2E_INSTANT_DIAGNOSTIC=1 o cliente submete respostas neutras (3) para todas as perguntas.
 * Usar apenas com `npm run dev:e2e` ou variável definida no servidor de teste — nunca em produção.
 *
 * Gates de acesso (ordem):
 *   1. Sem nome no perfil → `/onboarding` (primeiro acesso).
 *   2. Diagnóstico já concluído e não autorizado pelo admin → `/dashboard`.
 *      "Não autorizado" = existe `access_grants` com `can_take_diagnostic = false`
 *      OU não existe grant mas já há respostas (estado órfão legado).
 *      O admin pode re-autorizar via POST /api/admin/unlock-diagnostic.
 */
export default async function AssessmentPage() {
  const e2eInstant =
    process.env.E2E_INSTANT_DIAGNOSTIC === "1" ||
    process.env.E2E_INSTANT_DIAGNOSTIC === "true";

  if (!isAuthDisabled()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      const hasName =
        typeof profile?.full_name === "string" &&
        profile.full_name.trim().length > 0;

      if (!hasName) {
        redirect("/onboarding?next=/assessment");
      }

      const { data: grant } = await supabase
        .from("access_grants")
        .select("can_take_diagnostic")
        .eq("user_id", user.id)
        .maybeSingle();

      const { count: responseCount } = await supabase
        .from("responses")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const hasCompleted = (responseCount ?? 0) > 0;
      const blockedByGrant = grant
        ? grant.can_take_diagnostic !== true
        : hasCompleted;

      if (blockedByGrant) {
        redirect("/dashboard");
      }
    }
  }

  return <AssessmentClient e2eInstantDiagnostic={e2eInstant} />;
}
