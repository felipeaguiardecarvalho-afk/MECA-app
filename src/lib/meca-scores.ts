import type { MECAScores } from "@/utils/archetypeEngine";

/**
 * Pure conversion from a DB/API diagnostic row into the `MECAScores` shape
 * consumed by the dashboard charts/archetype engine.
 *
 * This module is intentionally stateless and storage-free. Diagnostic
 * results (scores / archetype) are PII-adjacent and must NEVER be written
 * to any browser storage; callers must read them from the server on each
 * navigation (`GET /api/user/history`). See
 * `src/__tests__/no-browser-storage.test.ts` for the enforcement.
 */
export function diagnosticRowToMECAScores(row: {
  mentalidade: number;
  engajamento: number;
  cultura: number;
  performance: number;
}): MECAScores {
  return {
    M: Math.round(Number(row.mentalidade)),
    E: Math.round(Number(row.engajamento)),
    C: Math.round(Number(row.cultura)),
    A: Math.round(Number(row.performance)),
  };
}
