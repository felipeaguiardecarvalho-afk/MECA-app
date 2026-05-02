import type { BlogFaqItem } from "@/components/blog/BlogFAQAccordion";

const MECA_METHOD_FAQ: readonly BlogFaqItem[] = [
  {
    question: "O que é o método MECA na prática?",
    answer:
      "O MECA é um método comportamental que organiza o crescimento profissional em quatro pilares: mentalidade, engajamento, cultura e alta performance. Ele não parte de teoria abstrata, mas da observação prática de padrões que se repetem em carreiras que aceleram. A proposta é simples: tornar visível aquilo que normalmente não é explicado nas organizações e transformar isso em comportamento aplicável no dia a dia.",
  },
  {
    question: "O MECA funciona para qualquer área ou só para carreira corporativa?",
    answer:
      "O método foi construído a partir do ambiente corporativo, mas os princípios são comportamentais, não técnicos. Isso significa que ele funciona em qualquer contexto onde exista crescimento baseado em percepção, valor e entrega — empresas, consultorias, startups ou até projetos individuais.",
  },
  {
    question: "Qual é o principal erro de quem não cresce na carreira?",
    answer:
      "O erro mais comum não é falta de esforço, é falta de direcionamento. Muitos profissionais investem energia em competências técnicas e produtividade, mas ignoram fatores como percepção, posicionamento, leitura de contexto e comportamento estratégico. Como você mesmo construiu no material: o problema não é potencial, é ausência de método.",
  },
  {
    question: "O MECA substitui experiência ou acelera experiência?",
    answer:
      "Ele não substitui experiência — ele acelera a forma como você aprende com ela. Em vez de depender apenas do tempo, você passa a operar com consciência sobre o que gera crescimento, reduzindo tentativa e erro.",
  },
  {
    question: "O método serve para quem está no início da carreira?",
    answer:
      "Sim — e talvez seja onde ele gera mais impacto. Porque, no início, o profissional ainda não internalizou padrões improdutivos. Aplicar o MECA cedo reduz anos de aprendizado desorganizado e evita a chamada “zona cinza” da carreira.",
  },
  {
    question: "O MECA é mais comportamento ou técnica?",
    answer:
      "Ele é essencialmente comportamento. A técnica continua importante, mas ela deixa de ser o centro e passa a ser base. O crescimento acontece quando o comportamento gera percepção — e percepção gera oportunidade.",
  },
];

const COMPETENT_STAGNATION_FAQ: readonly BlogFaqItem[] = [
  {
    question: "Por que profissionais talentosos ficam estagnados?",
    answer:
      "Porque talento técnico não é suficiente para gerar crescimento. Sem comportamento estratégico, leitura de contexto e visibilidade, a entrega não se transforma em percepção — e sem percepção, não há avanço.",
  },
  {
    question: "O que realmente define uma promoção?",
    answer:
      "Promoções são baseadas em percepção de prontidão. Isso inclui confiabilidade, maturidade, comunicação, capacidade de assumir responsabilidade e impacto no negócio — fatores muitas vezes não explícitos.",
  },
  {
    question: "O que é o “jogo invisível” das empresas?",
    answer:
      "É o conjunto de critérios não formalizados que influenciam decisões de crescimento. Ele inclui comportamento, postura, leitura cultural e capacidade de gerar confiança.",
  },
  {
    question: "Por que trabalhar mais não garante crescimento?",
    answer:
      "Porque volume de trabalho não é o principal critério de avaliação. O que importa é impacto percebido, não esforço invisível.",
  },
];

type BlogFaqConfig = {
  items: readonly BlogFaqItem[];
  intro: string;
  sectionTitle?: string;
};

const BLOG_FAQ_BY_SLUG: Record<string, BlogFaqConfig> = {
  "o-que-e-o-metodo-meca": {
    items: MECA_METHOD_FAQ,
    intro: "Respostas diretas sobre o Método MECA.",
  },
  "por-que-profissionais-competentes-nao-crescem": {
    items: COMPETENT_STAGNATION_FAQ,
    intro: "Esclarecimentos sobre estagnação, promoções e o que as organizações observam de fato.",
  },
};

export function getBlogFaq(slug: string): BlogFaqConfig | undefined {
  return BLOG_FAQ_BY_SLUG[slug];
}
