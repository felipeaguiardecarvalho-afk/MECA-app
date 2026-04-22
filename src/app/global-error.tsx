"use client";

/**
 * Erro na raiz da árvore (antes do layout ou falha total do RSC).
 * Deve definir <html> e <body> — não herda o layout principal.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: "#f9fafb",
          color: "#111827",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 12 }}>
          Erro no servidor
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#4b5563", maxWidth: 420 }}>
          {process.env.NODE_ENV === "development"
            ? error.message
            : "Ocorreu um erro inesperado. Tente novamente."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: 20,
            padding: "10px 20px",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#fff",
            background: "#111827",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Tentar de novo
        </button>
        <p style={{ marginTop: 24, fontSize: "0.75rem", color: "#9ca3af" }}>
          Em desenvolvimento: pare todos os <code>next dev</code>, execute{" "}
          <code>npm run clean</code> e suba um único servidor.
        </p>
      </body>
    </html>
  );
}
