export type TheoryPillar = "mentalidade" | "engajamento" | "cultura" | "performance";

export interface MecaTheory {
  id: number;
  name: string;
  pillar: TheoryPillar;
  questionIds: number[];
  diagnostico: string;
  fundamentacao: string;
  impacto: string;
  acoes: [string, string, string];
  resultado: string;
}

export const MECA_THEORIES: MecaTheory[] = [
  {
    id: 1,
    name: "Intraempreendedorismo",
    pillar: "mentalidade",
    questionIds: [1, 2, 3],
    diagnostico:
      "Você demonstra baixa tendência a tomar iniciativas além do que é solicitado. Há uma inclinação a aguardar direcionamentos externos antes de agir, o que limita sua capacidade de inovar dentro do seu contexto profissional e reduz seu impacto estratégico.",
    fundamentacao:
      "O intraempreendedorismo (Pinchot, 1985) descreve a capacidade de empreender de dentro das organizações — identificar oportunidades, propor soluções e implementar mudanças sem precisar sair do papel institucional. Profissionais com esse perfil elevado são reconhecidos como agentes de transformação interna.",
    impacto:
      "A ausência desse comportamento resulta em estagnação da carreira, invisibilidade organizacional e perda de oportunidades de liderança. Em contextos de alta competitividade, quem aguarda permissão para agir raramente ocupa posições de destaque.",
    acoes: [
      "Identifique um processo ineficiente no seu trabalho e proponha uma melhoria documentada esta semana, sem esperar ser solicitado.",
      "Reserve 20 minutos diários para mapear problemas recorrentes da equipe e desenvolver hipóteses de solução — transforme observação em proposta.",
      "Apresente ao menos uma ideia por mês ao seu gestor ou equipe, com análise de viabilidade, impacto esperado e primeiros passos de implementação.",
    ],
    resultado:
      "Ao desenvolver o intraempreendedorismo, você se posiciona como referência de inovação interna, amplia sua visibilidade estratégica e cria as condições para assumir projetos de maior complexidade e responsabilidade.",
  },
  {
    id: 2,
    name: "Mentalidade de Crescimento",
    pillar: "mentalidade",
    questionIds: [4, 5, 6],
    diagnostico:
      "Sua pontuação indica uma tendência a evitar situações de risco ou exposição ao erro, mesmo quando representam oportunidades de aprendizado. Isso sinaliza a presença de uma mentalidade fixa — onde habilidades são vistas como estáticas — em detrimento de uma mentalidade de crescimento.",
    fundamentacao:
      "Carol Dweck (2006) demonstrou que indivíduos com mentalidade de crescimento compreendem que capacidades se desenvolvem com esforço e experiência. Esse mindset está diretamente associado a maior resiliência, adaptabilidade e desempenho sustentado ao longo da carreira.",
    impacto:
      "A mentalidade fixa cria barreiras invisíveis que impedem o desenvolvimento: evitar desafios, desistir diante de obstáculos e interpretar feedback como ameaça. A longo prazo, esses padrões limitam a evolução profissional e pessoal de forma significativa.",
    acoes: [
      "Na próxima semana, escolha deliberadamente uma tarefa que você normalmente evitaria por receio de errar — foque no processo, não no resultado.",
      "Ao receber um feedback difícil, escreva três perguntas que transformem a crítica em orientação de desenvolvimento antes de reagir emocionalmente.",
      "Crie o hábito de revisar mensalmente um erro significativo e extrair dele ao menos dois aprendizados concretos aplicáveis.",
    ],
    resultado:
      "Com uma mentalidade de crescimento consolidada, você aumenta sua tolerância à ambiguidade, acelera o aprendizado e desenvolve a resiliência necessária para performar em ambientes de alta exigência e mudança constante.",
  },
  {
    id: 3,
    name: "Comportamento Proativo",
    pillar: "mentalidade",
    questionIds: [7, 8, 9],
    diagnostico:
      "Você apresenta baixa frequência de comportamentos antecipatórios — a tendência é reagir às demandas quando surgem, ao invés de antecipá-las. Isso reduz sua influência sobre o próprio trabalho e limita sua capacidade de criar valor além do prescrito.",
    fundamentacao:
      "A proatividade (Crant, 2000; Grant & Ashford, 2008) é definida como comportamento autoiniciado, orientado ao futuro e à mudança. Profissionais proativos criam oportunidades, solucionam problemas antes que escalem e constroem redes de influência de forma intencional.",
    impacto:
      "A postura reativa gera dependência de terceiros para progredir, reduz a autonomia percebida e afasta o profissional de posições de maior responsabilidade. Em organizações que valorizam iniciativa, a passividade é frequentemente interpretada como falta de engajamento.",
    acoes: [
      "Antes de cada reunião importante, envie um breve resumo com suas perspectivas e perguntas — isso demonstra preparo e posicionamento proativo.",
      "Identifique semanalmente um risco ou oportunidade latente no seu contexto de trabalho e comunique ao responsável com uma sugestão de ação.",
      "Estabeleça uma rotina de planejamento semanal: defina três resultados prioritários que você irá perseguir ativamente, sem aguardar solicitação.",
    ],
    resultado:
      "Ao cultivar comportamentos proativos, você amplia sua influência no ambiente de trabalho, torna-se referência de confiabilidade e constrói uma reputação de profissional que gera resultados, não apenas os executa.",
  },
  {
    id: 4,
    name: "Redesenho do Trabalho",
    pillar: "mentalidade",
    questionIds: [10, 11, 12],
    diagnostico:
      "Você demonstra baixa tendência a adaptar ativamente as tarefas, relações ou percepção de significado do seu trabalho. Isso indica que você tende a executar o trabalho como prescrito, sem buscar personalizá-lo de forma a aumentar sua satisfação, energia ou impacto.",
    fundamentacao:
      "O job crafting (Wrzesniewski & Dutton, 2001) descreve as ações que os profissionais tomam para remodelar limites físicos, cognitivos e relacionais do seu trabalho. Profissionais que praticam job crafting relatam maior bem-estar, engajamento e senso de propósito.",
    impacto:
      "A ausência de redesenho ativo leva ao distanciamento emocional do trabalho, queda de motivação intrínseca e sensação crescente de rotina vazia. Com o tempo, o profissional passa a executar por obrigação, não por significado — o que compromete tanto a qualidade quanto a sustentabilidade da performance.",
    acoes: [
      "Mapeie suas tarefas semanais e identifique quais geram mais energia — busque ampliar essas atividades e reduzir ou automatizar as que drenam.",
      "Redefina o propósito de ao menos uma tarefa rotineira: como ela contribui para algo maior? Escreva essa conexão e retome sempre que necessário.",
      "Amplie suas conexões com colegas que lhe inspiram — interações relacionais positivas são uma das formas mais eficazes de redesenho do trabalho.",
    ],
    resultado:
      "Com o job crafting como prática regular, você transforma o trabalho de obrigação em expressão — aumentando engajamento genuíno, criatividade e a capacidade de sustentar alta performance ao longo do tempo.",
  },
  {
    id: 5,
    name: "Autoeficácia",
    pillar: "mentalidade",
    questionIds: [13, 14, 15],
    diagnostico:
      "Sua pontuação revela baixa crença na própria capacidade de realizar tarefas com sucesso. Isso pode se manifestar como hesitação diante de novos desafios, tendência a subestimar suas competências e dependência de validação externa para agir com segurança.",
    fundamentacao:
      "Albert Bandura (1977) define autoeficácia como a crença do indivíduo em sua capacidade de executar os comportamentos necessários para atingir determinados resultados. É um dos preditores mais robustos de desempenho, persistência e resiliência psicológica.",
    impacto:
      "Baixa autoeficácia cria um ciclo de evitação: ao não confiar nas próprias capacidades, o profissional evita desafios que poderiam desenvolvê-lo — o que perpetua a crença limitante. Isso se traduz em resultados aquém do potencial real e progressão de carreira lenta.",
    acoes: [
      "Registre diariamente uma competência que você utilizou com sucesso — esse exercício de reconhecimento constrói evidências internas de capacidade.",
      "Estabeleça metas progressivas: desafios levemente acima da sua zona de conforto atual, acumulando experiências de domínio que alimentem sua autoeficácia.",
      "Busque um mentor ou profissional que você admira e observe sua forma de lidar com incerteza — a modelagem social é uma das fontes mais poderosas de autoeficácia.",
    ],
    resultado:
      "Com autoeficácia desenvolvida, você passa a assumir desafios com mais segurança, persiste diante de obstáculos e constrói uma trajetória de crescimento consistente — baseada em competência real e confiança genuína.",
  },
  {
    id: 6,
    name: "Carreira Autodirigida",
    pillar: "mentalidade",
    questionIds: [16, 17, 18],
    diagnostico:
      "Você demonstra baixo protagonismo na gestão da própria carreira, com tendência a deixar que oportunidades e decisões sejam definidas externamente. Isso indica ausência de um plano intencional de desenvolvimento e pouca clareza sobre onde quer chegar e como chegar lá.",
    fundamentacao:
      "O modelo de carreira proteana (Hall, 1996) e as carreiras sem fronteiras (Arthur & Rousseau, 1996) descrevem profissionais que assumem a responsabilidade pelo próprio desenvolvimento, orientados por valores internos e adaptáveis à mudança — em contraste com carreiras lineares e organizacionalmente definidas.",
    impacto:
      "Sem direção autodirigida, a carreira fica sujeita ao acaso ou às necessidades da organização — o que pode gerar estagnação, insatisfação e uma trajetória desalinhada com as aspirações mais profundas do profissional.",
    acoes: [
      "Defina sua visão de carreira para os próximos três anos: que tipo de profissional você quer ser? Quais entregas, habilidades e posições você almeja?",
      "Crie um plano de desenvolvimento individual com ao menos duas competências prioritárias para desenvolver nos próximos seis meses, com ações e prazos.",
      "Reserve um encontro trimestral consigo mesmo para revisar sua trajetória, ajustar o plano e reconhecer o progresso — a autoliderança exige reflexão sistemática.",
    ],
    resultado:
      "Com uma carreira autodirigida, você deixa de ser passageiro da própria trajetória e passa a construí-la ativamente — com propósito, estratégia e a consciência de que cada decisão contribui para o profissional que você está se tornando.",
  },
  {
    id: 7,
    name: "Qualidade da Relação Líder-Membro (LMX)",
    pillar: "engajamento",
    questionIds: [19, 20, 21, 28, 29, 30],
    diagnostico:
      "Sua pontuação indica que as relações com líderes e pares apresentam baixa qualidade de troca — há pouca reciprocidade, confiança limitada e escassez de suporte mútuo. Isso compromete diretamente o seu nível de engajamento e a sua influência dentro das redes organizacionais.",
    fundamentacao:
      "A teoria Leader-Member Exchange (Graen & Uhl-Bien, 1995) demonstra que a qualidade da relação entre líder e liderado é um dos principais determinantes do engajamento, satisfação e desempenho. Relações de alta qualidade são marcadas por confiança, respeito e obrigação mútua além do contrato formal.",
    impacto:
      "Relações de baixa qualidade com lideranças e pares geram isolamento, falta de acesso a recursos e informações estratégicas, e reduzem significativamente as oportunidades de desenvolvimento e visibilidade organizacional.",
    acoes: [
      "Invista na construção de ao menos uma relação de alta qualidade: agende conversas genuínas com seu líder ou um colega estratégico — sem agenda oculta, focadas em troca e escuta.",
      "Ofereça suporte proativo a um colega em um projeto relevante — reciprocidade é o alicerce das relações de alta qualidade.",
      "Solicite feedback estruturado ao seu líder sobre seu desempenho e contribuições — isso demonstra abertura, fortalece o vínculo e cria dados para desenvolvimento.",
    ],
    resultado:
      "Ao elevar a qualidade das suas relações profissionais, você amplia seu capital social, aumenta o engajamento no trabalho e cria uma rede de suporte que potencializa tanto seus resultados quanto seu crescimento.",
  },
  {
    id: 8,
    name: "Motivação Autônoma (SDT)",
    pillar: "engajamento",
    questionIds: [22, 23, 24, 25, 26, 27],
    diagnostico:
      "Você apresenta sinais de motivação predominantemente controlada — suas ações parecem ser mais orientadas por pressão externa, obrigação ou evitação de consequências do que por interesse genuíno, valores pessoais ou satisfação intrínseca. Isso compromete a qualidade do seu engajamento e a sustentabilidade da sua performance.",
    fundamentacao:
      "A Teoria da Autodeterminação (Deci & Ryan, 1985) distingue entre motivação autônoma (oriunda de valores e interesse genuíno) e controlada (oriunda de pressão externa ou interna). A motivação autônoma está associada a maior bem-estar, criatividade, persistência e desempenho de alta qualidade.",
    impacto:
      "A motivação controlada é cognitivamente custosa e emocionalmente desgastante. Profissionais que operam predominantemente nesse modo experimentam maior burnout, menor criatividade e dificuldade de sustentar alta performance em contextos desafiadores.",
    acoes: [
      "Identifique quais atividades do seu trabalho você faria mesmo sem recompensa ou obrigação — essas são as fontes da sua motivação autônoma. Aumente intencionalmente o tempo nelas.",
      "Conecte suas tarefas atuais a valores pessoais profundos: por que esse trabalho importa para você além do salário? Escreva essa resposta e revise regularmente.",
      "Desenvolva sua autonomia percebida: negocie com seu gestor formas de ter mais controle sobre como (não apenas o quê) você realiza seu trabalho.",
    ],
    resultado:
      "Ao cultivar motivação autônoma, você aumenta a qualidade do seu engajamento, reduz o desgaste associado ao desempenho por obrigação e constrói uma relação com o trabalho que é sustentável, criativa e genuinamente satisfatória.",
  },
  {
    id: 9,
    name: "Organizações de Alta Performance",
    pillar: "engajamento",
    questionIds: [31, 32, 33, 34, 35, 36],
    diagnostico:
      "Sua pontuação indica que você apresenta baixo alinhamento com as práticas e dinâmicas de organizações de alta performance — há pouca tendência a atuar com foco em resultados coletivos, clareza de papel e responsabilidade compartilhada. Isso limita sua contribuição para ambientes de excelência.",
    fundamentacao:
      "Organizações de Alta Performance (Holbeche, 2005) são caracterizadas por metas claras, confiança interpessoal, colaboração efetiva e responsabilidade mútua. Profissionais que operam dentro desse modelo contribuem para resultados coletivos superiores e experimentam maior engajamento.",
    impacto:
      "A ausência desses comportamentos cria fragmentação de esforços, conflitos de expectativa e resultados abaixo do potencial coletivo. Em equipes de alta exigência, baixo alinhamento com esses padrões é rapidamente percebido e pode comprometer a reputação e o avanço do profissional.",
    acoes: [
      "Clarifique com sua equipe ou liderança quais são os 3 resultados mais críticos do trimestre — alinhe sua energia e esforço com essas prioridades coletivas.",
      "Adote o hábito de comunicar proativamente o status das suas entregas, impedimentos e necessidades de suporte — visibilidade é responsabilidade compartilhada.",
      "Identifique uma prática de colaboração que sua equipe poderia adotar e proponha sua implementação com um piloto de 30 dias — lidere pelo exemplo.",
    ],
    resultado:
      "Ao desenvolver comportamentos alinhados a organizações de alta performance, você amplia seu impacto coletivo, fortalece a confiança da equipe e posiciona-se como um profissional que eleva o nível do ambiente ao seu redor.",
  },
  {
    id: 10,
    name: "Níveis da Cultura Organizacional",
    pillar: "cultura",
    questionIds: [37, 38],
    diagnostico:
      "Você demonstra baixa consciência ou alinhamento com os níveis mais profundos da cultura organizacional — os valores declarados e, sobretudo, os pressupostos implícitos que regem o comportamento coletivo. Isso pode gerar fricção com o ambiente e dificultar sua integração e influência cultural.",
    fundamentacao:
      "Edgar Schein (1985) descreve a cultura organizacional em três níveis: artefatos visíveis, valores declarados e pressupostos básicos inconscientes. Os pressupostos são os verdadeiros determinantes do comportamento organizacional — e compreendê-los é essencial para navegar e transformar culturas.",
    impacto:
      "Sem leitura precisa dos níveis culturais, o profissional tende a interpretar conflitos e dinâmicas organizacionais de forma superficial, propor mudanças que encontram resistência silenciosa e ter dificuldade de exercer influência real — mesmo com competências técnicas elevadas.",
    acoes: [
      "Observe e documente os rituais, símbolos e comportamentos recorrentes da sua organização — eles revelam os valores reais, não os declarados.",
      "Identifique um pressuposto cultural implícito que impacta diretamente seu trabalho e avalie se ele está alinhado ou em tensão com seus objetivos.",
      "Inicie conversas com colegas sobre como as coisas funcionam de verdade — isso ativa a consciência cultural coletiva e abre espaço para transformação.",
    ],
    resultado:
      "Com leitura cultural aprofundada, você passa a navegar o ambiente organizacional com maior precisão, influencia mudanças de forma mais efetiva e constrói alianças estratégicas ancoradas em compreensão real, não em suposições.",
  },
  {
    id: 11,
    name: "Cultura Forte vs. Fraca",
    pillar: "cultura",
    questionIds: [39, 40],
    diagnostico:
      "Sua pontuação indica baixo senso de pertencimento ou alinhamento com os valores centrais da organização, sugerindo que você pode estar operando em um contexto de cultura fraca — ou que há um desalinhamento entre seus valores e os da organização.",
    fundamentacao:
      "Culturas fortes (Deal & Kennedy, 1982; Peters & Waterman, 1982) são aquelas em que os valores são amplamente compartilhados, os comportamentos esperados são claros e há alto senso de identidade coletiva. Elas geram maior coesão, tomada de decisão mais ágil e desempenho organizacional superior.",
    impacto:
      "Operar em desalinhamento com a cultura organizacional gera dissonância constante, gasto de energia em adaptação e sensação de não pertencimento — o que compromete tanto o bem-estar quanto a eficácia profissional.",
    acoes: [
      "Avalie honestamente o grau de alinhamento entre seus valores pessoais e os valores praticados (não declarados) pela organização — clareza aqui é estratégica.",
      "Se houver alinhamento, invista em rituais e comportamentos que reforcem a cultura forte: celebre conquistas, reconheça quem vive os valores, compartilhe histórias.",
      "Se houver desalinhamento significativo, avalie se é possível influenciar a cultura a partir da sua posição — ou se é hora de considerar um ambiente mais compatível.",
    ],
    resultado:
      "Ao atuar com clareza sobre o alinhamento cultural, você toma decisões mais estratégicas sobre onde e como investir sua energia — maximizando sua contribuição em contextos de alta compatibilidade ou desenvolvendo agência para transformar os que ainda não estão.",
  },
  {
    id: 12,
    name: "Modelo de Cultura Denison",
    pillar: "cultura",
    questionIds: [41, 42],
    diagnostico:
      "Você apresenta baixa percepção ou envolvimento com as dimensões culturais que sustentam a eficácia organizacional — envolvimento, consistência, adaptabilidade e missão. Isso pode indicar desconexão com os processos organizacionais que mais impactam desempenho coletivo.",
    fundamentacao:
      "O modelo de Denison (1990) identifica quatro traços culturais preditores de performance organizacional: envolvimento, consistência, adaptabilidade e missão. A combinação equilibrada dessas dimensões define organizações de alto desempenho.",
    impacto:
      "Baixo engajamento com essas dimensões resulta em desconexão com a estratégia organizacional, menor influência nos processos de mudança e dificuldade de operar com consistência em ambientes dinâmicos.",
    acoes: [
      "Identifique qual das quatro dimensões de Denison está mais fraca na sua equipe e proponha uma iniciativa concreta para fortalecê-la.",
      "Conecte suas entregas individuais à missão da organização — essa conexão aumenta o senso de propósito e fortalece a dimensão de missão culturalmente.",
      "Promova pelo menos uma conversa por mês sobre aprendizados coletivos da equipe — isso fortalece a adaptabilidade e a consistência simultaneamente.",
    ],
    resultado:
      "Com maior consciência e contribuição às dimensões culturais de Denison, você amplia sua capacidade de influenciar o ambiente organizacional e contribui diretamente para a construção de uma cultura de alta performance.",
  },
  {
    id: 13,
    name: "Dimensões Culturais de Hofstede",
    pillar: "cultura",
    questionIds: [43, 44],
    diagnostico:
      "Você apresenta baixa capacidade de leitura ou adaptação às dimensões culturais que regem comportamentos coletivos — como orientação para resultados vs. pessoas, distância hierárquica ou aversão à incerteza. Isso pode gerar atrito em contextos culturalmente diversos.",
    fundamentacao:
      "Geert Hofstede (1980) identificou dimensões culturais que explicam diferenças sistemáticas de comportamento entre grupos e organizações: distância do poder, individualismo, masculinidade, aversão à incerteza e orientação de longo prazo. Compreender essas dimensões é fundamental para operar com eficácia em contextos culturais variados.",
    impacto:
      "Sem essa competência, o profissional tende a interpretar diferenças culturais como falhas de caráter ou competência, gerar conflitos desnecessários em equipes diversas e perder oportunidades de colaboração eficaz em contextos interculturais.",
    acoes: [
      "Estude o perfil cultural predominante da sua organização ou equipe — identifique em quais dimensões de Hofstede ela se posiciona e como isso afeta sua dinâmica.",
      "Em situações de conflito com colegas, pergunte-se: que dimensão cultural diferente pode estar em jogo aqui? — isso transforma julgamento em curiosidade.",
      "Desenvolva sua flexibilidade cultural: pratique adaptar seu estilo de comunicação e colaboração ao perfil da pessoa com quem você está interagindo.",
    ],
    resultado:
      "Com inteligência cultural desenvolvida, você navega com mais eficácia em ambientes diversos, transforma diferenças em vantagens e constrói pontes que potencializam a colaboração em qualquer contexto organizacional.",
  },
  {
    id: 14,
    name: "Psicologia Social dos Grupos",
    pillar: "cultura",
    questionIds: [45, 46],
    diagnostico:
      "Sua pontuação indica baixo senso de pertencimento grupal e pouco aproveitamento da dinâmica social do seu ambiente de trabalho. Isso pode gerar isolamento, perda de influência e dificuldade de construir a coesão necessária para resultados coletivos expressivos.",
    fundamentacao:
      "A psicologia social dos grupos (Tajfel & Turner, 1979; Hackman, 2002) demonstra que identidade grupal forte, normas compartilhadas e coesão social são preditores robustos de desempenho coletivo. Profissionais que cultivam pertencimento e conexão grupal contribuem para equipes mais resilientes e produtivas.",
    impacto:
      "Baixo engajamento com a dimensão social do trabalho gera isolamento relacional, perda de acesso a redes de suporte e redução da capacidade de influência — dimensões frequentemente subestimadas, mas altamente impactantes na trajetória profissional.",
    acoes: [
      "Invista em rituais de conexão com sua equipe: almoços, check-ins informais, celebrações de conquistas — esses momentos constroem a coesão que sustenta a performance.",
      "Identifique quem na sua rede profissional poderia se beneficiar de uma conexão com outra pessoa que você conhece — pratique ser um conector intencional.",
      "Participe ativamente de ao menos um projeto coletivo por trimestre que vá além das suas atribuições formais — isso amplia pertencimento e influência simultaneamente.",
    ],
    resultado:
      "Ao cultivar vínculos grupais mais sólidos, você constrói capital social que se traduz em suporte, oportunidades e a capacidade de mobilizar outros em torno de objetivos compartilhados — um diferencial raramente ensinado, mas sempre observado.",
  },
  {
    id: 15,
    name: "Princípio de Pareto",
    pillar: "performance",
    questionIds: [47, 48],
    diagnostico:
      "Você demonstra baixa tendência a identificar e priorizar as atividades de maior impacto, distribuindo esforço de forma relativamente uniforme entre tarefas de valor muito diferente. Isso resulta em alta ocupação com baixo retorno e sensação crônica de que o tempo nunca é suficiente.",
    fundamentacao:
      "O Princípio de Pareto (1896), popularizado por Joseph Juran, demonstra que aproximadamente 80% dos resultados provêm de 20% das causas. Aplicado à gestão pessoal, significa que uma minoria das atividades é responsável pela maioria do impacto — e identificá-las é o primeiro passo para uma performance eficiente.",
    impacto:
      "Sem essa clareza, o profissional dispersa energia em tarefas operacionais ou de baixo valor estratégico, enquanto as atividades verdadeiramente transformadoras ficam constantemente postergadas. O resultado é esforço visível com impacto limitado.",
    acoes: [
      "Liste todas as suas atividades semanais e classifique cada uma pelo seu impacto real nos resultados que mais importam — elimine ou delegue as de baixo valor.",
      "Identifique os 3 projetos ou ações que, se executados com excelência, gerariam 80% do seu valor profissional neste trimestre — concentre sua energia neles.",
      "Revise sua agenda semanal e calcule que percentual do tempo está alocado nas atividades de alto impacto vs. baixo impacto — ajuste ativamente esse equilíbrio.",
    ],
    resultado:
      "Com o Princípio de Pareto como lente de priorização, você multiplica seu impacto sem aumentar o esforço — trabalhando menos no que não importa e muito mais no que transforma.",
  },
  {
    id: 16,
    name: "Comportamento de Execução",
    pillar: "performance",
    questionIds: [49, 50],
    diagnostico:
      "Sua pontuação indica dificuldade em transformar intenções e planos em ação consistente. Há uma lacuna entre o que é planejado e o que é efetivamente entregue — o que pode gerar frustração, perda de credibilidade e ciclos de comprometimento sem conclusão.",
    fundamentacao:
      "McKeown (2014) e outros pesquisadores de execução demonstram que a capacidade de implementar com consistência é uma das competências mais escassas e valiosas do profissional contemporâneo. Execução eficaz envolve clareza de prioridade, disciplina de foco e sistemas que reduzem a dependência da motivação momentânea.",
    impacto:
      "A lacuna de execução compromete a reputação de confiabilidade, gera retrabalho e cria um padrão de comprometimento-abandono que mina a autoeficácia ao longo do tempo. Em posições de liderança, essa lacuna se amplifica — afetando não apenas o próprio profissional, mas toda a equipe.",
    acoes: [
      "Adote o princípio de uma coisa só: identifique diariamente a tarefa mais importante e não inicie nada novo até concluí-la ou avançá-la significativamente.",
      "Crie sistemas de accountability: compartilhe seus compromissos com alguém de confiança e estabeleça check-ins semanais de progresso — a responsabilização social reduz o abandono.",
      "Reduza seus compromissos ativos: diga não a novas demandas enquanto houver entregas críticas pendentes — foco é uma forma de respeito ao que já foi comprometido.",
    ],
    resultado:
      "Ao desenvolver consistência de execução, você constrói uma das reputações mais valiosas no ambiente profissional: a de quem diz o que vai fazer e faz o que diz — um diferencial que abre portas e gera confiança duradoura.",
  },
  {
    id: 17,
    name: "Gestão da Energia",
    pillar: "performance",
    questionIds: [51, 52],
    diagnostico:
      "Você apresenta sinais de baixa gestão da própria energia — física, emocional, mental ou de propósito. Isso pode se manifestar como cansaço recorrente, dificuldade de concentração, irritabilidade ou sensação de que o trabalho drena mais do que alimenta.",
    fundamentacao:
      "Loehr & Schwartz (2003) demonstram que performance sustentada depende menos da gestão do tempo e mais da gestão da energia. Os quatro reservatórios — físico, emocional, mental e espiritual — precisam ser ativamente renovados para sustentar alta performance sem o custo do esgotamento.",
    impacto:
      "A má gestão da energia é silenciosa e progressiva: inicialmente a produtividade cai, depois a criatividade, depois o relacionamento. Em estágios avançados, o profissional opera no limite — entregando resultados mediocres com esforço desproporcional, o que cria o ciclo mais caro da carreira.",
    acoes: [
      "Audite seus quatro reservatórios de energia semanalmente: como está seu físico (sono, exercício, alimentação)? Emocional (relações, limites)? Mental (foco, sobrecarga)? Propósito?",
      "Identifique as três maiores fontes de drenagem de energia no seu trabalho atual e estabeleça um plano concreto para reduzir ou eliminar cada uma.",
      "Crie rituais de renovação: pausas estruturadas, sono protegido, atividade física regular — não como luxo, mas como investimento estratégico na sua performance.",
    ],
    resultado:
      "Com gestão ativa da energia, você passa a performar de forma mais consistente, criativa e sustentável — sem o ciclo de picos e colapsos que caracteriza profissionais que confundem ocupação com eficácia.",
  },
  {
    id: 18,
    name: "Estado de Flow",
    pillar: "performance",
    questionIds: [53, 54],
    diagnostico:
      "Sua pontuação indica baixa frequência de experiências de flow — estados de imersão profunda e absorção total no trabalho. Isso pode ser resultado de tarefas mal calibradas em relação às suas habilidades, excesso de interrupções ou ausência de clareza nos objetivos.",
    fundamentacao:
      "Mihaly Csikszentmihalyi (1990) descreve o flow como o estado de consciência ideal para performance: total absorção, perda da noção do tempo, prazer intrínseco e eficiência máxima. Ele ocorre no ponto de equilíbrio entre desafio e habilidade — nem muito fácil, nem impossível.",
    impacto:
      "Sem flow regular, o trabalho tende a parecer árido, fragmentado e cognitivamente custoso. A qualidade do output cai, o prazer do trabalho diminui e a sustentabilidade da performance fica comprometida — especialmente em tarefas que exigem criatividade ou pensamento complexo.",
    acoes: [
      "Proteja blocos de tempo sem interrupção de 90 a 120 minutos para suas tarefas mais complexas — flow requer continuidade e o ambiente certo.",
      "Calibre o nível de desafio das suas tarefas: se muito fáceis, adicione restrições ou expanda o escopo; se muito difíceis, quebre-as em partes menores e aprenda incrementalmente.",
      "Elimine gatilhos de distração antes de iniciar sessões de trabalho profundo: desative notificações, feche abas irrelevantes e sinalize para colegas que você não estará disponível.",
    ],
    resultado:
      "Ao criar as condições para o flow, você acessa um estado de alta performance natural — onde a qualidade do trabalho aumenta, o tempo passa sem esforço e o resultado final reflete o melhor da sua capacidade criativa e analítica.",
  },
  {
    id: 19,
    name: "Prática Deliberada",
    pillar: "performance",
    questionIds: [55, 56],
    diagnostico:
      "Você apresenta baixa tendência a praticar de forma intencional e estruturada as competências que mais impactam sua performance. Há uma inclinação a repetir o que já sabe, ao invés de empurrar consistentemente os limites do seu desempenho atual.",
    fundamentacao:
      "Anders Ericsson (2016) demonstrou que expertise não é resultado de talento, mas de prática deliberada: exercício focado, fora da zona de conforto, com feedback imediato e repetição sistemática. Os 10.000 horas de Gladwell só produzem maestria quando a prática é deliberada — não apenas acumulada.",
    impacto:
      "Sem prática deliberada, o profissional melhora rapidamente no início da carreira e depois plateia — repetindo o mesmo nível de competência indefinidamente, enquanto pares que praticam intencionalmente continuam avançando. O talento sem deliberação é uma vantagem de curto prazo.",
    acoes: [
      "Identifique a competência que, se dominada, mais impactaria sua performance nos próximos 12 meses — e crie um plano de prática deliberada com metas semanais.",
      "Busque feedback específico e frequente: não apenas 'fui bem?', mas 'o que exatamente posso melhorar nesta competência?'",
      "Treine conscientemente no limite do seu desempenho atual: escolha tarefas que exijam um pouco mais do que você consegue confortavelmente — esse desconforto é o sinal de que o desenvolvimento está ocorrendo.",
    ],
    resultado:
      "Com prática deliberada como hábito, você deixa de depender de talento e passa a construir maestria de forma sistemática — desenvolvendo competências que a maioria considera inatas, mas que são, na verdade, construídas.",
  },
  {
    id: 20,
    name: "Carga Cognitiva e Foco",
    pillar: "performance",
    questionIds: [57, 58],
    diagnostico:
      "Sua pontuação indica alta carga cognitiva e baixa capacidade de foco sustentado. Você pode estar operando com muitas frentes abertas simultaneamente, o que fragmenta a atenção, aumenta o tempo de execução e reduz a qualidade do pensamento estratégico.",
    fundamentacao:
      "Sweller (1988) demonstrou que a memória de trabalho humana é severamente limitada e que excesso de demandas cognitivas simultâneas compromete aprendizado, tomada de decisão e qualidade da execução. Cal Newport (2016) complementa com o conceito de trabalho profundo — períodos de foco não fragmentado que produzem o máximo cognitivo.",
    impacto:
      "Alta carga cognitiva sustentada degrada progressivamente a qualidade das decisões, aumenta erros, reduz criatividade e acelera o esgotamento mental. Profissionais nesse estado frequentemente sentem que trabalham muito, mas entregam menos do que deveriam — porque o problema não é esforço, é fragmentação.",
    acoes: [
      "Reduza o número de projetos ou tarefas abertas simultaneamente: estabeleça um limite de trabalho em progresso e respeite-o como regra, não como sugestão.",
      "Implemente o princípio do trabalho profundo: blocos diários de 60 a 120 minutos de foco absoluto em uma única tarefa cognitivamente exigente — sem multitarefa.",
      "Externalize sua memória de trabalho: use sistemas confiáveis de captura (lista de tarefas, notas estruturadas) para liberar espaço mental para o que realmente importa.",
    ],
    resultado:
      "Ao reduzir a carga cognitiva e desenvolver foco sustentado, você multiplica a qualidade do seu pensamento, toma decisões mais precisas e produz resultados que só o trabalho profundo e não fragmentado é capaz de gerar.",
  },
];

