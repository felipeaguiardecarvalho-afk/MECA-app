"use client";

import { getActionPlan } from "@/lib/action-plan";
import { diagnosticRowToMECAScores } from "@/lib/meca-scores";
import {
  pickLatestRow,
  type ResponseRowScores,
} from "@/lib/meca-history-utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ListChecks } from "lucide-react";
import type { MECAScores } from "@/utils/archetypeEngine";

export function PlanoDeAcaoClient() {
  const searchParams = useSearchParams();
  const saved = searchParams.get("saved");

  const [scores, setScores] = useState<MECAScores | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleRetakeDiagnostic = useCallback(() => {
    window.alert(
      "Apenas um diagnóstico é permitido por cadastro. Caso queira realmente refazer seu diagnóstico, entre em contato com felipe.aguiardecarvalho@gmail.com",
    );
  }, []);

  const fetchHistory = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/user/history", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Falha ao carregar o histórico.",
        );
        return;
      }

      const rows = (data.rows ?? []) as ResponseRowScores[];
      const chosen =
        saved && rows.length
          ? (rows.find((r) => r.id === saved) ?? pickLatestRow(rows))
          : pickLatestRow(rows);

      if (chosen) {
        setScores(diagnosticRowToMECAScores(chosen));
      }
    } catch {
      setError("Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, [saved]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory, saved]);

  const plan = useMemo(
    () => (scores ? getActionPlan(scores) : null),
    [scores],
  );

  if (loading && !scores) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] w-full flex-col items-center justify-center gap-6 py-12 sm:py-16 lg:py-24">
        <div className="w-full max-w-lg space-y-3 px-4" aria-busy aria-label="A carregar">
          <div className="h-7 w-40 animate-shimmer rounded-lg" />
          <div className="h-24 animate-shimmer rounded-2xl" />
          <div className="h-14 animate-shimmer rounded-2xl" />
        </div>
        <p className="text-sm font-medium text-slate-500">A carregar o plano de ação…</p>
      </div>
    );
  }

  if (error && !scores) {
    return (
      <div className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-4 py-12 text-center sm:py-16 lg:py-24">
        <div className="container-meca">
          <p className="text-sm text-red-600">{error}</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block text-sm font-semibold text-[#1a3a5c]"
          >
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!scores || !plan) {
    return (
      <div className="flex min-h-[50vh] w-full flex-col items-center justify-center py-12 text-center sm:py-16 lg:py-24">
        <div className="container-meca">
          <div className="mx-auto max-w-2xl space-y-6">
            <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
              Realize o diagnóstico primeiro
            </h1>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-600 sm:text-base">
              Precisamos do seu resultado MECA para gerar um plano de ação
              personalizado a partir do seu pilar com menor pontuação.
            </p>
            <Link href="/assessment" className="ds-btn-primary inline-flex justify-center">
              Iniciar diagnóstico
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-[calc(100dvh-4rem)] w-full bg-gradient-to-b from-slate-50/80 via-white to-indigo-50/30 py-12 sm:py-16 lg:py-24">
      <div className="container-meca">
        <div className="mx-auto w-full max-w-6xl space-y-10 sm:space-y-12">
        <div className="border-b border-slate-200/80 pb-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            MECA · Plano de ação
          </p>
          <h1 className="break-words text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            {plan.title}
          </h1>
          <p className="mt-5 break-words text-base leading-relaxed text-slate-600 sm:text-lg">
            {plan.description}
          </p>
        </div>

        {error && (
          <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error} — a mostrar dados em cache local quando disponíveis.
          </p>
        )}

        <section className="ds-card mb-10 p-6 md:p-8">
          <p className="text-lg font-semibold text-slate-900 md:text-xl">
            Seu principal ponto de alavancagem está em:{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text font-bold text-transparent">
              {plan.pillar}
            </span>
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Menor pontuação neste pilar:{" "}
            <strong>
              {plan.lowestScore}/100
            </strong>
            {" · "}
            Mentalidade {plan.scores.mentalidade} · Engajamento{" "}
            {plan.scores.engajamento} · Cultura {plan.scores.cultura} ·
            Performance {plan.scores.performance}
          </p>
        </section>

        <section>
          <div className="mb-6 flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-indigo-600" aria-hidden />
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">
              Ações recomendadas
            </h2>
          </div>
          <ul className="relative space-y-0 pl-1">
            {plan.actions.map((action, i) => (
              <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
                {i < plan.actions.length - 1 ? (
                  <div
                    className="absolute left-[17px] top-10 h-[calc(100%-0.5rem)] w-px bg-gradient-to-b from-indigo-200 via-slate-200 to-transparent"
                    aria-hidden
                  />
                ) : null}
                <div className="relative z-[1] flex shrink-0 flex-col items-center">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-md shadow-blue-500/25">
                    {i + 1}
                  </span>
                </div>
                <div className="ds-card min-w-0 flex-1 border-slate-200/80 py-4 pl-4 pr-5 sm:pl-5">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600/90">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    Passo {i + 1}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-800 sm:text-[15px]">{action}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-10 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f2744] via-[#1a3a5c] to-indigo-900 p-6 text-center shadow-premium md:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#4a90d9]">
            Relatório premium
          </p>
          <h3 className="mt-2 text-xl font-bold text-white">
            Acesse seu relatório completo
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Interpretação detalhada de cada pilar, gráfico radar, arquétipo e
            plano de ação personalizado em PDF.
          </p>
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
          >
            Acessar meu relatório completo →
          </button>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Link href="/dashboard" className="ds-btn-secondary inline-flex flex-1 justify-center sm:flex-none">
            ← Voltar ao dashboard
          </Link>
          <button
            type="button"
            onClick={handleRetakeDiagnostic}
            className="ds-btn-primary inline-flex flex-1 justify-center sm:flex-none"
          >
            Refazer diagnóstico
          </button>
        </div>
        </div>
      </div>
    </div>

    {showReportModal ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
        onClick={() => setShowReportModal(false)}
      >
        <div
          className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6 text-center">
            <span className="inline-block rounded-full bg-[#4a90d9]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#4a90d9]">
              Premium
            </span>
            <h2 className="mt-3 text-2xl font-bold text-[#1a3a5c]">
              Relatório completo MECA
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              PDF profissional com análise detalhada dos seus 4 pilares
            </p>
          </div>
          <ul className="mb-6 space-y-2 text-sm text-gray-700">
            {[
              "Gráfico radar com seus 4 pilares",
              "Interpretação personalizada por pilar",
              "Arquétipo e posição na matriz MECA",
              "Plano de ação com foco no pilar crítico",
              "Recomendações estratégicas do arquétipo",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="font-bold text-[#2ecc71]">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <div className="mb-6 flex items-baseline justify-center gap-2">
            <span className="text-4xl font-extrabold text-[#1a3a5c]">
              R$&nbsp;49
            </span>
            <span className="text-sm text-gray-400">pagamento único</span>
          </div>
          <a
            href="https://wa.me/5512996573102?text=Quero%20meu%20relatorio%20MECA"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#1fba56]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.528 5.858L0 24l6.335-1.508A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.015-1.374l-.36-.214-3.727.977.994-3.634-.235-.374A9.818 9.818 0 1112 21.818z"/>
            </svg>
            Falar no WhatsApp
          </a>
          <button
            type="button"
            onClick={() => setShowReportModal(false)}
            className="mt-3 w-full rounded-xl border border-gray-200 px-6 py-2.5 text-sm text-gray-500 transition hover:bg-gray-50"
          >
            Fechar
          </button>
        </div>
      </div>
    ) : null}
    </>
  );
}
