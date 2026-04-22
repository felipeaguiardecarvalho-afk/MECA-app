import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { buildAnswersPayload } from "./helpers/diagnostic-payload";
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
      page.getByRole("button", { name: /Receber link/i }),
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

/* ------------------------------------------------------------------ */
/*  API TESTS                                                         */
/* ------------------------------------------------------------------ */

test.describe("API — POST /api/auth/magic-link", () => {
  test("returns uniform success JSON (anti-enumeration)", async ({ request }) => {
    const res = await request.post("/api/auth/magic-link", {
      data: {
        email: "anon-uat@example.com",
        next: "/assessment",
      },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"] || "").toMatch(/json/i);
    const json = (await res.json()) as { success?: boolean };
    expect(json.success).toBe(true);
  });
});

test.describe("API — POST /api/score", () => {
  test("valid payload returns ok with diagnostic data", async ({ request }) => {
    const answers = buildAnswersPayload(3);
    const res = await request.post("/api/score", {
      data: { answers },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.diagnostic).toBeDefined();
    expect(json.diagnostic.mentalidade).toBeGreaterThanOrEqual(0);
    expect(json.diagnostic.mentalidade).toBeLessThanOrEqual(100);
    expect(json.diagnostic.archetype).toBeDefined();
    expect(typeof json.diagnostic.archetype).toBe("string");
  });

  test("invalid JSON returns 400", async ({ request }) => {
    const res = await request.post("/api/score", {
      headers: { "content-type": "application/json" },
      data: "not json{{{",
    });
    const status = res.status();
    expect(status).toBeGreaterThanOrEqual(400);
    expect(status).toBeLessThan(500);
  });

  test("missing answers returns 400", async ({ request }) => {
    const res = await request.post("/api/score", {
      data: {},
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  test("out-of-range values return 400", async ({ request }) => {
    const answers = buildAnswersPayload(3);
    answers["1"] = 99;
    const res = await request.post("/api/score", {
      data: { answers },
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  test("score calculation is deterministic", async ({ request }) => {
    const answers = buildAnswersPayload(4);
    const [res1, res2] = await Promise.all([
      request.post("/api/score", { data: { answers } }),
      request.post("/api/score", { data: { answers } }),
    ]);
    const json1 = await res1.json();
    const json2 = await res2.json();
    expect(json1.diagnostic.mentalidade).toBe(json2.diagnostic.mentalidade);
    expect(json1.diagnostic.engajamento).toBe(json2.diagnostic.engajamento);
    expect(json1.diagnostic.archetype).toBe(json2.diagnostic.archetype);
  });
});

test.describe("API — GET /api/user/history", () => {
  test("returns ok with rows array", async ({ request }) => {
    const res = await request.get("/api/user/history");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.rows)).toBe(true);
  });

  test("rows have required fields when present", async ({ request }) => {
    const res = await request.get("/api/user/history");
    const json = await res.json();
    if (json.rows && json.rows.length > 0) {
      const row = json.rows[0];
      expect(row).toHaveProperty("id");
      expect(row).toHaveProperty("created_at");
      expect(row).toHaveProperty("mentalidade");
      expect(row).toHaveProperty("engajamento");
      expect(row).toHaveProperty("cultura");
      expect(row).toHaveProperty("performance");
      expect(row).toHaveProperty("direction");
      expect(row).toHaveProperty("capacity");
      expect(row).toHaveProperty("archetype");
    }
  });

  test("rows are sorted by created_at DESC", async ({ request }) => {
    const res = await request.get("/api/user/history");
    const json = await res.json();
    if (json.rows && json.rows.length > 1) {
      for (let i = 0; i < json.rows.length - 1; i++) {
        const a = new Date(json.rows[i].created_at).getTime();
        const b = new Date(json.rows[i + 1].created_at).getTime();
        expect(a).toBeGreaterThanOrEqual(b);
      }
    }
  });
});
