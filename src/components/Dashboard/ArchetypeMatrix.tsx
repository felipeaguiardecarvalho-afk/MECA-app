"use client";

import React, { useEffect, useState } from "react";
import {
  ARCHETYPES,
  HIGH,
  LOW,
  VERY_LOW,
  ACCELERATED_MIN,
  type ArchetypeKey,
  type ArchetypeResult,
} from "@/lib/archetypes";

// ----------------------------------------------------------------------------
// RULE → GEOMETRY
// ----------------------------------------------------------------------------
//
// Cada arquétipo tem uma regra em `classifyArchetype()` formada por bandas
// (BAND_HIGH ≥ HIGH, BAND_LOW ≤ LOW, BAND_VERY_LOW ≤ VERY_LOW). Modelamos
// cada regra como cláusulas estruturadas (cada cláusula = AND de bandas;
// múltiplas cláusulas = OR), e projetamos para o plano (x = A, y = (C+E)/2)
// para obter o retângulo geométrico que cobre todos os pontos válidos.
//
// Garantia: se `classifyArchetype` retorna o arquétipo K, o ponto (A, (C+E)/2)
// satisfaz pelo menos uma cláusula de RULES[K], logo cai dentro do retângulo
// projetado.
// ----------------------------------------------------------------------------

type Band = { min?: number; max?: number };
type RuleClause = { M?: Band; E?: Band; C?: Band; A?: Band };
type RuleSpec = RuleClause[]; // OR de cláusulas

// "v não é HIGH" = v < HIGH → projeção [0, HIGH] (boundary inclusivo p/ visual)
const NOT_HIGH: Band = { max: HIGH };
// "v não é LOW" = v > LOW → projeção [LOW, 100]
const NOT_LOW: Band = { min: LOW };

const RULES: Record<ArchetypeKey, RuleSpec> = {
  // R1: M,E,C,A ≥ ACCELERATED_MIN
  acelerado_meca: [
    {
      M: { min: ACCELERATED_MIN },
      E: { min: ACCELERATED_MIN },
      C: { min: ACCELERATED_MIN },
      A: { min: ACCELERATED_MIN },
    },
  ],
  // R2: A,C,E ≥ HIGH (M livre)
  especialista_reconhecido: [
    { A: { min: HIGH }, C: { min: HIGH }, E: { min: HIGH } },
  ],
  // R3: E ≥ HIGH ∧ M ≤ LOW (C, A livres)
  util_sem_direcao: [{ E: { min: HIGH }, M: { max: LOW } }],
  // R4: E ≥ HIGH ∧ C ≥ HIGH ∧ A ≤ LOW
  bem_quisto_estagnado: [
    { E: { min: HIGH }, C: { min: HIGH }, A: { max: LOW } },
  ],
  // R5: C ≥ HIGH ∧ E ≥ HIGH ∧ A não-HIGH
  arquiteto_em_construcao: [
    { C: { min: HIGH }, E: { min: HIGH }, A: NOT_HIGH },
  ],
  // R6: C ≥ HIGH ∧ A ≤ LOW (E livre)
  estrategista_estagnado: [{ C: { min: HIGH }, A: { max: LOW } }],
  // R7: M ≥ HIGH ∧ A ≥ HIGH ∧ C ≤ LOW ∧ E não-LOW
  protagonista_desalinhado: [
    {
      M: { min: HIGH },
      A: { min: HIGH },
      C: { max: LOW },
      E: NOT_LOW,
    },
  ],
  // R8: A ≥ HIGH ∧ M ≥ HIGH ∧ (E ≤ LOW OU C ≤ LOW)
  performatico_exausto: [
    { A: { min: HIGH }, M: { min: HIGH }, E: { max: LOW } },
    { A: { min: HIGH }, M: { min: HIGH }, C: { max: LOW } },
  ],
  // R9: A ≥ HIGH ∧ C ≥ HIGH ∧ E ≤ LOW
  competente_desengajado: [
    { A: { min: HIGH }, C: { min: HIGH }, E: { max: LOW } },
  ],
  // R10: A ≥ HIGH ∧ E ≤ LOW (C livre)
  executor_isolado: [{ A: { min: HIGH }, E: { max: LOW } }],
  // R11: M ≥ HIGH ∧ C ≤ LOW ∧ A não-HIGH (E livre)
  esforcado_perdido: [
    { M: { min: HIGH }, C: { max: LOW }, A: NOT_HIGH },
  ],
  // R12: E ≤ LOW ∧ C não-LOW ∧ A não-HIGH
  potencial_represado: [{ E: { max: LOW }, C: NOT_LOW, A: NOT_HIGH }],
  // R13: E ≤ VERY_LOW ∧ C ≤ VERY_LOW
  profissional_invisivel: [
    { E: { max: VERY_LOW }, C: { max: VERY_LOW } },
  ],
  // R14: E ≤ LOW ∧ C ≤ LOW (R10/R8 já capturam A ≥ HIGH → cláusula efetiva tem A não-HIGH)
  adormecido: [{ E: { max: LOW }, C: { max: LOW }, A: NOT_HIGH }],
};

