"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Defaults = {
  name: string;
  profession: string;
  phone: string;
};

/**
 * Formulário de primeiro acesso. Apenas o Nome é obrigatório; Profissão e
 * Telefone são opcionais mas ficam registados em `public.profiles` para que o
 * diagnóstico possa ser contextualizado mais tarde.
 */
export function OnboardingForm({
  next,
  defaults,
}: {
  next: string;
  defaults: Defaults;
}) {
  const router = useRouter();
  const [name, setName] = useState(defaults.name);
  const [profession, setProfession] = useState(defaults.profession);
  const [phone, setPhone] = useState(defaults.phone);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length >= 2 && status !== "saving";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("saving");
    setMessage(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          profession: profession.trim(),
          phone: phone.trim(),
        }),
      });

      if (res.status === 429) {
        setStatus("error");
        setMessage("Muitos pedidos. Aguarde um momento e tente novamente.");
        return;
      }

      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!res.ok || !json.ok) {
        setStatus("error");
        setMessage(
          json.error === "validation"
            ? "Confirme os dados preenchidos e tente novamente."
            : "Não foi possível guardar o cadastro. Tente novamente em instantes.",
        );
        return;
      }

      const dest = next.startsWith("/") ? next : `/${next}`;
      router.replace(dest);
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("Erro de rede. Verifique a sua ligação e tente novamente.");
    }
  }

  return (
    <section className="ds-page flex min-h-[calc(100dvh-4rem)] flex-col justify-center px-6 py-10">
      <div className="mx-auto w-full max-w-lg">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm md:p-10">
          <div className="space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-600">
              Antes de começar
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Complete o seu cadastro
            </h1>
            <p className="text-base text-gray-600">
              Precisamos apenas do seu nome para iniciar o diagnóstico. Profissão
              e telefone são opcionais e ajudam a contextualizar o seu perfil.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <label className="block text-left">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Nome <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                required
                autoFocus
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                className="ds-input"
                placeholder="O seu nome completo"
              />
            </label>

            <label className="block text-left">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Profissão{" "}
                <span className="text-xs font-normal text-gray-400">
                  (opcional)
                </span>
              </span>
              <input
                type="text"
                autoComplete="organization-title"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                maxLength={120}
                className="ds-input"
                placeholder="Ex. Analista de FP&A"
              />
            </label>

            <label className="block text-left">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Telefone{" "}
                <span className="text-xs font-normal text-gray-400">
                  (opcional)
                </span>
              </span>
              <input
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={40}
                className="ds-input"
                placeholder="+55 11 91234-5678"
              />
            </label>

            <button
              type="submit"
              disabled={!canSubmit}
              className="ds-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "saving" ? "A guardar…" : "Iniciar diagnóstico"}
            </button>
          </form>

          {message && (
            <p
              className={`mt-5 text-center text-sm ${
                status === "error" ? "text-red-600" : "text-gray-600"
              }`}
              role={status === "error" ? "alert" : undefined}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
