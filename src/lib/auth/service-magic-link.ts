import { isMasterLoginRequestEmail } from "@/lib/auth/master-login";
import { sanitizeNextParam } from "@/lib/auth/post-login-redirect";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { NextResponse, type NextRequest } from "next/server";

/** Opt-out do bypass Admin para o e-mail master (volta a usar OTP público). */
function masterMagicLinkAllowed(): boolean {
  const off = process.env.DISABLE_MASTER_MAGIC_LINK?.trim();
  if (off === "1" || off === "true") return false;
  return true;
}

/**
 * Bypass do OTP público para qualquer e-mail: quando há `SUPABASE_SERVICE_ROLE_KEY`,
 * por defeito usa-se Admin `generateLink` (sem quota de e-mail do Auth).
 * Desligar: `DISABLE_MAGIC_LINK_SERVICE_FOR_ALL=1`.
 * Forçar só com flag explícita: `ENABLE_MAGIC_LINK_SERVICE_FOR_ALL=1` / `MAGIC_LINK_BYPASS_ALL_EMAILS=1`
 * (redundante se já há service role, útil para documentar intenção).
 *
 * Quem submete o e-mail obtém sessão via `verifyOtp` no browser sem abrir a caixa de correio;
 * em exposição pública avalie desativar e usar SMTP / limites no painel Supabase.
 */
function serviceMagicLinkForAllEmails(): boolean {
  const disable = process.env.DISABLE_MAGIC_LINK_SERVICE_FOR_ALL?.trim();
  if (disable === "1" || disable === "true") return false;

  const raw =
    process.env.ENABLE_MAGIC_LINK_SERVICE_FOR_ALL?.trim() ??
    process.env.MAGIC_LINK_BYPASS_ALL_EMAILS?.trim();
  if (raw === "0" || raw === "false") return false;
  if (raw === "1" || raw === "true") return true;

  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

function shouldUseAdminMagicLink(email: string): boolean {
  if (serviceMagicLinkForAllEmails()) return true;
  if (masterMagicLinkAllowed() && isMasterLoginRequestEmail(email)) return true;
  return false;
}

export async function handleServiceMagicLinkPost(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    let body: { email?: string; next?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ bypass: false });
    }

    const email = typeof body.email === "string" ? body.email : "";
    const nextRaw = typeof body.next === "string" ? body.next : null;

    const emailTrim = email.trim();
    if (!emailTrim || !shouldUseAdminMagicLink(emailTrim)) {
      return NextResponse.json({ bypass: false });
    }

    const admin = createServiceRoleClient();
    if (!admin) {
      return NextResponse.json({ bypass: false });
    }

    const next = sanitizeNextParam(nextRaw);

    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: emailTrim,
      options: {
        redirectTo: new URL(
          `/auth/callback?next=${encodeURIComponent(next)}`,
          request.nextUrl.origin,
        ).href,
      },
    });

    const hashed = data?.properties?.hashed_token;
    if (error || !hashed) {
      console.error("[magic-link] generateLink", error?.message);
      return NextResponse.json({ bypass: false });
    }

    return NextResponse.json({
      bypass: true,
      hashed_token: hashed,
      next,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro interno.";
    console.error("[magic-link]", e);
    return NextResponse.json(
      { error: "internal", detail: message },
      { status: 502 },
    );
  }
}
