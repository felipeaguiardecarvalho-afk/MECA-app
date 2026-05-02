/**
 * 20 cenários diversificados — valida 3 invariantes:
 *
 *   1) Engine devolve um dos 14 arquétipos canônicos.
 *   2) O ponto (xScore = A, yScore = (C+E)/2) cai DENTRO do retângulo
 *      `projectRule(RULES[arquetipo])` derivado da regra (rule-space).
 *   3) Resultado é determinístico e bate com o esperado por cenário.
 *
 * Reproduz a projeção de regras do `ArchetypeMatrix.tsx` para garantir que a
 * geometria visual e a engine permanecem alinhadas.
 */

import { describe, it, expect } from "vitest";
import {
  ARCHETYPE_NAMES,
  HIGH,
  LOW,
  VERY_LOW,
  ACCELERATED_MIN,
  getArchetype,
  type ArchetypeKey,
  type MECAScores,
} from "@/lib/archetypes";

// ---- projeção rule-space (espelha ArchetypeMatrix.tsx) -------------------

type Band = { min?: number; max?: number };
type RuleClause = { M?: Band; E?: Band; C?: Band; A?: Band };
type RuleSpec = RuleClause[];

const NOT_HIGH: Band = { max: HIGH };
const NOT_LOW: Band = { min: LOW };

const RULES: Record<ArchetypeKey, RuleSpec> = {
  acelerado_meca: [
    {
      M: { min: ACCELERATED_MIN },
      E: { min: ACCELERATED_MIN },
      C: { min: ACCELERATED_MIN },
      A: { min: ACCELERATED_MIN },
    },
  ],
  especialista_reconhecido: [{ A: { min: HIGH }, C: { min: HIGH }, E: { min: HIGH } }],
  util_sem_direcao: [{ E: { min: HIGH }, M: { max: LOW } }],
  bem_quisto_estagnado: [{ E: { min: HIGH }, C: { min: HIGH }, A: { max: LOW } }],
  arquiteto_em_construcao: [{ C: { min: HIGH }, E: { min: HIGH }, A: NOT_HIGH }],
  estrategista_estagnado: [{ C: { min: HIGH }, A: { max: LOW } }],
  protagonista_desalinhado: [
    { M: { min: HIGH }, A: { min: HIGH }, C: { max: LOW }, E: NOT_LOW },
  ],
  performatico_exausto: [
    { A: { min: HIGH }, M: { min: HIGH }, E: { max: LOW } },
    { A: { min: HIGH }, M: { min: HIGH }, C: { max: LOW } },
  ],
  competente_desengajado: [{ A: { min: HIGH }, C: { min: HIGH }, E: { max: LOW } }],
  executor_isolado: [{ A: { min: HIGH }, E: { max: LOW } }],
  esforcado_perdido: [{ M: { min: HIGH }, C: { max: LOW }, A: NOT_HIGH }],
  potencial_represado: [{ E: { max: LOW }, C: NOT_LOW, A: NOT_HIGH }],
  profissional_invisivel: [{ E: { max: VERY_LOW }, C: { max: VERY_LOW } }],
  adormecido: [{ E: { max: LOW }, C: { max: LOW }, A: NOT_HIGH }],
};

function projectRule(rule: RuleSpec): { x: [number, number]; y: [number, number] } {
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  for (const clause of rule) {
    const aLo = clause.A?.min ?? 0;
    const aHi = clause.A?.max ?? 100;
    const cLo = clause.C?.min ?? 0;
    const cHi = clause.C?.max ?? 100;
    const eLo = clause.E?.min ?? 0;
    const eHi = clause.E?.max ?? 100;
    if (aLo < xMin) xMin = aLo;
    if (aHi > xMax) xMax = aHi;
    if ((cLo + eLo) / 2 < yMin) yMin = (cLo + eLo) / 2;
    if ((cHi + eHi) / 2 > yMax) yMax = (cHi + eHi) / 2;
  }
  return { x: [xMin, xMax], y: [yMin, yMax] };
}

// ---- 20 cenários ---------------------------------------------------------

type Case = {
  label: string;
  scores: MECAScores;
  expectedKey: ArchetypeKey;
};

