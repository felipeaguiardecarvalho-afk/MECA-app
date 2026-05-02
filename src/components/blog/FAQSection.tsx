const FAQ_ITEMS: readonly { question: string; answer: string }[] = [
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
] as const;

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
} as const;

/**
 * FAQ semântico + accordion nativo (`details`/`summary`) para SEO e acessibilidade.
 * JSON-LD FAQPage opcional para rich results.
 */
export function FAQSection() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(FAQ_JSON_LD),
        }}
      />

      <section
        className="mt-8 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm shadow-slate-900/5 sm:p-8"
        aria-labelledby="faq-heading"
      >
        <h2
          id="faq-heading"
          className="text-balance text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl"
        >
          Perguntas frequentes
        </h2>
        <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
          Respostas diretas sobre o Método MECA.
        </p>

        <div className="mt-8 divide-y divide-slate-200/90 border-t border-slate-200/90">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group py-5 first:pt-6 open:pb-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left text-base font-semibold text-slate-900 outline-none ring-indigo-500/40 transition-colors hover:text-indigo-900 focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:text-lg">
                <span className="min-w-0 flex-1">{item.question}</span>
                <span
                  className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition-transform duration-200 ease-out group-open:rotate-180"
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </summary>
              <div className="mt-3 max-w-3xl text-pretty text-sm leading-relaxed text-slate-600 sm:text-base sm:leading-relaxed">
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
