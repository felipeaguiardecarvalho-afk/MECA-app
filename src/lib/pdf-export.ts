import type { DiagnosticResult } from "./types";
import { jsPDF } from "jspdf";

export function buildMecaPdfReport(params: {
  title: string;
  result: DiagnosticResult;
  benchmarkNote?: string;
}): jsPDF {
  const { title, result, benchmarkNote } = params;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const line = 7;
  let y = 20;

  doc.setFontSize(18);
  doc.text("MECA — Relatório diagnóstico", 20, y);
  y += line * 1.5;

  doc.setFontSize(11);
  doc.text(title, 20, y);
  y += line * 2;

  const rows: [string, string | number][] = [
    ["Mentalidade", result.mentalidade],
    ["Engajamento", result.engajamento],
    ["Cultura", result.cultura],
    ["Performance", result.performance],
    ["Direção", result.direction],
    ["Capacidade", result.capacity],
    ["Arquétipo", result.archetype],
  ];

  rows.forEach(([k, v]) => {
    doc.text(`${k}: ${v}`, 20, y);
    y += line;
  });

  if (benchmarkNote) {
    y += line;
    doc.setFontSize(10);
    doc.text(benchmarkNote, 20, y, { maxWidth: 170 });
  }

  return doc;
}
