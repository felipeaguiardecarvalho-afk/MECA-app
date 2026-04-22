import { describe, expect, it } from "vitest";
import {
  computeDiagnostic,
  emptyAnswers,
  MECA_QUESTIONS,
} from "@/lib/diagnostic-engine";
import { ARCHETYPE_NAMES } from "@/lib/archetypes";
import { makeAnswers, makeAnswersWithPillar } from "./helpers/diagnostic";

const PILLARS = ["mentalidade", "engajamento", "cultura", "performance"] as const;

function likertToScore(v: number): number {
  return Math.round(((v - 1) / 4) * 100);
}

function expectedPillarScore(
  pillar: (typeof PILLARS)[number],
  value: number,
): number {
  const questions = MECA_QUESTIONS.filter((q) => q.pillar === pillar);
  const sum = questions.reduce(
    (total, question) =>
      total + likertToScore(question.reverse ? 6 - value : value),
    0,
  );
  return Math.round(sum / questions.length);
}

describe("MECA_QUESTIONS", () => {
  it("has exactly 60 questions", () => {
    expect(MECA_QUESTIONS.length).toBe(60);
  });

  it("has unique IDs 1–60", () => {
    const ids = MECA_QUESTIONS.map((q) => q.id).sort((a, b) => a - b);
    expect(ids).toEqual(Array.from({ length: 60 }, (_, i) => i + 1));
  });

  it("covers exactly 4 pillars", () => {
    const pillars = new Set(MECA_QUESTIONS.map((q) => q.pillar));
    expect(pillars).toEqual(
      new Set(["mentalidade", "engajamento", "cultura", "performance"]),
    );
  });

  it("has 20 reverse-scored questions distributed equally", () => {
    const reversed = MECA_QUESTIONS.filter((q) => q.reverse);
    expect(reversed).toHaveLength(20);
    for (const pillar of PILLARS) {
      expect(reversed.filter((q) => q.pillar === pillar)).toHaveLength(5);
    }
  });
});

describe("computeDiagnostic", () => {
  it("scores all neutral (3) answers near mid range", () => {
    const r = computeDiagnostic(emptyAnswers());
    expect(r.mentalidade).toBe(50);
    expect(r.engajamento).toBe(50);
    expect(r.cultura).toBe(50);
    expect(r.performance).toBe(50);
    // no legacy fallback: all-neutral maps to a canonical archetype name
    expect(ARCHETYPE_NAMES).toContain(r.archetype);
    expect(r.archetype).not.toBe("Perfil Equilibrado");
  });

  it("scores all max (5) answers with reverse items inverted", () => {
    const r = computeDiagnostic(makeAnswers(5));
    expect(r.mentalidade).toBe(expectedPillarScore("mentalidade", 5));
    expect(r.engajamento).toBe(expectedPillarScore("engajamento", 5));
    expect(r.cultura).toBe(expectedPillarScore("cultura", 5));
    expect(r.performance).toBe(expectedPillarScore("performance", 5));
  });

  it("scores all min (1) answers with reverse items inverted", () => {
    const r = computeDiagnostic(makeAnswers(1));
    expect(r.mentalidade).toBe(expectedPillarScore("mentalidade", 1));
    expect(r.engajamento).toBe(expectedPillarScore("engajamento", 1));
    expect(r.cultura).toBe(expectedPillarScore("cultura", 1));
    expect(r.performance).toBe(expectedPillarScore("performance", 1));
  });

  it("treats reverse-scored questions as 1 good and 5 alert", () => {
    const reverseQuestion = MECA_QUESTIONS.find(
      (q) => q.reverse && q.pillar === "mentalidade",
    );
    expect(reverseQuestion).toBeDefined();

    const low = makeAnswers(3);
    const high = makeAnswers(3);
    low[String(reverseQuestion?.id)] = 1;
    high[String(reverseQuestion?.id)] = 5;

    expect(computeDiagnostic(low).mentalidade).toBeGreaterThan(
      computeDiagnostic(high).mentalidade,
    );
  });

  it("direction = avg(mentalidade, engajamento)", () => {
    const r = computeDiagnostic(
      makeAnswersWithPillar({ mentalidade: 5, engajamento: 1, cultura: 3, performance: 3 }),
    );
    expect(r.direction).toBe(Math.round((r.mentalidade + r.engajamento) / 2));
  });

  it("capacity = avg(cultura, performance)", () => {
    const r = computeDiagnostic(
      makeAnswersWithPillar({ mentalidade: 3, engajamento: 3, cultura: 5, performance: 1 }),
    );
    expect(r.capacity).toBe(Math.round((r.cultura + r.performance) / 2));
  });

  it("throws on missing answers", () => {
    const partial = { "1": 5 } as Record<string, number>;
    expect(() => computeDiagnostic(partial)).toThrow();
  });

  it("throws on out-of-range answer", () => {
    const answers = makeAnswers(3);
    answers["1"] = 6;
    expect(() => computeDiagnostic(answers)).toThrow();
  });

  it("throws on zero answer", () => {
    const answers = makeAnswers(3);
    answers["1"] = 0;
    expect(() => computeDiagnostic(answers)).toThrow();
  });

  it("never returns the legacy 'Perfil Equilibrado' label", () => {
    const samples = [
      emptyAnswers(),
      makeAnswers(1),
      makeAnswers(5),
      makeAnswersWithPillar({ mentalidade: 5, engajamento: 1, cultura: 1, performance: 1 }),
      makeAnswersWithPillar({ mentalidade: 1, engajamento: 5, cultura: 5, performance: 1 }),
    ];
    for (const a of samples) {
      const r = computeDiagnostic(a);
      expect(r.archetype).not.toBe("Perfil Equilibrado");
      expect(ARCHETYPE_NAMES).toContain(r.archetype);
    }
  });

  it("returns a canonical archetype when one pillar dominates", () => {
    const r = computeDiagnostic(
      makeAnswersWithPillar({ mentalidade: 5, engajamento: 1, cultura: 1, performance: 1 }),
    );
    expect(ARCHETYPE_NAMES).toContain(r.archetype);
    expect(r.archetype.length).toBeGreaterThan(0);
  });

  it("all 6 score keys are present and in 0–100 range", () => {
    const r = computeDiagnostic(makeAnswers(4));
    for (const key of ["mentalidade", "engajamento", "cultura", "performance", "direction", "capacity"] as const) {
      expect(r[key]).toBeGreaterThanOrEqual(0);
      expect(r[key]).toBeLessThanOrEqual(100);
    }
  });
});
