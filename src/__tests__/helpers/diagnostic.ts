import { MECA_QUESTIONS } from "@/lib/diagnostic-engine";

/** Generate a full 60-answer payload where every answer has the same value. */
export function makeAnswers(value: 1 | 2 | 3 | 4 | 5 = 3): Record<string, number> {
  return Object.fromEntries(MECA_QUESTIONS.map((q) => [String(q.id), value]));
}

/**
 * Generate answers with a specific value per pillar.
 * Useful for testing archetype derivation and bottleneck detection.
 */
export function makeAnswersWithPillar(opts: {
  mentalidade?: number;
  engajamento?: number;
  cultura?: number;
  performance?: number;
}): Record<string, number> {
  const defaults = { mentalidade: 3, engajamento: 3, cultura: 3, performance: 3, ...opts };
  return Object.fromEntries(
    MECA_QUESTIONS.map((q) => [String(q.id), defaults[q.pillar]]),
  );
}
