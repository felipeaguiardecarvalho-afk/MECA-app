/**
 * Build a valid 60-answer payload for POST /api/score.
 * Questions 1–60, all with the same Likert value (default 3).
 */
export function buildAnswersPayload(
  value: 1 | 2 | 3 | 4 | 5 = 3,
): Record<string, number> {
  const answers: Record<string, number> = {};
  for (let i = 1; i <= 60; i++) {
    answers[String(i)] = value;
  }
  return answers;
}
