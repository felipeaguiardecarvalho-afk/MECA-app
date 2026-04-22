import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ProductionEnvError, assertProductionEnv } from "@/lib/env";

const ENV_KEYS = [
  "NODE_ENV",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_DISABLE_AUTH",
  "DISABLE_AUTH",
  "DEV_ANONYMOUS_USER_ID",
  "E2E_INSTANT_DIAGNOSTIC",
  "ENABLE_MAGIC_LINK_SERVICE_FOR_ALL",
  "MAGIC_LINK_BYPASS_ALL_EMAILS",
  "ADMIN_MFA_ENFORCE",
  "NODE_TLS_REJECT_UNAUTHORIZED",
] as const;

type EnvKey = (typeof ENV_KEYS)[number];

const original: Partial<Record<EnvKey, string | undefined>> = {};

// `NODE_ENV` is typed read-only by @types/node; bypass with a loose alias.
const env = process.env as Record<string, string | undefined>;

function setEnv(key: EnvKey, value: string | undefined): void {
  if (value === undefined) {
    delete env[key];
  } else {
    env[key] = value;
  }
}

beforeEach(() => {
  for (const k of ENV_KEYS) original[k] = process.env[k];
});

afterEach(() => {
  for (const k of ENV_KEYS) setEnv(k, original[k]);
});

describe("assertProductionEnv", () => {
  it("does not throw in development even with bypass flags", () => {
    setEnv("NODE_ENV", "development");
    setEnv("NEXT_PUBLIC_DISABLE_AUTH", "1");
    setEnv("DISABLE_AUTH", "1");
    expect(() => assertProductionEnv()).not.toThrow();
  });

  it("throws in production when required vars are missing", () => {
    setEnv("NODE_ENV", "production");
    setEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
    setEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", undefined);
    setEnv("SUPABASE_SERVICE_ROLE_KEY", undefined);
    setEnv("NEXT_PUBLIC_DISABLE_AUTH", undefined);
    setEnv("DISABLE_AUTH", undefined);
    expect(() => assertProductionEnv()).toThrow(ProductionEnvError);
  });

  it("throws in production when DISABLE_AUTH is set", () => {
    setEnv("NODE_ENV", "production");
    setEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    setEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    setEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    setEnv("DISABLE_AUTH", "1");
    expect(() => assertProductionEnv()).toThrow(/DISABLE_AUTH/);
  });

  it("throws in production when NEXT_PUBLIC_DISABLE_AUTH is set", () => {
    setEnv("NODE_ENV", "production");
    setEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    setEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    setEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    setEnv("NEXT_PUBLIC_DISABLE_AUTH", "1");
    expect(() => assertProductionEnv()).toThrow(/NEXT_PUBLIC_DISABLE_AUTH/);
  });

  it("throws when service role key is exposed via NEXT_PUBLIC_*", () => {
    setEnv("NODE_ENV", "production");
    setEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    setEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    setEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    setEnv("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", "leaked");
    expect(() => assertProductionEnv()).toThrow(
      /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/,
    );
  });

  it("throws when legacy magic-link bypass flags are set in production", () => {
    setEnv("NODE_ENV", "production");
    setEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    setEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    setEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    setEnv("ENABLE_MAGIC_LINK_SERVICE_FOR_ALL", "1");
    expect(() => assertProductionEnv()).toThrow(
      /ENABLE_MAGIC_LINK_SERVICE_FOR_ALL/,
    );
  });

  it("throws in production when ADMIN_MFA_ENFORCE is disabled", () => {
    setEnv("NODE_ENV", "production");
    setEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    setEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    setEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    setEnv("ADMIN_MFA_ENFORCE", "0");
    expect(() => assertProductionEnv()).toThrow(/ADMIN_MFA_ENFORCE/);
  });

  it("throws in production when ADMIN_MFA_ENFORCE=false", () => {
    setEnv("NODE_ENV", "production");
    setEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    setEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    setEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    setEnv("ADMIN_MFA_ENFORCE", "false");
    expect(() => assertProductionEnv()).toThrow(/ADMIN_MFA_ENFORCE/);
  });

  it("throws in production when NODE_TLS_REJECT_UNAUTHORIZED=0", () => {
    setEnv("NODE_ENV", "production");
    setEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    setEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    setEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    setEnv("NODE_TLS_REJECT_UNAUTHORIZED", "0");
    expect(() => assertProductionEnv()).toThrow(/NODE_TLS_REJECT_UNAUTHORIZED/);
  });

  it("throws in production when DEV_ANONYMOUS_USER_ID is set", () => {
    setEnv("NODE_ENV", "production");
    setEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    setEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    setEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    setEnv("DEV_ANONYMOUS_USER_ID", "00000000-0000-4000-8000-000000000001");
    expect(() => assertProductionEnv()).toThrow(/DEV_ANONYMOUS_USER_ID/);
  });

  it("throws in production when E2E_INSTANT_DIAGNOSTIC is set", () => {
    setEnv("NODE_ENV", "production");
    setEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    setEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    setEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    setEnv("E2E_INSTANT_DIAGNOSTIC", "1");
    expect(() => assertProductionEnv()).toThrow(/E2E_INSTANT_DIAGNOSTIC/);
  });

  it("passes in production with the canonical env set and no bypass flags", () => {
    setEnv("NODE_ENV", "production");
    setEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    setEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    setEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    setEnv("NEXT_PUBLIC_DISABLE_AUTH", undefined);
    setEnv("DISABLE_AUTH", undefined);
    setEnv("ENABLE_MAGIC_LINK_SERVICE_FOR_ALL", undefined);
    setEnv("MAGIC_LINK_BYPASS_ALL_EMAILS", undefined);
    setEnv("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", undefined);
    setEnv("DEV_ANONYMOUS_USER_ID", undefined);
    setEnv("E2E_INSTANT_DIAGNOSTIC", undefined);
    setEnv("ADMIN_MFA_ENFORCE", undefined);
    setEnv("NODE_TLS_REJECT_UNAUTHORIZED", undefined);
    expect(() => assertProductionEnv()).not.toThrow();
  });
});
