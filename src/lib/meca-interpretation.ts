import type { MECAScores } from "@/utils/archetypeEngine";

const PILLAR_FULL_NAMES: Record<keyof MECAScores, string> = {
  M: "Mentalidade Empreendedora",
  E: "Engajamento Autêntico",
  C: "Cultura como Motor de Crescimento",
  A: "Alta Performance",
};

const PILLAR_DB_NAMES: Record<keyof MECAScores, string> = {
  M: "mentalidade",
  E: "engajamento",
  C: "cultura",
  A: "performance",
};

function scoreRange(score: number): "critical" | "low" | "moderate" | "high" | "excellent" {
  if (score < 30) return "critical";
  if (score < 50) return "low";
  if (score < 70) return "moderate";
  if (score < 85) return "high";
  return "excellent";
}

const INTERPRETATIONS: Record<keyof MECAScores, Record<string, string>> = {
  M: {
    critical:
      "Mentalidade em zona crítica. Há fortes padrões de reatividade, baixa autoeficácia e dificuldade em assumir protagonismo. Requer atenção imediata para reverter crenças limitantes que bloqueiam o crescimento.",
    low: "Mentalidade abaixo do ideal. Ainda há postura predominantemente reativa e tendência a aguardar direcionamento externo. Há potencial claro para desenvolver mais autonomia e iniciativa.",
    moderate:
      "Mentalidade em desenvolvimento. Você alterna entre iniciativa e dependência externa conforme o contexto. Com práticas deliberadas, é possível consolidar uma postura mais protagonista e estratégica.",
    high: "Mentalidade bem desenvolvida. Você demonstra autonomia, assume responsabilidade pelos resultados e age estrategicamente na maior parte do tempo. O foco agora é consistência e expansão de escopo.",
    excellent:
      "Mentalidade de alta performance consolidada. Protagonismo, resiliência e visão sistêmica são traços consistentes. Você opera com clareza de propósito e transforma adversidades em oportunidades.",
  },
  E: {
    critical:
      "Engajamento em zona crítica. Visibilidade e confiança junto a stakeholders estão comprometidas. Há risco de invisibilidade organizacional que limita reconhecimento e acesso a oportunidades.",
    low: "Engajamento abaixo do esperado. A comunicação e o alinhamento com liderança e pares precisam ser fortalecidos. Pequenas ações de presença e clareza na comunicação podem gerar impacto imediato.",
    moderate:
      "Engajamento em desenvolvimento. Você comunica e se relaciona bem em contextos familiares, mas ainda há inconsistência na construção de confiança com stakeholders-chave. Trabalhar a presença estratégica é o próximo passo.",
    high: "Engajamento bem desenvolvido. Você constrói confiança, comunica com clareza e mantém relacionamentos estratégicos relevantes. O desafio é ampliar esse engajamento para novos escopos e audiências.",
    excellent:
      "Engajamento excepcional. Sua presença é percebida como referência. Você influencia com autenticidade, alinha expectativas com precisão e é reconhecido como ponto de confiança na organização.",
  },
  C: {
    critical:
      "Leitura de cultura em zona crítica. Há dificuldade em compreender e navegar as dinâmicas informais da organização, o que gera atrito, atraso nas decisões e baixa adesão às suas ideias.",
    low: "Leitura de cultura abaixo do esperado. Você identifica alguns padrões, mas ainda age de forma desalinhada ao contexto informal com frequência. Desenvolver essa competência reduz resistências e acelera resultados.",
    moderate:
      "Leitura de cultura em desenvolvimento. Você percebe as dinâmicas organizacionais, mas nem sempre adapta seu comportamento de forma eficaz. Com mais consistência, é possível influenciar o contexto cultural.",
    high: "Boa leitura de cultura organizacional. Você navega com competência nas dinâmicas informais, adapta seu estilo e contribui para um ambiente mais colaborativo. O próximo nível é liderar transformações culturais.",
    excellent:
      "Leitura de cultura excepcional. Você entende profundamente as dinâmicas organizacionais, age como catalisador de mudanças positivas e é reconhecido como referência cultural dentro da equipe.",
  },
  A: {
    critical:
      "Alta performance em zona crítica. Há comprometimento na qualidade da entrega, foco e gestão de energia. A sobrecarga ou falta de método está bloqueando os resultados esperados.",
    low: "Alta performance abaixo do ideal. Há entregas sendo feitas, mas falta consistência, profundidade e uso estratégico do tempo e da energia. Priorização e foco são os alvos imediatos.",
    moderate:
      "Alta performance em desenvolvimento. Você entrega resultados, mas ainda há espaço significativo para ganhos em qualidade, impacto e sustentabilidade da execução. Trabalhar o método de trabalho é o próximo passo.",
    high: "Alta performance bem estabelecida. Suas entregas têm qualidade reconhecida, você gerencia bem sua energia e opera com foco. O desafio é elevar o impacto e manter consistência em contextos de maior pressão.",
    excellent:
      "Alta performance excepcional. Você opera com excelência técnica, foco profundo e ritmo sustentável. Suas entregas têm alto impacto e você é referência de execução de qualidade na organização.",
  },
};

export type PillarInterpretation = {
  key: keyof MECAScores;
  fullName: string;
  dbName: string;
  score: number;
  range: string;
  text: string;
};

export function getPillarInterpretations(scores: MECAScores): PillarInterpretation[] {
  return (Object.keys(scores) as Array<keyof MECAScores>).map((key) => {
    const score = Math.round(Number(scores[key]));
    const range = scoreRange(score);
    return {
      key,
      fullName: PILLAR_FULL_NAMES[key],
      dbName: PILLAR_DB_NAMES[key],
      score,
      range,
      text: INTERPRETATIONS[key][range],
    };
  });
}

/** Returns pillars sorted ascending by score (worst first). */
export function getPillarRanking(scores: MECAScores): PillarInterpretation[] {
  return getPillarInterpretations(scores).sort((a, b) => a.score - b.score);
}
