import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function assertServerOnly(): void {
  if (typeof window !== "undefined") {
    throw new Error(
      "Service role Supabase client must only be used on the server.",
    );
  }
}

/**
 * Never expose the service role key via NEXT_PUBLIC_* — it would ship to browsers.
 */
function assertNoPublicServiceRoleLeak(): void {
  if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY must not be set. Remove it from the environment — service role keys must never be public.",
    );
  }
}

/**
 * Server-only client with elevated privileges. Never import from client components.
 * Returns null if SUPABASE_SERVICE_ROLE_KEY is unset (dev fallback may use RLS + anon).
 */
export function createServiceRoleClient(): SupabaseClient | null {
  assertServerOnly();
  assertNoPublicServiceRoleLeak();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.trim() || !key?.trim()) {
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Alias — same constraints as `createServiceRoleClient`. */
export const createAdminClient = createServiceRoleClient;
