import type { DiagnosticResult, Evolution } from "./types";

/**
 * Compares the current diagnostic to the most recent prior result.
 * delta = current - previous (per metric).
 */
export function calculateEvolution(
  currentResult: DiagnosticResult,
  pastResults: DiagnosticResult[],
): Evolution {
  const previous =
    pastResults.length > 0 ? pastResults[pastResults.length - 1] : null;

  const base = (curr: number, prev: number) =>
    previous === null ? 0 : curr - prev;

  return {
    mentalidade_delta: base(
      currentResult.mentalidade,
      previous?.mentalidade ?? 0,
    ),
    engajamento_delta: base(
      currentResult.engajamento,
      previous?.engajamento ?? 0,
    ),
    cultura_delta: base(currentResult.cultura, previous?.cultura ?? 0),
    performance_delta: base(
      currentResult.performance,
      previous?.performance ?? 0,
    ),
    direction_delta: base(currentResult.direction, previous?.direction ?? 0),
    capacity_delta: base(currentResult.capacity, previous?.capacity ?? 0),
  };
}
