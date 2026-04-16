import type { MECAScores } from "@/utils/archetypeEngine";

/** Quatro pilares alinhados ao diagnóstico (0–100). */
export type FourPillarScores = {
  mentalidade: number;
  engajamento: number;
  cultura: number;
  performance: number;
};

export type ActionPlanPillarKey = keyof FourPillarScores;

/** Ordem de desempate: primeiro pilar com valor mínimo nesta ordem. */
const PILLAR_ORDER: ActionPlanPillarKey[] = [
  "mentalidade",
  "engajamento",
  "cultura",
  "performance",
];

const PILLAR_LABEL: Record<ActionPlanPillarKey, string> = {
  mentalidade: "Mentalidade",
  engajamento: "Engajamento",
  cultura: "Cultura",
  performance: "Performance",
};

type PlanTemplate = {
  title: string;
  description: string;
  actions: string[];
};

const PLANS: Record<ActionPlanPillarKey, PlanTemplate> = {
  mentalidade: {
    title: "Desenvolver protagonismo e autonomia",
    description:
      "O seu pilar mais baixo é Mentalidade: há margem para assumir mais iniciativa, reduzir a postura reativa e alinhar decisões ao impacto que pretende ter na equipa e na organização.",
    actions: [
      "Comece a propor soluções antes de ser solicitado",
      "Tome decisões mesmo com informação incompleta",
      "Assuma responsabilidade por resultados, não tarefas",
      "Busque feedback ativo e ajuste seu comportamento",
    ],
  },
  engajamento: {
    title: "Aumentar visibilidade e confiança",
    description:
      "O seu pilar mais baixo é Engajamento: fortalecer presença, comunicação e alinhamento com stakeholders aumenta a confiança nas suas entregas e na sua trajetória.",
    actions: [
      "Comunique mais claramente seu progresso",
      "Alinhe expectativas com liderança",
      "Participe ativamente de discussões",
      "Demonstre consistência nas entregas",
    ],
  },
  cultura: {
    title: "Aprimorar leitura de contexto",
    description:
      "O seu pilar mais baixo é Cultura: ajustar comportamento ao contexto informal e às dinâmicas reais do grupo reduz atrito e acelera adesão às suas ideias.",
    actions: [
      "Observe como decisões realmente acontecem",
      "Identifique padrões de comportamento valorizados",
      "Adapte sua comunicação ao ambiente",
      "Evite conflitos improdutivos",
    ],
  },
  performance: {
    title: "Melhorar execução e foco",
    description:
      "O seu pilar mais baixo é Performance: priorizar impacto, ritmo sustentável e foco profundo eleva resultados mensuráveis sem esgotar energia em baixo retorno.",
    actions: [
      "Priorize tarefas de maior impacto",
      "Reduza atividades de baixo valor",
      "Organize sua rotina para foco profundo",
      "Evite sobrecarga e multitarefa excessiva",
    ],
  },
};

export function mecaScoresToFourPillar(scores: MECAScores): FourPillarScores {
  return {
    mentalidade: Math.round(Number(scores.M)),
    engajamento: Math.round(Number(scores.E)),
    cultura: Math.round(Number(scores.C)),
    performance: Math.round(Number(scores.A)),
  };
}

/** Identifica o pilar com menor score (empates: ordem Mentalidade → Engajamento → Cultura → Performance). */
export function getBottleneckPillar(
  four: FourPillarScores,
): { key: ActionPlanPillarKey; value: number } {
  let key: ActionPlanPillarKey = PILLAR_ORDER[0];
  let value = four[key];
  for (const k of PILLAR_ORDER) {
    const v = four[k];
    if (v < value) {
      value = v;
      key = k;
    }
  }
  return { key, value };
}

export type ActionPlanResult = {
  pillar: string;
  pillarKey: ActionPlanPillarKey;
  lowestScore: number;
  title: string;
  description: string;
  actions: string[];
  /** Valores por pilar (para transparência na UI). */
  scores: FourPillarScores;
};

/**
 * Plano de ação derivado do gargalo: menor entre mentalidade, engajamento, cultura e performance.
 * Conteúdo específico por pilar — não é genérico entre pilares.
 */
export function getActionPlan(scores: MECAScores): ActionPlanResult {
  const four = mecaScoresToFourPillar(scores);
  const { key, value } = getBottleneckPillar(four);
  const template = PLANS[key];

  return {
    pillar: PILLAR_LABEL[key],
    pillarKey: key,
    lowestScore: value,
    title: template.title,
    description: template.description,
    actions: [...template.actions],
    scores: { ...four },
  };
}