/** Projeta uma cláusula em (x = A, y = (C+E)/2). */
function projectClause(clause: RuleClause): {
  x: [number, number];
  y: [number, number];
} {
  const a = clause.A ?? {};
  const c = clause.C ?? {};
  const e = clause.E ?? {};
  const aLo = a.min ?? 0;
  const aHi = a.max ?? 100;
  const cLo = c.min ?? 0;
  const cHi = c.max ?? 100;
  const eLo = e.min ?? 0;
  const eHi = e.max ?? 100;
  return {
    x: [aLo, aHi],
    y: [(cLo + eLo) / 2, (cHi + eHi) / 2],
  };
}

/** União dos retângulos projetados de cada cláusula (OR semântico). */
function projectRule(rule: RuleSpec): {
  x: [number, number];
  y: [number, number];
} {
  let xMin = Number.POSITIVE_INFINITY;
  let xMax = Number.NEGATIVE_INFINITY;
  let yMin = Number.POSITIVE_INFINITY;
  let yMax = Number.NEGATIVE_INFINITY;
  for (const clause of rule) {
    const p = projectClause(clause);
    if (p.x[0] < xMin) xMin = p.x[0];
    if (p.x[1] > xMax) xMax = p.x[1];
    if (p.y[0] < yMin) yMin = p.y[0];
    if (p.y[1] > yMax) yMax = p.y[1];
  }
  return { x: [xMin, xMax], y: [yMin, yMax] };
}

interface Props {
  archetype: ArchetypeResult;
}

/**
 * Layout dos 14 arquétipos no plano (viewBox 480×480).
 *
 * Coordenadas em "data units" (0..100). Conversão: svg = data * 4.8 ; svgY = (100 - dataY) * 4.8.
 *
 * IMPORTANTE — alinhamento com o motor:
 * Os bounds (`dataX`, `dataY`) NÃO são valores estéticos; eles vêm diretamente
 * das condições da regra correspondente em `classifyArchetype()` (R1–R14),
 * projetadas no plano (x = A, y = (C+E)/2) usando os mesmos thresholds
 * (HIGH = 60, LOW = 40, VERY_LOW = 30, ACCELERATED_MIN = 80).
 *
 * Garantia: se o motor classifica um arquétipo, o ponto do usuário SEMPRE cai
 * dentro do retângulo desse arquétipo (porque a regra disparou, e o retângulo
 * é a projeção dessa regra no plano).
 */
type ArchLayout = {
  key: ArchetypeKey;
  /** Bounds derivados da regra do motor — não alterar sem alinhar com classifyArchetype(). */
  dataX: [number, number];
  dataY: [number, number];
  anchor: [number, number]; // (data) centro do retângulo
  color: string;
  fillOpacity: number;
  strokeOpacity: number;
  strokeWidth: number;
  /** Pill label position in SVG units (top-left x, top-left y, width). */
  label: { x: number; y: number; w: number };
  /** Two-line label text (linha 1, linha 2). Linha 1 inclui glifo + nome curto. */
  labelLines: [string, string];
  /** Cor do texto do label (variação mais escura do `color`). */
  labelColor: string;
};

const center = (a: number, b: number): number => (a + b) / 2;

