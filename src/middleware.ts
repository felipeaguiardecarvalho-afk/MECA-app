import { NextResponse, type NextRequest } from "next/server";
import { ensureEmailAccessGrantIfNeeded } from "@/lib/auth/ensure-email-access";
import { sanitizeNextParam } from "@/lib/auth/post-login-redirect";
import { isAuthDisabled } from "@/lib/auth-mode";
import { updateSession } from "@/lib/supabase/middleware";

/** Rotas que exigem sessão (sem sessão → /login?next=...) */
const REQUIRES_SESSION = [
  "/assessment",
  "/dashboard",
  "/plano-de-acao",
  "/access-code",
];

/** Rotas que exigem access_grants (além de sessão), exceto /access-code (só precisa de login). */
const REQUIRES_GRANT = ["/assessment", "/dashboard", "/plano-de-acao"];

function matchesPrefix(path: string, prefixes: string[]): boolean {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (isAuthDisabled()) {
    const { response } = await updateSession(request);
    return response;
  }

  if (path === "/access" || path.startsWith("/access/")) {
    const u = request.nextUrl.clone();
    u.pathname =
      path === "/access"
        ? "/access-code"
        : `/access-code${path.slice("/access".length)}`;
    return NextResponse.redirect(u);
  }

  if (path === "/results" || path.startsWith("/results/")) {
    const u = request.nextUrl.clone();
    u.pathname = "/dashboard";
    const id = u.searchParams.get("id");
    if (id) {
      u.searchParams.delete("id");
      u.searchParams.set("highlight", id);
    }
    return NextResponse.redirect(u);
  }

  if (path === "/reports" || path.startsWith("/reports/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  /**
   * PKCE (magic link / OAuth): `updateSession` calls `getUser()`, which can
   * mutate auth cookies before `/auth/callback` runs. That clears the code
   * verifier and breaks `exchangeCodeForSession`. Skip session refresh here.
   */
  if (path === "/auth/callback" || path.startsWith("/auth/callback/")) {
    return NextResponse.next({ request });
  }

  const { response: supabaseResponse, supabase, user } =
    await updateSession(request);

  /** APIs respondem com JSON (401); nunca redirecionar para HTML /login */
  if (path.startsWith("/api/")) {
    return supabaseResponse;
  }

  /**
   * Páginas públicas: landing, login, callback de sessão, assets de rota.
   * Sem redirecionamento forçado para /login.
   */
  if (
    path === "/" ||
    path === "/login" ||
    path === "/icon" ||
    path === "/robots.txt" ||
    path === "/diagnostico" ||
    path.startsWith("/diagnostico/")
  ) {
    return supabaseResponse;
  }

  const needsSession = matchesPrefix(path, REQUIRES_SESSION);

  if (needsSession && !user) {
    const login = new URL("/login", request.url);
    const returnTo = `${path}${request.nextUrl.search}`;
    login.searchParams.set("next", returnTo);
    return NextResponse.redirect(login);
  }

  const needsGrant = matchesPrefix(path, REQUIRES_GRANT);

  if (user && needsGrant && supabase) {
    let { data: grant } = await supabase
      .from("access_grants")
      .select("user_id, can_take_diagnostic")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!grant) {
      await ensureEmailAccessGrantIfNeeded(supabase, user.id);
      ({ data: grant } = await supabase
        .from("access_grants")
        .select("user_id, can_take_diagnostic")
        .eq("user_id", user.id)
        .maybeSingle());
    }

    if (!grant) {
      const access = new URL("/access-code", request.url);
      access.searchParams.set("next", `${path}${request.nextUrl.search}`);
      return NextResponse.redirect(access);
    }

    const isAssessment =
      path === "/assessment" || path.startsWith("/assessment/");
    if (isAssessment && grant.can_take_diagnostic !== true) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  /**
   * Sessão ativa em /access-code: criar grant por e-mail (RPC) e sair desta página.
   * Evita pedir "código MECA" a quem só usa login por e-mail.
   */
  if (
    user &&
    supabase &&
    (path === "/access-code" || path.startsWith("/access-code/"))
  ) {
    await ensureEmailAccessGrantIfNeeded(supabase, user.id);
    const { data: grant } = await supabase
      .from("access_grants")
      .select("user_id, can_take_diagnostic")
      .eq("user_id", user.id)
      .maybeSingle();

    if (grant) {
      if (grant.can_take_diagnostic === true) {
        const rawNext = request.nextUrl.searchParams.get("next");
        let dest = sanitizeNextParam(rawNext);
        if (dest === "/access-code" || dest.startsWith("/access-code")) {
          dest = "/assessment";
        }
        return NextResponse.redirect(new URL(dest, request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
