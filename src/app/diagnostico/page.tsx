import Link from "next/link";

const STEPS = [
  {
    title: "60 perguntas",
    body: "O diagnóstico percorre 60 afirmações comportamentais ligadas aos quatro pilares do método MECA.",
  },
  {
    title: "15 segundos por pergunta",
    body: "Cada pergunta tem tempo curto para capturar uma resposta mais espontânea. Se o tempo acabar, a resposta neutra é registrada.",
  },
  {
    title: "Escala de 1 a 5",
    body: "1 significa discordo totalmente, 5 significa concordo totalmente e 3 representa uma posição neutra.",
  },
  {
    title: "Resultado final",
    body: "Ao terminar, você recebe seu perfil MECA, pontuação por pilar, arquétipo dominante e recomendações de próximos passos.",
  },
] as const;

export default function DiagnosticoPage() {
  return (
    <section className="w-full bg-white py-10 sm:py-14 lg:py-16">
      <div className="w-full px-4 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.1em] text-gray-500">
            Antes de começar
          </p>
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Como funciona o diagnóstico MECA
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-gray-600 sm:text-lg">
            Responda com sinceridade e rapidez. Não existe resposta certa ou
            errada: o objetivo é mapear como você pensa, se posiciona e executa
            no contexto profissional.
          </p>
        </div>

        <div className="mx-auto mt-8 grid max-w-[calc(100vw-6rem)] gap-4 sm:mt-10 sm:grid-cols-2 lg:gap-5">
          {STEPS.map((step) => (
            <article
              key={step.title}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900">
                {step.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
                {step.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-8 flex max-w-[calc(100vw-6rem)] flex-col items-center justify-center gap-3 text-center sm:mt-10 sm:flex-row">
          <Link href="/assessment" className="ds-btn-primary">
            Iniciar diagnóstico
          </Link>
          <Link href="/" className="ds-btn-secondary">
            Voltar
          </Link>
        </div>
      </div>
    </section>
  );
}
