/**
 * MECA — Sistema de Arquétipos (fonte única de verdade).
 *
 * LAYERS:
 *   1) GRAFICO (4 zonas) = posicionamento no plano (A × (C+E)/2)
 *   2) ARQUETIPOS (8 tipos) = interpretação psicométrica dos pilares
 *
 * Eixos do gráfico (conforme spec textual — X=Capacidade, Y=Direção e Sistema):
 *   X = Capacidade = A          (entrega · competência · execução)
 *   Y = Direção e Sistema = (C + E) / 2   (leitura de contexto · posicionamento · engajamento)
 *
 * As 4 zonas (threshold = 50):
 *   top-right    (X ≥ 50, Y ≥ 50) → Zona de Aceleração
 *   top-left     (X < 50, Y ≥ 50) → Potencial Desperdiçado
 *   bottom-right (X ≥ 50, Y < 50) → Zona de Esforço Invisível
 *   bottom-left  (X < 50, Y < 50) → Zona de Invisibilidade
 *
 * Os 8 arquétipos:
 *   1. Executor Isolado          → Zona de Esforço Invisível
 *   2. Útil Sem Direção          → Potencial Desperdiçado (global: alto E + baixo M)
 *   3. Estrategista Estagnado    → Potencial Desperdiçado
 *   4. Protagonista Desalinhado  → Zona de Aceleração
 *   5. Profissional Invisível    → Zona de Invisibilidade
 *   6. Performático Exausto      → Zona de Esforço Invisível
 *   7. Bem-Quisto Estagnado      → Potencial Desperdiçado
 *   8. Acelerado MECA            → Zona de Aceleração (só se M,E,C,A ≥ 60)
 *
 * Regra de consistência: `getArchetype()` é a ÚNICA função que classifica.
 * Qualquer override manual é proibido — o motor de relatório, o PDF, o dashboard
 * e a IA premium consomem exatamente este resultado.
 */

export interface MECAScores {
  M: number;
  E: number;
  C: number;
  A: number;
}

export type ArchetypeKey =
  | "executor_isolado"
  | "util_sem_direcao"
  | "estrategista_estagnado"
  | "protagonista_desalinhado"
  | "profissional_invisivel"
  | "performatico_exausto"
  | "bem_quisto_estagnado"
  | "acelerado_meca";

export type ZoneKey =
  | "aceleracao"
  | "potencial_desperdicado"
  | "esforco_invisivel"
  | "invisibilidade";

export type QuadrantPosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left";

export interface ZoneDefinition {
  key: ZoneKey;
  label: string;
  quadrant: QuadrantPosition;
  bgColor: string;
  textColor: string;
  description: string;
}

export interface ArchetypeReport {
  diagnosis: string;
  mechanics: string;
  risk: string;
  leverage: string;
  action_plan: string[];
}

export interface ArchetypeDefinition extends ArchetypeReport {
  key: ArchetypeKey;
  /** Nome exibido ao usuário (estável — persistido em `responses.archetype`). */
  name: string;
  /** Zona em que o arquétipo reside conceitualmente (mapeamento visual no gráfico). */
  zone: ZoneKey;
  /** Ícone curto para UI (glifo). */
  icon: string;
}

export interface ArchetypeResult {
  key: ArchetypeKey;
  name: string;
  zone: ZoneKey;
  zoneLabel: string;
  quadrant: QuadrantPosition;
  /** Posição X (Capacidade = A), 0–100. */
  xScore: number;
  /** Posição Y (Direção e Sistema = (C+E)/2), 0–100. */
  yScore: number;
  /** Zona derivada diretamente das coordenadas (pode diferir do `zone` do arquétipo). */
  positionZone: ZoneKey;
  bgColor: string;
  textColor: string;
  icon: string;
  /** Pilar de menor pontuação (ponto de atenção). */
  weakestPilar: keyof MECAScores;
  weakestPilarName: string;
  report: ArchetypeReport;
}

export const PILAR_NAMES: Record<keyof MECAScores, string> = {
  M: "Mentalidade Empreendedora",
  E: "Engajamento Autêntico",
  C: "Cultura como Motor de Crescimento",
  A: "Alta Performance",
};

