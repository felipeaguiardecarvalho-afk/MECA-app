"use client";

import React, { useEffect, useRef, useState } from "react";
import type { PremiumDiagnosticOutput } from "@/lib/claude";

interface PremiumDiagnosticProps {
  responseId: string;
}

function scoreColor(score: number): string {
  if (score < 35) return "#e74c3c";
  if (score < 50) return "#e67e22";
  if (score < 65) return "#f39c12";
  return "#2ecc71";
}

function scoreLabel(score: number): string {
  if (score < 35) return "Crítico";
  if (score < 50) return "Baixo";
  if (score < 65) return "Moderado";
  return "Bom";
}

export const PremiumDiagnostic: React.FC<PremiumDiagnosticProps> = ({ responseId }) => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PremiumDiagnosticOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (fetchedRef.current === responseId) return;
    fetchedRef.current = responseId;

    setLoading(true);
    setResult(null);
    setError(null);

    fetch("/api/diagnostic/premium", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responseId }),
    })
      .then((res) => res.json())
      .then((data: { ok: boolean; diagnostic?: PremiumDiagnosticOutput; error?: string }) => {
        if (!data.ok) {
          setError(data.error ?? "Erro ao gerar diagnóstico.");
        } else {
          setResult(data.diagnostic ?? null);
        }
      })
      .catch(() => setError("Não foi possível conectar ao servidor."))
      .finally(() => setLoading(false));
  }, [responseId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#1a3a5c]/10 bg-gradient-to-br from-[#1a3a5c] to-[#1a4a7c] p-8 shadow-[0_4px_24px_rgba(26,58,92,0.15)]">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/20 border-t-[#4a90d9]" />
          <p className="text-sm text-white/60">Gerando diagnóstico personalizado…</p>
          <p className="text-xs text-white/40">Isso pode levar alguns segundos</p>
        </div>
      </div>
    );
  }

  if (error) {
    return null;
  }

  if (!result) return null;

  return (
    <div className="space-y-6">
      {/* Header com resumo executivo */}
      <div className="rounded-2xl border border-[#1a3a5c]/10 bg-gradient-to-br from-[#1a3a5c] to-[#1a4a7c] p-6 shadow-[0_4px_24px_rgba(26,58,92,0.15)] sm:p-8">
        <div className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#4a90d9]">
          Análise Premium
        </div>
        <h2 className="mb-4 text-xl font-extrabold text-white sm:text-2xl">
          Diagnóstico Personalizado
        </h2>
        <div className="rounded-xl bg-white/5 p-5 sm:p-6">
          <div className="mb-3 text-xs font-bold uppercase tracking-widest text-[#4a90d9]">
            Resumo Executivo
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-white/80 sm:text-base">
            {result.resumoExecutivo.split("\n\n").map((p, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static render
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Diagnósticos por teoria — 4 menores scores */}
      <div className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-widest text-[#1a3a5c]/50">
          Pontos Críticos — Diagnóstico Detalhado
        </div>
        {result.diagnosticoPremium.map((item, idx) => {
          const color = scoreColor(item.score);
          const label = scoreLabel(item.score);
          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: static render
              key={idx}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_4px_24px_rgba(26,58,92,0.06)] sm:p-6"
              style={{ borderLeftWidth: 4, borderLeftColor: color }}
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Teoria {idx + 1}
                  </span>
                  <h3 className="text-base font-extrabold text-[#1a3a5c] sm:text-lg">
                    {item.theoryName}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold" style={{ color }}>
                    {item.score}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
                    style={{ background: color }}
                  >
                    {label}
                  </span>
                </div>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-gray-700 sm:text-base">
                {item.texto.split("\n\n").map((p, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static render
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
