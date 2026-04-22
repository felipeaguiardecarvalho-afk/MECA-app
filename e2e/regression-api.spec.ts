/**
 * REGRESSION: API-level business rules
 *
 * Tests run against the E2E server (auth disabled, E2E_INSTANT_DIAGNOSTIC=1).
 * These verify that the API layer enforces critical invariants even when
 * the auth middleware is relaxed.
 */
import { expect, test } from "@playwright/test";
import { buildAnswersPayload } from "./helpers/diagnostic-payload";

/* ================================================================== */
/*  1. POST /api/score — access control & security                    */
/* ================================================================== */

test.describe("REGRESSION — /api/score access control", () => {
  test("valid answers always produce a result (happy path)", async ({ request }) => {
    const res = await request.post("/api/score", {
      data: { answers: buildAnswersPayload(3) },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.diagnostic.mentalidade).toBe(50);
    expect(json.diagnostic.engajamento).toBe(50);
    // All-neutral answers → xScore=A=50, yScore=(C+E)/2=50 → top-right fallback.
    expect(json.diagnostic.archetype).toBe("Acelerado MECA");
  });

  test("body with extra user_id field is ignored — server uses session only", async ({ request }) => {
    const spoofedUserId = "00000000-0000-0000-0000-000000000000";
    const res = await request.post("/api/score", {
      data: {
        answers: buildAnswersPayload(3),
        user_id: spoofedUserId,
      },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    if (json.persisted && json.id) {
      expect(json.id).not.toBe(spoofedUserId);
    }
  });

  test("Zod rejects answers with value 0", async ({ request }) => {
    const answers = buildAnswersPayload(3);
    answers["1"] = 0;
    const res = await request.post("/api/score", { data: { answers } });
    expect(res.status()).toBe(400);
    expect((await res.json()).ok).toBe(false);
  });

  test("Zod rejects answers with value 6", async ({ request }) => {
    const answers = buildAnswersPayload(3);
    answers["1"] = 6;
    const res = await request.post("/api/score", { data: { answers } });
    expect(res.status()).toBe(400);
    expect((await res.json()).ok).toBe(false);
  });

  test("Zod rejects non-numeric answer values", async ({ request }) => {
    const answers: Record<string, unknown> = buildAnswersPayload(3);
    answers["1"] = "five";
    const res = await request.post("/api/score", { data: { answers } });
    expect(res.status()).toBe(400);
  });

  test("incomplete answers (59 of 60) are rejected", async ({ request }) => {
    const answers = buildAnswersPayload(3);
    delete answers["60"];
    const res = await request.post("/api/score", { data: { answers } });
    expect(res.status()).toBe(400);
  });

  test("empty body returns 400", async ({ request }) => {
    const res = await request.post("/api/score", { data: {} });
    expect(res.status()).toBe(400);
  });
});

/* ================================================================== */
/*  2. POST /api/score — determinism                                  */
/* ================================================================== */

test.describe("REGRESSION — /api/score determinism", () => {
  test("identical payloads produce identical scores across calls", async ({ request }) => {
    const answers = buildAnswersPayload(2);
    const results = await Promise.all(
      Array.from({ length: 3 }, () =>
        request.post("/api/score", { data: { answers } }).then((r) => r.json()),
      ),
    );

    const baseline = results[0].diagnostic;
    for (const r of results.slice(1)) {
      expect(r.diagnostic.mentalidade).toBe(baseline.mentalidade);
      expect(r.diagnostic.engajamento).toBe(baseline.engajamento);
      expect(r.diagnostic.cultura).toBe(baseline.cultura);
      expect(r.diagnostic.performance).toBe(baseline.performance);
      expect(r.diagnostic.direction).toBe(baseline.direction);
      expect(r.diagnostic.capacity).toBe(baseline.capacity);
      expect(r.diagnostic.archetype).toBe(baseline.archetype);
    }
  });

  test("different answers produce different scores", async ({ request }) => {
    const [res1, res2] = await Promise.all([
      request.post("/api/score", { data: { answers: buildAnswersPayload(1) } }),
      request.post("/api/score", { data: { answers: buildAnswersPayload(5) } }),
    ]);
    const d1 = (await res1.json()).diagnostic;
    const d2 = (await res2.json()).diagnostic;
    expect(d1.mentalidade).not.toBe(d2.mentalidade);
    expect(d1.mentalidade).toBe(0);
    expect(d2.mentalidade).toBe(100);
  });
});

/* ================================================================== */
/*  3. GET /api/user/history — data isolation & correctness           */
/* ================================================================== */

test.describe("REGRESSION — /api/user/history", () => {
  test("returns rows sorted by created_at DESC (latest first)", async ({ request }) => {
    const res = await request.get("/api/user/history");
    expect(res.status()).toBe(200);
    const { rows } = await res.json();
    if (rows && rows.length > 1) {
      for (let i = 0; i < rows.length - 1; i++) {
        const tA = new Date(rows[i].created_at).getTime();
        const tB = new Date(rows[i + 1].created_at).getTime();
        expect(tA).toBeGreaterThanOrEqual(tB);
      }
    }
  });

  test("each row has all 6 score fields + archetype + id + created_at", async ({ request }) => {
    const res = await request.get("/api/user/history");
    const { rows } = await res.json();
    const required = [
      "id", "created_at", "mentalidade", "engajamento",
      "cultura", "performance", "direction", "capacity", "archetype",
    ];
    for (const row of rows ?? []) {
      for (const field of required) {
        expect(row).toHaveProperty(field);
      }
    }
  });

  test("scores are numbers in 0–100 range", async ({ request }) => {
    const res = await request.get("/api/user/history");
    const { rows } = await res.json();
    const scoreKeys = ["mentalidade", "engajamento", "cultura", "performance", "direction", "capacity"];
    for (const row of rows ?? []) {
      for (const key of scoreKeys) {
        const v = row[key];
        expect(typeof v).toBe("number");
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
  });

  test("created_at is valid ISO date string", async ({ request }) => {
    const res = await request.get("/api/user/history");
    const { rows } = await res.json();
    for (const row of rows ?? []) {
      const d = new Date(row.created_at);
      expect(d.getTime()).not.toBeNaN();
      expect(row.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  test("all rows belong to the same user_id (data isolation)", async ({ request }) => {
    const res = await request.get("/api/user/history");
    const { rows } = await res.json();
    if (rows && rows.length > 1) {
      const firstUserId = rows[0].user_id;
      for (const row of rows) {
        expect(row.user_id).toBe(firstUserId);
      }
    }
  });
});

/* ================================================================== */
/*  4. POST /api/admin/unlock-diagnostic — admin gate                 */
/* ================================================================== */

test.describe("REGRESSION — /api/admin/unlock-diagnostic", () => {
  test("returns 403 when auth is disabled (E2E mode)", async ({ request }) => {
    const res = await request.post("/api/admin/unlock-diagnostic", {
      data: { user_id: "00000000-0000-0000-0000-000000000001" },
    });
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json.ok).toBe(false);
  });

  test("rejects invalid user_id format", async ({ request }) => {
    const res = await request.post("/api/admin/unlock-diagnostic", {
      data: { user_id: "not-a-uuid" },
    });
    const status = res.status();
    expect(status).toBeGreaterThanOrEqual(400);
    expect(status).toBeLessThan(500);
  });

  test("rejects empty body", async ({ request }) => {
    const res = await request.post("/api/admin/unlock-diagnostic", {
      data: {},
    });
    const status = res.status();
    expect(status).toBeGreaterThanOrEqual(400);
    expect(status).toBeLessThan(500);
  });
});