/**
 * Cosméticos por arquétipo. Bounds e âncoras vêm de `RULE_BOUNDS` (rule-space).
 * Posições de label são fixas em coords SVG para evitar sobreposições.
 */
type LayoutCosmetic = Omit<ArchLayout, "key" | "dataX" | "dataY" | "anchor">;

const COSMETIC: Record<ArchetypeKey, LayoutCosmetic> = {
  estrategista_estagnado: {
    color: "#2245a8", fillOpacity: 0.15, strokeOpacity: 0.65, strokeWidth: 1.8,
    label: { x: 13, y: 13, w: 86 },
    labelLines: ["◈ Estrategista", "   Estagnado"],
    labelColor: "#2245a8",
  },
  bem_quisto_estagnado: {
    color: "#4070c8", fillOpacity: 0.15, strokeOpacity: 0.65, strokeWidth: 1.8,
    label: { x: 13, y: 175, w: 86 },
    labelLines: ["◇ Bem-Quisto", "   Estagnado"],
    labelColor: "#3a60b8",
  },
  util_sem_direcao: {
    color: "#6090d8", fillOpacity: 0.15, strokeOpacity: 0.65, strokeWidth: 1.8,
    label: { x: 76, y: 137, w: 76 },
    labelLines: ["◉ Útil Sem", "   Direção"],
    labelColor: "#4a78c0",
  },
  potencial_represado: {
    color: "#6848b8", fillOpacity: 0.16, strokeOpacity: 0.72, strokeWidth: 2,
    label: { x: 27, y: 248, w: 106 },
    labelLines: ["✦ Potencial", "   Represado"],
    labelColor: "#6848b8",
  },
  acelerado_meca: {
    color: "#1a7a45", fillOpacity: 0.22, strokeOpacity: 0.8, strokeWidth: 2,
    label: { x: 363, y: 13, w: 88 },
    labelLines: ["🚀 Acelerado", "   MECA ≥80"],
    labelColor: "#1a7a45",
  },
  especialista_reconhecido: {
    color: "#2a7060", fillOpacity: 0.18, strokeOpacity: 0.75, strokeWidth: 2,
    label: { x: 291, y: 93, w: 116 },
    labelLines: ["✦ Especialista", "   Reconhecido"],
    labelColor: "#2a7060",
  },
  protagonista_desalinhado: {
    color: "#3aae78", fillOpacity: 0.16, strokeOpacity: 0.68, strokeWidth: 1.8,
    label: { x: 243, y: 183, w: 110 },
    labelLines: ["🧭 Protagonista", "   Desalinhado"],
    labelColor: "#1e8050",
  },
  competente_desengajado: {
    color: "#a07020", fillOpacity: 0.18, strokeOpacity: 0.75, strokeWidth: 2,
    label: { x: 330, y: 213, w: 118 },
    labelLines: ["✦ Competente", "   Desengajado"],
    labelColor: "#a07020",
  },
  performatico_exausto: {
    color: "#e07828", fillOpacity: 0.18, strokeOpacity: 0.7, strokeWidth: 1.8,
    label: { x: 243, y: 248, w: 94 },
    labelLines: ["🔋 Performático", "   Exausto"],
    labelColor: "#b85c10",
  },
  esforcado_perdido: {
    color: "#904060", fillOpacity: 0.16, strokeOpacity: 0.72, strokeWidth: 2,
    label: { x: 185, y: 356, w: 100 },
    labelLines: ["✦ Esforçado", "   Perdido"],
    labelColor: "#904060",
  },
  executor_isolado: {
    color: "#c84810", fillOpacity: 0.18, strokeOpacity: 0.7, strokeWidth: 1.8,
    label: { x: 338, y: 428, w: 82 },
    labelLines: ["⚙ Executor", "   Isolado"],
    labelColor: "#a03808",
  },
  profissional_invisivel: {
    color: "#c03040", fillOpacity: 0.18, strokeOpacity: 0.7, strokeWidth: 1.8,
    label: { x: 13, y: 432, w: 104 },
    labelLines: ["👁 Profissional", "   Invisível"],
    labelColor: "#961828",
  },
  arquiteto_em_construcao: {
    color: "#7040a8", fillOpacity: 0.17, strokeOpacity: 0.75, strokeWidth: 2,
    label: { x: 185, y: 24, w: 106 },
    labelLines: ["✦ Arquiteto em", "   Construção"],
    labelColor: "#7040a8",
  },
  adormecido: {
    color: "#5a7088", fillOpacity: 0.17, strokeOpacity: 0.72, strokeWidth: 2,
    label: { x: 138, y: 295, w: 84 },
    labelLines: ["✦ O", "   Adormecido"],
    labelColor: "#5a7088",
  },
};

