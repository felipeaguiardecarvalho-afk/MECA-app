/**
 * Next.js instrumentation hook (runs once at server boot).
 *
 * We use it to fail fast in production when the environment is misconfigured
 * (missing required secrets, dangerous bypass flags enabled, or service role
 * key accidentally exposed via NEXT_PUBLIC_*). Catching these at boot is the
 * only way to guarantee a misconfigured deployment never serves traffic.
 *
 * Edge runtime is intentionally skipped: service role + secrets only matter on
 * Node, and Edge can't import every server module the assertions touch.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { assertProductionEnv } = await import("@/lib/env");
  assertProductionEnv();

  const { logDevMagicLinkEmailBootStatus } = await import(
    "@/lib/email/email-config"
  );
  logDevMagicLinkEmailBootStatus();
}
