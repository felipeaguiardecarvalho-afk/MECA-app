import type { MetricKey } from "@/lib/types";

const METRIC_KEYS: MetricKey[] = [
  "mentalidade",
  "engajamento",
  "cultura",
  "performance",
  "direction",
  "capacity",
];

export type ResponseMetricsRow = {
  user_id: string;
  mentalidade: number;
  engajamento: number;
  cultura: number;
  performance: number;
  direction: number;
  capacity: number;
  archetype: string;
};

export type GlobalBenchmarkInsights = {
  responseCount: number;
  uniqueUsers: number;
  means: Record<MetricKey, number>;
  archetypeDistribution: Record<string, number>;
};

/**
 * Aggregates anonymized statistics from response rows (server-only; never send raw rows to non-admin clients).
 */
export function buildGlobalInsights(
  rows: ResponseMetricsRow[],
): GlobalBenchmarkInsights {
  const n = rows.length;
  const means = {} as Record<MetricKey, number>;
  for (const k of METRIC_KEYS) {
    means[k] =
      n === 0 ? 0 : rows.reduce((sum, r) => sum + Number(r[k]), 0) / n;
  }
  const archetypeDistribution: Record<string, number> = {};
  for (const r of rows) {
    const a = r.archetype ?? "—";
    archetypeDistribution[a] = (archetypeDistribution[a] ?? 0) + 1;
  }
  const uniqueUsers = new Set(rows.map((r) => r.user_id)).size;
  return {
    responseCount: n,
    uniqueUsers,
    means,
    archetypeDistribution,
  };
}
