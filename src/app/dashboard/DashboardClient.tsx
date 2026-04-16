"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { RadarChart } from "@/components/charts/RadarChart";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { PdfExportButton } from "@/components/PdfExportButton";
import type { GlobalBenchmarkInsights } from "@/lib/benchmark-insights";
import { BENCHMARK_SCORES, gapToBenchmark } from "@/lib/benchmark";
import type { DiagnosticResult, MetricKey } from "@/lib/types";
import { OFFLINE_RESULT_KEY_PREFIX } from "@/lib/meca-offline-result";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type ResponseRow = {
  id: string;
  user_id: string;
  created_at: string;
  mentalidade: number;
  engajamento: number;
  cultura: number;
  performance: number;
  direction: number;
  capacity: number;
  archetype: string;
};

const METRICS: { label: string; key: MetricKey }[] = [
  { label: "Mentalidade", key: "mentalidade" },
  { label: "Engajamento", key: "engajamento" },
  { label: "Cultura", key: "cultura" },
  { label: "Performance", key: "performance" },
  { label: "Direção", key: "direction" },
  { label: "Capacidade", key: "capacity" },
];

function rowToResult(r: ResponseRow): DiagnosticResult {
  return {
    mentalidade: Number(r.mentalidade),
    engajamento: Number(r.engajamento),
    cultura: Number(r.cultura),
    performance: Number(r.performance),
    direction: Number(r.direction),
    capacity: Number(r.capacity),
    archetype: r.archetype,
  };
}

function avgScore(r: ResponseRow): number {
  const v = rowToResult(r);
  return (
    (v.mentalidade +
      v.engajamento +
      v.cultura +
      v.performance +
      v.direction +
      v.capacity) /
    6
  );
}

function deltaLabel(delta: number): string {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `${delta}`;
  return "0";
}

function shortUser(id: string): string {
  return id.length > 10 ? `${id.slice(0, 8)}…` : id;
}

