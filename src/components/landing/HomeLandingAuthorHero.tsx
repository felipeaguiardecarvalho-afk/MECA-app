import Image from "next/image";
import Link from "next/link";
import { HomeLandingActions } from "@/components/landing/HomeLandingActions";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const LINKEDIN_URL =
  "https://www.linkedin.com/in/felipe-aguiar-de-carvalho-5b171b2a/";

/** Foto hero da landing — asset em `public/images/felipe-aguiar.webp`. */
const AUTHOR_PHOTO_SRC = "/images/felipe-aguiar.webp";

export function HomeLandingAuthorHero() {
  return (
    <section
      aria-labelledby="landing-author-hero-heading"
      className="w-full border-b border-slate-200/60 bg-gradient-to-b from-white via-slate-50/80 to-indigo-50/30 py-10 sm:py-11 lg:py-14"
    >
      <div className="mx-auto w-full min-w-0 max-w-[min(100%,1390px)] px-4 sm:px-6 lg:px-4">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-stretch lg:gap-10">
          <div className="mx-auto w-full min-w-0 max-w-2xl space-y-5 text-center lg:mx-0 lg:max-w-none lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600/90 sm:text-sm">
              Diagnóstico Comportamental
            </p>
            <h2
              id="landing-author-hero-heading"
              className="text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
            >
              Crescimento profissional não é só sobre esforço, é sobre método.
            </h2>
            <p className="text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
              Depois de duas décadas em grandes empresas industriais e
              multinacionais, liderando áreas de FP&amp;A, Pricing e Comercial, eu
              identifiquei um padrão claro: profissionais talentosos permanecem
              estagnados, não por falta de capacidade, mas por falta de direção.
            </p>
            <div className="space-y-4 text-pretty text-base leading-relaxed text-slate-700 sm:space-y-5">
              <p>
                Minha carreira não foi meteórica, foi construída de forma
                consistente, assumindo responsabilidades antes do título,
                liderando em contextos complexos e navegando diferentes culturas
                organizacionais.
              </p>
              <p>
                Foi nesse ambiente real — e não na teoria — que entendi como o
                crescimento realmente funciona dentro das empresas.
              </p>
            </div>
            <p className="text-pretty text-base font-medium leading-relaxed text-slate-800 sm:text-lg">
              O problema é que esse &quot;jogo&quot; nunca é explicado. As regras
              existem, mas são invisíveis. E é exatamente isso que o MECA
              resolve.
            </p>
            <p className="text-pretty text-base leading-relaxed text-slate-600">
              O MECA é um sistema prático de desenvolvimento profissional baseado
              em comportamento, posicionamento e execução, estruturado a partir
              de padrões reais observados ao longo de duas décadas de carreira.
            </p>
            <div className="flex flex-col items-center gap-2 pt-2 lg:items-start">
              <HomeLandingActions />
              <p className="text-sm text-slate-500">
                Descubra o que está travando sua carreira hoje.
              </p>
            </div>
          </div>

          <aside className="mx-auto flex w-full min-w-0 lg:h-full lg:min-h-0 lg:w-[70%] lg:max-w-[70%] lg:justify-self-end">
            <div className="flex min-h-[28rem] w-full flex-1 flex-col justify-between gap-6 rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-md backdrop-blur-sm sm:min-h-[32rem] sm:p-8 lg:min-h-full lg:p-10">
              <div className="flex min-h-0 flex-1 flex-col justify-center gap-6">
                <div className="relative mx-auto aspect-square w-full max-w-[min(100%,14rem)] overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/60 sm:max-w-[min(100%,15.5rem)]">
                  <Image
                    src={AUTHOR_PHOTO_SRC}
                    alt="Felipe Aguiar de Carvalho"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 640px) 56vw, 248px"
                    priority
                  />
                </div>
                <div className="min-w-0 space-y-3 text-center sm:space-y-4">
                  <h3 className="text-balance text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    Felipe Aguiar de Carvalho
                  </h3>
                  <p className="text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
                    19+ anos de experiência em ambiente corporativo, com atuação
                    em multinacionais e liderança em finanças, estratégia e
                    sistemas.
                  </p>
                  <p className="text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
                    Ex. Toyota, atualmente líder de FP&amp;A na Ball Corporation,
                    Palestrante em eventos corporativos e FP&amp;A Summit, dezenas
                    de mentorados com resultado real
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 justify-center pt-2">
                <Link
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full max-w-md items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md sm:w-auto sm:px-6"
                >
                  <LinkedInIcon className="h-5 w-5 shrink-0 text-[#0A66C2]" />
                  Ver perfil no LinkedIn
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
