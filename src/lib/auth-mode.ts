/**
 * Modo desenvolvimento: desativa login, código de acesso e gates no middleware.
 * Defina NEXT_PUBLIC_DISABLE_AUTH=true em .env.local (e reinicie o servidor).
 *
 * Para gravar diagnósticos na base sem sessão, use também:
 * - SUPABASE_SERVICE_ROLE_KEY
 * - DEV_ANONYMOUS_USER_ID=<uuid de um utilizador criado em Authentication>
 *
 * PRODUÇÃO: autenticação NUNCA pode ser desativada — ver `assertProductionAuthConfig`.
 * Defesa em profundidade: a validação central acontece em `src/lib/env.ts`
 * (`assertProductionEnv`, chamada via `src/instrumentation.ts` no boot do servidor).
 */

function envWantsAuthDisabled(): boolean {
  const v =
    process.env.NEXT_PUBLIC_DISABLE_AUTH ?? process.env.DISABLE_AUTH;
  return v === "true" || v === "1";
}

/**
 * Em produção, autenticação não pode estar desligada.
 * Chamado no middleware em cada pedido e por `isAuthDisabled()` em produção —
 * falha de forma explícita se as flags de bypass estiverem definidas.
 *
 * Redundante com `assertProductionEnv()` (boot em `instrumentation.ts`):
 * defesa em profundidade se a flag for injetada após o boot ou se algum
 * caminho de código correr antes das asserções de env.
 */
export function assertProductionAuthConfig(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (!envWantsAuthDisabled()) return;
  console.error(
    "[SECURITY] CRITICAL: DISABLE_AUTH / NEXT_PUBLIC_DISABLE_AUTH must not be set in production.",
  );
  throw new Error(
    "Authentication cannot be disabled in production. Remove DISABLE_AUTH and NEXT_PUBLIC_DISABLE_AUTH.",
  );
}

/**
 * `true` apenas em desenvolvimento quando `NEXT_PUBLIC_DISABLE_AUTH` ou
 * `DISABLE_AUTH` está ativo. Em produção chama sempre `assertProductionAuthConfig()`
 * primeiro — nunca retorna `true` em produção; lança se as flags existirem.
 */
export function isAuthDisabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    assertProductionAuthConfig();
    return false;
  }
  return envWantsAuthDisabled();
}
