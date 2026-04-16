"use client";

import { getActionPlan } from "@/lib/action-plan";
import {
  diagnosticRowToMECAScores,
  readDashboardBootstrap,
} from "@/lib/meca-dashboard-scores";
import {
  pickLatestRow,
  type ResponseRowScores,
} from "@/lib/meca-history-utils";
import { OFFLINE_RESULT_KEY_PREFIX } from "@/lib/meca-offline-result";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import type { MECAScores } from "@/utils/archetypeEngine";

function readOfflineRowForSaved(saved: string): ResponseRowScores | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${OFFLINE_RESULT_KEY_PREFIX}${saved}`);
    if (!raw) return null;
    return JSON.parse(raw) as ResponseRowScores;
  } catch {
    return null;
  }
}

export function PlanoDeAcaoClient() {
  const searchParams = useSearchParams();
  const saved = searchParams.get("saved");

  const [scores, setScores] = useState<MECAScores | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    const boot = readDashboardBootstrap();
    if (boot && (!saved || boot.id === saved)) {
      setScores(boot.scores);
      setLoading(false);
      return;
    }
    if (saved) {
      const offline = readOfflineRowForSaved(saved);
      if (offline) {
        setScores(diagnosticRowToMECAScores(offline));
        setLoading(false);
      }
    }
  }, [saved]);

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
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-4 px-6">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-[#1a3a5c]"
          aria-hidden
        />
        <p className="text-sm text-gray-600">A carregar o plano de ação…</p>
      </div>
    );
  }

  if (error && !scores) {
    return (
      <div className="ds-page flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <Link href="/dashboard" className="text-sm font-semibold text-[#1a3a5c]">
          Voltar ao dashboard
        </Link>
      </div>
    );
  }

  if (!scores || !plan) {
    return (
      <div className="ds-page flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center px-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Realize o diagnóstico primeiro
        </h1>
        <p className="max-w-md text-sm text-gray-600">
          Precisamos do seu resultado MECA para gerar um plano de ação
          personalizado a partir do seu pilar com menor pontuação.
        </p>
        <Link href="/assessment" className="ds-btn-primary">
          Iniciar diagnóstico
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-[#f8fafc] pb-16 pt-10">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-10 border-b border-gray-200 pb-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#4a90d9]">
            MECA · Plano de ação
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a3a5c] md:text-4xl">
            {plan.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-gray-700">
            {plan.description}
          </p>
        </div>

        {error && (
          <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error} — a mostrar dados em cache local quando disponíveis.
          </p>
        )}

        <section className="mb-10 rounded-2xl border border-[#1a3a5c]/15 bg-white p-6 shadow-sm md:p-8">
          <p className="text-lg font-semibold text-[#1a3a5c] md:text-xl">
            Seu principal ponto de alavancagem está em:{" "}
            <span className="text-[#4a90d9]">{plan.pillar}</span>
          </p>
          <p className="mt-2 text-sm text-gray-600">
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
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
            Ações recomendadas
          </h2>
          <ul className="space-y-3">
            {plan.actions.map((action, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1a3a5c] text-xs font-bold text-white"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-gray-800">
                  {action}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            ← Voltar ao dashboard
          </Link>
          <Link
            href="/assessment"
            className="inline-flex items-center justify-center rounded-xl bg-[#1a3a5c] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#152d45]"
          >
            Refazer diagnóstico
          </Link>
        </div>
      </div>
    </div>
  );
}
