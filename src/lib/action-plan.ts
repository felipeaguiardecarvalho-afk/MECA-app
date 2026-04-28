import type { MECAScores } from "@/utils/archetypeEngine";
import {
  computeTheoryScore,
  MECA_THEORIES,
  type TheoryPillar,
} from "@/lib/meca-theories";

/** Quatro pilares alinhados ao diagnóstico (0–100). */
export type FourPillarScores = {
  mentalidade: number;
  engajamento: number;
  cultura: number;
  performance: number;
};

export type ActionPlanPillarKey = keyof FourPillarScores;

/** Ordem canônica para iteração/consistência interna. */
const PILLAR_ORDER: ActionPlanPillarKey[] = [
  "mentalidade",
  "engajamento",
  "cultura",
  "performance",
];

/**
 * Empate no menor score: prioriza o pilar com maior potencial de alavancagem comportamental.
 * Exceção de negócio: quando todos os pilares = 100, mantém Mentalidade.
 */
const BEHAVIORAL_LEVERAGE_ORDER: ActionPlanPillarKey[] = [
  "engajamento",
  "cultura",
  "performance",
  "mentalidade",
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

export type ActionPlanItem = {
  dashboardText: string;
  pdfActionText: string;
  foundationText: string;
  theoryId?: number;
  theoryName?: string;
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

/** Identifica o pilar com menor score (com desempate por alavancagem comportamental). */
export function getBottleneckPillar(
  four: FourPillarScores,
): { key: ActionPlanPillarKey; value: number } {
  const value = Math.min(...PILLAR_ORDER.map((k) => four[k]));
  const minKeys = PILLAR_ORDER.filter((k) => four[k] === value);

  if (minKeys.length === 1) {
    return { key: minKeys[0], value };
  }

  if (PILLAR_ORDER.every((k) => four[k] === 100)) {
    return { key: "mentalidade", value };
  }

  for (const k of BEHAVIORAL_LEVERAGE_ORDER) {
    if (minKeys.includes(k)) {
      return { key: k, value };
    }
  }

  // Fallback defensivo (não esperado): mantém ordem canônica.
  return { key: minKeys[0], value };
}

function rankPillarsByScore(four: FourPillarScores): ActionPlanPillarKey[] {
  // Excecao de negocio: quando tudo = 100, manter Mentalidade como ancora principal.
  if (PILLAR_ORDER.every((k) => four[k] === 100)) {
    return ["mentalidade", "engajamento", "cultura", "performance"];
  }

  const tieBreakPriority: Record<ActionPlanPillarKey, number> = {
    engajamento: 0,
    cultura: 1,
    performance: 2,
    mentalidade: 3,
  };

  return [...PILLAR_ORDER].sort((a, b) => {
    const diff = four[a] - four[b];
    if (diff !== 0) return diff;
    return tieBreakPriority[a] - tieBreakPriority[b];
  });
}

export type ActionPlanResult = {
  pillar: string;
  pillarKey: ActionPlanPillarKey;
  secondaryPillarKey: ActionPlanPillarKey;
  lowestScore: number;
  title: string;
  description: string;
  actionItems: ActionPlanItem[];
  actions: string[];
  actionTheoryIds: number[];
  /** Valores por pilar (para transparência na UI). */
  scores: FourPillarScores;
};

/**
 * Plano de ação derivado do gargalo: menor entre mentalidade, engajamento, cultura e performance.
 * Conteúdo específico por pilar — não é genérico entre pilares.
 */
export function getActionPlan(
  scores: MECAScores,
  answers?: Record<string, number> | null,
): ActionPlanResult {
  const four = mecaScoresToFourPillar(scores);
  const { key, value } = getBottleneckPillar(four);
  const template = PLANS[key];
  const ranked = rankPillarsByScore(four);
  const secondaryKey = ranked.find((pillar) => pillar !== key) ?? key;
  const secondaryTemplate = PLANS[secondaryKey];

  const hasAnswers = Boolean(answers && Object.keys(answers).length > 0);
  const foundationMarker = "Para embasamento, estude em Fundamentos:";
  const splitTemplateAction = (text: string): ActionPlanItem => {
    const idx = text.indexOf(foundationMarker);
    if (idx < 0) {
      return {
        dashboardText: text,
        pdfActionText: text,
        foundationText: "",
      };
    }

    const actionPart = text.slice(0, idx).trim();
    const foundationPart = text
      .slice(idx + foundationMarker.length)
      .trim()
      .replace(/\s+$/, "");

    return {
      dashboardText: text,
      pdfActionText: actionPart || text,
      foundationText: foundationPart,
    };
  };

  const primaryActions = template.actions.slice(0, 3);
  const secondaryAction = secondaryTemplate.actions[0]
    ? [secondaryTemplate.actions[0]]
    : [];

  let actionItems = [...primaryActions, ...secondaryAction].map(splitTemplateAction);
  let actionTheoryIds: number[] = [];

  if (hasAnswers) {
    const answerMap = answers ?? {};
    const scored = MECA_THEORIES.map((theory) => ({
      theory,
      score: computeTheoryScore(theory.questionIds, answerMap),
    })).sort((a, b) => a.score - b.score || a.theory.id - b.theory.id);

    const primaryPillar = key as TheoryPillar;
    const secondaryPillar = secondaryKey as TheoryPillar;

    const primarySelected = scored
      .filter((entry) => entry.theory.pillar === primaryPillar)
      .slice(0, 3);
    const secondarySelected = scored
      .filter((entry) => entry.theory.pillar === secondaryPillar)
      .slice(0, 1);

    const selected = [...primarySelected, ...secondarySelected].slice(0, 4);
    const theoryItems = selected
      .map((entry) => {
        const action1 = entry.theory.acoes[0];
        const action2 = entry.theory.acoes[1];
        if (!action1) return null;

        const foundationSentence = entry.theory.fundamentacao
          .split(".")[0]
          .trim();
        const foundationText = foundationSentence
          ? `${entry.theory.name}: ${foundationSentence}.`
          : entry.theory.name;
        const dashboardText =
          `${action1} Para embasamento, estude em Fundamentos: ${entry.theory.name}.`.trim();
        const pdfActionText = [action1, action2].filter(Boolean).join(" ");

        return {
          dashboardText,
          pdfActionText: pdfActionText || action1,
          foundationText,
          theoryId: entry.theory.id,
          theoryName: entry.theory.name,
        } satisfies ActionPlanItem;
      })
      .filter((item): item is ActionPlanItem => item !== null);

    if (theoryItems.length === 4) {
      actionItems = theoryItems;
      actionTheoryIds = selected.map((entry) => entry.theory.id);
    }
  }

  const actions = actionItems.map((item) => item.dashboardText);

  return {
    pillar: PILLAR_LABEL[key],
    pillarKey: key,
    secondaryPillarKey: secondaryKey,
    lowestScore: value,
    title: template.title,
    description: template.description,
    actionItems,
    actions,
    actionTheoryIds,
    scores: { ...four },
  };
}
