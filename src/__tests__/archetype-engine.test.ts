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

describe("archetype catalog (14 types + 4 zones)", () => {
  it("defines exactly 14 archetypes", () => {
    expect(Object.keys(ARCHETYPES)).toHaveLength(14);
    expect(ARCHETYPE_ORDER).toHaveLength(14);
    expect(ARCHETYPE_NAMES).toHaveLength(14);
  });

  it("archetype names are unique and canonical", () => {
    const names = new Set(ARCHETYPE_NAMES);
    expect(names.size).toBe(14);
    const expected = [
      "Executor Isolado",
      "Útil Sem Direção",
      "Estrategista Estagnado",
      "Protagonista Desalinhado",
      "Profissional Invisível",
      "Performático Exausto",
      "Bem-Quisto Estagnado",
      "Acelerado MECA",
      "Especialista Reconhecido",
      "Competente Desengajado",
      "Potencial Represado",
      "Esforçado Perdido",
      "Arquiteto em Construção",
      "O Adormecido",
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

  it("zone layout: all 14 archetypes are distributed across 4 zones", () => {
    const total = (["aceleracao", "potencial_desperdicado", "esforco_invisivel", "invisibilidade"] as const)
      .map((z) => archetypesInZone(z).length)
      .reduce((a, b) => a + b, 0);
    expect(total).toBe(14);
  });

  it("Zona de Aceleração holds Protagonista + Acelerado MECA + Especialista Reconhecido", () => {
    const names = archetypesInZone("aceleracao").map((a) => a.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "Protagonista Desalinhado",
        "Acelerado MECA",
        "Especialista Reconhecido",
      ]),
    );
    expect(names).toHaveLength(3);
  });

  it("Potencial Desperdiçado holds Estrategista, Bem-Quisto, Útil Sem Direção, Arquiteto em Construção", () => {
    const names = archetypesInZone("potencial_desperdicado").map((a) => a.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "Estrategista Estagnado",
        "Bem-Quisto Estagnado",
        "Útil Sem Direção",
        "Arquiteto em Construção",
      ]),
    );
    expect(names).toHaveLength(4);
  });

  it("Zona de Esforço Invisível holds Executor, Performático, Competente, Esforçado", () => {
    const names = archetypesInZone("esforco_invisivel").map((a) => a.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "Executor Isolado",
        "Performático Exausto",
        "Competente Desengajado",
        "Esforçado Perdido",
      ]),
    );
    expect(names).toHaveLength(4);
  });

  it("Zona de Invisibilidade holds Profissional Invisível, O Adormecido, Potencial Represado", () => {
    const names = archetypesInZone("invisibilidade").map((a) => a.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "Profissional Invisível",
        "O Adormecido",
        "Potencial Represado",
      ]),
    );
    // 3: Profissional Invisível + O Adormecido + Potencial Represado
    expect(names).toHaveLength(3);
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