export const PILAR_COLORS: Record<keyof MECAScores, string> = {
  M: "#4a90d9",
  E: "#2ecc71",
  C: "#f39c12",
  A: "#9b59b6",
};

export const ZONES: Record<ZoneKey, ZoneDefinition> = {
  aceleracao: {
    key: "aceleracao",
    label: "Zona de Aceleração",
    quadrant: "top-right",
    bgColor: "#e6f4ea",
    textColor: "#1e4d2b",
    description:
      "Alta capacidade combinada com alta direção e sistema. Aqui o crescimento é sustentável e o impacto é visível.",
  },
  potencial_desperdicado: {
    key: "potencial_desperdicado",
    label: "Potencial Desperdiçado",
    quadrant: "top-left",
    bgColor: "#e8ecf5",
    textColor: "#1a3a5c",
    description:
      "Boa direção e engajamento, mas a capacidade técnica ou execução não acompanha. Muito potencial, pouco resultado.",
  },
  esforco_invisivel: {
    key: "esforco_invisivel",
    label: "Zona de Esforço Invisível",
    quadrant: "bottom-right",
    bgColor: "#fff3e0",
    textColor: "#8a4b00",
    description:
      "Alta entrega com baixa leitura de contexto e posicionamento. Muito trabalho, pouco reconhecimento.",
  },
  invisibilidade: {
    key: "invisibilidade",
    label: "Zona de Invisibilidade",
    quadrant: "bottom-left",
    bgColor: "#fdecee",
    textColor: "#7a1f2b",
    description:
      "Baixa capacidade e baixa direção. Zona de alerta — o crescimento está bloqueado em múltiplas frentes.",
  },
};

/**
 * Conteúdo editorial por arquétipo — texto diagnóstico, assertivo, sem genérico.
 * NUNCA reordenar / remover / misturar com legado. Ponto único de verdade.
 */
export const ARCHETYPES: Record<ArchetypeKey, ArchetypeDefinition> = {
  executor_isolado: {
    key: "executor_isolado",
    name: "Executor Isolado",
    zone: "esforco_invisivel",
    icon: "⚙",
    diagnosis:
      "Você entrega mais do que a média, mas não cresce na mesma velocidade porque sua visibilidade é baixa.",
    mechanics: "Alta performance com baixo engajamento e posicionamento.",
    risk: "Ser visto como operacional e não estratégico.",
    leverage: "Aumentar exposição e influência.",
    action_plan: [
      "Se posicionar em reuniões",
      "Comunicar entregas",
      "Participar de decisões",
    ],
  },
  performatico_exausto: {
    key: "performatico_exausto",
    name: "Performático Exausto",
    zone: "esforco_invisivel",
    icon: "🔋",
    diagnosis:
      "Você entrega muito, mas com alto custo pessoal e baixa sustentabilidade.",
    mechanics: "Alta execução com desalinhamento de contexto.",
    risk: "Burnout e estagnação.",
    leverage: "Eficiência e alinhamento.",
    action_plan: [
      "Reduzir esforço desnecessário",
      "Priorizar melhor",
      "Alinhar com contexto",
    ],
  },
  estrategista_estagnado: {
    key: "estrategista_estagnado",
    name: "Estrategista Estagnado",
    zone: "potencial_desperdicado",
    icon: "◈",
    diagnosis: "Você entende o jogo, mas não executa.",
    mechanics: "Alta cultura, baixa performance.",
    risk: "Ser visto como teórico.",
    leverage: "Execução prática.",
    action_plan: ["Executar mais rápido", "Reduzir análise excessiva"],
  },
  bem_quisto_estagnado: {
    key: "bem_quisto_estagnado",
    name: "Bem-Quisto Estagnado",
    zone: "potencial_desperdicado",
    icon: "◇",
    diagnosis: "Você é bem relacionado, mas não gera impacto real.",
    mechanics: "Alto engajamento sem performance.",
    risk: "Estagnação.",
    leverage: "Foco em resultado.",
    action_plan: ["Assumir entregas críticas", "Buscar impacto real"],
  },
  util_sem_direcao: {
    key: "util_sem_direcao",
    name: "Útil Sem Direção",
    zone: "potencial_desperdicado",
    icon: "◉",
    diagnosis: "Você ajuda todos, mas não cresce.",
    mechanics: "Alto engajamento, baixa mentalidade.",
    risk: "Ser sempre suporte.",
    leverage: "Direcionamento.",
    action_plan: ["Priorizar carreira", "Dizer não"],
  },
  protagonista_desalinhado: {
    key: "protagonista_desalinhado",
    name: "Protagonista Desalinhado",
    zone: "aceleracao",
    icon: "🧭",
    diagnosis: "Você tem iniciativa, mas atua fora do contexto.",
    mechanics: "Alta mentalidade, baixa cultura.",
    risk: "Ser visto como desalinhado.",
    leverage: "Leitura organizacional.",
    action_plan: ["Observar antes de agir", "Entender dinâmica interna"],
  },
  acelerado_meca: {
    key: "acelerado_meca",
    name: "Acelerado MECA",
    zone: "aceleracao",
    icon: "🚀",
    diagnosis: "Você opera com equilíbrio e alto impacto.",
    mechanics: "Equilíbrio entre todos os pilares.",
    risk: "Estagnação por conforto.",
    leverage: "Escala e influência.",
    action_plan: ["Expandir impacto", "Desenvolver outros"],
  },
  profissional_invisivel: {
    key: "profissional_invisivel",
    name: "Profissional Invisível",
    zone: "invisibilidade",
    icon: "👁",
    diagnosis: "Você trabalha, mas não é percebido.",
    mechanics: "Baixo engajamento e cultura.",
    risk: "Estagnação prolongada.",
    leverage: "Presença e visibilidade.",
    action_plan: ["Participar mais", "Se posicionar"],
  },
};