export function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const saved = searchParams.get("saved");
  const highlight = searchParams.get("highlight");

  const [rows, setRows] = useState<ResponseRow[] | null>(null);
  const [viewerRole, setViewerRole] = useState<"admin" | "user" | null>(null);
  const [benchmark, setBenchmark] =
    useState<typeof BENCHMARK_SCORES>(BENCHMARK_SCORES);
  const [globalInsights, setGlobalInsights] =
    useState<GlobalBenchmarkInsights | null>(null);
  const [adminBenchmarkIncomplete, setAdminBenchmarkIncomplete] =
    useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareWithId, setCompareWithId] = useState<string | null>(null);

  const isAdminViewer = viewerRole === "admin";

  async function signOut() {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const load = useCallback(async () => {
    setLoadError(null);
    setAdminBenchmarkIncomplete(false);
    setGlobalInsights(null);

    const hRes = await fetch("/api/user/history");
    const hJson = await hRes.json().catch(() => ({}));

    if (!hRes.ok || !hJson.ok) {
      const msg =
        typeof hJson.error === "string"
          ? hJson.error
          : "Falha ao carregar histórico.";
      const detail =
        typeof hJson.detail === "string" ? ` ${hJson.detail}` : "";
      setLoadError(`${msg}${detail}`);
      setRows([]);
      setViewerRole(null);
      return;
    }

    setRows(hJson.rows as ResponseRow[]);
    setViewerRole(hJson.viewer?.role === "admin" ? "admin" : "user");

    const bRes = await fetch("/api/benchmark");
    const bJson = await bRes.json().catch(() => ({}));

    if (hJson.viewer?.role === "admin" && bRes.status === 503) {
      setBenchmark(BENCHMARK_SCORES);
      setAdminBenchmarkIncomplete(true);
      return;
    }

    if (!bRes.ok || !bJson.ok) {
      setLoadError(
        typeof bJson.error === "string"
          ? bJson.error
          : "Falha ao carregar benchmark.",
      );
      return;
    }

    if (bJson.scores) {
      setBenchmark(bJson.scores);
    }
    if (bJson.viewer === "admin" && bJson.globalInsights) {
      setGlobalInsights(bJson.globalInsights as GlobalBenchmarkInsights);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Junta resultado guardado no browser quando o modo dev não usa Supabase. */
  useEffect(() => {
    if (rows === null || !saved || typeof window === "undefined") return;
    const raw = sessionStorage.getItem(`${OFFLINE_RESULT_KEY_PREFIX}${saved}`);
    if (!raw) return;
    try {
      const row = JSON.parse(raw) as ResponseRow;
      setRows((prev) => {
        if (!prev) return [row];
        if (prev.some((r) => r.id === row.id)) return prev;
        return [...prev, row];
      });
    } catch {
      /* ignore */
    }
  }, [rows, saved]);

  const sorted = useMemo(() => rows ?? [], [rows]);

  useEffect(() => {
    if (!sorted.length) return;
    const ids = new Set(sorted.map((r) => r.id));
    const prefer =
      saved && ids.has(saved)
        ? saved
        : highlight && ids.has(highlight)
          ? highlight
          : null;
    const latest = sorted[sorted.length - 1].id;
    setSelectedId((prev) => {
      if (prefer) return prefer;
      if (prev && ids.has(prev)) return prev;
      return latest;
    });
  }, [sorted, saved, highlight]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("saved");
      router.replace(`/dashboard${next.toString() ? `?${next}` : ""}`, {
        scroll: false,
      });
    }, 2000);
    return () => clearTimeout(t);
  }, [saved, router, searchParams]);

  const selected = useMemo(() => {
    if (!sorted.length || !selectedId) return null;
    return sorted.find((r) => r.id === selectedId) ?? sorted[sorted.length - 1];
  }, [sorted, selectedId]);

  const userRows = useMemo(() => {
    if (!sorted.length) return [];
    if (!isAdminViewer) return sorted;
    if (!selected) return [];
    return sorted.filter((r) => r.user_id === selected.user_id);
  }, [sorted, isAdminViewer, selected]);

  const current = selected ? rowToResult(selected) : null;
  useEffect(() => {
    if (!selected || !userRows.length) {
      setCompareWithId(null);
      return;
    }
    const candidates = userRows.filter((r) => r.id !== selected.id);
    if (!candidates.length) {
      setCompareWithId(null);
      return;
    }
    setCompareWithId((prev) => {
      if (prev && candidates.some((r) => r.id === prev)) return prev;
      const idx = userRows.findIndex((r) => r.id === selected.id);
      if (idx > 0) return userRows[idx - 1].id;
      return candidates[candidates.length - 1].id;
    });
  }, [selected, userRows]);

  const comparedRow = useMemo(() => {
    if (!compareWithId) return null;
    return userRows.find((r) => r.id === compareWithId) ?? null;
  }, [compareWithId, userRows]);

  const trendPoints = useMemo(() => {
    if (!userRows.length) return [];
    return userRows.map((r) => ({
      label: new Date(r.created_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      }),
      value: Math.round(avgScore(r)),
    }));
  }, [userRows]);

  if (loadError) {
    return (
      <div className="ds-page-narrow py-24 text-center">
        <p className="text-base text-red-600">{loadError}</p>
      </div>
    );
  }

  if (viewerRole && rows && rows.length === 0) {
    if (isAdminViewer) {
      return (
        <div className="ds-page-narrow flex min-h-[60vh] flex-col items-center justify-center space-y-8 text-center">
          <p className="text-sm text-gray-500">Modo administrador</p>
          <h2 className="ds-heading-xl text-balance">
            Ainda não há diagnósticos na base
          </h2>
          <p className="ds-body max-w-md">
            Quando existirem submissões, verá todos os registos aqui com insights
            globais.
          </p>
          <Link href="/assessment" className="ds-btn-primary">
            Executar diagnóstico (teste)
          </Link>
        </div>
      );
    }
    return (
      <div className="ds-page-narrow flex min-h-[60vh] flex-col items-center justify-center space-y-8 text-center">
        <h2 className="ds-heading-xl text-balance">O seu mapa ainda não existe</h2>
        <p className="ds-body max-w-md">
          Quando concluir o diagnóstico, tudo aparece aqui — claro e organizado.
        </p>
        <Link href="/assessment" className="ds-btn-primary">
          Iniciar diagnóstico
        </Link>
      </div>
    );
  }

  if (!rows || !current || !selected || !viewerRole) {
    return (
      <div className="ds-page flex min-h-[40vh] items-center justify-center">
        <p className="ds-body">A carregar…</p>
      </div>
    );
  }

  return (
    <div className="ds-page-narrow space-y-16 pb-24">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-sm text-gray-600 underline transition hover:text-gray-900"
        >
          Sair
        </button>
      </div>
      {saved && (
        <p className="text-center text-sm text-gray-600">
          Diagnóstico guardado. Pode exportar o relatório em PDF quando quiser.
        </p>
      )}

      {isAdminViewer && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-center text-sm text-gray-800">
          <strong className="font-medium">Modo administrador</strong>
          <span className="text-gray-600">
            {" "}
            — dados de todos os utilizadores; tendências por utilizador selecionado.
          </span>
          {adminBenchmarkIncomplete && (
            <span className="mt-2 block text-gray-600">
              Configure{" "}
              <code className="rounded bg-white px-1.5 py-0.5 text-xs text-gray-900">
                SUPABASE_SERVICE_ROLE_KEY
              </code>{" "}
              no servidor para insights globais completos.
            </span>
          )}
        </div>
      )}

      {isAdminViewer && globalInsights && (
        <section className="space-y-10">
          <div className="space-y-2 text-center">
            <h2 className="ds-heading">Insights globais</h2>
            <p className="ds-body text-sm">
              Agregados sobre todas as respostas na base.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="ds-card border border-gray-100">
              <p className="ds-small">Diagnósticos</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900">
                {globalInsights.responseCount}
              </p>
            </div>
            <div className="ds-card border border-gray-100">
              <p className="ds-small">Utilizadores únicos</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900">
                {globalInsights.uniqueUsers}
              </p>
            </div>
            <div className="ds-card border border-gray-100 sm:col-span-3 lg:col-span-1">
              <p className="ds-small">Arquétipos</p>
              <ul className="mt-3 space-y-1 text-sm text-gray-700">
                {Object.entries(globalInsights.archetypeDistribution).map(
                  ([k, v]) => (
                    <li key={k} className="flex justify-between gap-4">
                      <span>{k}</span>
                      <span className="tabular-nums text-gray-500">{v}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-center text-sm text-gray-500">
              Médias globais (0–100)
            </p>
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {METRICS.map(({ label, key }) => (
                <div
                  key={key}
                  className="flex items-center justify-between border-b border-gray-100 pb-3"
                >
                  <span className="text-sm text-gray-900">{label}</span>
                  <span className="text-sm font-semibold tabular-nums text-gray-900">
                    {Math.round(globalInsights.means[key])}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 1. Main insight */}
      <section className="space-y-6 text-center">
        <p className="text-sm text-gray-500">
          {isAdminViewer ? "Registo selecionado — arquétipo" : "Seu padrão dominante é"}
        </p>
        <h1 className="ds-heading-xl text-balance">{current.archetype}</h1>
        <p className="ds-body mx-auto max-w-md">
          {new Date(selected.created_at).toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          {isAdminViewer && (
            <span className="mt-2 block text-sm text-gray-500">
              Utilizador:{" "}
              <code className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-900">
                {shortUser(selected.user_id)}
              </code>
            </span>
          )}
        </p>
      </section>

      {/* 2. Chart */}
      <section className="space-y-6">
        <p className="text-center text-sm text-gray-500">Mapa das seis dimensões</p>
        <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-6 py-12">
          <RadarChart values={current} />
        </div>
      </section>

      {/* 3. Scores */}
      <section className="space-y-10">
        <h2 className="ds-heading text-center">Dimensões</h2>
        <div className="mx-auto max-w-lg space-y-6">
          {METRICS.map(({ label, key }) => {
            const score = current[key];
            const pct = Math.min(100, Math.max(0, score));
            return (
              <div key={key}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-gray-900">{label}</span>
                  <span className="text-lg font-semibold tabular-nums text-gray-900">
                    {Math.round(score)}
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gray-900 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Referência (compact) */}
      <section className="space-y-10">
        <div className="space-y-2 text-center">
          <h2 className="ds-heading">Referência de mercado</h2>
          <p className="ds-body text-sm">
            {isAdminViewer
              ? "Comparação do registo selecionado com o benchmark de referência."
              : "Contexto para o seu resultado."}
          </p>
        </div>
        <div className="mx-auto max-w-lg space-y-6">
          {METRICS.map(({ label, key }) => {
            const score = current[key];
            const bench = benchmark[key];
            const gap = gapToBenchmark(key, score);
            return (
              <div
                key={key}
                className="flex flex-col gap-1 border-b border-gray-100 pb-6 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm text-gray-900">{label}</span>
                <div className="text-right text-sm">
                  <span className="font-medium text-gray-900">{Math.round(score)}</span>
                  <span className="text-gray-500"> / {bench}</span>
                  <p className="mt-0.5 text-gray-500">
                    {gap > 0 ? "+" : ""}
                    {gap} vs referência
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {comparedRow && (
        <section className="space-y-10">
          <div className="space-y-2 text-center">
            <h2 className="ds-heading">Comparação entre diagnósticos</h2>
            <p className="ds-body text-sm">
              Escolha qual diagnóstico comparar com o atualmente selecionado.
            </p>
          </div>
          <div className="mx-auto max-w-lg">
            <label className="block text-left">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Comparar com
              </span>
              <select
                value={compareWithId ?? ""}
                onChange={(e) => setCompareWithId(e.target.value || null)}
                className="ds-input"
              >
                {userRows
                  .filter((r) => r.id !== selected.id)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {new Date(r.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <div className="mx-auto max-w-lg space-y-6">
            {METRICS.map(({ label, key }) => {
              const now = Math.round(current[key]);
              const prev = Math.round(Number(comparedRow[key]));
              const delta = now - prev;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between border-b border-gray-100 pb-4"
                >
                  <span className="text-sm text-gray-900">{label}</span>
                  <div className="text-right text-sm">
                    <p className="font-medium text-gray-900 tabular-nums">
                      {now} vs {prev}
                    </p>
                    <p
                      className={`tabular-nums ${
                        delta > 0
                          ? "text-emerald-600"
                          : delta < 0
                            ? "text-red-600"
                            : "text-gray-500"
                      }`}
                    >
                      {deltaLabel(delta)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Evolution */}
      {trendPoints.length >= 2 && (
        <section className="space-y-10">
          <div className="space-y-2 text-center">
            <h2 className="ds-heading">Evolução</h2>
            <p className="ds-body text-sm">
              {isAdminViewer
                ? `Índice médio — utilizador ${shortUser(selected.user_id)}.`
                : "Índice médio ao longo dos seus diagnósticos."}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-10 md:px-8">
            <TrendLineChart points={trendPoints} />
          </div>
        </section>
      )}

      {/* History */}
      <section className="space-y-8 border-t border-gray-100 pt-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="ds-heading">
            {isAdminViewer ? "Histórico" : "Histórico"}
          </h2>
          <PdfExportButton
            title={`MECA ${new Date(selected.created_at).toLocaleDateString("pt-BR")}`}
            result={current}
            benchmarkNote={Object.entries(benchmark)
              .map(([k, v]) => `${k}: ${v}`)
              .join("; ")}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {[...rows].reverse().map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedId(r.id)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                r.id === selectedId
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              {isAdminViewer && (
                <span className="mr-2 font-mono text-[0.65rem] text-gray-400">
                  {shortUser(r.user_id)}
                </span>
              )}
              {new Date(r.created_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </button>
          ))}
        </div>
      </section>

      <p className="text-center">
        <Link
          href="/assessment"
          className="text-sm text-gray-500 transition hover:text-gray-900"
        >
          Novo diagnóstico
        </Link>
      </p>
    </div>
  );
}
