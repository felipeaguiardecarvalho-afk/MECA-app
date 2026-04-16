import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { expectPageOpensWithoutServerError } from "./helpers/page-load";

/**
 * UAT — critérios de UX automatizados:
 * - Rotas críticas renderizam e respondem a interação
 * - Abertura de página: HTTP 2xx/3xx (nunca 5xx) e sem página de erro do browser
 * - Acessibilidade: falha apenas em violações `critical` (axe-core)
 * - Fluxo: diagnóstico (respostas neutras em modo E2E) → dashboard
 */

/** Rotas HTML críticas (servidor E2E com auth desativada — sem redirect para /login). */
const SMOKE_PAGE_PATHS = [
  "/",
  "/login",
  "/access-code",
  "/dashboard",
  "/assessment",
  "/diagnostico",
  "/plano-de-acao",
] as const;

test.describe("Abertura de página (smoke)", () => {
  for (const path of SMOKE_PAGE_PATHS) {
    test(`${path} carrega sem erro de servidor (HTTP + corpo)`, async ({
      page,
    }) => {
      await expectPageOpensWithoutServerError(page, path);
    });
  }
});

test.describe("Páginas públicas", () => {
  test("landing MECA e CTA para diagnóstico (auth desativado no E2E)", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /^MECA$/ })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Iniciar Diagnóstico MECA" }).first(),
    ).toBeVisible();
  });

  test("login: título, botão e sem violações críticas de a11y", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.getByTestId("login-title")).toHaveText("Entrar");
    await expect(
      page.getByRole("button", { name: /Receber código/i }),
    ).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(
      critical,
      critical.map((v) => `${v.id}: ${v.description}`).join("\n"),
    ).toEqual([]);
  });
});

test.describe("Fluxo diagnóstico → dashboard (E2E_INSTANT_DIAGNOSTIC)", () => {
  test("submissão automática leva ao dashboard com perfil", async ({
    page,
  }) => {
    await page.goto("/assessment");
    await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
    await expect(
      page.getByRole("heading", { name: /Seu Perfil MECA/i }),
    ).toBeVisible();
    await expect(page.getByText(/Resultado do Diagnóstico/i)).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(
      critical,
      critical.map((v) => `${v.id}: ${v.description}`).join("\n"),
    ).toEqual([]);
  });
});

test.describe("API", () => {
  test("POST magic-link devolve JSON (e-mail não-master → bypass)", async ({
    request,
  }) => {
    const res = await request.post("/api/auth/magic-link", {
      data: {
        email: "anon-uat@example.com",
        next: "/assessment",
      },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"] || "").toMatch(/json/i);
    const json = (await res.json()) as { bypass?: boolean };
    expect(json.bypass).toBe(false);
  });
});