/** Lista canônica em ordem estável (para iteração determinística no UI). */
export const ARCHETYPE_ORDER: ArchetypeKey[] = [
  "executor_isolado",
  "util_sem_direcao",
  "estrategista_estagnado",
  "protagonista_desalinhado",
  "profissional_invisivel",
  "performatico_exausto",
  "bem_quisto_estagnado",
  "acelerado_meca",
];

/** Nomes canônicos (estáveis para persistência e testes). */
export const ARCHETYPE_NAMES: readonly string[] = ARCHETYPE_ORDER.map(
  (k) => ARCHETYPES[k].name,
);

// --------------------------------------------------------------------------
// POSICIONAMENTO (eixos + zonas)
// --------------------------------------------------------------------------

export const AXIS_THRESHOLD = 50;

/** X axis = Capacidade (A), 0–100. */
export function computeCapacityAxis(scores: MECAScores): number {
  return clamp100(scores.A);
}

/** Y axis = Direção e Sistema = (C + E) / 2, 0–100. */
export function computeDirectionAxis(scores: MECAScores): number {
  return clamp100((scores.C + scores.E) / 2);
}

function clamp100(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, v));
}

export function computePositionZone(
  xScore: number,
  yScore: number,
  threshold = AXIS_THRESHOLD,
): ZoneKey {
  if (xScore >= threshold && yScore >= threshold) return "aceleracao";
  if (xScore < threshold && yScore >= threshold) return "potencial_desperdicado";
  if (xScore >= threshold && yScore < threshold) return "esforco_invisivel";
  return "invisibilidade";
}

// --------------------------------------------------------------------------
// CLASSIFICAÇÃO (regras determinísticas)
// --------------------------------------------------------------------------

const HIGH = 60;
const LOW = 40;

const BAND_HIGH = (v: number) => v >= HIGH;
const BAND_LOW = (v: number) => v <= LOW;

/**
 * Classifica o arquétipo a partir dos 4 pilares.
 *
 * Prioridade (primeira regra verdadeira vence):
 *   1) Acelerado MECA              — min(M,E,C,A) ≥ HIGH
 *   2) Útil Sem Direção            — alto E + baixo M
 *   3) Bem-Quisto Estagnado        — alto E + alto C + baixo A
 *   4) Estrategista Estagnado      — alto C + baixo A
 *   5) Protagonista Desalinhado    — alto M + alto A + baixo C + E não-baixo
 *                                    (Y ainda alto porque E compensa C)
 *   6) Performático Exausto        — alto A + alto M + (baixo E OU baixo C)
 *   7) Executor Isolado            — alto A + baixo E
 *   8) Profissional Invisível      — baixo E + baixo C
 *
 * Fallback (nenhuma regra aplicável): arquétipo âncora da zona posicional.
 * Na zona de aceleração (gráfico), se nem todas as regras casarem e min(pilares) < 60,
 * a âncora é Protagonista Desalinhado — Acelerado MECA só entra pela regra 1.
 * Em empate de desequilíbrios → prioridade acima resolve (dominância por ordem).
 */
