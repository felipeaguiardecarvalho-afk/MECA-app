import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/isAdmin";
import { redirect } from "next/navigation";
import { MfaClient } from "./MfaClient";

/**
 * TOTP enroll / verify screen for the master admin.
 *
 * Server-side gate:
 *   - Must be logged in → otherwise redirect to /login.
 *   - Non-admin visitors are sent to /dashboard (MFA is only required for
 *     the master admin today; adding MFA for other users would be a separate
 *     product decision and would need its own gating rules).
 *
 * This page itself is deliberately **not** gated by MFA — it's the place the
 * admin goes to establish AAL2 in the first place.
 */
export const dynamic = "force-dynamic";

export default async function MfaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login?next=/account/mfa");
  }

  if (!isAdmin(user.email)) {
    redirect("/dashboard");
  }

  return (
    <main className="section-meca">
      <div className="container-meca max-w-2xl">
        <header className="mb-6 sm:mb-8">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-900">
            Conta do administrador
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            Autenticação de dois fatores
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            O painel e as APIs
            <code className="mx-1 rounded bg-gray-100 px-1 py-0.5 text-[11px]">
              /api/admin/*
            </code>
            exigem Assurance Level 2 (TOTP). Conclua o registo neste dispositivo
            e depois faça o desafio em cada login.
          </p>
        </header>

        <MfaClient userEmail={user.email} />
      </div>
    </main>
  );
}
