import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates `access_grants` for the current session user when missing, so magic-link
 * login is enough to use the app (no access code). Idempotent.
 */
export async function ensureEmailAccessGrantIfNeeded(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data: grant } = await supabase
    .from("access_grants")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (grant) return;

  const { error } = await supabase.rpc("ensure_email_access_grant");
  if (error) {
    console.error("[ensure_email_access_grant]", error.message);
  }
}
