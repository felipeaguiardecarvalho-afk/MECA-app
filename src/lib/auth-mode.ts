/**
 * Modo desenvolvimento: desativa login, código de acesso e gates no middleware.
 * Defina NEXT_PUBLIC_DISABLE_AUTH=true em .env.local (e reinicie o servidor).
 *
 * Para gravar diagnósticos na base sem sessão, use também:
 * - SUPABASE_SERVICE_ROLE_KEY
 * - DEV_ANONYMOUS_USER_ID=<uuid de um utilizador criado em Authentication>
 */

export function isAuthDisabled(): boolean {
  const v =
    process.env.NEXT_PUBLIC_DISABLE_AUTH ?? process.env.DISABLE_AUTH;
  return v === "true" || v === "1";
}
