import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { sanitizeNextParam } from "@/lib/auth/post-login-redirect";
import { NextResponse, type NextRequest } from "next/server";

function loginRedirect(
  request: NextRequest,
  params: Record<string, string | undefined>,
) {
  const next = sanitizeNextParam(request.nextUrl.searchParams.get("next"));
  const url = new URL("/login", request.nextUrl.origin);
  url.searchParams.set("next", next);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }
  return NextResponse.redirect(url);
}

/**
 * Magic link / OAuth PKCE: session cookies MUST be set on this Route Handler's
 * `NextResponse`. Using only `cookies()` from `next/headers` often fails to
 * attach Set-Cookie to the redirect, so the user appears logged out at /login.
 */
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const oauthError = request.nextUrl.searchParams.get("error");
    const oauthDesc = request.nextUrl.searchParams.get("error_description");
    const next = sanitizeNextParam(request.nextUrl.searchParams.get("next"));

    if (oauthError) {
      return loginRedirect(request, {
        error: "oauth",
        detail: oauthDesc ?? oauthError,
      });
    }

    if (!code) {
      return loginRedirect(request, { error: "missing_code" });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!supabaseUrl || !supabaseAnon) {
      return loginRedirect(request, { error: "config" });
    }

    let redirectTarget: URL;
    try {
      redirectTarget = new URL(next, request.nextUrl.origin);
    } catch {
      return loginRedirect(request, { error: "missing_code" });
    }

    const response = NextResponse.redirect(redirectTarget);

    const supabase = createServerClient(supabaseUrl, supabaseAnon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return loginRedirect(request, {
        error: "exchange",
        detail: error.message,
      });
    }

    return response;
  } catch (e) {
    const detail = e instanceof Error ? e.message : "unexpected";
    console.error("[auth/callback]", e);
    return loginRedirect(request, { error: "exchange", detail });
  }
}
