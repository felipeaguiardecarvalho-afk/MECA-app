import { describe, expect, it } from "vitest";
import {
  getTheoriesSortedByScore,
  MECA_THEORIES,
} from "@/lib/meca-theories";

describe("getTheoriesSortedByScore", () => {
  it("returns all MECA theories sorted ascending by score", () => {
    const answers: Record<string, number> = {};
    for (let i = 1; i <= 60; i++) {
      answers[String(i)] = ((i % 5) + 1) as number;
    }

    const theories = getTheoriesSortedByScore(answers);

    expect(theories).toHaveLength(MECA_THEORIES.length);
    for (let i = 1; i < theories.length; i++) {
      const prev = theories[i - 1]!;
      const curr = theories[i]!;
      expect(curr.score).toBeGreaterThanOrEqual(prev.score);
      if (curr.score === prev.score) {
        expect(curr.id).toBeGreaterThan(prev.id);
      }
    }
  });
});
