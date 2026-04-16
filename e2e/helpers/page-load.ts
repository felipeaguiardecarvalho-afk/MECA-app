import { expect, type Page } from "@playwright/test";

/**
 * Garante que a navegação não termina em 5xx nem na página de erro do browser
 * (“This page isn't working” / “unable to handle this request”).
 */
export async function expectPageOpensWithoutServerError(
  page: Page,
  path: string,
): Promise<void> {
  const response = await page.goto(path, {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });

  expect(
    response,
    `Sem resposta HTTP ao abrir ${path} (servidor a correr?)`,
  ).not.toBeNull();

  const status = response!.status();
  expect(
    status,
    `${path}: HTTP ${status} — falha do servidor (esperado 2xx/3xx)`,
  ).toBeGreaterThanOrEqual(200);
  expect(status).toBeLessThan(500);

  const text = await page.locator("body").innerText().catch(() => "");
  expect(
    text,
    "Parece página de erro do browser (localhost indisponível / 5xx mascarado)",
  ).not.toMatch(
    /this page isn't working|unable to handle this request|can't be reached|não é possível aceder|esta página não está a funcionar/i,
  );
}
