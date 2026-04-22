"use client";

const fmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : fmt.format(d);
}

export type ComparableDiagnostic = {
  id: string;
  created_at: string;
};

type Props = {
  /** All diagnostics available for the active user (already excluding the primary). */
  candidates: ComparableDiagnostic[];
  /** Currently selected comparison id, or null for none. */
  compareWithId: string | null;
  onChange: (id: string | null) => void;
};

export function ComparisonSelector({ candidates, compareWithId, onChange }: Props) {
  if (!candidates.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-700">Comparar com</p>
        {compareWithId && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-gray-400 underline underline-offset-2 transition hover:text-gray-700"
          >
            Limpar comparação
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {candidates.map((d) => {
          const isActive = d.id === compareWithId;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onChange(isActive ? null : d.id)}
              aria-pressed={isActive}
              className={[
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                isActive
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900",
              ].join(" ")}
            >
              {formatDate(d.created_at)}
            </button>
          );
        })}
      </div>

      {compareWithId && (
        <p className="text-xs text-gray-400">
          A comparar com{" "}
          <span className="font-medium text-indigo-600">
            {formatDate(
              candidates.find((d) => d.id === compareWithId)?.created_at ?? "",
            )}
          </span>
          . O gráfico mostra os dois perfis sobrepostos.
        </p>
      )}
    </div>
  );
}
