/**
 * MECA — textos aprovados para a página /arquetipos.
 *
 * REGRA CRÍTICA: os textos abaixo são FINAIS e aprovados. Não reescrever,
 * resumir, simplificar ou alterar tom. Qualquer edição editorial deve vir
 * explicitamente do produto.
 *
 * Conteúdo editorial (diagnosis/mechanics/risk/leverage/action_plan) da
 * página /arquetipos é propositalmente MAIS LONGO do que o snapshot
 * utilizado no dashboard (`ARCHETYPES[k].diagnosis` etc. em
 * `src/lib/archetypes.ts`). O dashboard traz o resumo operacional do
 * diagnóstico; esta página traz o conteúdo expandido de referência.
 */

import type { ArchetypeKey } from "@/lib/archetypes";

export interface ArchetypePageContent {
  key: ArchetypeKey;
  name: string;
  short: string;
  diagnosis: string;
  mechanics: string;
  risk: string;
  leverage: string;
  action_plan: string[];
}

export const ARCHETYPE_PAGE_ORDER: ArchetypeKey[] = [
  "executor_isolado",
  "performatico_exausto",
  "estrategista_estagnado",
  "bem_quisto_estagnado",
  "protagonista_desalinhado",
  "acelerado_meca",
  "profissional_invisivel",
  "util_sem_direcao",
];

