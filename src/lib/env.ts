/**
 * Canonical site origin for metadata and redirects (Vercel sets VERCEL_URL).
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://meca.app).
 *
 * This module also centralizes production env assertions (`assertProductionEnv`)
 * called from `src/instrumentation.ts` at server boot. Failing fast here is the
 * only safe behaviour when a critical secret is missing or a dangerous bypass
 * flag leaks into production.
 */

/** Alinhado com `npm run dev` (next dev -p 3001 em package.json). */
const FALLBACK_ORIGIN = "http://localhost:3001";

const isProduction = (): boolean => process.env.NODE_ENV === "production";

/**
 * Returns true when one of the recognized "auth bypass" flags is set.
 * These flags are only legal in development; production must reject them.
 */
function envWantsAuthDisabled(): boolean {
  const v =
    process.env.NEXT_PUBLIC_DISABLE_AUTH ?? process.env.DISABLE_AUTH;
  return v === "true" || v === "1";
}

/**
 * Parse a public site URL safely. Values without a scheme (e.g. "meca.app")
 * are treated as https — bare host strings would otherwise make `new URL()` throw.
 */
function parsePublicOrigin(raw: string): string | null {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return null;
  try {
    const withScheme = trimmed.includes("://")
      ? trimmed
      : `https://${trimmed}`;
    return new URL(withScheme).origin;
  } catch {
    return null;
  }
}

export function getSiteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    const parsed = parsePublicOrigin(explicit);
    if (parsed) return parsed;
    console.error(
      "[env] Invalid NEXT_PUBLIC_SITE_URL — must be a valid URL (e.g. https://meca.app). Got:",
      explicit,
    );
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    try {
      return new URL(`https://${vercel}`).origin;
    } catch {
      console.error("[env] Invalid VERCEL_URL:", vercel);
    }
  }

  return FALLBACK_ORIGIN;
}

/**
 * Used by `metadata` in root layout — must never throw or every route returns 500.
 */
export function getMetadataBase(): URL {
  try {
    return new URL(`${getSiteOrigin()}/`);
  } catch (e) {
    console.error("[env] getMetadataBase: falling back to localhost", e);
    return new URL(`${FALLBACK_ORIGIN}/`);
  }
}

/* ---------------------------------------------------------------- *
 *  Production safety: fail-fast assertions                         *
 * ---------------------------------------------------------------- */

/**
 * Variables that MUST be defined in production. Missing values would expose
 * the app to unauthenticated requests, broken auth, or runtime crashes.
 */
const REQUIRED_PROD_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

/**
 * Variables that MUST NEVER be set in production — they enable bypasses or
 * leak server-only secrets to the browser bundle.
 */
const FORBIDDEN_PROD_ENV = [
  "NEXT_PUBLIC_DISABLE_AUTH",
  "DISABLE_AUTH",
  /** Dev-only fixed user for writes without a session — must never ship to prod. */
  "DEV_ANONYMOUS_USER_ID",
  /** E2E shortcut that auto-fills assessment — must never ship to prod. */
  "E2E_INSTANT_DIAGNOSTIC",
  "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY",
  // Legacy bypass flags — refused even if accidentally re-introduced.
  "ENABLE_MAGIC_LINK_SERVICE_FOR_ALL",
  "MAGIC_LINK_BYPASS_ALL_EMAILS",
] as const;

export class ProductionEnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductionEnvError";
  }
}

/**
 * Validate environment variables at server startup.
 * In production, throws on missing required vars or on forbidden bypass flags
 * (auth off, dev anonymous user, E2E shortcuts, leaked service role, etc.).
 * In development, only logs (so DX is preserved).
 *
 * Idempotent: calling twice does the same work; safe to invoke from
 * `instrumentation.ts` and (defense in depth) from `auth-mode`.
 */
export function assertProductionEnv(): void {
  if (typeof window !== "undefined") return;

  if (!isProduction()) {
    if (envWantsAuthDisabled()) {
      console.warn(
        "[env] DEV: authentication is disabled via NEXT_PUBLIC_DISABLE_AUTH / DISABLE_AUTH. " +
          "Production will refuse to boot with these flags set.",
      );
    }
    return;
  }

  const missing = REQUIRED_PROD_ENV.filter(
    (k) => !process.env[k] || !process.env[k]?.trim(),
  );
  const forbidden = FORBIDDEN_PROD_ENV.filter(
    (k) => process.env[k] && process.env[k]?.trim(),
  );

  // ADMIN_MFA_ENFORCE=0/false is a dev-only escape hatch. In production any
  // disabling value must refuse to boot — otherwise a misconfigured deployment
  // could silently downgrade admin auth to password-only.
  const mfaRaw = process.env.ADMIN_MFA_ENFORCE?.trim().toLowerCase();
  const mfaDisabledInProd = mfaRaw === "0" || mfaRaw === "false";

  /** Node disables TLS verification globally when set to "0" (SMTP, HTTPS, etc.). */
  const tlsVerificationDisabled =
    process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0";

  if (
    missing.length === 0 &&
    forbidden.length === 0 &&
    !mfaDisabledInProd &&
    !tlsVerificationDisabled
  )
    return;

  const lines: string[] = ["[SECURITY] Production env validation failed."];
  if (missing.length > 0) {
    lines.push(`  Missing required: ${missing.join(", ")}`);
  }
  if (forbidden.length > 0) {
    lines.push(
      `  Forbidden in production (must be unset): ${forbidden.join(", ")}`,
    );
  }
  if (mfaDisabledInProd) {
    lines.push(
      "  ADMIN_MFA_ENFORCE must not be 0/false in production (admin MFA is mandatory).",
    );
  }
  if (tlsVerificationDisabled) {
    lines.push(
      "  NODE_TLS_REJECT_UNAUTHORIZED must not be 0 in production (TLS verification is mandatory).",
    );
  }
  const message = lines.join("\n");

  console.error(message);
  throw new ProductionEnvError(message);
}
