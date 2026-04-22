import { isAuthDisabled } from "@/lib/auth-mode";
import { HomeLandingActions } from "@/components/landing/HomeLandingActions";
import { HomeLandingAuthorHero } from "@/components/landing/HomeLandingAuthorHero";

const SECTIONS: { title: string; paragraphs: string[] }[] = [
  {
    title: "O problema que o MECA resolve",
    paragraphs: [
      "O crescimento profissional nunca foi tão exigente e, ao mesmo tempo, tão mal compreendido. Em praticamente todas as organizações, repete-se o mesmo paradoxo, profissionais altamente capacitados permanecem estagnados enquanto outros avançam com consistência e velocidade. A diferença não está no talento, nem no esforço, está na compreensão de um jogo que raramente é explicado.",
      "Carreiras não travam por falta de competência, travam por falta de método. A maioria dos profissionais investe energia nos lugares errados, acumulando conhecimento técnico, aumentando carga de trabalho e esperando reconhecimento, sem perceber que decisões de crescimento são guiadas por fatores mais sutis, como comportamento, posicionamento, leitura de contexto e impacto percebido.",
      "O MECA existe para tornar visível o que sempre esteve oculto, transformando um processo difuso e imprevisível em um sistema claro, estratégico e intencional, devolvendo ao profissional o controle sobre a própria trajetória.",
    ],
  },
  {
    title: "Como o MECA surgiu",
    paragraphs: [
      "O MECA não foi concebido como teoria, foi lapidado pela realidade. Ao longo de quase duas décadas em ambientes corporativos distintos, atravessando culturas, níveis de complexidade e contextos globais, um padrão começou a se repetir com consistência, profissionais que cresciam mais rápido não eram necessariamente os mais técnicos, mas aqueles que se comportavam de forma diferente.",
      "Esse padrão nunca foi formalizado, nunca foi ensinado, mas sempre esteve presente. Com o tempo, a repetição deixou de parecer coincidência e passou a revelar método.",
      "Existe, porém, um motivo claro para que esse conhecimento permaneça invisível. Executivos raramente explicam como o crescimento realmente acontece, não por falta de intenção, mas por estrutura, operam sob alta pressão, com pouco tempo para reflexão, distantes da realidade dos níveis intermediários e, muitas vezes, sem capacidade de traduzir experiência em algo ensinável. O resultado é um vácuo, profissionais talentosos recebem orientações genéricas enquanto as regras reais do jogo continuam implícitas.",
      "O MECA nasce exatamente para preencher esse espaço, transformando experiência em método, comportamento em sistema e percepção em clareza, organizando de forma acessível aquilo que sempre foi praticado, mas raramente explicado.",
    ],
  },
  {
    title: "Como o MECA funciona",
    paragraphs: [
      "O MECA é um sistema de desenvolvimento profissional construído sobre lógica, consistência e aplicação prática. Ele não se apoia em fórmulas genéricas nem em motivação superficial, opera como uma arquitetura comportamental integrada, onde cada elemento potencializa o outro.",
      "Sua estrutura se sustenta em quatro pilares fundamentais, mentalidade empreendedora, que define como o profissional se posiciona internamente, engajamento autêntico, que transforma essa postura em comportamento visível, cultura como motor, que orienta onde e como agir com precisão, e alta performance, que converte tudo isso em impacto real e sustentável.",
      "Essa lógica não é apenas conceitual, é operacional. O método começa gerando clareza, evolui para ação direcionada e se consolida por meio de ciclos contínuos de ajuste e refinamento, até que deixa de ser ferramenta e passa a se tornar identidade.",
      "O resultado não é apenas crescimento, é previsibilidade, consistência e domínio sobre a própria evolução profissional.",
    ],
  },
];

export function HomeLanding() {
  return (
    <div className="w-full min-w-0">
      {/* Marca MECA — logo abaixo da barra principal (sem CTA; o botão segue na secção do autor e no rodapé) */}
      <section
        aria-label="MECA — diagnóstico comportamental"
        className="ds-hero-mesh w-full border-b border-slate-200/60 py-2 sm:py-2 lg:py-2"
      >
        <div className="container-meca relative z-[1] text-center">
          <div className="mx-auto w-full max-w-3xl animate-fade-up sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl">
            <h1 className="ds-hero-glow-title text-balance text-[clamp(3.375rem,calc(7.5vw+0.75rem),5.625rem)] font-bold leading-none tracking-tight text-slate-900">
              MECA
            </h1>
          </div>
        </div>
      </section>

      <HomeLandingAuthorHero />

      <section
        aria-label="Sobre o método MECA"
        className="border-y border-slate-200/50 bg-gradient-to-b from-white/80 via-slate-50/40 to-indigo-50/30 py-12 sm:py-16 lg:py-24"
      >
        <div className="container-meca">
          <div className="grid-meca-cards items-stretch">
            {SECTIONS.map((section, idx) => (
              <article
                key={section.title}
                style={{ animationDelay: `${idx * 90}ms` }}
                className="ds-card ds-card-interactive animate-fade-up flex h-full min-h-0 min-w-0 flex-col p-6 sm:p-8"
              >
                <h2 className="text-balance break-words text-lg font-bold leading-snug tracking-tight text-slate-900 sm:text-xl">
                  {section.title}
                </h2>
                <div className="mt-4 min-h-0 flex-1 space-y-3 sm:mt-5 sm:space-y-4">
                  {section.paragraphs.map((p, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: static content
                    <p key={i} className="text-pretty text-sm leading-relaxed text-slate-600 sm:text-base sm:leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full border-t border-slate-200/50 bg-white/40 py-14 sm:py-20 lg:py-24">
        <div className="container-meca">
          <div className="mx-auto w-full max-w-4xl space-y-8 text-center sm:max-w-5xl sm:space-y-10 lg:max-w-6xl">
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-center">
              <HomeLandingActions />
            </div>
            <p className="text-sm text-slate-500 sm:text-base">
              {isAuthDisabled()
                ? "Modo desenvolvimento — sem login."
                : "Acesso seguro por link enviado ao seu e-mail."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
