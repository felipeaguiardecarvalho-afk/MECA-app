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
  "especialista_reconhecido",
  "competente_desengajado",
  "potencial_represado",
  "esforcado_perdido",
  "arquiteto_em_construcao",
  "adormecido",
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
        "Você cumpre seu papel, entrega o que é esperado, mas sua atuação não gera percepção de valor. Você trabalha, mas não aparece no sistema. Engajamento e leitura de contexto estão em nível muito abaixo do necessário para que sua presença seja notada.",
      mechanics:
        "Engajamento e cultura extremamente baixos. Sua atuação fica restrita ao operacional e não se conecta com o ambiente de forma relevante.",
      risk: "Estagnação prolongada, perda de oportunidades e desconexão progressiva do ambiente.",
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

    especialista_reconhecido: {
      key: "especialista_reconhecido",
      name: "Especialista Reconhecido",
      short: "Alta competência e bom engajamento, mas falta protagonismo.",
      diagnosis:
        "Você tem alta competência técnica, bom engajamento com o ambiente e forte leitura de contexto. Você é valorizado e reconhecido pelo que entrega. Mas há uma lacuna de protagonismo — você ainda não transformou esse reconhecimento em liderança de impacto e crescimento acelerado.",
      mechanics:
        "Alto A + alto C + alto E com M abaixo do necessário para liderar mudanças. Você é o profissional em quem o sistema confia para executar, mas raramente para liderar.",
      risk:
        "Estabilizar no conforto de ser reconhecido sem assumir os riscos que geram o próximo nível de crescimento.",
      leverage: "Mentalidade de protagonismo e iniciativa estratégica.",
      action_plan: [
        "Assumir projetos com risco calculado e liderança visível",
        "Propor soluções e mudanças sem esperar solicitação",
        "Desenvolver postura de liderança além da sua especialidade técnica",
      ],
    },

    competente_desengajado: {
      key: "competente_desengajado",
      name: "Competente Desengajado",
      short: "Alta capacidade, mas engajamento baixo trava o crescimento.",
      diagnosis:
        "Você tem capacidade real, lê bem o ambiente e entrega resultados consistentes, mas seu engajamento com o contexto é baixo. O sistema percebe sua presença técnica, mas não sente seu envolvimento. Isso cria uma lacuna entre o que você pode gerar e o que efetivamente é percebido.",
      mechanics:
        "Alto A + alto C + baixo E. A competência existe, mas a conexão com o sistema é superficial. Você entrega, mas não se conecta.",
      risk:
        "Ser percebido como distante, desinteressado ou difícil de envolver — e perder oportunidades de influência e crescimento por isso.",
      leverage: "Engajamento genuíno e construção de relações estratégicas.",
      action_plan: [
        "Investir tempo ativo em relações-chave do seu contexto",
        "Demonstrar interesse genuíno nas iniciativas do time",
        "Ampliar presença e contribuição em discussões relevantes",
      ],
    },

    potencial_represado: {
      key: "potencial_represado",
      name: "Potencial Represado",
      short: "Consciência do ambiente, mas engajamento e capacidade travados.",
      diagnosis:
        "Você tem consciência do ambiente, lê algumas dinâmicas do contexto e entende o que precisa acontecer, mas baixo engajamento e capacidade ainda em desenvolvimento impedem que você converta esse entendimento em avanço real. O potencial existe, mas está represado.",
      mechanics:
        "Baixo E + baixo A + C moderado. Você observa mais do que age. Sua leitura de contexto não se traduz em execução ou presença relevante.",
      risk:
        "Permanecer no modo de observação indefinidamente, perdendo o timing das oportunidades que percebe mas não aproveita.",
      leverage: "Engajamento ativo e desenvolvimento consistente de capacidade técnica.",
      action_plan: [
        "Escolher uma área de alta relevância para aprofundar a competência",
        "Aumentar presença e participação visível no seu contexto",
        "Traduzir leitura de contexto em pelo menos uma ação concreta por semana",
      ],
    },

    esforcado_perdido: {
      key: "esforcado_perdido",
      name: "Esforçado Perdido",
      short: "Muita energia e iniciativa, mas sem direção ou sistema.",
      diagnosis:
        "Você tem energia, iniciativa e disposição para agir. O esforço é real e visível. Mas falta direção estratégica e leitura de contexto para que esse esforço se converta em impacto. Você trabalha muito, mas frequentemente nos lugares errados ou sem o sistema necessário para escalar.",
      mechanics:
        "Alta M com baixo C e A ainda em desenvolvimento. Você age antes de entender e executa sem o mapa do ambiente. O esforço existe, mas se perde antes de gerar resultado.",
      risk:
        "Desgaste sem crescimento visível. Esforço desalinhado gera perda de credibilidade mesmo para quem tem boa intenção.",
      leverage: "Direção estratégica e desenvolvimento de competências práticas com foco.",
      action_plan: [
        "Definir um objetivo de crescimento claro e mensurável para os próximos 90 dias",
        "Alinhar esforço com o que o sistema realmente valoriza — observar antes de agir",
        "Desenvolver pelo menos uma competência técnica de alto impacto com consistência",
      ],
    },

    arquiteto_em_construcao: {
      key: "arquiteto_em_construcao",
      name: "Arquiteto em Construção",
      short: "Boa direção e engajamento, mas capacidade ainda em desenvolvimento.",
      diagnosis:
        "Você tem boa leitura de contexto, engajamento ativo e está construindo uma direção clara. A visão existe e o sistema percebe seu alinhamento. O que falta é que sua capacidade técnica ainda não chegou ao nível da sua visão. Você está montando a fundação — mas a estrutura precisa se sustentar.",
      mechanics:
        "Alto C + alto E + A moderado. Você enxerga o caminho e engaja com o ambiente, mas o desenvolvimento de capacidade não acompanha o ritmo da sua intenção.",
      risk:
        "A lacuna entre visão e execução pode gerar frustração interna e perda de credibilidade externa se não for reduzida com consistência.",
      leverage: "Desenvolvimento de capacidade prática e consistência na entrega.",
      action_plan: [
        "Priorizar o desenvolvimento de uma competência de alto impacto e aplicá-la imediatamente",
        "Reduzir o gap entre planejamento e execução — transformar decisões em ações na mesma semana",
        "Transformar sua visão em entregas concretas e mensuráveis que o sistema possa perceber",
      ],
    },

    adormecido: {
      key: "adormecido",
      name: "O Adormecido",
      short: "Presente, mas inativo. Engajamento e contexto precisam ser ativados.",
      diagnosis:
        "Você está presente no ambiente, mas não ativo dentro dele. Seu engajamento com o sistema e sua leitura de contexto estão baixos — o que faz com que sua presença não seja percebida como relevante. Você ocupa espaço, mas não gera movimento.",
      mechanics:
        "Baixo E + baixo C. Sem conexão ativa com o ambiente e sem presença visível, o crescimento não encontra tração. Não é ausência de capacidade — é ausência de ativação.",
      risk:
        "Estagnação prolongada e distanciamento progressivo das oportunidades. O sistema tende a ignorar quem não aparece.",
      leverage: "Ativação comportamental — engajamento e presença como ponto de partida.",
      action_plan: [
        "Escolher uma relação-chave para investir atenção genuína esta semana",
        "Participar de ao menos uma discussão relevante com contribuição real — não apenas presença",
        "Mapear o ambiente: entender as regras informais, quem influencia e o que é valorizado",
      ],
    },
  };
