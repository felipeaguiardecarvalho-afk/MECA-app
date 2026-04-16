import { describe, expect, it } from "vitest";
import { calculateEvolution } from "@/lib/evolution";

const base = {
  mentalidade: 70,
  engajamento: 70,
  cultura: 70,
  performance: 70,
  direction: 70,
  capacity: 70,
  archetype: "X",
};

describe("calculateEvolution", () => {
  it("returns zero deltas when there is no prior result", () => {
    const ev = calculateEvolution(base, []);
    expect(ev.mentalidade_delta).toBe(0);
    expect(ev.capacity_delta).toBe(0);
  });

  it("computes delta vs most recent past result", () => {
    const past = [
      {
        ...base,
        mentalidade: 60,
        engajamento: 50,
        cultura: 80,
        performance: 40,
        direction: 55,
        capacity: 62,
        archetype: "A",
      },
    ];
    const current = {
      ...base,
      mentalidade: 72,
      engajamento: 48,
      cultura: 81,
      performance: 44,
      direction: 60,
      capacity: 60,
      archetype: "B",
    };
    const ev = calculateEvolution(current, past);
    expect(ev.mentalidade_delta).toBe(12);
    expect(ev.engajamento_delta).toBe(-2);
    expect(ev.cultura_delta).toBe(1);
    expect(ev.performance_delta).toBe(4);
    expect(ev.direction_delta).toBe(5);
    expect(ev.capacity_delta).toBe(-2);
  });
});