export function classifyArchetype(scores: MECAScores): ArchetypeKey {
  const { M, E, C, A } = scores;

  if (BAND_HIGH(M) && BAND_HIGH(E) && BAND_HIGH(C) && BAND_HIGH(A)) {
    return "acelerado_meca";
  }

  if (BAND_HIGH(E) && BAND_LOW(M)) return "util_sem_direcao";

  if (BAND_HIGH(E) && BAND_HIGH(C) && BAND_LOW(A)) {
    return "bem_quisto_estagnado";
  }

  if (BAND_HIGH(C) && BAND_LOW(A)) return "estrategista_estagnado";

  // Protagonista Desalinhado precisa vir ANTES de Performático porque ambos
  // casam com (alto M + alto A + baixo C). Diferencial: E não pode ser baixo
  // (E alto mantém o eixo Y na metade superior → Zona de Aceleração).
  if (BAND_HIGH(M) && BAND_HIGH(A) && BAND_LOW(C) && !BAND_LOW(E)) {
    return "protagonista_desalinhado";
  }

  if (BAND_HIGH(A) && BAND_HIGH(M) && (BAND_LOW(E) || BAND_LOW(C))) {
    return "performatico_exausto";
  }

  if (BAND_HIGH(A) && BAND_LOW(E)) return "executor_isolado";

  if (BAND_LOW(E) && BAND_LOW(C)) return "profissional_invisivel";

  // Fallback: usa a zona posicional para escolher o arquétipo âncora.
  const xScore = computeCapacityAxis(scores);
  const yScore = computeDirectionAxis(scores);
  const zone = computePositionZone(xScore, yScore);
  switch (zone) {
    case "aceleracao":
      return "protagonista_desalinhado";
    case "potencial_desperdicado":
      return "estrategista_estagnado";
    case "esforco_invisivel":
      return "executor_isolado";
    case "invisibilidade":
      return "profissional_invisivel";
  }
}

function weakestPilar(scores: MECAScores): keyof MECAScores {
  return (Object.keys(scores) as Array<keyof MECAScores>).reduce((a, b) =>
    scores[a] <= scores[b] ? a : b,
  );
}

/**
 * Ponto único de verdade. Retorna arquétipo + posição + conteúdo editorial.
 *
 * Consumidores (dashboard, PDF, prompt Claude, plano de ação) devem usar
 * APENAS esta função — nenhuma reclassificação manual é permitida.
 */
export function getArchetype(scores: MECAScores): ArchetypeResult {
  const xScore = computeCapacityAxis(scores);
  const yScore = computeDirectionAxis(scores);
  const positionZone = computePositionZone(xScore, yScore);
  const key = classifyArchetype(scores);
  const def = ARCHETYPES[key];
  const zone = ZONES[def.zone];
  const w = weakestPilar(scores);

  return {
    key,
    name: def.name,
    zone: def.zone,
    zoneLabel: zone.label,
    quadrant: zone.quadrant,
    xScore,
    yScore,
    positionZone,
    bgColor: zone.bgColor,
    textColor: zone.textColor,
    icon: def.icon,
    weakestPilar: w,
    weakestPilarName: PILAR_NAMES[w],
    report: {
      diagnosis: def.diagnosis,
      mechanics: def.mechanics,
      risk: def.risk,
      leverage: def.leverage,
      action_plan: [...def.action_plan],
    },
  };
}

/** Utilitário para layout do gráfico — retorna os arquétipos de uma zona. */
export function archetypesInZone(zone: ZoneKey): ArchetypeDefinition[] {
  return ARCHETYPE_ORDER.map((k) => ARCHETYPES[k]).filter(
    (a) => a.zone === zone,
  );
}
