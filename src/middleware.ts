import { NextResponse, type NextRequest } from "next/server";
import { assertProductionAuthConfig, isAuthDisabled } from "@/lib/auth-mode";
import { buildCsp, generateNonce } from "@/lib/security/csp";
import { CANONICAL_SITE_HOST } from "@/lib/site-domain";
import { updateSession } from "@/lib/supabase/middleware";

/** Rotas que exigem sessão (sem sessão → /login?next=...) */
const REQUIRES_SESSION = ["/assessment", "/dashboard", "/plano-de-acao"];

function matchesPrefix(path: string, prefixes: string[]): boolean {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * Per-request Content-Security-Policy with a fresh nonce for `<style>` and
 * `<script>` elements. The nonce is forwarded to downstream Server Components
 * via the `x-nonce` request header (Next.js auto-attaches it to its own
 * framework `<script>` tags when it sees a matching nonce in the CSP header).
 *
 * CSP is emitted from middleware instead of `next.config.ts` headers because
 * the nonce has to change on every request — a static header cannot do that.
 */
export async function middleware(request: NextRequest) {
  const nonce = generateNonce();
  // Mutable in middleware runtime; propagates to every `NextResponse.next({ request })`
  // constructed downstream (including inside `updateSession`) so RSC can read it via
  // `headers().get('x-nonce')`.
  request.headers.set("x-nonce", nonce);

  const response = await routeMiddleware(request);
  response.headers.set("content-security-policy", buildCsp(nonce));
  // Small debug aid: lets the browser's SSR/hydration code read the nonce out
  // of the response headers if ever needed without re-parsing CSP. Not a secret.
  response.headers.set("x-nonce", nonce);
  return response;
}

function normalizePathname(pathname: string): string {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

async function routeMiddleware(request: NextRequest): Promise<NextResponse> {
  assertProductionAuthConfig();

  /** Produção: www → apex (SEO + cookies num único host). Ignora localhost e *.vercel.app. */
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (host === `www.${CANONICAL_SITE_HOST}`) {
    const u = request.nextUrl.clone();
    u.hostname = CANONICAL_SITE_HOST;
    u.protocol = "https:";
    return NextResponse.redirect(u, 308);
  }

  /** Alinha com o router da app (`/login` e `/login/` → mesmo segmento). */
  const path = normalizePathname(request.nextUrl.pathname);

  if (isAuthDisabled()) {
    const { response } = await updateSession(request);
    return response;
  }

  if (path === "/access" || path.startsWith("/access/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
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

  const { response: supabaseResponse, user } = await updateSession(request);

  /** APIs respondem com JSON (401); nunca redirecionar para HTML /login */
  if (path.startsWith("/api/")) {
    return supabaseResponse;
  }

  /**
   * Páginas públicas: landing, fundamentos, arquétipos, login, callback de sessão, assets de rota.
   * Sem redirecionamento forçado para /login nem exigência de access grant.
   */
  if (
    path === "/" ||
    path === "/fundamentos" ||
    path.startsWith("/fundamentos/") ||
    path === "/arquetipos" ||
    path.startsWith("/arquetipos/") ||
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

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
