import { classifyArchetype, ARCHETYPES } from "./archetypes";
import type { DiagnosticResult } from "./types";

export type Question = {
  id: number;
  pillar: "mentalidade" | "engajamento" | "cultura" | "performance";
  text: string;
  reverse?: boolean;
};

/** Likert 1–5; mapped to 0–100 per answer */
const LIKERT_TO_SCORE = (v: number) => Math.round(((v - 1) / 4) * 100);

/**
 * 60 perguntas validadas (ordem 1→60).
 * Itens com `reverse` têm sentido invertido: 1 é positivo e 5 é alerta.
 * Pilares: mentalidade 18, engajamento 18, cultura 10, performance 14.
 */
export const MECA_QUESTIONS: Question[] = [
  { id: 1, pillar: "mentalidade", text: "Eu tomo iniciativa mesmo sem solicitação" },
  {
    id: 2,
    pillar: "mentalidade",
    text: "Eu ajo para resolver problemas antes que virem demandas",
  },
  { id: 3, pillar: "mentalidade", text: "Eu busco melhorar processos existentes" },
  {
    id: 4,
    pillar: "mentalidade",
    text: "Eu evito situações em que posso errar, mesmo quando elas gerariam aprendizado",
    reverse: true,
  },
  {
    id: 5,
    pillar: "mentalidade",
    text: "Eu busco evoluir mesmo quando já desempenho bem",
  },
  {
    id: 6,
    pillar: "mentalidade",
    text: "Eu tenho dificuldade de ajustar minha forma de agir quando recebo feedback",
    reverse: true,
  },
  {
    id: 7,
    pillar: "mentalidade",
    text: "Eu inicio ações sem depender de direcionamento",
  },
  {
    id: 8,
    pillar: "mentalidade",
    text: "Eu proponho soluções ao invés de apenas apontar problemas",
  },
  {
    id: 9,
    pillar: "mentalidade",
    text: "Eu ajo rapidamente quando identifico oportunidades",
  },
  {
    id: 10,
    pillar: "mentalidade",
    text: "Eu adapto minhas responsabilidades para gerar mais impacto",
  },
  {
    id: 11,
    pillar: "mentalidade",
    text: "Eu busco aumentar o valor do meu papel além do esperado",
  },
  {
    id: 12,
    pillar: "mentalidade",
    text: "Eu ajusto minha forma de trabalhar para melhorar resultados",
  },
  {
    id: 13,
    pillar: "mentalidade",
    text: "Eu confio na minha capacidade de gerar resultado",
  },
  {
    id: 14,
    pillar: "mentalidade",
    text: "Eu adio decisões importantes quando não tenho todas as informações",
    reverse: true,
  },
  {
    id: 15,
    pillar: "mentalidade",
    text: "Eu dependo de validação constante para agir com segurança",
    reverse: true,
  },
  {
    id: 16,
    pillar: "mentalidade",
    text: "Eu me vejo como responsável pela minha trajetória profissional",
  },
  {
    id: 17,
    pillar: "mentalidade",
    text: "Eu insisto no mesmo caminho mesmo quando os aprendizados indicam mudança",
    reverse: true,
  },
  { id: 18, pillar: "mentalidade", text: "Eu priorizo aprendizado contínuo" },
  {
    id: 19,
    pillar: "engajamento",
    text: "Minha liderança confia no meu trabalho",
  },
  {
    id: 20,
    pillar: "engajamento",
    text: "Eu evito conversas abertas com meu gestor, mesmo quando preciso alinhar expectativas",
    reverse: true,
  },
  {
    id: 21,
    pillar: "engajamento",
    text: "Eu sou incluído em discussões relevantes",
  },
  {
    id: 22,
    pillar: "engajamento",
    text: "Eu sinto que só consigo avançar quando alguém define exatamente o que fazer",
    reverse: true,
  },
  { id: 23, pillar: "engajamento", text: "Eu me sinto competente no que faço" },
  { id: 24, pillar: "engajamento", text: "Eu sinto que faço parte do time" },
  {
    id: 25,
    pillar: "engajamento",
    text: "Eu me sinto frequentemente drenado pelo meu trabalho",
    reverse: true,
  },
  {
    id: 26,
    pillar: "engajamento",
    text: "Eu mantenho consistência mesmo em dias difíceis",
  },
  { id: 27, pillar: "engajamento", text: "Eu me envolvo ativamente nas demandas" },
  { id: 28, pillar: "engajamento", text: "Eu sou visto como alguém confiável" },
  {
    id: 29,
    pillar: "engajamento",
    text: "Eu cumpro consistentemente o que prometo",
  },
  {
    id: 30,
    pillar: "engajamento",
    text: "Eu sou acionado em momentos críticos",
  },
  {
    id: 31,
    pillar: "engajamento",
    text: "Eu tenho dificuldade de comunicar prioridades de forma clara e objetiva",
    reverse: true,
  },
  { id: 32, pillar: "engajamento", text: "Eu reduzo ruído nas interações" },
  {
    id: 33,
    pillar: "engajamento",
    text: "Eu adapto minha comunicação ao interlocutor",
  },
  {
    id: 34,
    pillar: "engajamento",
    text: "Eu tenho dificuldade de influenciar decisões quando não tenho autoridade formal",
    reverse: true,
  },
  {
    id: 35,
    pillar: "engajamento",
    text: "Eu consigo engajar outras pessoas nas minhas ideias",
  },
  {
    id: 36,
    pillar: "engajamento",
    text: "Eu contribuo para alinhamento entre áreas",
  },
  {
    id: 37,
    pillar: "cultura",
    text: "Eu entendo o que realmente é valorizado na empresa",
  },
  {
    id: 38,
    pillar: "cultura",
    text: "Eu costumo tomar o discurso oficial como verdade sem observar a prática real",
    reverse: true,
  },
  {
    id: 39,
    pillar: "cultura",
    text: "Eu identifico padrões de comportamento do grupo",
  },
  {
    id: 40,
    pillar: "cultura",
    text: "Eu mantenho a mesma forma de atuar mesmo quando o ambiente pede adaptação",
    reverse: true,
  },
  {
    id: 41,
    pillar: "cultura",
    text: "Eu adapto meu estilo conforme o contexto",
  },
  {
    id: 42,
    pillar: "cultura",
    text: "Eu tenho dificuldade de lidar com áreas que operam de forma diferente da minha",
    reverse: true,
  },
  {
    id: 43,
    pillar: "cultura",
    text: "Eu ajo alinhado ao que gera reconhecimento",
  },
  {
    id: 44,
    pillar: "cultura",
    text: "Eu entendo como decisões realmente acontecem",
  },
  {
    id: 45,
    pillar: "cultura",
    text: "Eu me desgasto ao lidar com perfis muito diferentes do meu",
    reverse: true,
  },
  {
    id: 46,
    pillar: "cultura",
    text: "Eu entro em conflitos que consomem energia sem gerar avanço prático",
    reverse: true,
  },
  {
    id: 47,
    pillar: "performance",
    text: "Eu priorizo atividades de maior impacto",
  },
  {
    id: 48,
    pillar: "performance",
    text: "Eu gasto tempo demais em tarefas de baixo valor",
    reverse: true,
  },
  {
    id: 49,
    pillar: "performance",
    text: "Eu transformo planos em ação rapidamente",
  },
  { id: 50, pillar: "performance", text: "Eu entrego de forma consistente" },
  {
    id: 51,
    pillar: "performance",
    text: "Eu gerencio minha energia ao longo da semana",
  },
  {
    id: 52,
    pillar: "performance",
    text: "Eu funciono frequentemente em sobrecarga constante",
    reverse: true,
  },
  {
    id: 53,
    pillar: "performance",
    text: "Eu consigo manter foco profundo",
  },
  {
    id: 54,
    pillar: "performance",
    text: "Eu me distraio com facilidade durante tarefas importantes",
    reverse: true,
  },
  {
    id: 55,
    pillar: "performance",
    text: "Eu busco melhorar continuamente",
  },
  {
    id: 56,
    pillar: "performance",
    text: "Eu analiso erros para evoluir",
  },
  {
    id: 57,
    pillar: "performance",
    text: "Eu organizo tarefas para evitar sobrecarga mental",
  },
  {
    id: 58,
    pillar: "performance",
    text: "Eu perco clareza quando preciso lidar com múltiplas demandas",
    reverse: true,
  },
  {
    id: 59,
    pillar: "performance",
    text: "Eu mantenho estabilidade emocional sob pressão",
  },
  {
    id: 60,
    pillar: "performance",
    text: "Eu tenho dificuldade de tomar decisões com clareza sob estresse",
    reverse: true,
  },
];

