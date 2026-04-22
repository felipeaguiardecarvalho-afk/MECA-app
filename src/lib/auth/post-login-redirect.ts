/**
 * Allowed `next` targets after Supabase auth (magic link / OAuth callback).
 * Keep in sync with middleware expectations for logged-in users.
 */
export const ALLOWED_AFTER_LOGIN = [
  "/dashboard",
  "/fundamentos",
  "/arquetipos",
  "/assessment",
  "/plano-de-acao",
] as const;

export function sanitizeNextParam(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/assessment";
  }
  const pathOnly = raw.split("?")[0] ?? raw;
  const ok = ALLOWED_AFTER_LOGIN.some(
    (p) => pathOnly === p || pathOnly.startsWith(`${p}/`),
  );
  return ok ? raw : "/assessment";
}
