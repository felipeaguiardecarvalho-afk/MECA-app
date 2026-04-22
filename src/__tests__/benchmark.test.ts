import { describe, expect, it } from "vitest";
import { BENCHMARK_SCORES, gapToBenchmark } from "@/lib/benchmark";
import type { MetricKey } from "@/lib/types";

const ALL_METRICS: MetricKey[] = [
  "mentalidade",
  "engajamento",
  "cultura",
  "performance",
  "direction",
  "capacity",
];

describe("BENCHMARK_SCORES", () => {
  it("defines a value for all 6 metrics", () => {
    for (const k of ALL_METRICS) {
      expect(BENCHMARK_SCORES[k]).toBeDefined();
      expect(typeof BENCHMARK_SCORES[k]).toBe("number");
    }
  });

  it("all values are in 0–100 range", () => {
    for (const k of ALL_METRICS) {
      expect(BENCHMARK_SCORES[k]).toBeGreaterThanOrEqual(0);
      expect(BENCHMARK_SCORES[k]).toBeLessThanOrEqual(100);
    }
  });
});

describe("gapToBenchmark", () => {
  it("positive gap when score above benchmark", () => {
    expect(gapToBenchmark("mentalidade", 90)).toBe(90 - BENCHMARK_SCORES.mentalidade);
    expect(gapToBenchmark("mentalidade", 90)).toBeGreaterThan(0);
  });

  it("negative gap when score below benchmark", () => {
    expect(gapToBenchmark("engajamento", 10)).toBe(10 - BENCHMARK_SCORES.engajamento);
    expect(gapToBenchmark("engajamento", 10)).toBeLessThan(0);
  });

  it("zero gap when score equals benchmark", () => {
    expect(gapToBenchmark("cultura", BENCHMARK_SCORES.cultura)).toBe(0);
  });
});
