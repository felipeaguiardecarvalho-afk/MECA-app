import React from "react";

export type DiagnosticSummary = {
  id: string;
  created_at: string;
};

interface Props {
  diagnostics: DiagnosticSummary[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${date} ${time}`;
}

function formatDateLong(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${date} às ${time}`;
}

export const DiagnosticSelector: React.FC<Props> = ({
  diagnostics,
  selectedIds,
  onToggle,
  onClear,
}) => {
  const isComparing = selectedIds.length === 2;
  const latestId = diagnostics[0]?.id;

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 sm:p-5 lg:p-6">
      <div className="mb-3 flex flex-col gap-3 sm:mb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#374151",
          }}
        >
          {isComparing ? "Comparando diagnósticos" : "Seus diagnósticos"}
        </span>
        {isComparing && (
          <button
            type="button"
            onClick={onClear}
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#6b7280",
              background: "#f3f4f6",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: "4px 10px",
              cursor: "pointer",
            }}
          >
            Limpar comparação
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {diagnostics.map((d) => {
          const isSelected = selectedIds.includes(d.id);
          const isLatest = d.id === latestId;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onToggle(d.id)}
              title={formatDateLong(d.created_at)}
              style={{
                position: "relative",
                padding: "8px 14px",
                borderRadius: 8,
                border: isSelected
                  ? "2px solid #1a3a5c"
                  : "1px solid #e5e7eb",
                background: isSelected ? "#eef3f9" : "#fff",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: isSelected ? 700 : 500,
                color: isSelected ? "#1a3a5c" : "#6b7280",
                transition: "all 0.15s ease",
              }}
            >
              {formatDate(d.created_at)}
              {isLatest && isSelected && isComparing && (
                <span
                  style={{
                    position: "absolute",
                    top: -7,
                    right: -6,
                    fontSize: 9,
                    fontWeight: 700,
                    background: "#1a3a5c",
                    color: "#fff",
                    padding: "1px 5px",
                    borderRadius: 4,
                    whiteSpace: "nowrap",
                  }}
                >
                  Recente
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!isComparing && diagnostics.length >= 2 && (
        <p
          style={{
            fontSize: 11,
            color: "#9ca3af",
            marginTop: 10,
          }}
        >
          Selecione outro diagnóstico para comparar
        </p>
      )}
    </div>
  );
};

export default DiagnosticSelector;