function answerKey(id: number): string {
  return String(id);
}

function scoreAnswer(question: Question, raw: number): number {
  return LIKERT_TO_SCORE(question.reverse ? 6 - raw : raw);
}

function averageForPillar(
  answers: Record<string, number>,
  pillar: Question["pillar"],
): number {
  const qs = MECA_QUESTIONS.filter((q) => q.pillar === pillar);
  if (qs.length === 0) return 0;
  let sum = 0;
  for (const q of qs) {
    const raw = answers[answerKey(q.id)];
    if (typeof raw !== "number" || raw < 1 || raw > 5) {
      throw new Error(`Resposta inválida para ${q.id}`);
    }
    sum += scoreAnswer(q, raw);
  }
  return Math.round(sum / qs.length);
}

/**
 * Rótulo persistido em `responses.archetype`. Delega ao classificador único
 * em `src/lib/archetypes.ts` — sem fallback de legado, sem "Perfil Equilibrado",
 * sem os 6 rótulos dominantes antigos.
 */
function deriveArchetype(pillars: {
  mentalidade: number;
  engajamento: number;
  cultura: number;
  performance: number;
}): string {
  const key = classifyArchetype({
    M: pillars.mentalidade,
    E: pillars.engajamento,
    C: pillars.cultura,
    A: pillars.performance,
  });
  return ARCHETYPES[key].name;
}

