import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { isAuthDisabled } from "@/lib/auth-mode";

const env = process.env as Record<string, string | undefined>;

const KEYS = [
  "NODE_ENV",
  "DISABLE_AUTH",
  "NEXT_PUBLIC_DISABLE_AUTH",
] as const;

type Key = (typeof KEYS)[number];

const snapshot: Partial<Record<Key, string | undefined>> = {};

beforeEach(() => {
  for (const k of KEYS) snapshot[k] = env[k];
});

afterEach(() => {
  for (const k of KEYS) {
    if (snapshot[k] === undefined) delete env[k];
    else env[k] = snapshot[k];
  }
});

describe("isAuthDisabled", () => {
  it("returns true in development when DISABLE_AUTH is active", () => {
    env.NODE_ENV = "development";
    env.DISABLE_AUTH = "1";
    delete env.NEXT_PUBLIC_DISABLE_AUTH;
    expect(isAuthDisabled()).toBe(true);
  });

  it("throws in production when DISABLE_AUTH is set", () => {
    env.NODE_ENV = "production";
    env.DISABLE_AUTH = "1";
    delete env.NEXT_PUBLIC_DISABLE_AUTH;
    expect(() => isAuthDisabled()).toThrow(
      /Authentication cannot be disabled in production/,
    );
  });

  it("throws in production when NEXT_PUBLIC_DISABLE_AUTH is set", () => {
    env.NODE_ENV = "production";
    delete env.DISABLE_AUTH;
    env.NEXT_PUBLIC_DISABLE_AUTH = "true";
    expect(() => isAuthDisabled()).toThrow(
      /Authentication cannot be disabled in production/,
    );
  });

  it("returns false in production when bypass flags are unset", () => {
    env.NODE_ENV = "production";
    delete env.DISABLE_AUTH;
    delete env.NEXT_PUBLIC_DISABLE_AUTH;
    expect(isAuthDisabled()).toBe(false);
  });
});
