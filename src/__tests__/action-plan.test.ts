import { describe, expect, it } from "vitest";
import { getActionPlan, getBottleneckPillar, mecaScoresToFourPillar } from "@/lib/action-plan";
import type { MECAScores } from "@/utils/archetypeEngine";

function s(m: number, e: number, c: number, a: number): MECAScores {
  return { M: m, E: e, C: c, A: a };
}

describe("getActionPlan", () => {
  it("escolhe Mentalidade quando é o único mínimo", () => {
    const p = getActionPlan(s(20, 50, 50, 50));
    expect(p.pillarKey).toBe("mentalidade");
    expect(p.title).toContain("protagonismo");
    expect(p.actions).toHaveLength(4);
    expect(p.actions[0]).toContain("solução");
    expect(p.actions[0]).toContain("Fundamentos");
  });

  it("escolhe Engajamento quando é o mínimo", () => {
    const p = getActionPlan(s(80, 15, 70, 70));
    expect(p.pillarKey).toBe("engajamento");
    expect(p.title).toContain("visibilidade");
    expect(p.actions.some((a) => a.toLowerCase().includes("comunica"))).toBe(
      true,
    );
    expect(p.actions.every((a) => a.includes("Fundamentos:"))).toBe(true);
  });

  it("escolhe Cultura quando é o mínimo", () => {
    const p = getActionPlan(s(60, 60, 10, 60));
    expect(p.pillarKey).toBe("cultura");
    expect(p.title).toContain("contexto");
    expect(p.actions.some((a) => a.includes("Observe"))).toBe(true);
  });

  it("escolhe Performance quando é o mínimo", () => {
    const p = getActionPlan(s(90, 90, 90, 5));
    expect(p.pillarKey).toBe("performance");
    expect(p.title).toContain("execução");
    expect(p.actions.some((a) => a.includes("Priorize"))).toBe(true);
  });

  it("produz planos distintos por pilar (não genérico)", () => {
    const titles = new Set(
      [
        getActionPlan(s(1, 99, 99, 99)).title,
        getActionPlan(s(99, 1, 99, 99)).title,
        getActionPlan(s(99, 99, 1, 99)).title,
        getActionPlan(s(99, 99, 99, 1)).title,
      ],
    );
    expect(titles.size).toBe(4);
  });

  it("empate: prioridade Mentalidade → Engajamento → Cultura → Performance", () => {
    const p = getActionPlan(s(40, 40, 40, 40));
    expect(p.pillarKey).toBe("mentalidade");
  });
});

describe("getBottleneckPillar", () => {
  it("reflete o mínimo numérico", () => {
    const four = mecaScoresToFourPillar(s(10, 20, 30, 40));
    const b = getBottleneckPillar(four);
    expect(b.key).toBe("mentalidade");
    expect(b.value).toBe(10);
  });
});