describe("classifyArchetype — 14 rules", () => {
  // ─── Rule 1: Acelerado MECA (threshold raised from 70 to 80) ─────────────
  it("Rule 1 — all pillars ≥ 80 → Acelerado MECA", () => {
    expect(classifyArchetype(s(80, 80, 80, 80))).toBe("acelerado_meca");
    expect(classifyArchetype(s(90, 90, 90, 90))).toBe("acelerado_meca");
  });

  it("Rule 1 — threshold is 80, not 70: s(70,70,70,70) is no longer Acelerado", () => {
    expect(classifyArchetype(s(70, 70, 70, 70))).not.toBe("acelerado_meca");
    expect(classifyArchetype(s(79, 79, 79, 79))).not.toBe("acelerado_meca");
  });

  it("Rule 1 — one pillar below 80 does not yield Acelerado MECA", () => {
    expect(classifyArchetype(s(80, 80, 80, 79))).not.toBe("acelerado_meca");
  });

  // ─── Rule 2: Especialista Reconhecido ──────────────────────────────────────
  it("Rule 2 — high A + high C + high E → Especialista Reconhecido", () => {
    expect(classifyArchetype(s(45, 70, 70, 70))).toBe("especialista_reconhecido");
    expect(classifyArchetype(s(50, 65, 65, 65))).toBe("especialista_reconhecido");
  });

  it("Rule 2 — fires before Útil Sem Direção even when M is BAND_LOW", () => {
    // M=20 (BAND_LOW) but A,C,E are all BAND_HIGH → Especialista wins
    expect(classifyArchetype(s(20, 70, 70, 70))).toBe("especialista_reconhecido");
  });

  // ─── Rule 3: Útil Sem Direção ──────────────────────────────────────────────
  it("Rule 3 — high E + low M → Útil Sem Direção", () => {
    expect(classifyArchetype(s(20, 80, 55, 55))).toBe("util_sem_direcao");
  });

  // ─── Rule 4: Bem-Quisto Estagnado ─────────────────────────────────────────
  it("Rule 4 — high E + high C + low A → Bem-Quisto Estagnado", () => {
    expect(classifyArchetype(s(55, 80, 80, 20))).toBe("bem_quisto_estagnado");
  });

  // ─── Rule 5: Arquiteto em Construção ──────────────────────────────────────
  it("Rule 5 — high C + high E + moderate A → Arquiteto em Construção", () => {
    expect(classifyArchetype(s(55, 70, 70, 50))).toBe("arquiteto_em_construcao");
    expect(classifyArchetype(s(60, 65, 65, 45))).toBe("arquiteto_em_construcao");
  });

  it("Rule 5 — low A + high C + high E goes to Bem-Quisto, not Arquiteto", () => {
    expect(classifyArchetype(s(55, 80, 80, 30))).toBe("bem_quisto_estagnado");
  });

  // ─── Rule 6: Estrategista Estagnado ───────────────────────────────────────
  it("Rule 6 — high C + low A → Estrategista Estagnado", () => {
    expect(classifyArchetype(s(55, 55, 80, 20))).toBe("estrategista_estagnado");
  });

  // ─── Rule 7: Protagonista Desalinhado ─────────────────────────────────────
  it("Rule 7 — high M + high A + low C + E not-low → Protagonista Desalinhado", () => {
    expect(classifyArchetype(s(80, 80, 20, 80))).toBe("protagonista_desalinhado");
  });

  // ─── Rule 8: Performático Exausto ─────────────────────────────────────────
  it("Rule 8 — high A + high M + low E → Performático Exausto", () => {
    expect(classifyArchetype(s(80, 20, 55, 80))).toBe("performatico_exausto");
    expect(classifyArchetype(s(80, 20, 20, 80))).toBe("performatico_exausto");
  });

  it("Rule 8 beats Protagonista when E is low", () => {
    expect(classifyArchetype(s(80, 20, 20, 80))).toBe("performatico_exausto");
  });

  // ─── Rule 9: Competente Desengajado ───────────────────────────────────────
  it("Rule 9 — high A + high C + low E → Competente Desengajado", () => {
    expect(classifyArchetype(s(50, 20, 70, 70))).toBe("competente_desengajado");
  });

  it("Rule 9 — high C distinguishes Competente from Executor Isolado", () => {
    // High A + low E + moderate C → Executor Isolado
    expect(classifyArchetype(s(55, 20, 55, 80))).toBe("executor_isolado");
    // High A + low E + high C → Competente Desengajado
    expect(classifyArchetype(s(55, 20, 70, 80))).toBe("competente_desengajado");
  });

  // ─── Rule 10: Executor Isolado ────────────────────────────────────────────
  it("Rule 10 — high A + low E → Executor Isolado", () => {
    expect(classifyArchetype(s(55, 20, 55, 80))).toBe("executor_isolado");
  });

  // ─── Rule 11: Esforçado Perdido ───────────────────────────────────────────
  it("Rule 11 — high M + low C + A not-high → Esforçado Perdido", () => {
    expect(classifyArchetype(s(75, 50, 25, 45))).toBe("esforcado_perdido");
    expect(classifyArchetype(s(70, 55, 30, 50))).toBe("esforcado_perdido");
  });

  it("Rule 11 — high A routes to Performático or Protagonista instead", () => {
    expect(classifyArchetype(s(80, 20, 20, 80))).toBe("performatico_exausto");
    expect(classifyArchetype(s(80, 80, 20, 80))).toBe("protagonista_desalinhado");
  });

  // ─── Rule 12: Potencial Represado ─────────────────────────────────────────
  it("Rule 12 — low E + C not-low + A not-high → Potencial Represado", () => {
    expect(classifyArchetype(s(50, 30, 55, 35))).toBe("potencial_represado");
    expect(classifyArchetype(s(55, 35, 50, 40))).toBe("potencial_represado");
  });

  // ─── Rule 13: Profissional Invisível (threshold 30) ───────────────────────
  it("Rule 13 — E ≤ 30 + C ≤ 30 → Profissional Invisível", () => {
    expect(classifyArchetype(s(50, 20, 20, 50))).toBe("profissional_invisivel");
    expect(classifyArchetype(s(40, 25, 25, 40))).toBe("profissional_invisivel");
  });

  it("Rule 13 — E=35 above VERY_LOW threshold → NOT Profissional Invisível", () => {
    expect(classifyArchetype(s(50, 35, 35, 50))).not.toBe("profissional_invisivel");
  });

  // ─── Rule 14: O Adormecido ────────────────────────────────────────────────
  it("Rule 14 — low E + low C (not very low) → O Adormecido", () => {
    expect(classifyArchetype(s(50, 35, 35, 50))).toBe("adormecido");
    expect(classifyArchetype(s(55, 40, 40, 55))).toBe("adormecido");
  });

  // ─── Priority checks ──────────────────────────────────────────────────────
  it("priority: all ≥ 80 wins over every imbalance rule", () => {
    expect(classifyArchetype(s(90, 90, 90, 90))).toBe("acelerado_meca");
  });

  it("priority: Útil Sem Direção beats Bem-Quisto when M is very low", () => {
    expect(classifyArchetype(s(20, 80, 80, 20))).toBe("util_sem_direcao");
  });

  it("fallback: equal mid scores map to zone anchor", () => {
    // s(55,55,55,55): all BAND_HIGH → Especialista Reconhecido fires (Rule 2)
    expect(classifyArchetype(s(55, 55, 55, 55))).toBe("especialista_reconhecido");
    // s(45,45,45,45): invisibilidade zone, equal tie → O Adormecido
    expect(classifyArchetype(s(45, 45, 45, 45))).toBe("adormecido");
  });

  it("fallback: s(63,40,73,52) — high C + low E + moderate A → Potencial Represado, not Protagonista", () => {
    // C is high (73), E is low (40), A is moderate (52) → Rule 12 fires
    expect(classifyArchetype(s(63, 40, 73, 52))).toBe("potencial_represado");
  });
});