/**
 * Layout final: bounds (rule-space) + cosméticos. Iterado em ordem estável.
 */
const LAYOUT_ORDER: ArchetypeKey[] = [
  "estrategista_estagnado",
  "bem_quisto_estagnado",
  "util_sem_direcao",
  "potencial_represado",
  "acelerado_meca",
  "especialista_reconhecido",
  "protagonista_desalinhado",
  "competente_desengajado",
  "performatico_exausto",
  "esforcado_perdido",
  "executor_isolado",
  "profissional_invisivel",
  "arquiteto_em_construcao",
  "adormecido",
];

const LAYOUT: ArchLayout[] = LAYOUT_ORDER.map((key) => {
  const bounds = projectRule(RULES[key]);
  const cosmetic = COSMETIC[key];
  return {
    key,
    dataX: bounds.x,
    dataY: bounds.y,
    anchor: [center(bounds.x[0], bounds.x[1]), center(bounds.y[0], bounds.y[1])],
    ...cosmetic,
  };
});

const SVG_SIZE = 480;
const SCALE = SVG_SIZE / 100;

function dataToSvgX(dataX: number): number {
  return dataX * SCALE;
}
function dataToSvgY(dataY: number): number {
  return (100 - dataY) * SCALE;
}

export const ArchetypeMatrix: React.FC<Props> = ({ archetype }) => {
  const [animated, setAnimated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const userSvgX = dataToSvgX(archetype.xScore);
  const userSvgY = dataToSvgY(archetype.yScore);

  // Trajetória: aponta sempre para o âncora do Acelerado MECA (referência aspiracional)
  const target = LAYOUT.find((l) => l.key === "acelerado_meca")!;
  const targetSvgX = dataToSvgX(target.anchor[0]);
  const targetSvgY = dataToSvgY(target.anchor[1]);

  return (
    <div style={{ width: "100%" }}>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#1a3a5c",
          marginBottom: 4,
        }}
      >
        Arquétipo MECA
      </h2>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
        14 arquétipos posicionados nos eixos Capacidade × Direção e Sistema
      </p>

      <div
        style={{
          textAlign: "center",
          fontSize: isMobile ? 10 : 12,
          fontWeight: 700,
          color: "#1a3a5c",
          letterSpacing: "0.05em",
          marginBottom: 5,
        }}
      >
        ↑ ALTA DIREÇÃO E SISTEMA
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <div
          style={{
            fontSize: isMobile ? 9 : 11,
            fontWeight: 700,
            color: "#1a3a5c",
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          ← BAIXA CAPACIDADE
        </div>

        <svg
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          xmlns="http://www.w3.org/2000/svg"
          style={{
            flex: 1,
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            display: "block",
            width: "100%",
            height: "auto",
          }}
        >
          <defs>
            <clipPath id="meca-clip">
              <rect width={SVG_SIZE} height={SVG_SIZE} />
            </clipPath>
          </defs>

          {/* Fundo das 4 zonas — esmaecido para que o retângulo do arquétipo classificado prevaleça
              (positionZone pode divergir de archetype.zone; visualmente prioriza-se o arquétipo). */}
          <g opacity="0.45">
            <rect x="0" y="0" width="240" height="240" fill="#e8ecf5" />
            <rect x="240" y="0" width="240" height="240" fill="#e6f4ea" />
            <rect x="0" y="240" width="240" height="240" fill="#fdecee" />
            <rect x="240" y="240" width="240" height="240" fill="#fff3e0" />
          </g>

          {/* Retângulos dos 14 arquétipos — sempre rule-space (nunca expandidos).
              Em fallback (`archetype.isFallback`), nenhum retângulo é destacado
              como "atual" — só o alvo (Acelerado MECA) fica em foco; o usuário
              é representado pelo ponto + label "Perfil em transição". Em caso
              regular, o retângulo do arquétipo classificado contém o ponto por
              construção (regra → projeção). */}
          <g clipPath="url(#meca-clip)">
            {LAYOUT.map((a) => {
              const x = dataToSvgX(a.dataX[0]);
              const y = dataToSvgY(a.dataY[1]);
              const width = (a.dataX[1] - a.dataX[0]) * SCALE;
              const height = (a.dataY[1] - a.dataY[0]) * SCALE;
              const isCurrent = !archetype.isFallback && a.key === archetype.key;
              const isNearestInFallback =
                archetype.isFallback && a.key === archetype.key;
              const isTarget = a.key === "acelerado_meca";
              const isFocused = isCurrent || isTarget;
              const strokeOpacity = isFocused
                ? 1
                : isNearestInFallback
                ? 0.55
                : 0.25;
              const fillOpacity = isFocused
                ? a.fillOpacity + 0.1
                : isNearestInFallback
                ? 0.1
                : 0.06;
              return (
                <rect
                  key={a.key}
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  rx={9}
                  fill={a.color}
                  fillOpacity={fillOpacity}
                  stroke={a.color}
                  strokeWidth={isFocused ? a.strokeWidth + 0.6 : a.strokeWidth}
                  strokeOpacity={strokeOpacity}
                  strokeDasharray="7,2.5"
                />
              );
            })}
          </g>

          {/* Eixos divisórios (X=50 e Y=50) */}
          <line x1="240" y1="0" x2="240" y2="480" stroke="#64748b" strokeWidth="1.5" />
          <line x1="0" y1="240" x2="480" y2="240" stroke="#64748b" strokeWidth="1.5" />

          {/* Rótulos das zonas (cantos) */}
          <text x="10" y="477" fontSize="7" fontWeight="800" fill="#7a1f2b" opacity="0.55" letterSpacing="0.04em">
            INVISIBILIDADE
          </text>
          <text x="470" y="477" fontSize="7" fontWeight="800" fill="#8a4b00" opacity="0.55" letterSpacing="0.04em" textAnchor="end">
            ESFORÇO INVISÍVEL
          </text>
          <text x="10" y="10" fontSize="7" fontWeight="800" fill="#1a3a5c" opacity="0.55" letterSpacing="0.04em">
            POTENCIAL DESPERDIÇADO
          </text>
          <text x="470" y="10" fontSize="7" fontWeight="800" fill="#1e4d2b" opacity="0.55" letterSpacing="0.04em" textAnchor="end">
            ZONA DE ACELERAÇÃO
          </text>

          {/* Zona de Transição (centro) — overlay sutil para não competir com o arquétipo classificado */}
          <g opacity="0.15">
            <rect
              x="192"
              y="192"
              width="96"
              height="96"
              fill="rgba(248,250,252,0.90)"
              stroke="#64748b"
              strokeWidth="1.5"
              strokeDasharray="4,3"
              rx="8"
            />
            <text x="240" y="234" textAnchor="middle" fontSize="7" fontWeight="800" fill="#475569" letterSpacing="0.05em">
              ZONA DE
            </text>
            <text x="240" y="245" textAnchor="middle" fontSize="7" fontWeight="800" fill="#475569" letterSpacing="0.05em">
              TRANSIÇÃO
            </text>
          </g>

          {/* Pílulas de label + ponto-âncora de cada arquétipo (focados em opacidade total, demais esmaecidos) */}
          {LAYOUT.map((a) => {
            const cx = dataToSvgX(a.anchor[0]);
            const cy = dataToSvgY(a.anchor[1]);
            const isFocused =
              a.key === archetype.key || a.key === "acelerado_meca";
            return (
              <g key={`label-${a.key}`} opacity={isFocused ? 1 : 0.25}>
                <rect
                  x={a.label.x}
                  y={a.label.y}
                  width={a.label.w}
                  height={34}
                  rx={5}
                  fill="white"
                  fillOpacity={0.88}
                />
                <text x={a.label.x + 4} y={a.label.y + 12} fontSize="8.5" fontWeight="700" fill={a.labelColor}>
                  {a.labelLines[0]}
                </text>
                <text x={a.label.x + 4} y={a.label.y + 23} fontSize="8.5" fontWeight="700" fill={a.labelColor}>
                  {a.labelLines[1]}
                </text>
                <circle cx={cx} cy={cy} r={3.5} fill={a.color} stroke="white" strokeWidth="1.5" />
              </g>
            );
          })}

          {/* Trajetória até Acelerado MECA */}
          <line
            x1={userSvgX}
            y1={userSvgY}
            x2={targetSvgX}
            y2={targetSvgY}
            stroke="#1a7a45"
            strokeWidth="1.4"
            strokeDasharray="5,4"
            opacity="0.5"
          />

          {/* Anel pulsante na posição do usuário */}
          <circle cx={userSvgX} cy={userSvgY} fill="#1a3a5c" opacity="0.28" r="9">
            <animate attributeName="r" values="9;22;9" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.35;0;0.35" dur="2s" repeatCount="indefinite" />
          </circle>

          {/* Ponto do usuário */}
          <circle
            cx={userSvgX}
            cy={userSvgY}
            r={animated ? 8 : 0}
            fill="#1a3a5c"
            stroke="white"
            strokeWidth="3"
            style={{ transition: "r 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}
          />

          {/* Callout do usuário — em fallback indica explicitamente "Perfil em transição" */}
          <g style={{ opacity: animated ? 1 : 0, transition: "opacity 0.5s ease" }}>
            <rect
              x={userSvgX + 10}
              y={userSvgY - 18}
              width={archetype.isFallback ? 116 : 86}
              height="18"
              rx="4"
              fill={archetype.isFallback ? "#7a4ca0" : "#1a3a5c"}
            />
            <text
              x={userSvgX + 10 + (archetype.isFallback ? 58 : 43)}
              y={userSvgY - 5}
              textAnchor="middle"
              fontSize="8.5"
              fontWeight="700"
              fill="white"
            >
              {archetype.isFallback ? "Perfil em transição" : "Você está aqui"}
            </text>
          </g>

          {/* Anel animado no alvo (Acelerado MECA) */}
          <circle cx={targetSvgX} cy={targetSvgY} fill="none" stroke="#1a7a45" strokeWidth="1.8" r="14">
            <animate attributeName="r" values="12;20;12" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.75;0.2;0.75" dur="2.4s" repeatCount="indefinite" />
          </circle>
        </svg>

        <div
          style={{
            fontSize: isMobile ? 9 : 11,
            fontWeight: 700,
            color: "#1a3a5c",
            writingMode: "vertical-rl",
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          ALTA CAPACIDADE →
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          fontSize: isMobile ? 10 : 12,
          fontWeight: 700,
          color: "#1a3a5c",
          letterSpacing: "0.05em",
          marginTop: 5,
        }}
      >
        ↓ BAIXA DIREÇÃO E SISTEMA
      </div>

      {/* Score readouts */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 14,
          padding: "10px 14px",
          background: "#f8fafc",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>
            Capacidade (A)
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1a3a5c" }}>
            {Math.round(archetype.xScore)}
            <span style={{ fontSize: 12, fontWeight: 500, color: "#9ca3af" }}>
              /100
            </span>
          </div>
        </div>
        <div style={{ width: 1, background: "#e5e7eb" }} />
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>
            Direção e Sistema (C+E)
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1a3a5c" }}>
            {Math.round(archetype.yScore)}
            <span style={{ fontSize: 12, fontWeight: 500, color: "#9ca3af" }}>
              /100
            </span>
          </div>
        </div>
        <div style={{ width: 1, background: "#e5e7eb" }} />
        <div style={{ textAlign: "center", flex: 1.3 }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>
            {archetype.isFallback ? "Arquétipo mais próximo" : "Arquétipo"}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: archetype.isFallback ? "#7a4ca0" : "#1a3a5c",
              lineHeight: 1.2,
            }}
          >
            {ARCHETYPES[archetype.key].icon} {archetype.name}
            {archetype.isFallback ? (
              <span style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#7a4ca0", marginTop: 2 }}>
                · Perfil em transição
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchetypeMatrix;
