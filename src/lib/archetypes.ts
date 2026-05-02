/**
 * MECA — Sistema de Arquétipos (fonte única de verdade).
 *
 * LAYERS:
 *   1) GRAFICO (4 zonas) = posicionamento no plano (A × (C+E)/2)
 *   2) ARQUETIPOS (14 tipos) = interpretação psicométrica dos pilares
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
 * Os 14 arquétipos:
 *   1.  Executor Isolado            → Zona de Esforço Invisível
 *   2.  Útil Sem Direção            → Potencial Desperdiçado (alto E + baixo M)
 *   3.  Estrategista Estagnado      → Potencial Desperdiçado
 *   4.  Protagonista Desalinhado    → Zona de Aceleração
 *   5.  Profissional Invisível      → Zona de Invisibilidade
 *   6.  Performático Exausto        → Zona de Esforço Invisível
 *   7.  Bem-Quisto Estagnado        → Potencial Desperdiçado
 *   8.  Acelerado MECA              → Zona de Aceleração (só se M,E,C,A ≥ 80)
 *   9.  Especialista Reconhecido    → Zona de Aceleração
 *   10. Competente Desengajado      → Zona de Esforço Invisível
 *   11. Potencial Represado         → Potencial Desperdiçado
 *   12. Esforçado Perdido           → Zona de Esforço Invisível
 *   13. Arquiteto em Construção     → Potencial Desperdiçado
 *   14. O Adormecido                → Zona de Invisibilidade
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
  | "acelerado_meca"
  | "especialista_reconhecido"
  | "competente_desengajado"
  | "potencial_represado"
  | "esforcado_perdido"
  | "arquiteto_em_construcao"
  | "adormecido";

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
  /**
   * `true` quando NENHUMA regra (R1–R14) disparou e o arquétipo veio do fallback
   * por nearest-neighbor. UI deve sinalizar visualmente — o ponto não cai dentro
   * do retângulo rule-space do arquétipo nominalmente classificado.
   */
  isFallback: boolean;
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
    diagnosis: "Você trabalha, mas não é percebido — engajamento e leitura de contexto estão muito abaixo do mínimo.",
    mechanics: "Engajamento e cultura extremamente baixos.",
    risk: "Estagnação prolongada e desconexão total do sistema.",
    leverage: "Presença e visibilidade.",
    action_plan: ["Participar mais", "Se posicionar"],
  },
  especialista_reconhecido: {
    key: "especialista_reconhecido",
    name: "Especialista Reconhecido",
    zone: "aceleracao",
    icon: "🎯",
    diagnosis:
      "Você tem alta competência, bom engajamento e forte leitura de contexto, mas falta mentalidade de protagonismo para transformar reconhecimento em avanço real.",
    mechanics:
      "Alta performance, cultura e engajamento, com mentalidade ainda mais voltada à execução do que à liderança de mudança.",
    risk: "Estabilizar no conforto de ser reconhecido sem assumir riscos que geram crescimento acelerado.",
    leverage: "Mentalidade de protagonismo e iniciativa estratégica.",
    action_plan: [
      "Assumir projetos com risco calculado",
      "Propor soluções sem esperar solicitação",
      "Desenvolver postura de liderança além da especialidade",
    ],
  },
  competente_desengajado: {
    key: "competente_desengajado",
    name: "Competente Desengajado",
    zone: "esforco_invisivel",
    icon: "🔌",
    diagnosis:
      "Você tem capacidade real e lê bem o ambiente, mas seu engajamento é baixo — o sistema percebe presença, não envolvimento.",
    mechanics:
      "Alta performance e leitura de contexto com engajamento aquém da capacidade — entrega sólida, conexão fraca com o jogo.",
    risk: "Ser percebido como distante ou desinteressado, perdendo oportunidades de influência.",
    leverage: "Engajamento genuíno e construção de relações estratégicas.",
    action_plan: [
      "Investir tempo em relações-chave",
      "Comunicar interesse ativo nas iniciativas do time",
      "Ampliar presença em discussões relevantes",
    ],
  },
  potencial_represado: {
    key: "potencial_represado",
    name: "Potencial Represado",
    zone: "invisibilidade",
    icon: "🔒",
    diagnosis:
      "Você tem consciência do ambiente e alguma cultura organizacional, mas baixo engajamento e capacidade ainda em desenvolvimento travam sua evolução.",
    mechanics:
      "Cultura moderada sem engajamento nem performance suficientes para transformar percepção em resultado visível.",
    risk: "Permanecer no modo de observação sem transitar para execução e presença.",
    leverage: "Engajamento ativo e desenvolvimento de capacidade técnica.",
    action_plan: [
      "Escolher uma área para aprofundar a competência",
      "Aumentar presença e participação visível",
      "Traduzir leitura de contexto em ação concreta",
    ],
  },
  esforcado_perdido: {
    key: "esforcado_perdido",
    name: "Esforçado Perdido",
    zone: "esforco_invisivel",
    icon: "🌀",
    diagnosis:
      "Você tem energia e iniciativa, mas sem direção clara e sem sistema. O esforço existe, mas se perde antes de gerar impacto real.",
    mechanics:
      "Mentalidade ativa com leitura de contexto e performance ainda em construção — muita energia, pouco alinhamento.",
    risk: "Esforço sem resultados gera desgaste e perda de credibilidade.",
    leverage: "Direção estratégica e desenvolvimento de competências práticas.",
    action_plan: [
      "Definir um objetivo de crescimento claro para os próximos 90 dias",
      "Alinhar esforço com o que o sistema realmente valoriza",
      "Desenvolver pelo menos uma competência técnica com consistência",
    ],
  },
  arquiteto_em_construcao: {
    key: "arquiteto_em_construcao",
    name: "Arquiteto em Construção",
    zone: "potencial_desperdicado",
    icon: "🏗",
    diagnosis:
      "Você tem boa leitura de contexto, engajamento e está construindo direção, mas sua capacidade ainda não chegou ao nível de sua visão. A fundação está sendo montada.",
    mechanics:
      "Forte cultura e engajamento com performance ainda desenvolvendo — visão e presença à frente da entrega mensurável.",
    risk: "A lacuna entre visão e execução gerar frustração ou perda de credibilidade.",
    leverage: "Desenvolvimento de capacidade prática e consistência na entrega.",
    action_plan: [
      "Priorizar o desenvolvimento de uma competência de alto impacto",
      "Reduzir o gap entre planejamento e execução",
      "Transformar a sua visão em entregas concretas e mensuráveis",
    ],
  },
  adormecido: {
    key: "adormecido",
    name: "O Adormecido",
    zone: "invisibilidade",
    icon: "💤",
    diagnosis:
      "Você está presente, mas não ativo. Seu engajamento e leitura de contexto estão baixos — o sistema não percebe sua presença como relevante.",
    mechanics:
      "Engajamento e leitura de contexto muito baixos — presença formal sem presença estratégica no sistema.",
    risk: "Estagnação prolongada e progressivo distanciamento das oportunidades disponíveis.",
    leverage: "Ativação comportamental — engajamento e presença.",
    action_plan: [
      "Escolher uma relação-chave para investir atenção genuína",
      "Participar de ao menos uma discussão relevante por semana com contribuição real",
      "Mapear o ambiente e entender as regras informais do contexto",
    ],
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
  "especialista_reconhecido",
  "competente_desengajado",
  "potencial_represado",
  "esforcado_perdido",
  "arquiteto_em_construcao",
  "adormecido",
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

// Thresholds das bandas de classificação. Exportados para que o gráfico
// (ArchetypeMatrix) derive os bounds dos retângulos diretamente das mesmas
// constantes — evita drift entre engine e UI.
export const HIGH = 60;
export const LOW = 40;
export const VERY_LOW = 30; // Limiar mais restritivo para Profissional Invisível
export const ACCELERATED_MIN = 80; // Todos os pilares precisam atingir este valor para Acelerado MECA

const BAND_HIGH = (v: number) => v >= HIGH;
const BAND_LOW = (v: number) => v <= LOW;
const BAND_VERY_LOW = (v: number) => v <= VERY_LOW;

/**
 * Classifica o arquétipo a partir dos 4 pilares.
 *
 * Prioridade (primeira regra verdadeira vence):
 *   1)  Acelerado MECA              — min(M,E,C,A) ≥ 80
 *   2)  Especialista Reconhecido    — alto A + alto C + alto E
 *   3)  Útil Sem Direção            — alto E + baixo M
 *   4)  Bem-Quisto Estagnado        — alto E + alto C + baixo A
 *   5)  Arquiteto em Construção     — alto C + alto E + A não-alto e não-baixo (moderado)
 *   6)  Estrategista Estagnado      — alto C + baixo A
 *   7)  Protagonista Desalinhado    — alto M + alto A + baixo C + E não-baixo
 *   8)  Performático Exausto        — alto A + alto M + (baixo E OU baixo C)
 *   9)  Competente Desengajado      — alto A + alto C + baixo E
 *   10) Executor Isolado            — alto A + baixo E
 *   11) Esforçado Perdido           — alto M + baixo C + A não-alto
 *   12) Potencial Represado         — baixo E + C não-baixo + A não-alto
 *   13) Profissional Invisível      — E muito baixo + C muito baixo (limiar 30)
 *   14) O Adormecido                — baixo E + baixo C (fallback zona de invisibilidade)
 *
 * Fallback (nenhuma regra aplicável): distância euclidiana para protótipos.
 */
/**
 * Tenta classificar usando apenas as 14 regras determinísticas.
 * Retorna `null` quando nenhuma regra dispara — chamador decide se aplica fallback.
 */
export function classifyByRule(scores: MECAScores): ArchetypeKey | null {
  const { M, E, C, A } = scores;

  if (
    M >= ACCELERATED_MIN &&
    E >= ACCELERATED_MIN &&
    C >= ACCELERATED_MIN &&
    A >= ACCELERATED_MIN
  ) return "acelerado_meca";
  if (BAND_HIGH(A) && BAND_HIGH(C) && BAND_HIGH(E)) return "especialista_reconhecido";
  if (BAND_HIGH(E) && BAND_LOW(M)) return "util_sem_direcao";
  if (BAND_HIGH(E) && BAND_HIGH(C) && BAND_LOW(A)) return "bem_quisto_estagnado";
  if (BAND_HIGH(C) && BAND_HIGH(E) && !BAND_HIGH(A)) return "arquiteto_em_construcao";
  if (BAND_HIGH(C) && BAND_LOW(A)) return "estrategista_estagnado";
  if (BAND_HIGH(M) && BAND_HIGH(A) && BAND_LOW(C) && !BAND_LOW(E))
    return "protagonista_desalinhado";
  if (BAND_HIGH(A) && BAND_HIGH(M) && (BAND_LOW(E) || BAND_LOW(C)))
    return "performatico_exausto";
  if (BAND_HIGH(A) && BAND_HIGH(C) && BAND_LOW(E)) return "competente_desengajado";
  if (BAND_HIGH(A) && BAND_LOW(E)) return "executor_isolado";
  if (BAND_HIGH(M) && BAND_LOW(C) && !BAND_HIGH(A)) return "esforcado_perdido";
  if (BAND_LOW(E) && !BAND_LOW(C) && !BAND_HIGH(A)) return "potencial_represado";
  if (BAND_VERY_LOW(E) && BAND_VERY_LOW(C)) return "profissional_invisivel";
  if (BAND_LOW(E) && BAND_LOW(C)) return "adormecido";
  return null;
}

/** `true` quando o caso cai no fallback nearest-neighbor (nenhuma regra disparou). */
export function isFallbackScore(scores: MECAScores): boolean {
  return classifyByRule(scores) === null;
}

export function classifyArchetype(scores: MECAScores): ArchetypeKey {
  const { M, E, C, A } = scores;

  // 1. Acelerado MECA — exige equilíbrio máximo em todos os pilares
  if (
    M >= ACCELERATED_MIN &&
    E >= ACCELERATED_MIN &&
    C >= ACCELERATED_MIN &&
    A >= ACCELERATED_MIN
  ) {
    return "acelerado_meca";
  }

  // 2. Especialista Reconhecido — alto A + alto C + alto E (falta protagonismo em M)
  if (BAND_HIGH(A) && BAND_HIGH(C) && BAND_HIGH(E)) {
    return "especialista_reconhecido";
  }

  // 3. Útil Sem Direção — alto E + baixo M
  if (BAND_HIGH(E) && BAND_LOW(M)) return "util_sem_direcao";

  // 4. Bem-Quisto Estagnado — alto E + alto C + baixo A
  if (BAND_HIGH(E) && BAND_HIGH(C) && BAND_LOW(A)) {
    return "bem_quisto_estagnado";
  }

  // 5. Arquiteto em Construção — alto C + alto E + A moderado (nem alto nem baixo)
  //    (casos com A baixo já foram capturados pela regra 4)
  if (BAND_HIGH(C) && BAND_HIGH(E) && !BAND_HIGH(A)) {
    return "arquiteto_em_construcao";
  }

  // 6. Estrategista Estagnado — alto C + baixo A
  if (BAND_HIGH(C) && BAND_LOW(A)) return "estrategista_estagnado";

  // 7. Protagonista Desalinhado — alto M + alto A + baixo C + E não-baixo
  //    (E alto mantém o eixo Y na metade superior → Zona de Aceleração)
  if (BAND_HIGH(M) && BAND_HIGH(A) && BAND_LOW(C) && !BAND_LOW(E)) {
    return "protagonista_desalinhado";
  }

  // 8. Performático Exausto — alto A + alto M + (baixo E OU baixo C)
  if (BAND_HIGH(A) && BAND_HIGH(M) && (BAND_LOW(E) || BAND_LOW(C))) {
    return "performatico_exausto";
  }

  // 9. Competente Desengajado — alto A + alto C + baixo E
  if (BAND_HIGH(A) && BAND_HIGH(C) && BAND_LOW(E)) {
    return "competente_desengajado";
  }

  // 10. Executor Isolado — alto A + baixo E
  if (BAND_HIGH(A) && BAND_LOW(E)) return "executor_isolado";

  // 11. Esforçado Perdido — alto M + baixo C + A não-alto (esforço sem direção e sem capacidade consolidada)
  if (BAND_HIGH(M) && BAND_LOW(C) && !BAND_HIGH(A)) {
    return "esforcado_perdido";
  }

  // 12. Potencial Represado — baixo E + C não-baixo + A não-alto
  //     (tem leitura de contexto mas baixo engajamento e capacidade em desenvolvimento)
  if (BAND_LOW(E) && !BAND_LOW(C) && !BAND_HIGH(A)) {
    return "potencial_represado";
  }

  // 13. Profissional Invisível — E e C extremamente baixos (limiar 30, mais restritivo)
  if (BAND_VERY_LOW(E) && BAND_VERY_LOW(C)) return "profissional_invisivel";

  // 14. O Adormecido — baixo E + baixo C (não extremo — captura a zona central-baixa)
  if (BAND_LOW(E) && BAND_LOW(C)) return "adormecido";

  // Fallback: nearest-neighbor com guardrails para preservar semântica editorial.
  return nearestArchetypeByDistance(scores);
}

function weakestPilar(scores: MECAScores): keyof MECAScores {
  return (Object.keys(scores) as Array<keyof MECAScores>).reduce((a, b) =>
    scores[a] <= scores[b] ? a : b,
  );
}

const FALLBACK_PROTOTYPES: Record<
  Exclude<ArchetypeKey, "acelerado_meca">,
  MECAScores
> = {
  util_sem_direcao:          { M: 30, E: 80, C: 55, A: 50 },
  bem_quisto_estagnado:      { M: 55, E: 80, C: 80, A: 30 },
  estrategista_estagnado:    { M: 55, E: 55, C: 80, A: 30 },
  protagonista_desalinhado:  { M: 80, E: 65, C: 30, A: 80 },
  performatico_exausto:      { M: 80, E: 30, C: 30, A: 80 },
  executor_isolado:          { M: 55, E: 30, C: 55, A: 80 },
  profissional_invisivel:    { M: 35, E: 20, C: 20, A: 35 },
  especialista_reconhecido:  { M: 50, E: 70, C: 75, A: 75 },
  competente_desengajado:    { M: 50, E: 25, C: 70, A: 75 },
  potencial_represado:       { M: 50, E: 30, C: 50, A: 30 },
  esforcado_perdido:         { M: 75, E: 35, C: 25, A: 45 },
  arquiteto_em_construcao:   { M: 55, E: 70, C: 75, A: 50 },
  adormecido:                { M: 35, E: 30, C: 35, A: 40 },
};

type FallbackKey = keyof typeof FALLBACK_PROTOTYPES;

function isSemanticallyValidFallback(key: FallbackKey, s: MECAScores): boolean {
  const high = (v: number) => v >= 55;
  const low = (v: number) => v <= 55;

  switch (key) {
    case "util_sem_direcao":
      return high(s.E) && low(s.M);
    case "bem_quisto_estagnado":
      return high(s.E) && high(s.C) && low(s.A);
    case "estrategista_estagnado":
      return high(s.C) && low(s.A);
    case "protagonista_desalinhado":
      return high(s.M) && high(s.A) && low(s.C);
    case "performatico_exausto":
      return high(s.M) && high(s.A) && (low(s.E) || low(s.C));
    case "executor_isolado":
      return high(s.A) && low(s.E);
    case "profissional_invisivel":
      return s.E <= VERY_LOW && s.C <= VERY_LOW;
    case "especialista_reconhecido":
      return high(s.A) && high(s.C) && high(s.E);
    case "competente_desengajado":
      return high(s.A) && high(s.C) && low(s.E);
    case "potencial_represado":
      return low(s.E) && !low(s.C) && !high(s.A);
    case "esforcado_perdido":
      return high(s.M) && low(s.C) && !high(s.A);
    case "arquiteto_em_construcao":
      return high(s.C) && high(s.E) && !high(s.A);
    case "adormecido":
      return low(s.E) && low(s.C);
  }
}

function sqDist(a: MECAScores, b: MECAScores): number {
  const dM = a.M - b.M;
  const dE = a.E - b.E;
  const dC = a.C - b.C;
  const dA = a.A - b.A;
  return dM * dM + dE * dE + dC * dC + dA * dA;
}

function nearestArchetypeByDistance(scores: MECAScores): ArchetypeKey {
  const prioritized = fallbackByWeakestPilar(scores);
  if (prioritized) return prioritized;

  let best: FallbackKey | null = null;
  let bestDist = Number.POSITIVE_INFINITY;

  for (const key of Object.keys(FALLBACK_PROTOTYPES) as FallbackKey[]) {
    if (!isSemanticallyValidFallback(key, scores)) continue;
    const d = sqDist(scores, FALLBACK_PROTOTYPES[key]);
    if (d < bestDist) {
      bestDist = d;
      best = key;
    }
  }

  if (best) return best;

  // Sem candidato válido pelos guardrails: usa o mais próximo entre todos.
  for (const key of Object.keys(FALLBACK_PROTOTYPES) as FallbackKey[]) {
    const d = sqDist(scores, FALLBACK_PROTOTYPES[key]);
    if (d < bestDist) {
      bestDist = d;
      best = key;
    }
  }

  return best ?? "adormecido";
}

function fallbackByWeakestPilar(scores: MECAScores): ArchetypeKey | null {
  const values = [scores.M, scores.E, scores.C, scores.A];
  const min = Math.min(...values);
  const countMin = values.filter((v) => v === min).length;
  const zone = computePositionZone(
    computeCapacityAxis(scores),
    computeDirectionAxis(scores),
  );

  // Empate no menor pilar: usa âncora estável por zona.
  if (countMin > 1) {
    switch (zone) {
      case "aceleracao":
        return "especialista_reconhecido";
      case "potencial_desperdicado":
        return "arquiteto_em_construcao";
      case "esforco_invisivel":
        return "executor_isolado";
      case "invisibilidade":
        return "adormecido";
    }
  }

  const weak = weakestPilar(scores);
  switch (weak) {
    case "C":
      return "protagonista_desalinhado";
    case "E":
      return "executor_isolado";
    case "A":
      return "estrategista_estagnado";
    case "M":
      return "util_sem_direcao";
  }
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
    isFallback: classifyByRule(scores) === null,
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
