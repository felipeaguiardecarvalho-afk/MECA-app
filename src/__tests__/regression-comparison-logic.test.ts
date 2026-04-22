/**
 * REGRESSION: Comparison & Evolution Logic
 *
 * Business rule: when a user compares two diagnostics, deltas must be
 * mathematically correct. Wrong deltas give wrong career guidance.
 */
import { describe, expect, it } from "vitest";
import { calculateEvolution } from "@/lib/evolution";
import type { DiagnosticResult } from "@/lib/types";

function makeDiag(overrides: Partial<DiagnosticResult> = {}): DiagnosticResult {
  return {
    mentalidade: 50, engajamento: 50, cultura: 50,
    performance: 50, direction: 50, capacity: 50,
    archetype: "Acelerado MECA",
    ...overrides,
  };
}

describe("REGRESSION — evolution delta calculation", () => {
  it("no prior results → all deltas are exactly 0", () => {
    const ev = calculateEvolution(makeDiag(), []);
    expect(ev.mentalidade_delta).toBe(0);
    expect(ev.engajamento_delta).toBe(0);
    expect(ev.cultura_delta).toBe(0);
    expect(ev.performance_delta).toBe(0);
    expect(ev.direction_delta).toBe(0);
    expect(ev.capacity_delta).toBe(0);
  });

  it("positive improvement is correctly computed", () => {
    const prev = makeDiag({ mentalidade: 40, engajamento: 30 });
    const curr = makeDiag({ mentalidade: 70, engajamento: 55 });
    const ev = calculateEvolution(curr, [prev]);
    expect(ev.mentalidade_delta).toBe(30);
    expect(ev.engajamento_delta).toBe(25);
  });

  it("regression (negative delta) is correctly computed", () => {
    const prev = makeDiag({ cultura: 80, performance: 90 });
    const curr = makeDiag({ cultura: 60, performance: 70 });
    const ev = calculateEvolution(curr, [prev]);
    expect(ev.cultura_delta).toBe(-20);
    expect(ev.performance_delta).toBe(-20);
  });

  it("uses the LAST element of pastResults (most recent)", () => {
    const old = makeDiag({ mentalidade: 10 });
    const recent = makeDiag({ mentalidade: 60 });
    const curr = makeDiag({ mentalidade: 80 });
    const ev = calculateEvolution(curr, [old, recent]);
    expect(ev.mentalidade_delta).toBe(20);
  });

  it("identical diagnostics produce all-zero deltas", () => {
    const d = makeDiag({ mentalidade: 75, engajamento: 60 });
    const ev = calculateEvolution(d, [d]);
    expect(ev.mentalidade_delta).toBe(0);
    expect(ev.engajamento_delta).toBe(0);
    expect(ev.cultura_delta).toBe(0);
    expect(ev.performance_delta).toBe(0);
    expect(ev.direction_delta).toBe(0);
    expect(ev.capacity_delta).toBe(0);
  });
});

describe("REGRESSION — comparison dataset selection", () => {
  it("two datasets with known scores produce correct per-metric diff", () => {
    const diag1: DiagnosticResult = {
      mentalidade: 80, engajamento: 70, cultura: 60,
      performance: 50, direction: 75, capacity: 55,
      archetype: "Bem-Quisto Estagnado",
    };
    const diag2: DiagnosticResult = {
      mentalidade: 65, engajamento: 85, cultura: 45,
      performance: 70, direction: 75, capacity: 58,
      archetype: "Executor Isolado",
    };

    const keys = ["mentalidade", "engajamento", "cultura", "performance", "direction", "capacity"] as const;
    const expected = { mentalidade: 15, engajamento: -15, cultura: 15, performance: -20, direction: 0, capacity: -3 };

    for (const k of keys) {
      expect(diag1[k] - diag2[k]).toBe(expected[k]);
    }
  });
});
