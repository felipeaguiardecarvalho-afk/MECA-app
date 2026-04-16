import type { MetricKey } from "./types";

/** Reference benchmarks (e.g. sector composite) on 0–100 scale */
export const BENCHMARK_SCORES: Record<MetricKey, number> = {
  mentalidade: 72,
  engajamento: 68,
  cultura: 70,
  performance: 74,
  direction: 71,
  capacity: 69,
};

export function gapToBenchmark(metric: MetricKey, score: number): number {
  return score - BENCHMARK_SCORES[metric];
}
