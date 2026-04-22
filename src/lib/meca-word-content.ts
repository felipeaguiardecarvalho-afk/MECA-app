/**
 * Conteúdo oficial das 20 teorias do método MECA, extraído do documento Word
 * "Plano de ação por teoria MECA". Usado como base de conhecimento para o
 * diagnóstico premium gerado pela IA.
 */

export interface WordTheory {
  id: number;
  name: string;
  diagnostico: string;
  fundamentacao: string;
  impacto: string;
}

export const WORD_THEORIES: WordTheory[] = [
  {
    id: 1,
    name: "Intraempreendedorismo",
    diagnostico:
      "Sua pontuação em Intraempreendedorismo indica que sua atuação profissional tende a estar mais orientada à execução de demandas do que à criação ativa de soluções dentro do ambiente organizacional. Isso sugere uma postura mais reativa, na qual você responde bem ao que é solicitado, mas raramente avança além do escopo definido ou assume responsabilidade por problemas que não foram explicitamente atribuídos a você. Esse padrão, embora funcional no curto prazo, limita sua capacidade de se posicionar como alguém que gera impacto real e contínuo dentro da organização.",
    fundamentacao:
      "O conceito de Intraempreendedorismo, originalmente desenvolvido por Gifford Pinchot, descreve profissionais que atuam dentro de organizações com a mesma lógica de um empreendedor. Esses indivíduos não se limitam às fronteiras formais do cargo, mas expandem continuamente sua atuação ao identificar oportunidades, propor soluções e assumir responsabilidade por resultados, mesmo sem autoridade formal. A base teórica está na ideia de propriedade psicológica e autonomia percebida — o profissional opera com a mentalidade de que 'isso é meu para resolver', independentemente de ter sido formalmente designado.",
    impacto:
      "Quando essa competência não está desenvolvida, o profissional tende a se posicionar como um executor eficiente, mas não como um agente de transformação. Mesmo entregando bem suas tarefas, sua visibilidade estratégica permanece limitada, pois o reconhecimento organizacional está cada vez mais associado à capacidade de resolver problemas complexos e gerar melhorias, e não apenas cumprir atividades. Na prática, isso reduz sua participação em decisões mais relevantes, limita seu acesso a projetos estratégicos e torna seu crescimento mais dependente de validação externa.",
  },
  {
    id: 2,
    name: "Mentalidade de Crescimento",
    diagnostico:
      "Sua pontuação em Mentalidade de Crescimento indica que, em determinados momentos, você pode interpretar desafios, erros ou situações de alta exigência como sinais de limitação pessoal, e não como oportunidades naturais de desenvolvimento. Esse padrão tende a gerar uma relação mais defensiva com o aprendizado, na qual a prioridade passa a ser preservar a percepção de competência, em vez de expandi-la.",
    fundamentacao:
      "A teoria de Mentalidade de Crescimento, desenvolvida por Carol Dweck, propõe que a forma como um indivíduo percebe suas próprias habilidades influencia diretamente seu comportamento diante de desafios. A distinção central está entre a mentalidade fixa, que entende habilidades como estáticas, e a mentalidade de crescimento, que as compreende como desenvolvíveis por meio de esforço, estratégia e aprendizado contínuo. Indivíduos com mentalidade de crescimento tendem a interpretar erros como parte essencial do processo de aprendizado.",
    impacto:
      "Quando essa mentalidade não está plenamente desenvolvida, o profissional tende a operar dentro de um espaço de segurança, priorizando situações onde já possui domínio e evitando contextos que possam expor lacunas. Isso reduz significativamente a taxa de aprendizado, pois o crescimento ocorre justamente na interface entre o que você já sabe e o que ainda precisa desenvolver.",
  },
  {
    id: 3,
    name: "Comportamento Proativo",
    diagnostico:
      "Sua pontuação em Comportamento Proativo indica que sua atuação profissional tende a ser predominantemente reativa — orientada por demandas externas, prazos definidos por terceiros e problemas já estruturados. Isso sugere que você responde bem ao que acontece, mas participa menos da construção do que vai acontecer.",
    fundamentacao:
      "A teoria de Proactive Work Behavior, desenvolvida por pesquisadores como Parker, Bindl e Strauss, define proatividade como um comportamento auto-iniciado, orientado ao futuro e voltado para a modificação do próprio ambiente ou da forma como o trabalho é realizado. O indivíduo não apenas responde ao contexto, mas atua para moldá-lo — com capacidade de antecipar situações antes que se tornem problemas, iniciativa para agir sem necessidade de solicitação e orientação para promover mudanças.",
    impacto:
      "Quando a proatividade não está desenvolvida, o profissional tende a operar dentro de um fluxo contínuo de resposta. Isso reduz sua capacidade de se posicionar como alguém estratégico, pois sua atuação passa a ser percebida como dependente de direcionamento. Na prática, isso limita sua participação em decisões relevantes e faz com que oportunidades de melhoria passem despercebidas.",
  },
  {
    id: 4,
    name: "Redesenho do Trabalho",
    diagnostico:
      "Sua pontuação em Redesenho do Trabalho indica que sua atuação profissional tende a estar fortemente orientada pelas definições formais do seu papel, com baixa adaptação intencional das suas atividades para ampliar impacto, relevância ou alinhamento com objetivos mais estratégicos.",
    fundamentacao:
      "A teoria de Job Crafting, desenvolvida por Amy Wrzesniewski e Jane Dutton, parte do princípio de que o trabalho não é uma estrutura fixa, mas um espaço dinâmico que pode ser moldado pelo próprio indivíduo. Ela se organiza em três dimensões: redesenho das tarefas, ampliação das interações e reconfiguração do significado atribuído às atividades realizadas.",
    impacto:
      "Quando essa competência não está desenvolvida, o trabalho tende a se tornar progressivamente mais mecânico e previsível. Mesmo com alto volume de atividades, o impacto gerado permanece limitado, pois o profissional atua dentro de um escopo restrito, sem explorar possibilidades de expansão.",
  },
  {
    id: 5,
    name: "Carreira Autodirigida",
    diagnostico:
      "Sua pontuação em Carreira Autodirigida indica que sua evolução profissional tende a estar mais condicionada ao ambiente do que a uma direção construída de forma intencional por você. Isso sugere que esse desenvolvimento ocorre de forma mais reativa, respondendo a oportunidades, demandas ou mudanças externas, em vez de seguir uma estratégia clara de crescimento.",
    fundamentacao:
      "A teoria de Carreira Autodirigida, ou Protean Career, desenvolvida por Douglas Hall, coloca o indivíduo como o principal agente da própria trajetória. A carreira deixa de ser linear e previsível, passando a ser dinâmica, adaptativa e orientada por valores pessoais. Profissionais autodirigidos não esperam que o ambiente defina seus próximos passos; eles constroem esses passos de forma ativa.",
    impacto:
      "Quando essa competência não está plenamente desenvolvida, o profissional tende a avançar de forma incremental, mas sem uma direção estratégica clara. Na prática, isso se traduz em decisões de carreira baseadas mais em oportunidade imediata do que em construção intencional, podendo gerar sensação de estagnação ou dificuldade em alcançar posições mais estratégicas.",
  },
  {
    id: 6,
    name: "Autoeficácia",
    diagnostico:
      "Sua pontuação em Autoeficácia indica que, em contextos de maior incerteza ou exigência, você pode apresentar uma tendência a hesitar antes de agir, principalmente quando não há garantia clara de sucesso. Esse padrão geralmente se manifesta como uma necessidade maior de validação, uma demora na tomada de decisão ou a evitação de situações onde sua capacidade pode ser testada.",
    fundamentacao:
      "A teoria de Autoeficácia, desenvolvida por Albert Bandura, define autoeficácia como a crença que o indivíduo possui sobre sua capacidade de organizar e executar ações necessárias para alcançar determinados resultados. Autoeficácia não está relacionada diretamente ao nível de habilidade, mas à percepção que o indivíduo tem sobre sua própria capacidade de utilizar essas habilidades em situações reais.",
    impacto:
      "Quando a autoeficácia não está plenamente desenvolvida, o profissional tende a operar com uma frequência menor de ação em situações que realmente impulsionam crescimento. Isso cria um ciclo limitante: a dúvida reduz a ação, a falta de ação reduz a geração de resultados, e a ausência de resultados reforça a dúvida inicial.",
  },
  {
    id: 7,
    name: "Troca Líder–Membro (LMX)",
    diagnostico:
      "Sua pontuação em Troca Líder–Membro indica que sua relação com a liderança pode estar mais próxima de um nível transacional do que de uma relação de confiança e parceria estratégica. Isso sugere que sua interação com seu líder pode estar restrita a demandas operacionais, alinhamentos básicos e acompanhamento de entregas, sem uma construção mais profunda de vínculo profissional.",
    fundamentacao:
      "A teoria de Leader–Member Exchange (LMX), desenvolvida por Graen e Uhl-Bien, propõe que líderes formam diferentes níveis de qualidade de relacionamento com os membros da equipe — de interações estritamente formais até relações de alta confiança e troca contínua. Profissionais que desenvolvem relações de alta qualidade tendem a receber mais oportunidades, maior nível de autonomia e maior participação em decisões estratégicas.",
    impacto:
      "Quando a relação com a liderança permanece em um nível mais superficial, o profissional tende a operar com menor visibilidade e menor acesso a contextos de maior impacto. Mesmo com boas entregas, sua participação em decisões estratégicas pode ser limitada, e oportunidades relevantes podem ser direcionadas para pessoas com maior proximidade com o líder.",
  },
  {
    id: 8,
    name: "Teoria da Autodeterminação (SDT)",
    diagnostico:
      "Sua pontuação em Autodeterminação indica que sua motivação para o trabalho pode estar mais associada a fatores externos — como cobrança, reconhecimento ou obrigação — do que a um engajamento interno genuíno. Isso sugere que sua energia para executar tarefas pode variar bastante dependendo do contexto, do nível de pressão ou da validação recebida.",
    fundamentacao:
      "A Teoria da Autodeterminação (SDT), desenvolvida por Deci e Ryan, propõe que a qualidade da motivação é mais importante do que sua intensidade, diferenciando motivações extrínsecas de intrínsecas. Ela identifica três necessidades psicológicas básicas que sustentam motivação de alta qualidade: autonomia, competência e relacionamento/pertencimento.",
    impacto:
      "Quando a autodeterminação não está bem desenvolvida, o profissional passa a depender de estímulos externos para manter sua performance. Isso significa que sua energia e consistência ficam vulneráveis ao contexto, ao estilo de liderança e ao nível de reconhecimento recebido — gerando ciclos de alta e baixa produtividade.",
  },
  {
    id: 9,
    name: "Organizações de Alta Performance",
    diagnostico:
      "Sua pontuação em Organizações de Alta Performance indica que você pode não estar explorando plenamente o potencial do ambiente ao seu redor como um fator de aceleração da sua performance. Isso sugere que sua atuação pode estar mais focada nas suas próprias entregas individuais, com menor leitura e aproveitamento das dinâmicas organizacionais.",
    fundamentacao:
      "O conceito de Organizações de Alta Performance está associado a ambientes que operam com elevados níveis de clareza, alinhamento, responsabilidade e aprendizado contínuo. A performance não é apenas uma característica individual, mas um fenômeno sistêmico — resultados consistentes emergem da interação entre comportamento individual e contexto organizacional.",
    impacto:
      "Quando essa competência não está desenvolvida, o profissional pode acabar operando de forma desalinhada com as dinâmicas reais da organização. Mesmo entregando resultados, pode haver menor reconhecimento, menor integração com o time e menor participação em ciclos de evolução.",
  },
  {
    id: 10,
    name: "Níveis da Cultura Organizacional",
    diagnostico:
      "Sua pontuação em Níveis da Cultura Organizacional indica que sua leitura do ambiente pode estar mais baseada no que é visível e declarado do que no que realmente orienta comportamentos e decisões dentro da organização. Isso sugere que você pode estar interpretando a cultura a partir de discursos formais, políticas ou comunicações institucionais, sem necessariamente captar os padrões mais profundos.",
    fundamentacao:
      "A teoria dos Níveis da Cultura Organizacional, proposta por Edgar Schein, estabelece que a cultura opera em três camadas: artefatos visíveis (linguagem, símbolos, rituais), valores declarados (o que a organização diz valorizar) e pressupostos básicos (crenças inconscientes que determinam como as pessoas realmente pensam, agem e tomam decisões). O terceiro nível é o mais difícil de identificar, mas é o que de fato sustenta a cultura.",
    impacto:
      "Quando essa competência não está desenvolvida, o profissional tende a operar com base em sinais superficiais, gerando interpretações equivocadas sobre o funcionamento da organização, frustração com aparentes incoerências e dificuldade em entender por que certos comportamentos são valorizados enquanto outros não.",
  },
  {
    id: 11,
    name: "Cultura Forte vs. Cultura Fraca",
    diagnostico:
      "Sua pontuação em Cultura Forte vs. Cultura Fraca indica que você pode não estar identificando com clareza o nível de consistência e definição cultural do ambiente em que está inserido. Isso sugere que sua atuação pode não estar totalmente adaptada ao tipo de cultura predominante, o que pode gerar desalinhamentos sutis.",
    fundamentacao:
      "A distinção entre culturas fortes e fracas está relacionada ao grau de clareza, consistência e compartilhamento dos valores dentro de uma organização. Em uma cultura forte, os valores são amplamente compreendidos, internalizados e praticados de forma consistente. Em uma cultura fraca, os valores são difusos, inconsistentes ou pouco praticados, gerando maior ambiguidade e menor previsibilidade.",
    impacto:
      "Quando essa leitura não está desenvolvida, o profissional pode aplicar o mesmo padrão de comportamento em contextos culturais completamente diferentes. Em uma cultura forte, a falta de alinhamento com os valores tende a gerar rápida exclusão ou estagnação. Já em uma cultura fraca, a ausência de leitura pode levar à confusão e inconsistência.",
  },
  {
    id: 12,
    name: "Modelo de Cultura Denison",
    diagnostico:
      "Sua pontuação no Modelo de Cultura Denison indica que você pode não estar utilizando a cultura organizacional como um fator ativo de performance. Isso sugere que sua atuação pode estar mais focada em execução individual, sem uma leitura estruturada de como aspectos culturais influenciam diretamente os resultados.",
    fundamentacao:
      "O Modelo de Cultura Organizacional de Denison estabelece uma relação direta entre cultura e performance, estruturando-a em quatro dimensões: Missão (clareza de direção e propósito), Consistência (alinhamento interno e coerência nas decisões), Envolvimento (nível de engajamento e pertencimento) e Adaptabilidade (capacidade de responder a mudanças). A força do modelo está na integração dessas dimensões.",
    impacto:
      "Quando essa competência não está desenvolvida, o profissional tende a atuar sem considerar como essas dimensões culturais influenciam o ambiente ao seu redor. Isso pode gerar desalinhamento com prioridades estratégicas, dificuldade em navegar conflitos internos e menor capacidade de adaptação a mudanças.",
  },
  {
    id: 13,
    name: "Dimensões Culturais de Hofstede",
    diagnostico:
      "Sua pontuação em Dimensões Culturais indica que você pode estar interpretando comportamentos, decisões e interações no ambiente de trabalho a partir de uma única lógica cultural, sem considerar que diferentes contextos podem operar com padrões distintos de comunicação, hierarquia, autonomia e tomada de decisão.",
    fundamentacao:
      "A Teoria das Dimensões Culturais, desenvolvida por Geert Hofstede, propõe que diferentes culturas operam com padrões distintos que influenciam diretamente a forma como as pessoas pensam, se comunicam e tomam decisões. Entre as principais dimensões: distância de poder, individualismo vs. coletivismo, aversão à incerteza e orientação de longo prazo vs. curto prazo.",
    impacto:
      "Quando essa competência não está desenvolvida, o profissional tende a julgar o ambiente a partir de uma referência única, gerando desalinhamentos frequentes, dificuldades de comunicação e menor capacidade de adaptação a diferentes estilos de trabalho.",
  },
  {
    id: 14,
    name: "Psicologia Social dos Grupos",
    diagnostico:
      "Sua pontuação em Psicologia Social dos Grupos indica que você pode estar analisando comportamentos dentro do ambiente de trabalho de forma excessivamente individual, sem considerar o impacto que o grupo exerce sobre decisões, atitudes e padrões de ação.",
    fundamentacao:
      "A Psicologia Social dos Grupos estuda como o comportamento individual é influenciado pela presença, pelas normas e pela identidade do grupo. Teorias como conformidade social (Asch), pensamento de grupo (Janis) e identidade social (Tajfel e Turner) demonstram que as pessoas internalizam padrões coletivos — normas sobre o que é aceitável, como decisões são tomadas e como conflitos são tratados.",
    impacto:
      "Quando essa competência não está desenvolvida, o profissional tende a subestimar o impacto das dinâmicas coletivas, gerando interpretações equivocadas e decisões pouco efetivas. Isso pode se manifestar como dificuldade em influenciar equipes e menor capacidade de navegar em contextos políticos ou sociais dentro da organização.",
  },
  {
    id: 15,
    name: "Psicologia da Performance",
    diagnostico:
      "Sua pontuação em Psicologia da Performance indica que sua execução pode não estar sendo sustentada por um equilíbrio adequado entre fatores cognitivos, emocionais e ambientais. Mesmo tendo capacidade técnica e conhecimento, sua performance pode variar dependendo do contexto, do estado emocional ou da pressão envolvida.",
    fundamentacao:
      "A Psicologia da Performance estuda como fatores mentais, emocionais e contextuais influenciam a capacidade de um indivíduo de executar em alto nível de forma consistente. Seus pilares são gestão do foco (direcionamento intencional da atenção), regulação emocional (manter estabilidade durante alta exigência) e construção de um ambiente que favoreça foco, clareza e estabilidade.",
    impacto:
      "Quando essa competência não está desenvolvida, o profissional tende a apresentar desempenho inconsistente, com momentos de alta produtividade alternados com períodos de baixa eficiência. Isso gera uma percepção de instabilidade, onde o potencial existe, mas não se traduz em resultado contínuo.",
  },
  {
    id: 16,
    name: "Prática Deliberada",
    diagnostico:
      "Sua pontuação em Prática Deliberada indica que seu desenvolvimento pode estar mais baseado em repetição e experiência acumulada do que em um processo estruturado de melhoria contínua. Embora você execute suas atividades com frequência, nem sempre existe uma intenção clara de evoluir habilidades específicas de forma direcionada.",
    fundamentacao:
      "O conceito de Prática Deliberada foi desenvolvido por Anders Ericsson. Diferente da prática comum, que envolve repetição de atividades, a prática deliberada é caracterizada por um processo estruturado, intencional e focado na melhoria de aspectos específicos da performance — com ciclos contínuos de esforço direcionado, feedback e ajuste, saindo da zona de conforto.",
    impacto:
      "Quando essa competência não está desenvolvida, o profissional tende a confundir experiência com evolução. Apesar de executar atividades de forma recorrente, o nível de habilidade permanece relativamente estável, pois não há um esforço direcionado para melhoria — reduzindo a velocidade de crescimento e limitando o desenvolvimento de competências críticas.",
  },
  {
    id: 17,
    name: "Gestão da Energia",
    diagnostico:
      "Sua pontuação em Gestão da Energia indica que sua performance pode estar sendo conduzida mais por disponibilidade de tempo e esforço do que por um uso estratégico da sua energia física, mental e emocional. Isso pode se manifestar como períodos de alta produtividade seguidos de queda significativa de desempenho, sensação de cansaço constante ou dificuldade em manter consistência sem desgaste.",
    fundamentacao:
      "A Gestão da Energia parte do princípio de que o principal recurso para performance não é o tempo, mas a energia disponível para executar. Tony Schwartz e Jim Loehr demonstram que a performance sustentável depende do equilíbrio entre quatro dimensões de energia: física, emocional, mental e propósito. O ser humano não foi projetado para operar de forma contínua sem pausas — ciclos de esforço e recuperação são essenciais.",
    impacto:
      "Quando essa competência não está desenvolvida, o profissional tende a compensar baixa energia com aumento de esforço, gerando um ciclo de desgaste. Em vez de otimizar performance, o aumento de esforço reduz ainda mais a capacidade de execução ao longo do tempo, levando à inconsistência e, em casos mais extremos, ao esgotamento.",
  },
  {
    id: 18,
    name: "Estado de Flow",
    diagnostico:
      "Sua pontuação em Estado de Flow indica que você pode não estar acessando com frequência estados de concentração profunda e engajamento total durante suas atividades. Isso sugere que sua execução pode estar fragmentada por distrações, interrupções ou falta de alinhamento entre o nível de desafio das tarefas e sua capacidade atual.",
    fundamentacao:
      "O conceito de Flow foi desenvolvido por Mihaly Csikszentmihalyi e descreve um estado mental no qual o indivíduo está completamente imerso em uma atividade, com foco total, sensação de controle e alto nível de engajamento. Esse estado ocorre quando há equilíbrio entre o nível de desafio da tarefa e o nível de habilidade — quando o desafio é muito baixo surge tédio; quando muito alto, ansiedade.",
    impacto:
      "Quando essa competência não está desenvolvida, o profissional tende a operar em níveis mais baixos de concentração, exigindo mais esforço para gerar o mesmo resultado. Isso cria uma relação de trabalho baseada em esforço contínuo, com menor eficiência e maior desgaste, reduzindo a qualidade das entregas.",
  },
  {
    id: 19,
    name: "Princípio de Pareto",
    diagnostico:
      "Sua pontuação no Princípio de Pareto indica que sua distribuição de esforço pode não estar totalmente alinhada com os resultados gerados. Você pode estar investindo tempo e energia em diversas atividades, mas sem uma priorização clara daquelas que realmente produzem maior impacto — gerando sensação de estar sempre ocupado, mas com dificuldade de avançar em resultados relevantes.",
    fundamentacao:
      "O Princípio de Pareto, também conhecido como regra 80/20, foi originalmente observado por Vilfredo Pareto: aproximadamente 80% dos resultados vêm de 20% das ações. No contexto de performance profissional, isso implica que nem todas as tarefas têm o mesmo valor — algumas atividades geram impacto direto em resultados enquanto outras consomem tempo sem contribuir significativamente.",
    impacto:
      "Quando essa competência não está desenvolvida, o profissional tende a distribuir seu esforço de forma homogênea, tratando todas as tarefas como igualmente importantes. Isso leva a uma agenda cheia, mas com baixa efetividade — o tempo é consumido por atividades que não geram impacto proporcional.",
  },
  {
    id: 20,
    name: "Carga Cognitiva",
    diagnostico:
      "Sua pontuação em Carga Cognitiva indica que sua capacidade de processamento mental pode estar sendo frequentemente sobrecarregada por excesso de informação, tarefas simultâneas ou falta de estrutura na forma como o trabalho é organizado. Isso pode se manifestar como dificuldade de concentração, sensação de confusão, retrabalho ou lentidão na tomada de decisão.",
    fundamentacao:
      "A Teoria da Carga Cognitiva, desenvolvida por John Sweller, parte do princípio de que a capacidade de processamento da memória de trabalho humana é limitada. Ela divide a carga em três tipos: intrínseca (complexidade natural da tarefa), extrínseca (gerada pela forma como a informação é apresentada) e germânica (esforço útil de aprendizado). O problema ocorre quando a carga total ultrapassa a capacidade da memória de trabalho.",
    impacto:
      "Quando essa competência não está desenvolvida, o profissional tende a operar em estado constante de sobrecarga mental. Isso reduz a clareza, aumenta o esforço necessário para executar tarefas e eleva a chance de erro. Na prática, se traduz em dificuldade de manter foco, perda de eficiência em atividades complexas e maior sensação de desgaste mental.",
  },
];
