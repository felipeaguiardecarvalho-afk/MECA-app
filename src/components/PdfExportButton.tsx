"use client";

import { buildMecaPdfReport } from "@/lib/pdf-export";
import type { DiagnosticResult } from "@/lib/types";

export function PdfExportButton(props: {
  title: string;
  result: DiagnosticResult;
  benchmarkNote?: string;
}) {
  function onClick() {
    const doc = buildMecaPdfReport(props);
    doc.save("meca-relatorio.pdf");
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="ds-btn-secondary shrink-0"
    >
      Exportar PDF
    </button>
  );
}
