import { logger } from "@/lib/logger";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase sometimes redirects magic links with tokens in the **hash** (implicit flow).
 * HTTP não envia o fragmento ao servidor — a troca tem de correr no cliente
 * (`src/app/auth/callback/AuthCallbackClient.tsx`).
 */
export async function recoverSessionFromImplicitHash(
  supabase: SupabaseClient,
): Promise<{ ok: true } | { ok: false }> {
  if (typeof window === "undefined") return { ok: false };

  const raw = window.location.hash;
  if (!raw || raw.length < 2) return { ok: false };
  if (!raw.includes("access_token")) return { ok: false };

  const params = new URLSearchParams(raw.startsWith("#") ? raw.slice(1) : raw);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) return { ok: false };

  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) {
    logger.error("[auth] setSession from implicit hash", error);
    return { ok: false };
  }
  return { ok: true };
}