export const ARCHETYPE_PAGE_CONTENT: Record<ArchetypeKey, ArchetypePageContent> =
  {
    executor_isolado: {
      key: "executor_isolado",
      name: "Executor Isolado",
      short:
        "Entrega muito, mas não é percebido. Falta posicionamento estratégico.",
      diagnosis:
        "Você entrega mais do que a média e resolve problemas com consistência, mas seu crescimento não acompanha sua capacidade. O seu trabalho acontece, mas não ganha tração dentro do sistema. Você é confiável para executar, mas não é percebido como alguém que precisa avançar.",
      mechanics:
        "Esse padrão surge quando alta performance não é acompanhada por engajamento e posicionamento. Você produz, mas não constrói percepção. O sistema reconhece quem aparece, não apenas quem entrega.",
      risk:
        "Se mantido, você tende a se tornar o profissional que sustenta a operação, mas não participa das decisões. Crescimento lento, mesmo com alto esforço.",
      leverage:
        "Visibilidade estratégica e posicionamento. Não basta entregar — é preciso ser percebido no contexto certo.",
      action_plan: [
        "Tornar suas entregas visíveis de forma intencional",
        "Participar ativamente de discussões relevantes",
        "Se posicionar com opinião, não apenas execução",
      ],
    },

    performatico_exausto: {
      key: "performatico_exausto",
      name: "Performático Exausto",
      short: "Alta entrega com alto custo. Resultado sem sustentabilidade.",
      diagnosis:
        "Você entrega em alto nível, assume responsabilidades e mantém o ritmo acima da média, mas isso vem acompanhado de desgaste crescente. Sua performance existe, mas não é sustentável.",
      mechanics:
        "Alta execução combinada com baixa leitura de contexto e uso ineficiente de energia. Você compensa desalinhamento com esforço, o que gera sobrecarga.",
      risk:
        "Exaustão, perda de clareza e eventual estagnação. Você pode continuar performando, mas com custo cada vez maior e retorno cada vez menor.",
      leverage:
        "Eficiência e alinhamento. O próximo nível não exige mais esforço, exige melhor direcionamento.",
      action_plan: [
        "Reduzir atividades de baixo impacto",
        "Priorizar entregas com maior visibilidade",
        "Alinhar esforço com o que realmente gera crescimento",
      ],
    },

    estrategista_estagnado: {
      key: "estrategista_estagnado",
      name: "Estrategista Estagnado",
      short:
        "Entende o jogo, mas não executa. Fica na análise e perde o timing.",
      diagnosis:
        "Você entende o ambiente, percebe dinâmicas e enxerga caminhos com clareza, mas não transforma esse entendimento em execução consistente. Seu potencial existe, mas não se converte em resultado.",
      mechanics:
        "Alta leitura de contexto com baixa ação. Você analisa mais do que executa e perde timing.",
      risk:
        "Ser visto como alguém inteligente, mas pouco efetivo. Com o tempo, sua credibilidade pode ficar restrita à análise, não à entrega.",
      leverage: "Execução prática e velocidade de ação.",
      action_plan: [
        "Transformar análise em decisões rápidas",
        "Executar mesmo sem cenário perfeito",
        "Reduzir tempo entre entender e agir",
      ],
    },

    bem_quisto_estagnado: {
      key: "bem_quisto_estagnado",
      name: "Bem-Quisto Estagnado",
      short: "Bem relacionado, mas sem impacto real de crescimento.",
      diagnosis:
        "Você construiu boas relações, é respeitado e bem aceito, mas isso não está se traduzindo em crescimento real. Você mantém o ambiente funcionando, mas não avança.",
      mechanics:
        "Alto engajamento e boa leitura de contexto sem correspondência em performance e direcionamento. Você preserva relações, mas não gera impacto suficiente.",
      risk:
        "Ser sempre bem visto, mas raramente escolhido para oportunidades maiores.",
      leverage: "Foco em impacto e resultado mensurável.",
      action_plan: [
        "Assumir responsabilidades com impacto claro",
        "Conectar relacionamento com entrega",
        "Priorizar crescimento sobre aprovação",
      ],
    },

    protagonista_desalinhado: {
      key: "protagonista_desalinhado",
      name: "Protagonista Desalinhado",
      short: "Muita iniciativa, mas leitura de contexto abaixo do ideal.",
      diagnosis:
        "Você tem iniciativa, energia e vontade de fazer acontecer, mas frequentemente atua fora do contexto ideal. Sua ação não acompanha o funcionamento do sistema.",
      mechanics:
        "Alta mentalidade empreendedora com baixa leitura cultural. Você age antes de entender completamente o ambiente.",
      risk:
        "Ser percebido como desalinhado ou difícil de integrar, mesmo com boas intenções.",
      leverage: "Leitura de contexto e adaptação estratégica.",
      action_plan: [
        "Observar padrões antes de agir",
        "Entender como decisões são tomadas",
        "Ajustar comportamento ao ambiente",
      ],
    },

    acelerado_meca: {
      key: "acelerado_meca",
      name: "Acelerado MECA",
      short:
        "Equilíbrio entre mentalidade, engajamento, cultura e performance.",
      diagnosis:
        "Você opera com equilíbrio entre execução, posicionamento, leitura de contexto e mentalidade. Seu crescimento tende a ser consequência direta do seu comportamento.",
      mechanics:
        "Integração consistente dos quatro pilares. Você não depende de esforço isolado, mas de coerência comportamental.",
      risk: "Zona de conforto operacional. Crescer menos por já estar performando bem.",
      leverage: "Escala e influência.",
      action_plan: [
        "Expandir impacto além da sua função",
        "Influenciar decisões estratégicas",
        "Desenvolver outros profissionais",
      ],
    },

    profissional_invisivel: {
      key: "profissional_invisivel",
      name: "Profissional Invisível",
      short: "Trabalha bem, mas não é percebido pelo sistema.",
      diagnosis:
        "Você cumpre seu papel, entrega o que é esperado, mas sua atuação não gera percepção de valor. Você trabalha, mas não aparece no sistema.",
      mechanics:
        "Baixo engajamento e baixa leitura de contexto. Sua atuação fica restrita ao operacional e não se conecta com o ambiente.",
      risk: "Estagnação prolongada e perda de oportunidades.",
      leverage: "Presença ativa e visibilidade.",
      action_plan: [
        "Participar mais de interações relevantes",
        "Comunicar melhor suas entregas",
        "Sair do modo exclusivamente operacional",
      ],
    },

    util_sem_direcao: {
      key: "util_sem_direcao",
      name: "Útil Sem Direção",
      short: "Ajuda todos, mas não direciona a própria carreira.",
      diagnosis:
        "Você é acessível, ajuda todos e contribui para o funcionamento do time, mas sua carreira não avança na mesma proporção. Você se torna útil para o sistema, mas não estratégico para si.",
      mechanics:
        "Alto engajamento com baixa mentalidade direcionada a crescimento. Você prioriza o coletivo, mas negligencia seu posicionamento.",
      risk: "Ser constantemente solicitado, mas pouco promovido.",
      leverage: "Direcionamento e priorização estratégica.",
      action_plan: [
        "Definir prioridades de carreira",
        "Dizer não para demandas que não agregam crescimento",
        "Direcionar esforço para impacto pessoal e profissional",
      ],
    },
  };