const CASES: Case[] = [
  // Zona de Aceleração
  { label: "01 · todos os pilares 90 → Acelerado MECA",
    scores: { M: 90, E: 90, C: 90, A: 90 }, expectedKey: "acelerado_meca" },
  { label: "02 · A,C,E altos · M no limite (75) → Especialista Reconhecido",
    scores: { M: 75, E: 70, C: 75, A: 80 }, expectedKey: "especialista_reconhecido" },
  { label: "03 · M,A altos · C baixo · E médio → Protagonista Desalinhado",
    scores: { M: 80, E: 50, C: 30, A: 75 }, expectedKey: "protagonista_desalinhado" },

  // Esforço Invisível
  { label: "04 · A,M altos · E baixo → Performático Exausto",
    scores: { M: 75, E: 30, C: 50, A: 80 }, expectedKey: "performatico_exausto" },
  { label: "05 · A,C altos · E baixo → Competente Desengajado",
    scores: { M: 50, E: 30, C: 75, A: 80 }, expectedKey: "competente_desengajado" },
  { label: "06 · A alto · E baixo (M e C médios) → Executor Isolado",
    scores: { M: 50, E: 30, C: 50, A: 75 }, expectedKey: "executor_isolado" },
  { label: "07 · M alto · C baixo · A médio → Esforçado Perdido",
    scores: { M: 75, E: 45, C: 30, A: 50 }, expectedKey: "esforcado_perdido" },

  // Potencial Desperdiçado
  { label: "08 · E alto · M baixo → Útil Sem Direção",
    scores: { M: 30, E: 75, C: 55, A: 50 }, expectedKey: "util_sem_direcao" },
  { label: "09 · C,E altos · A baixo → Bem-Quisto Estagnado",
    scores: { M: 50, E: 70, C: 70, A: 30 }, expectedKey: "bem_quisto_estagnado" },
  { label: "10 · C,E altos · A médio → Arquiteto em Construção",
    scores: { M: 55, E: 70, C: 70, A: 50 }, expectedKey: "arquiteto_em_construcao" },
  { label: "11 · C alto · A baixo · E médio → Estrategista Estagnado",
    scores: { M: 50, E: 50, C: 75, A: 30 }, expectedKey: "estrategista_estagnado" },

  // Invisibilidade / Transição
  { label: "12 · E,C ≤ 30 (extremo) → Profissional Invisível",
    scores: { M: 30, E: 25, C: 25, A: 30 }, expectedKey: "profissional_invisivel" },
  { label: "13 · E,C baixos (não extremos) · A médio → O Adormecido",
    scores: { M: 45, E: 35, C: 35, A: 45 }, expectedKey: "adormecido" },
  { label: "14 · E baixo · C médio · A médio → Potencial Represado",
    scores: { M: 50, E: 35, C: 55, A: 50 }, expectedKey: "potencial_represado" },

  // Bordas / casos limítrofes
  { label: "15 · pilares = HIGH (60) → Especialista Reconhecido (não Acelerado)",
    scores: { M: 60, E: 60, C: 60, A: 60 }, expectedKey: "especialista_reconhecido" },
  { label: "16 · pilares = ACC_MIN (80) → Acelerado MECA",
    scores: { M: 80, E: 80, C: 80, A: 80 }, expectedKey: "acelerado_meca" },
  { label: "17 · M alto · C ≤ LOW · A alto · E baixo → Performático Exausto (R8 cláusula 2)",
    scores: { M: 80, E: 30, C: 30, A: 75 }, expectedKey: "performatico_exausto" },
  { label: "18 · M baixo · A baixo · E baixo · C médio → Potencial Represado",
    scores: { M: 35, E: 35, C: 50, A: 35 }, expectedKey: "potencial_represado" },
  { label: "19 · M alto · A muito alto · C baixo · E médio → Protagonista Desalinhado",
    scores: { M: 70, E: 55, C: 35, A: 85 }, expectedKey: "protagonista_desalinhado" },
  { label: "20 · pico assimétrico (M=100,E=10,C=10,A=10) → Esforçado Perdido (R11)",
    scores: { M: 100, E: 10, C: 10, A: 10 }, expectedKey: "esforcado_perdido" },
];

describe("archetype coverage — 20 cenários", () => {
  for (const c of CASES) {
    it(c.label, () => {
      const r = getArchetype(c.scores);

      // 1) é arquétipo canônico
      expect(ARCHETYPE_NAMES).toContain(r.name);

      // 2) bate com o esperado
      expect(r.key).toBe(c.expectedKey);

      // 3) ponto cai dentro do retângulo rule-space
      const bounds = projectRule(RULES[r.key]);
      const x = r.xScore;
      const y = r.yScore;
      expect(x).toBeGreaterThanOrEqual(bounds.x[0]);
      expect(x).toBeLessThanOrEqual(bounds.x[1]);
      expect(y).toBeGreaterThanOrEqual(bounds.y[0]);
      expect(y).toBeLessThanOrEqual(bounds.y[1]);
    });
  }

  it("cobertura: nenhum dos 14 arquétipos sem cenário (warning, não falha)", () => {
    const hits = new Set(CASES.map((c) => c.expectedKey));
    const missing = ([
      "acelerado_meca", "especialista_reconhecido", "util_sem_direcao",
      "bem_quisto_estagnado", "arquiteto_em_construcao", "estrategista_estagnado",
      "protagonista_desalinhado", "performatico_exausto", "competente_desengajado",
      "executor_isolado", "esforcado_perdido", "potencial_represado",
      "profissional_invisivel", "adormecido",
    ] as const).filter((k) => !hits.has(k));
    if (missing.length > 0) {
      console.warn("[coverage] arquétipos sem cenário:", missing.join(", "));
    }
    expect(missing.length).toBeLessThanOrEqual(0);
  });
});
