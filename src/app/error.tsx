"use client";

/**
 * Erros não tratados no segmento da app (ex.: falha de renderização RSC).
 * Erros de rede/cache do dev: preferir `npm run clean` e um único `next dev`.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-xl font-semibold text-gray-900">Erro ao carregar a página</h1>
      <p className="max-w-md text-sm text-gray-600">
        {process.env.NODE_ENV === "development"
          ? error.message
          : "Tente novamente dentro de instantes. Se persistir, contacte o suporte."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white"
      >
        Tentar de novo
      </button>
    </div>
  );
}
