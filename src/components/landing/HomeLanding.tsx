import { isAuthDisabled } from "@/lib/auth-mode";
import { HomeLandingActions } from "@/components/landing/HomeLandingActions";

const SECTIONS = [
  {
    title: "O problema invisível do crescimento profissional",
    body: "O Método MECA é um sistema estruturado de desenvolvimento profissional que nasce da observação prática de um problema recorrente no ambiente corporativo: profissionais talentosos, técnicos e dedicados não avançam na carreira na mesma velocidade que outros — não por falta de capacidade, mas por ausência de método claro sobre como crescer.",
  },
  {
    title: "Os critérios existem, mas não são claros",
    body: "Ele surge, portanto, como resposta a um vazio estrutural: as organizações exigem comportamentos específicos para promover e reconhecer pessoas, mas raramente explicam esses critérios de forma explícita. O MECA traduz esses “códigos invisíveis” em algo compreensível, treinável e aplicável no dia a dia.",
  },
  {
    title: "Um sistema baseado em quatro pilares",
    body: "Na prática, o método funciona como um framework comportamental baseado em quatro pilares integrados: Mentalidade Empreendedora, Engajamento Autêntico, Cultura como Motor de Crescimento e Alta Performance. Esses pilares não atuam isoladamente, mas como um sistema progressivo: primeiro o profissional ajusta sua forma de pensar, depois sua forma de se posicionar, em seguida aprende a ler o contexto e, por fim, transforma tudo isso em entrega consistente e percebida.",
  },
  {
    title: "Diagnóstico, ação e evolução contínua",
    body: "O funcionamento do MECA é operacionalizado por meio de um modelo integrado que combina diagnóstico, plano de ação em ciclos curtos e acompanhamento contínuo. Esse sistema permite que o profissional identifique onde está, o que precisa ajustar e como evoluir de forma intencional, reduzindo tentativa e erro e tornando o crescimento mais previsível.",
  },
  {
    title: "Por que o método foi criado",
    body: "A motivação para a criação do método é profundamente prática e humana. Ela nasce da vivência de quase duas décadas em diferentes contextos organizacionais, onde ficou evidente que o problema não era falta de talento, mas falta de clareza. O MECA foi criado como uma forma de organizar essa experiência, encurtar caminhos, reduzir frustração e devolver ao profissional o protagonismo sobre sua própria trajetória.",
  },
  {
    title: "Transformando carreira em um processo estruturado",
    body: "Em essência, o MECA transforma carreira de algo reativo e incerto em um processo consciente, estruturado e gerenciável.",
  },
] as const;

export function HomeLanding() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="border-b border-gray-100">
        <div className="mx-auto max-w-3xl space-y-10 px-6 py-20 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 md:text-5xl">
            MECA
          </h1>
          <p className="text-base leading-relaxed text-gray-600">
            Diagnóstico comportamental profissional — método estruturado, resultado
            acionável.
          </p>
          <div className="pt-2">
            <HomeLandingActions />
          </div>
        </div>
      </section>

      {/* Structured content */}
      <div className="divide-y divide-gray-100">
        {SECTIONS.map((section) => (
          <section key={section.title} className="ds-landing-section">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
              {section.title}
            </h2>
            <p className="text-base leading-relaxed text-gray-600">{section.body}</p>
          </section>
        ))}
      </div>

      {/* Final CTA */}
      <section className="border-t border-gray-100">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <HomeLandingActions />
          <p className="mt-8 text-sm text-gray-500">
            {isAuthDisabled()
              ? "Modo desenvolvimento — sem login."
              : "Acesso seguro por e-mail e código único."}
          </p>
        </div>
      </section>
    </div>
  );
}