describe("getArchetype — integrated result", () => {
  it("returns the full report for the classified archetype", () => {
    const r = getArchetype(s(80, 20, 55, 80));
    expect(r.name).toBe("Performático Exausto");
    expect(r.report.diagnosis).toMatch(/custo pessoal/i);
    expect(r.report.action_plan.length).toBeGreaterThanOrEqual(2);
  });

  it("Especialista Reconhecido report is complete", () => {
    const r = getArchetype(s(45, 70, 70, 70));
    expect(r.name).toBe("Especialista Reconhecido");
    expect(r.zone).toBe("aceleracao");
    expect(r.report.diagnosis.length).toBeGreaterThan(20);
    expect(r.report.action_plan.length).toBeGreaterThanOrEqual(2);
  });

  it("Competente Desengajado report is complete", () => {
    const r = getArchetype(s(50, 20, 70, 70));
    expect(r.name).toBe("Competente Desengajado");
    expect(r.zone).toBe("esforco_invisivel");
    expect(r.report.action_plan.length).toBeGreaterThanOrEqual(2);
  });

  it("Arquiteto em Construção report is complete", () => {
    const r = getArchetype(s(55, 70, 70, 50));
    expect(r.name).toBe("Arquiteto em Construção");
    expect(r.zone).toBe("potencial_desperdicado");
    expect(r.report.action_plan.length).toBeGreaterThanOrEqual(2);
  });

  it("O Adormecido report is complete", () => {
    const r = getArchetype(s(50, 35, 35, 50));
    expect(r.name).toBe("O Adormecido");
    expect(r.zone).toBe("invisibilidade");
    expect(r.report.action_plan.length).toBeGreaterThanOrEqual(2);
  });

  it("weakestPilar is the lowest pillar", () => {
    const r = getArchetype(s(90, 10, 50, 50));
    expect(r.weakestPilar).toBe("E");
  });

  it("positionZone is derived from axes (may differ from archetype zone)", () => {
    // M=20 (low), E=80 (high), C=45 (moderate, not BAND_HIGH), A=70 (high)
    // → Rule 3 fires: Útil Sem Direção (high E + low M)
    // positionZone = aceleracao (A=70 ≥50, (C+E)/2 = 62.5 ≥50)
    // but conceptual zone = potencial_desperdicado
    const r = getArchetype(s(20, 80, 45, 70));
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

  it("all 14 archetypes are reachable by at least one score combination", () => {
    const reached = new Set<string>();
    const probes: MECAScores[] = [
      s(80, 80, 80, 80),  // acelerado_meca
      s(45, 70, 70, 70),  // especialista_reconhecido
      s(20, 80, 55, 55),  // util_sem_direcao
      s(55, 80, 80, 20),  // bem_quisto_estagnado
      s(55, 70, 70, 50),  // arquiteto_em_construcao
      s(55, 55, 80, 20),  // estrategista_estagnado
      s(80, 80, 20, 80),  // protagonista_desalinhado
      s(80, 20, 55, 80),  // performatico_exausto
      s(50, 20, 70, 70),  // competente_desengajado
      s(55, 20, 55, 80),  // executor_isolado
      s(75, 50, 25, 45),  // esforcado_perdido
      s(50, 30, 55, 35),  // potencial_represado
      s(50, 20, 20, 50),  // profissional_invisivel
      s(50, 35, 35, 50),  // adormecido
    ];
    for (const sc of probes) {
      reached.add(getArchetype(sc).key);
    }
    expect(reached.size).toBe(14);
  });
});
