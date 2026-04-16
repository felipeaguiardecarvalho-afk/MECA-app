import { describe, expect, it } from "vitest";
import {
  computeDiagnostic,
  emptyAnswers,
  MECA_QUESTIONS,
} from "@/lib/diagnostic-engine";

describe("computeDiagnostic", () => {
  it("scores all neutral answers near mid range", () => {
    const answers = emptyAnswers();
    const r = computeDiagnostic(answers);
    expect(r.mentalidade).toBeGreaterThan(40);
    expect(r.mentalidade).toBeLessThan(60);
    expect(r.archetype.length).toBeGreaterThan(0);
  });

  it("requires all 60 question ids", () => {
    expect(MECA_QUESTIONS.length).toBe(60);
    const partial = { "1": 5 } as Record<string, number>;
    expect(() => computeDiagnostic(partial)).toThrow();
  });
});
