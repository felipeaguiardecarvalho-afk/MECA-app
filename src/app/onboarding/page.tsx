import { isAuthDisabled } from "@/lib/auth-mode";
import { sanitizeNextParam } from "@/lib/auth/post-login-redirect";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingForm } from "./OnboardingForm";

export const dynamic = "force-dynamic";

/**
 * Primeiro acesso ao diagnóstico: pede Nome (obrigatório), Profissão e
 * Telefone. Apenas o nome é necessário para avançar. Se o utilizador já tem
 * `profiles.full_name` preenchido, saltamos esta etapa.
 */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const nextRaw =
    typeof params.next === "string" ? params.next : null;
  const next = sanitizeNextParam(nextRaw);

  if (isAuthDisabled()) {
    redirect(next);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const login = `/login?next=${encodeURIComponent(`/onboarding?next=${encodeURIComponent(next)}`)}`;
    redirect(login);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, profession, phone")
    .eq("id", user.id)
    .maybeSingle();

  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "";
  const hasName =
    (typeof profile?.full_name === "string" && profile.full_name.trim().length > 0) ||
    metadataName.trim().length > 0;

  if (hasName) {
    redirect(next);
  }

  return (
    <OnboardingForm
      next={next}
      defaults={{
        name: profile?.full_name ?? metadataName ?? "",
        profession: profile?.profession ?? "",
        phone: profile?.phone ?? "",
      }}
    />
  );
}
