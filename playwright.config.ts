import { defineConfig, devices } from "@playwright/test";

/**
 * UAT E2E: arranca `next dev` com auth desativada e diagnóstico instantâneo.
 * Não usar este servidor para desenvolvimento manual (usa NEXT_PUBLIC_DISABLE_AUTH).
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: process.env.CI ? "github" : "list",
  use: {
    /** Porta dedicada ao UAT para não colidir com `next dev` em :3000 */
    baseURL: "http://127.0.0.1:3004",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "pt-BR",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "cross-env NEXT_PUBLIC_DISABLE_AUTH=1 DISABLE_AUTH=1 E2E_INSTANT_DIAGNOSTIC=1 DISABLE_MAGIC_LINK_SERVICE_FOR_ALL=1 next dev -p 3004 -H 127.0.0.1",
    url: "http://127.0.0.1:3004",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
