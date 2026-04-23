import { describe, expect, it } from "vitest";
import {
  ARCHETYPES,
  ARCHETYPE_NAMES,
  ARCHETYPE_ORDER,
  archetypesInZone,
  AXIS_THRESHOLD,
  classifyArchetype,
  computeCapacityAxis,
  computeDirectionAxis,
  computePositionZone,
  getArchetype,
  ZONES,
  type MECAScores,
} from "@/lib/archetypes";

function s(M: number, E: number, C: number, A: number): MECAScores {
  return { M, E, C, A };
}

describe("archetype catalog (8 types + 4 zones)", () => {
  it("defines exactly 8 archetypes", () => {
    expect(Object.keys(ARCHETYPES)).toHaveLength(8);
    expect(ARCHETYPE_ORDER).toHaveLength(8);
    expect(ARCHETYPE_NAMES).toHaveLength(8);
  });

  it("archetype names are unique and canonical", () => {
    const names = new Set(ARCHETYPE_NAMES);
    expect(names.size).toBe(8);
    const expected = [
      "Executor Isolado",
      "Útil Sem Direção",
      "Estrategista Estagnado",
      "Protagonista Desalinhado",
      "Profissional Invisível",
      "Performático Exausto",
      "Bem-Quisto Estagnado",
      "Acelerado MECA",
    ];
    for (const n of expected) expect(names.has(n)).toBe(true);
  });

  it("defines exactly 4 zones with distinct quadrants", () => {
    const zones = Object.values(ZONES);
    expect(zones).toHaveLength(4);
    const quadrants = new Set(zones.map((z) => z.quadrant));
    expect(quadrants.size).toBe(4);
  });

  it("every archetype has full report content", () => {
    for (const key of ARCHETYPE_ORDER) {
      const a = ARCHETYPES[key];
      expect(a.diagnosis.length).toBeGreaterThan(10);
      expect(a.mechanics.length).toBeGreaterThan(5);
      expect(a.risk.length).toBeGreaterThan(3);
      expect(a.leverage.length).toBeGreaterThan(3);
      expect(a.action_plan.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("no legacy archetype names remain", () => {
    const legacy = [
      "Potencial Disperso",
      "Performance Alavancada",
      "Risco Estrutural",
      "Executor Sobrecarregado",
      "Perfil Equilibrado",
    ];
    for (const n of legacy) expect(ARCHETYPE_NAMES).not.toContain(n);
  });

  it("zone layout: each archetype lives in exactly one zone", () => {
    const total = (["aceleracao", "potencial_desperdicado", "esforco_invisivel", "invisibilidade"] as const)
      .map((z) => archetypesInZone(z).length)
      .reduce((a, b) => a + b, 0);
    expect(total).toBe(8);
  });

  it("Zona de Aceleração holds Protagonista Desalinhado + Acelerado MECA", () => {
    const names = archetypesInZone("aceleracao").map((a) => a.name);
    expect(names).toEqual(
      expect.arrayContaining(["Protagonista Desalinhado", "Acelerado MECA"]),
    );
    expect(names).toHaveLength(2);
  });

  it("Potencial Desperdiçado holds Estrategista, Bem-Quisto, Útil Sem Direção", () => {
    const names = archetypesInZone("potencial_desperdicado").map((a) => a.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "Estrategista Estagnado",
        "Bem-Quisto Estagnado",
        "Útil Sem Direção",
      ]),
    );
    expect(names).toHaveLength(3);
  });

  it("Zona de Esforço Invisível holds Executor Isolado + Performático Exausto", () => {
    const names = archetypesInZone("esforco_invisivel").map((a) => a.name);
    expect(names).toEqual(
      expect.arrayContaining(["Executor Isolado", "Performático Exausto"]),
    );
    expect(names).toHaveLength(2);
  });

  it("Zona de Invisibilidade holds Profissional Invisível", () => {
    const names = archetypesInZone("invisibilidade").map((a) => a.name);
    expect(names).toEqual(["Profissional Invisível"]);
  });
});

describe("axis computation (X = A, Y = (C+E)/2)", () => {
  it("xScore == A (Capacidade)", () => {
    expect(computeCapacityAxis(s(10, 20, 30, 80))).toBe(80);
    expect(getArchetype(s(10, 20, 30, 80)).xScore).toBe(80);
  });

  it("yScore == (C+E)/2 (Direção e Sistema)", () => {
    expect(computeDirectionAxis(s(10, 40, 80, 50))).toBe(60);
    expect(getArchetype(s(10, 40, 80, 50)).yScore).toBe(60);
  });

  it("clamps out-of-range values to 0..100", () => {
    expect(computeCapacityAxis(s(0, 0, 0, 150))).toBe(100);
    expect(computeCapacityAxis(s(0, 0, 0, -30))).toBe(0);
  });
});

describe("position zone (quadrant from xScore/yScore)", () => {
  it("top-right when X ≥ 50 and Y ≥ 50 → Zona de Aceleração", () => {
    expect(computePositionZone(80, 80)).toBe("aceleracao");
  });
  it("top-left when X < 50 and Y ≥ 50 → Potencial Desperdiçado", () => {
    expect(computePositionZone(30, 80)).toBe("potencial_desperdicado");
  });
  it("bottom-right when X ≥ 50 and Y < 50 → Esforço Invisível", () => {
    expect(computePositionZone(80, 30)).toBe("esforco_invisivel");
  });
  it("bottom-left when X < 50 and Y < 50 → Invisibilidade", () => {
    expect(computePositionZone(20, 20)).toBe("invisibilidade");
  });
  it("threshold is inclusive on the high side", () => {
    expect(computePositionZone(AXIS_THRESHOLD, AXIS_THRESHOLD)).toBe(
      "aceleracao",
    );
  });
});

describe("classifyArchetype — 8 rules", () => {
  it("Rule 1 — all pillars ≥ 60 → Acelerado MECA", () => {
    expect(classifyArchetype(s(80, 80, 80, 80))).toBe("acelerado_meca");
    expect(classifyArchetype(s(60, 60, 60, 60))).toBe("acelerado_meca");
  });

  it("Rule 1 — one pillar below 60 does not yield Acelerado MECA", () => {
    expect(classifyArchetype(s(60, 60, 60, 59))).toBe("protagonista_desalinhado");
  });

  it("Rule 2 — high E + low M → Útil Sem Direção", () => {
    expect(classifyArchetype(s(20, 80, 55, 55))).toBe("util_sem_direcao");
  });

  it("Rule 3 — high E + high C + low A → Bem-Quisto Estagnado", () => {
    expect(classifyArchetype(s(55, 80, 80, 20))).toBe("bem_quisto_estagnado");
  });

  it("Rule 4 — high C + low A → Estrategista Estagnado", () => {
    expect(classifyArchetype(s(55, 55, 80, 20))).toBe("estrategista_estagnado");
  });

  it("Rule 5 — high A + high M + low E → Performático Exausto", () => {
    // low E (20) triggers burnout pattern over protagonista (which needs E not low).
    expect(classifyArchetype(s(80, 20, 55, 80))).toBe("performatico_exausto");
    expect(classifyArchetype(s(80, 20, 20, 80))).toBe("performatico_exausto");
  });

  it("Rule 6 — high A + low E → Executor Isolado", () => {
    expect(classifyArchetype(s(55, 20, 55, 80))).toBe("executor_isolado");
  });

  it("Rule 7 — high M + high A + low C + high E → Protagonista Desalinhado", () => {
    expect(classifyArchetype(s(80, 80, 20, 80))).toBe("protagonista_desalinhado");
  });

  it("Rule 7 collides with Performático when E is low", () => {
    // Same imbalance (low C) but E is low → burnout pattern, not protagonista.
    expect(classifyArchetype(s(80, 20, 20, 80))).toBe("performatico_exausto");
  });

  it("Rule 8 — low E + low C → Profissional Invisível", () => {
    expect(classifyArchetype(s(55, 20, 20, 55))).toBe("profissional_invisivel");
  });

  it("priority: all-high wins over any imbalance rule", () => {
    expect(classifyArchetype(s(90, 90, 90, 90))).toBe("acelerado_meca");
  });

  it("priority: Útil Sem Direção beats Bem-Quisto when M is very low", () => {
    expect(classifyArchetype(s(20, 80, 80, 20))).toBe("util_sem_direcao");
  });

  it("fallback: mid scores map to the zone's anchor archetype", () => {
    expect(classifyArchetype(s(55, 55, 55, 55))).toBe(
      "protagonista_desalinhado",
    );
    expect(classifyArchetype(s(45, 45, 45, 45))).toBe("profissional_invisivel");
  });
});

describe("getArchetype — integrated result", () => {
  it("returns the full report for the classified archetype", () => {
    const r = getArchetype(s(80, 20, 55, 80));
    expect(r.name).toBe("Performático Exausto");
    expect(r.report.diagnosis).toMatch(/custo pessoal/i);
    expect(r.report.action_plan.length).toBeGreaterThanOrEqual(3);
  });

  it("weakestPilar is the lowest pillar", () => {
    const r = getArchetype(s(90, 10, 50, 50));
    expect(r.weakestPilar).toBe("E");
  });

  it("positionZone is derived from axes (may differ from archetype zone)", () => {
    // Útil Sem Direção is anchored to potencial_desperdicado, even though
    // high A + high E could place the user in aceleracao positionally.
    const r = getArchetype(s(20, 90, 60, 90));
    expect(r.name).toBe("Útil Sem Direção");
    expect(r.zone).toBe("potencial_desperdicado");
    expect(r.positionZone).toBe("aceleracao");
  });

  it("no diagnostic result produces a legacy name", () => {
    const legacy = new Set([
      "Potencial Disperso",
      "Performance Alavancada",
      "Risco Estrutural",
      "Executor Sobrecarregado",
      "Perfil Equilibrado",
    ]);
    const samples: MECAScores[] = [
      s(10, 10, 10, 10),
      s(90, 90, 90, 90),
      s(10, 90, 10, 90),
      s(90, 10, 90, 10),
      s(50, 50, 50, 50),
      s(80, 30, 70, 40),
      s(30, 80, 80, 20),
    ];
    for (const sc of samples) {
      const r = getArchetype(sc);
      expect(legacy.has(r.name)).toBe(false);
      expect(ARCHETYPE_NAMES).toContain(r.name);
    }
  });
});