/**
 * Calcula scores 0–100 e arquétipo. Quatro pilares vêm das médias das 60 respostas;
 * direction e capacity derivam dessas médias (modelo com 6 eixos no produto sem perguntas dedicadas).
 */
export function computeDiagnostic(
  answers: Record<string, number>,
): DiagnosticResult {
  const mentalidade = averageForPillar(answers, "mentalidade");
  const engajamento = averageForPillar(answers, "engajamento");
  const cultura = averageForPillar(answers, "cultura");
  const performance = averageForPillar(answers, "performance");

  const direction = Math.round((mentalidade + engajamento) / 2);
  const capacity = Math.round((cultura + performance) / 2);

  const scores = {
    mentalidade,
    engajamento,
    cultura,
    performance,
    direction,
    capacity,
  };

  return {
    ...scores,
    archetype: deriveArchetype({ mentalidade, engajamento, cultura, performance }),
  };
}

export function emptyAnswers(): Record<string, number> {
  return Object.fromEntries(
    MECA_QUESTIONS.map((q) => [answerKey(q.id), 3]),
  );
}

/** Rótulo UX para o pilar (telas de diagnóstico). */
export function pillarDisplayLabel(
  pillar: Question["pillar"],
): "MENTALIDADE" | "ENGAJAMENTO" | "CULTURA" | "ALTA PERFORMANCE" {
  switch (pillar) {
    case "mentalidade":
      return "MENTALIDADE";
    case "engajamento":
      return "ENGAJAMENTO";
    case "cultura":
      return "CULTURA";
    case "performance":
      return "ALTA PERFORMANCE";
  }
}
