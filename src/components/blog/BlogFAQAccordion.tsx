export type BlogFaqItem = {
  question: string;
  answer: string;
};

type BlogFAQAccordionProps = {
  items: readonly BlogFaqItem[];
  sectionTitle?: string;
  intro?: string;
  /** Must be unique on the page for aria-labelledby */
  headingId?: string;
  /** Emit FAQPage JSON-LD (one per page when true) */
  includeFaqJsonLd?: boolean;
};

function faqPageJsonLd(items: readonly BlogFaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/**
 * FAQ semântico com accordion nativo (`details`/`summary`) e JSON-LD FAQPage opcional.
 */
export function BlogFAQAccordion({
  items,
  sectionTitle = "Perguntas frequentes",
  intro,
  headingId = "faq-heading",
  includeFaqJsonLd = true,
}: BlogFAQAccordionProps) {
  const jsonLd = includeFaqJsonLd ? faqPageJsonLd(items) : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
      ) : null}

      <section
        className="mt-8 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm shadow-slate-900/5 sm:p-8"
        aria-labelledby={headingId}
      >
        <h2
          id={headingId}
          className="text-balance text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl"
        >
          {sectionTitle}
        </h2>
        {intro ? (
          <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
            {intro}
          </p>
        ) : null}

        <div className="mt-8 divide-y divide-slate-200/90 border-t border-slate-200/90">
          {items.map((item) => (
            <details
              key={item.question}
              className="group rounded-lg py-5 first:pt-6 open:border-slate-100 open:bg-slate-50/40 open:pb-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-md px-1 py-0.5 text-left text-base font-semibold text-slate-900 outline-none ring-indigo-500/40 transition-colors hover:bg-slate-50 hover:text-indigo-900 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:text-lg">
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
              <div className="mt-3 max-w-3xl px-1 text-pretty text-sm leading-relaxed text-slate-600 sm:text-base sm:leading-relaxed">
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
