export interface MECAScores {
  M: number;
  E: number;
  C: number;
  A: number;
}

export type ArchetypeQuadrant = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface ArchetypeResult {
  name: string;
  quadrant: ArchetypeQuadrant;
  xScore: number;
  yScore: number;
  description: string;
  challenge: string;
  recommendations: string[];
  bgColor: string;
  textColor: string;
  weakestPilar: keyof MECAScores;
  weakestPilarName: string;
}

export const PILAR_NAMES: Record<keyof MECAScores, string> = {
  M: 'Mentalidade Empreendedora',
  E: 'Engajamento Autêntico',
  C: 'Cultura como Motor de Crescimento',
  A: 'Alta Performance',
};

export const PILAR_COLORS: Record<keyof MECAScores, string> = {
  M: '#4a90d9',
  E: '#2ecc71',
  C: '#f39c12',
  A: '#9b59b6',
};

function getWeakestPilar(scores: MECAScores): keyof MECAScores {
  return (Object.keys(scores) as Array<keyof MECAScores>).reduce((a, b) =>
    scores[a] < scores[b] ? a : b
  );
}

export function getArchetype(scores: MECAScores): ArchetypeResult {
  const xScore = (scores.E + scores.A) / 2;
  const yScore = (scores.M + scores.C) / 2;
  const threshold = 50;
  const weakestPilar = getWeakestPilar(scores);
  const weakestPilarName = PILAR_NAMES[weakestPilar];

  if (yScore >= threshold && xScore < threshold) {
    return {
      name: 'Potencial Disperso',
      quadrant: 'top-left',
      xScore, yScore,
      description: 'Você tem alta capacidade individual, mas ainda carece de direção estratégica e sistema de execução. Muito esforço, resultado abaixo do potencial.',
      challenge: 'Transformar capacidade em resultado previsível.',
      recommendations: [
        'Defina prioridades estratégicas — não tudo que pode ser feito deve ser feito.',
        'Construa rotinas de execução e acompanhamento de metas semanais.',
        'Invista em Engajamento Autêntico para ampliar sua visibilidade interna.',
      ],
      bgColor: '#e8ecf0', textColor: '#1a3a5c', weakestPilar, weakestPilarName,
    };
  }
  if (yScore >= threshold && xScore >= threshold) {
    return {
      name: 'Performance Alavancada',
      quadrant: 'top-right',
      xScore, yScore,
      description: 'Você combina alta capacidade individual com direção estratégica e sistema sólido. É o estado de máxima aceleração de carreira do método MECA.',
      challenge: 'Manter consistência e ampliar impacto organizacional.',
      recommendations: [
        'Expanda seu escopo de influência para além da sua área.',
        'Mentore outros profissionais — isso amplifica seu reconhecimento.',
        'Gerencie sua energia para sustentar o ritmo no longo prazo.',
      ],
      bgColor: '#dbeeff', textColor: '#1a3a5c', weakestPilar, weakestPilarName,
    };
  }
  if (yScore < threshold && xScore < threshold) {
    return {
      name: 'Risco Estrutural',
      quadrant: 'bottom-left',
      xScore, yScore,
      description: 'Baixa capacidade individual combinada com ausência de direção e sistema. Zona de alerta — o crescimento está bloqueado em múltiplas frentes.',
      challenge: 'Reconstruir base de mentalidade e criar estrutura mínima de execução.',
      recommendations: [
        'Comece pelo Pilar M — reconstrua sua mentalidade e autoeficácia.',
        'Escolha um único comportamento novo para praticar por 21 dias.',
        'Busque um mentor ou referência dentro da sua organização.',
      ],
      bgColor: '#5a6a7a', textColor: '#ffffff', weakestPilar, weakestPilarName,
    };
  }
  return {
    name: 'Executor Sobrecarregado',
    quadrant: 'bottom-right',
    xScore, yScore,
    description: 'Você tem boa direção e sistema, mas a capacidade individual ainda limita os resultados. Executa muito, cresce pouco.',
    challenge: 'Elevar a qualidade da entrega, não só o volume.',
    recommendations: [
      'Reduza o volume de tarefas para aumentar a profundidade das que ficam.',
      'Invista em Prática Deliberada — melhore o como, não só o quanto.',
      'Aplique o filtro 80/20 para priorizar entregas de alto impacto.',
    ],
    bgColor: '#f7f7f7', textColor: '#1a3a5c', weakestPilar, weakestPilarName,
  };
}
