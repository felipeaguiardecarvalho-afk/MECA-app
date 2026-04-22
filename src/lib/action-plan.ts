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
      "Escolha um problema recorrente da sua área e apresente uma proposta simples de solução antes que alguém peça. Registre o problema, o impacto esperado e o primeiro passo executável. Para embasamento, estude em Fundamentos: Intraempreendedorismo (Intrapreneurship) e Comportamento Proativo (Proactive Work Behavior).",
      "Defina uma decisão pequena que você vem adiando por falta de certeza total e tome uma ação reversível em até 24 horas. O objetivo é treinar movimento antes da validação completa. Para embasamento, estude em Fundamentos: Autoeficácia (Self-Efficacy).",
      "Revise suas responsabilidades atuais e identifique uma tarefa que pode ser redesenhada para gerar mais impacto, conexão ou visibilidade. Transforme essa mudança em um experimento de uma semana. Para embasamento, estude em Fundamentos: Redesenho do Trabalho (Job Crafting).",
      "Peça feedback objetivo sobre um comportamento específico e transforme a resposta em um ajuste observável na semana seguinte. Para embasamento, estude em Fundamentos: Mentalidade de Crescimento (Growth Mindset) e Carreira Autodirigida (Protean Career).",
    ],
  },
  engajamento: {
    title: "Aumentar visibilidade e confiança",
    description:
      "O seu pilar mais baixo é Engajamento: fortalecer presença, comunicação e alinhamento com stakeholders aumenta a confiança nas suas entregas e na sua trajetória.",
    actions: [
      "Faça um alinhamento curto com sua liderança sobre prioridades, critérios de sucesso e riscos da semana. Leve uma síntese em três pontos para reduzir ruído e aumentar confiança. Para embasamento, estude em Fundamentos: Troca Líder-Membro (Leader-Member Exchange - LMX).",
      "Crie uma rotina de comunicação de progresso: o que foi concluído, o que está bloqueado e qual decisão precisa de apoio. Repita por duas semanas. Para embasamento, estude em Fundamentos: Organizações de Alta Performance (High-Performance Organizations).",
      "Mapeie uma relação-chave em que falta confiança ou clareza e faça uma conversa objetiva sobre expectativas mútuas. Para embasamento, estude em Fundamentos: Teoria da Autodeterminação (Self-Determination Theory - SDT).",
      "Escolha uma discussão relevante e contribua com uma síntese, uma pergunta ou uma proposta concreta. A meta é aumentar presença sem depender de cargo formal. Para embasamento, estude em Fundamentos: Troca Líder-Membro (Leader-Member Exchange - LMX).",
    ],
  },
  cultura: {
    title: "Aprimorar leitura de contexto",
    description:
      "O seu pilar mais baixo é Cultura: ajustar comportamento ao contexto informal e às dinâmicas reais do grupo reduz atrito e acelera adesão às suas ideias.",
    actions: [
      "Observe por uma semana quais comportamentos são realmente reconhecidos nas decisões, reuniões e promoções, separando discurso oficial de prática real. Para embasamento, estude em Fundamentos: Níveis da Cultura Organizacional (Organizational Culture Levels).",
      "Liste três regras informais do seu ambiente: como decisões avançam, quem influencia e quais atitudes geram confiança. Use essa leitura para ajustar sua próxima iniciativa. Para embasamento, estude em Fundamentos: Cultura Forte vs. Cultura Fraca (Strong vs. Weak Culture).",
      "Adapte sua comunicação para uma área ou perfil diferente do seu, mudando nível de detalhe, timing e linguagem. Para embasamento, estude em Fundamentos: Dimensões Culturais (Cultural Dimensions Theory).",
      "Identifique um conflito recorrente que consome energia e redesenhe sua resposta: alinhe objetivo, fatos e próximo passo antes de entrar na conversa. Para embasamento, estude em Fundamentos: Psicologia Social dos Grupos (Social Psychology of Groups) e Modelo de Cultura Denison (Denison Organizational Culture Model).",
    ],
  },
  performance: {
    title: "Melhorar execução e foco",
    description:
      "O seu pilar mais baixo é Performance: priorizar impacto, ritmo sustentável e foco profundo eleva resultados mensuráveis sem esgotar energia em baixo retorno.",
    actions: [
      "Priorize sua lista de tarefas marcando quais 20% geram maior impacto percebido. Reserve o melhor bloco de energia do dia para essas tarefas antes de responder demandas periféricas. Para embasamento, estude em Fundamentos: Princípio de Pareto (Pareto Principle - 80/20).",
      "Crie dois blocos semanais de foco profundo com objetivo claro, sem notificações e com critério de entrega definido. Para embasamento, estude em Fundamentos: Estado de Flow (Flow State).",
      "Reduza carga cognitiva agrupando demandas similares, removendo pendências pequenas e mantendo uma lista única de prioridades. Para embasamento, estude em Fundamentos: Carga Cognitiva (Cognitive Load Theory).",
      "Planeje recuperação como parte da execução: defina pausas, limite de multitarefa e um horário de corte para evitar sobrecarga crônica. Para embasamento, estude em Fundamentos: Gestão da Energia (Energy Management) e Psicologia da Performance (Performance Psychology).",
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
