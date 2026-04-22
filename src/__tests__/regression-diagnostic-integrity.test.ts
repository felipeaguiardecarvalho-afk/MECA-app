/**
 * REGRESSION: Diagnostic Integrity
 *
 * Business rule: identical answers MUST always produce identical scores and archetype.
 * A drift here means users get different results on re-take — destroys trust.
 */
import { describe, expect, it } from "vitest";
import { computeDiagnostic, MECA_QUESTIONS } from "@/lib/diagnostic-engine";
import { makeAnswers, makeAnswersWithPillar } from "./helpers/diagnostic";

describe("REGRESSION — diagnostic determinism", () => {
  it("same answers → identical result across 100 invocations", () => {
    const answers = makeAnswers(4);
    const baseline = computeDiagnostic(answers);

    for (let i = 0; i < 100; i++) {
      const result = computeDiagnostic({ ...answers });
      expect(result).toStrictEqual(baseline);
    }
  });

  it("every Likert boundary produces a defined score (no NaN, no undefined)", () => {
    for (const v of [1, 2, 3, 4, 5] as const) {
      const r = computeDiagnostic(makeAnswers(v));
      for (const key of ["mentalidade", "engajamento", "cultura", "performance", "direction", "capacity"] as const) {
        expect(Number.isFinite(r[key])).toBe(true);
        expect(r[key]).toBeGreaterThanOrEqual(0);
        expect(r[key]).toBeLessThanOrEqual(100);
      }
      expect(typeof r.archetype).toBe("string");
      expect(r.archetype.length).toBeGreaterThan(0);
    }
  });

  it("changing ONE answer changes the result (sensitivity check)", () => {
    const a = makeAnswers(3);
    const b = { ...a, "1": 5 };
    const ra = computeDiagnostic(a);
    const rb = computeDiagnostic(b);
    expect(ra.mentalidade).not.toBe(rb.mentalidade);
  });
});

describe("REGRESSION — invalid input rejection", () => {
  it("rejects answer value 0", () => {
    const a = makeAnswers(3);
    a["1"] = 0;
    expect(() => computeDiagnostic(a)).toThrow();
  });

  it("rejects answer value 6", () => {
    const a = makeAnswers(3);
    a["1"] = 6;
    expect(() => computeDiagnostic(a)).toThrow();
  });

  it("rejects negative answer", () => {
    const a = makeAnswers(3);
    a["1"] = -1;
    expect(() => computeDiagnostic(a)).toThrow();
  });

  it("fractional values within 1–5 are accepted by engine (Zod guards the API)", () => {
    const a = makeAnswers(3);
    a["1"] = 2.5;
    const r = computeDiagnostic(a);
    expect(Number.isFinite(r.mentalidade)).toBe(true);
  });

  it("rejects non-number answer", () => {
    const a = makeAnswers(3);
    (a as Record<string, unknown>)["1"] = "five";
    expect(() => computeDiagnostic(a as Record<string, number>)).toThrow();
  });

  it("rejects missing question (59 of 60)", () => {
    const a = makeAnswers(3);
    delete a["60"];
    expect(() => computeDiagnostic(a)).toThrow();
  });

  it("rejects empty object", () => {
    expect(() => computeDiagnostic({})).toThrow();
  });

  it("question count has not drifted from 60", () => {
    expect(MECA_QUESTIONS.length).toBe(60);
  });
});

describe("REGRESSION — derived metrics formula", () => {
  it("direction = round(avg(mentalidade, engajamento))", () => {
    const r = computeDiagnostic(makeAnswersWithPillar({
      mentalidade: 5, engajamento: 1, cultura: 3, performance: 3,
    }));
    expect(r.direction).toBe(Math.round((r.mentalidade + r.engajamento) / 2));
  });

  it("capacity = round(avg(cultura, performance))", () => {
    const r = computeDiagnostic(makeAnswersWithPillar({
      mentalidade: 3, engajamento: 3, cultura: 5, performance: 1,
    }));
    expect(r.capacity).toBe(Math.round((r.cultura + r.performance) / 2));
  });
});