export function computeTheoryScore(
  theoryQuestionIds: number[],
  answers: Record<string, number>,
): number {
  const scores: number[] = [];
  for (const qId of theoryQuestionIds) {
    const raw = answers[String(qId)];
    if (raw == null) continue;
    const score = Math.round(((raw - 1) / 4) * 100);
    scores.push(score);
  }
  if (scores.length === 0) return 50;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export interface ScoredTheory extends MecaTheory {
  score: number;
}

export function getLowestTheories(
  answers: Record<string, number>,
  count = 4,
): ScoredTheory[] {
  const scored: ScoredTheory[] = MECA_THEORIES.map((t) => ({
    ...t,
    score: computeTheoryScore(t.questionIds, answers),
  }));
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, count);
}

// ─── Legacy exports used by MECAPillarsSection / TheoryCard / TheoryModal ────
// These preserve the original pillar → theories browsing structure that
// powers the dashboard's theory library UI.

export type Theory = {
  id: string;
  title: string;
  originalName: string;
  short: string;
  full: string;
};

export type Pillar = {
  id: "M" | "E" | "C" | "A";
  name: string;
  theories: Theory[];
};

export const MECA_PILLARS: Pillar[] = [
  {
    id: "M",
    name: "Mentalidade Empreendedora",
    theories: [
      {
        id: "intraempreendedorismo-intrapreneurship",
        title: "Intraempreendedorismo",
        originalName: "Intrapreneurship",
        short: "Age como dono, cria soluções e assume responsabilidade sem esperar autorização.",
        full: "O intraempreendedorismo (Pinchot, 1985) descreve a capacidade de empreender de dentro das organizações — identificar oportunidades, propor soluções e implementar mudanças sem precisar sair do papel institucional. Profissionais com esse perfil elevado são reconhecidos como agentes de transformação interna que reduzem a necessidade de gestão e aumentam a percepção de valor dentro do sistema.",
      },
      {
        id: "mentalidade-de-crescimento-growth-mindset",
        title: "Mentalidade de Crescimento",
        originalName: "Growth Mindset",
        short: "Acredita que pode evoluir, aprende com erros e cresce continuamente.",
        full: "Carol Dweck (2006) demonstrou que indivíduos com mentalidade de crescimento compreendem que capacidades se desenvolvem com esforço e experiência. Esse mindset está diretamente associado a maior resiliência, adaptabilidade e desempenho sustentado — transformando desafios em oportunidades de desenvolvimento e erros em fontes de aprendizado.",
      },
      {
        id: "comportamento-proativo-proactive-work-behavior",
        title: "Comportamento Proativo",
        originalName: "Proactive Work Behavior",
        short: "Age antes de ser solicitado e melhora o ambiente ao redor.",
        full: "A proatividade (Crant, 2000; Grant & Ashford, 2008) é definida como comportamento autoiniciado, orientado ao futuro e à mudança. Profissionais proativos criam oportunidades, solucionam problemas antes que escalem e constroem redes de influência de forma intencional — tornando-se referências de confiabilidade no ambiente organizacional.",
      },
      {
        id: "redesenho-do-trabalho-job-crafting",
        title: "Redesenho do Trabalho",
        originalName: "Job Crafting",
        short: "Adapta o próprio trabalho para gerar mais impacto e relevância.",
        full: "O job crafting (Wrzesniewski & Dutton, 2001) descreve as ações que os profissionais tomam para remodelar limites físicos, cognitivos e relacionais do seu trabalho. Profissionais que praticam job crafting relatam maior bem-estar, engajamento e senso de propósito — transformando o trabalho de obrigação em expressão.",
      },
      {
        id: "autoeficacia-self-efficacy",
        title: "Autoeficácia",
        originalName: "Self-Efficacy",
        short: "Confia na própria capacidade de aprender e agir mesmo sem estar pronto.",
        full: "Albert Bandura (1977) define autoeficácia como a crença do indivíduo em sua capacidade de executar os comportamentos necessários para atingir determinados resultados. É um dos preditores mais robustos de desempenho, persistência e resiliência psicológica — permitindo agir antes da certeza e construir competência real ao longo do tempo.",
      },
      {
        id: "carreira-autodirigida-protean-career",
        title: "Carreira Autodirigida",
        originalName: "Protean Career",
        short: "Assume o controle da própria carreira com foco em evolução contínua.",
        full: "O modelo de carreira proteana (Hall, 1996) e as carreiras sem fronteiras (Arthur & Rousseau, 1996) descrevem profissionais que assumem a responsabilidade pelo próprio desenvolvimento, orientados por valores internos e adaptáveis à mudança — construindo trajetórias com propósito, estratégia e protagonismo.",
      },
    ],
  },
  {
    id: "E",
    name: "Engajamento Autêntico",
    theories: [
      {
        id: "troca-lider-membro-lmx",
        title: "Qualidade da Relação Líder-Membro (LMX)",
        originalName: "Leader-Member Exchange (LMX)",
        short: "Constrói relações de confiança com a liderança e amplia oportunidades.",
        full: "A teoria Leader-Member Exchange (Graen & Uhl-Bien, 1995) demonstra que a qualidade da relação entre líder e liderado é um dos principais determinantes do engajamento, satisfação e desempenho. Relações de alta qualidade são marcadas por confiança, respeito e obrigação mútua — gerando acesso a oportunidades, informações estratégicas e visibilidade organizacional.",
      },
      {
        id: "teoria-autodeterminacao-sdt",
        title: "Motivação Autônoma (SDT)",
        originalName: "Self-Determination Theory (SDT)",
        short: "Engajamento real nasce de autonomia, competência e pertencimento.",
        full: "A Teoria da Autodeterminação (Deci & Ryan, 1985) distingue entre motivação autônoma (oriunda de valores e interesse genuíno) e controlada (oriunda de pressão externa). A motivação autônoma está associada a maior bem-estar, criatividade, persistência e desempenho de alta qualidade — construindo engajamento sustentável e genuíno.",
      },
      {
        id: "organizacoes-alta-performance-hpo",
        title: "Organizações de Alta Performance",
        originalName: "High Performance Organizations (HPO)",
        short: "Ambientes fortes valorizam clareza, feedback e contribuição ativa.",
        full: "Organizações de Alta Performance (Holbeche, 2005) são caracterizadas por metas claras, confiança interpessoal, colaboração efetiva e responsabilidade mútua. Profissionais que operam dentro desse modelo contribuem para resultados coletivos superiores — posicionando-se como referências que elevam o nível do ambiente ao seu redor.",
      },
    ],
  },
  {
    id: "C",
    name: "Cultura como Motor",
    theories: [
      {
        id: "niveis-cultura-organizacional",
        title: "Níveis da Cultura Organizacional",
        originalName: "Organizational Culture Levels",
        short: "A cultura real aparece nas decisões, não apenas no discurso.",
        full: "Edgar Schein (1985) descreve a cultura organizacional em três níveis: artefatos visíveis, valores declarados e pressupostos básicos inconscientes. Os pressupostos são os verdadeiros determinantes do comportamento — e compreendê-los é essencial para navegar e transformar culturas com precisão estratégica.",
      },
      {
        id: "cultura-forte-vs-fraca",
        title: "Cultura Forte vs. Fraca",
        originalName: "Strong vs. Weak Culture",
        short: "Ambientes claros aceleram quem se alinha e travam quem não entende.",
        full: "Culturas fortes (Deal & Kennedy, 1982; Peters & Waterman, 1982) são aquelas em que os valores são amplamente compartilhados e há alto senso de identidade coletiva. Elas geram maior coesão, tomada de decisão mais ágil e desempenho superior — recompensando quem se alinha com clareza e intenção.",
      },
      {
        id: "modelo-cultura-denison",
        title: "Modelo de Cultura Denison",
        originalName: "Denison Culture Model",
        short: "Cultura impacta resultados por missão, consistência e adaptação.",
        full: "O modelo de Denison (1990) identifica quatro traços culturais preditores de performance: envolvimento, consistência, adaptabilidade e missão. A combinação equilibrada dessas dimensões define organizações de alto desempenho — e profissionais que as compreendem atuam com maior efetividade estratégica.",
      },
      {
        id: "dimensoes-culturais",
        title: "Dimensões Culturais de Hofstede",
        originalName: "Hofstede's Cultural Dimensions",
        short: "Cada cultura interpreta comportamento de forma diferente.",
        full: "Geert Hofstede (1980) identificou dimensões culturais que explicam diferenças sistemáticas de comportamento entre grupos: distância do poder, individualismo, aversão à incerteza e orientação de longo prazo. Compreender essas dimensões é fundamental para operar com eficácia em contextos culturais variados e construir pontes de colaboração.",
      },
      {
        id: "psicologia-social-grupos",
        title: "Psicologia Social dos Grupos",
        originalName: "Social Psychology of Groups",
        short: "O comportamento é moldado pelas regras invisíveis do grupo.",
        full: "A psicologia social dos grupos (Tajfel & Turner, 1979; Hackman, 2002) demonstra que identidade grupal forte, normas compartilhadas e coesão social são preditores robustos de desempenho coletivo. Profissionais que cultivam pertencimento e conexão grupal constroem capital social que se traduz em suporte, oportunidades e influência.",
      },
    ],
  },
  {
    id: "A",
    name: "Alta Performance",
    theories: [
      {
        id: "principio-pareto",
        title: "Princípio de Pareto",
        originalName: "Pareto Principle",
        short: "Poucas ações geram a maior parte dos resultados.",
        full: "O Princípio de Pareto demonstra que aproximadamente 80% dos resultados provêm de 20% das causas. Aplicado à gestão pessoal, significa que uma minoria das atividades é responsável pela maioria do impacto — e identificá-las é o primeiro passo para multiplicar resultado sem aumentar esforço.",
      },
      {
        id: "comportamento-execucao",
        title: "Comportamento de Execução",
        originalName: "Execution Behavior",
        short: "Transforma planos em entregas consistentes e confiáveis.",
        full: "McKeown (2014) demonstra que a capacidade de implementar com consistência é uma das competências mais escassas e valiosas. Execução eficaz envolve clareza de prioridade, disciplina de foco e sistemas que reduzem a dependência da motivação momentânea — construindo a reputação de quem diz o que vai fazer e faz o que diz.",
      },
      {
        id: "gestao-energia",
        title: "Gestão da Energia",
        originalName: "Energy Management",
        short: "Alta performance depende de energia, não só de tempo.",
        full: "Loehr & Schwartz (2003) demonstram que performance sustentada depende menos da gestão do tempo e mais da gestão da energia. Os quatro reservatórios — físico, emocional, mental e espiritual — precisam ser ativamente renovados para sustentar alta performance sem o custo do esgotamento.",
      },
      {
        id: "estado-flow",
        title: "Estado de Flow",
        originalName: "Flow State",
        short: "Foco total gera desempenho máximo.",
        full: "Mihaly Csikszentmihalyi (1990) descreve o flow como o estado de consciência ideal para performance: total absorção, eficiência máxima e prazer intrínseco. Ele ocorre no equilíbrio entre desafio e habilidade — e criá-lo intencionalmente é uma das alavancas mais poderosas de alta performance.",
      },
      {
        id: "pratica-deliberada",
        title: "Prática Deliberada",
        originalName: "Deliberate Practice",
        short: "Evolução vem de treino com foco, feedback e melhoria contínua.",
        full: "Anders Ericsson (2016) demonstrou que expertise não é resultado de talento, mas de prática deliberada: exercício focado, fora da zona de conforto, com feedback imediato e repetição sistemática. A maestria é construída — e quem pratica intencionalmente avança onde outros plateia.",
      },
      {
        id: "carga-cognitiva",
        title: "Carga Cognitiva e Foco",
        originalName: "Cognitive Load & Focus",
        short: "Excesso de informação reduz clareza e desempenho.",
        full: "Sweller (1988) e Cal Newport (2016) demonstram que a memória de trabalho humana é limitada e que excesso de demandas cognitivas simultâneas compromete aprendizado, decisão e qualidade da execução. Reduzir carga cognitiva e desenvolver foco sustentado é a diferença entre trabalhar muito e trabalhar bem.",
      },
    ],
  },
];
