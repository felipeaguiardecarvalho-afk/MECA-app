import { describe, expect, it } from "vitest";
import { getActionPlan, getBottleneckPillar, mecaScoresToFourPillar } from "@/lib/action-plan";
import type { MECAScores } from "@/utils/archetypeEngine";

function s(m: number, e: number, c: number, a: number): MECAScores {
  return { M: m, E: e, C: c, A: a };
}

function neutralAnswers(): Record<string, number> {
  const out: Record<string, number> = {};
  for (let i = 1; i <= 60; i += 1) out[String(i)] = 3;
  return out;
}

describe("getActionPlan", () => {
  it("escolhe Mentalidade quando é o único mínimo", () => {
    const p = getActionPlan(s(20, 50, 50, 50));
    expect(p.pillarKey).toBe("mentalidade");
    expect(p.secondaryPillarKey).toBe("engajamento");
    expect(p.title).toContain("protagonismo");
    expect(p.actions).toHaveLength(4);
    expect(p.actions[0]).toContain("solução");
    expect(p.actions[1]).toContain("decisão");
    expect(p.actions[2]).toContain("responsabilidades");
    expect(p.actions[3]).toContain("alinhamento curto");
    expect(p.actions[0]).toContain("Fundamentos");
  });

  it("escolhe Engajamento quando é o mínimo", () => {
    const p = getActionPlan(s(80, 15, 70, 70));
    expect(p.pillarKey).toBe("engajamento");
    expect(p.secondaryPillarKey).toBe("cultura");
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

  it("empate usa potencial de alavancagem comportamental", () => {
    const p = getActionPlan(s(40, 40, 40, 40));
    expect(p.pillarKey).toBe("engajamento");
    expect(p.secondaryPillarKey).toBe("cultura");
  });

  it("empate total em 100 mantém Mentalidade", () => {
    const p = getActionPlan(s(100, 100, 100, 100));
    expect(p.pillarKey).toBe("mentalidade");
    expect(p.secondaryPillarKey).toBe("engajamento");
  });

  it("monta 3 ações do menor pilar + 1 do segundo menor", () => {
    const p = getActionPlan(s(90, 90, 90, 5));
    expect(p.pillarKey).toBe("performance");
    expect(p.secondaryPillarKey).toBe("engajamento");
    expect(p.actions).toHaveLength(4);
    expect(p.actions[0]).toContain("Priorize");
    expect(p.actions[1]).toContain("blocos semanais");
    expect(p.actions[2]).toContain("carga cognitiva");
    expect(p.actions[3]).toContain("alinhamento curto");
  });

  it("com respostas, usa teorias de menor nota por pilar (3+1)", () => {
    const answers = neutralAnswers();
    // Mentalidade (teorias 1, 3, 4) como menores
    [1, 2, 3, 7, 8, 9, 10, 11, 12].forEach((id) => {
      answers[String(id)] = 1;
    });
    // Engajamento (teoria 7) como menor do 2o pilar
    [19, 21, 28, 29, 30].forEach((id) => {
      answers[String(id)] = 1;
    });
    answers["20"] = 5; // reversa

    const p = getActionPlan(s(20, 30, 80, 90), answers);

    expect(p.pillarKey).toBe("mentalidade");
    expect(p.secondaryPillarKey).toBe("engajamento");
    expect(p.actions).toHaveLength(4);
    expect(p.actionTheoryIds).toEqual([1, 3, 4, 7]);
    expect(p.actions[0]).toContain("processo ineficiente");
    expect(p.actions[1]).toContain("reunião importante");
    expect(p.actions[2]).toContain("tarefas semanais");
    expect(p.actions[3]).toContain("relação de alta qualidade");
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
