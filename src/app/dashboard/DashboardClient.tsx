"use client";

/**
 * @deprecated Para a rota `/dashboard`, o produto usa **`MECADashboard`** em
 * `src/components/Dashboard/index.tsx` (ver `src/app/dashboard/page.tsx`).
 * Mantido para referência / reutilização futura; não está montado na árvore atual.
 */
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { RadarChart } from "@/components/charts/RadarChart";
import { TrendLineChart } from "@/components/charts/TrendLineChart";
import { PdfExportButton } from "@/components/PdfExportButton";
import { DiagnosticTabs } from "@/components/DiagnosticTabs";
import { ComparisonSelector } from "@/components/ComparisonSelector";
import type { GlobalBenchmarkInsights } from "@/lib/benchmark-insights";
import { BENCHMARK_SCORES, gapToBenchmark } from "@/lib/benchmark";
import type { DiagnosticResult, MetricKey } from "@/lib/types";
import { logger } from "@/lib/logger";
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

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

const HISTORY_PAGE_SIZE = 100;
const MAX_ADMIN_HISTORY_PAGES = 500;

export function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const saved = searchParams.get("saved");
  const highlight = searchParams.get("highlight");

  const [rows, setRows] = useState<ResponseRow[]>([]);
  const [viewerRole, setViewerRole] = useState<"admin" | "user">("user");
  /** False until first `load()` attempt finishes (success or failure). */
  const [initialized, setInitialized] = useState(false);
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

  // ── Data fetching ──────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoadError(null);
    setAdminBenchmarkIncomplete(false);
    setGlobalInsights(null);

    try {
      const firstRes = await fetch(
        `/api/user/history?page=1&pageSize=${HISTORY_PAGE_SIZE}`,
      );
      const hJson = (await firstRes.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;

      if (!firstRes.ok || !hJson.ok) {
        const err = hJson.error;
        const detail = hJson.detail;
        const msg =
          err === "mfa_required" && typeof detail === "string"
            ? detail
            : typeof err === "string"
              ? `${err}${typeof detail === "string" ? ` ${detail}` : ""}`
              : "Falha ao carregar histórico.";
        setLoadError(msg);
        setRows([]);
        setViewerRole("user");
        return;
      }

      const viewer = hJson.viewer as { role?: string } | undefined;
      const role = viewer?.role === "admin" ? "admin" : "user";

      let merged: ResponseRow[] = Array.isArray(hJson.rows)
        ? ([...hJson.rows] as ResponseRow[])
        : [];

      const pag = hJson.pagination as
        | { hasMore?: boolean }
        | undefined;
      if (role === "admin" && pag?.hasMore) {
        let page = 2;
        let hasMore = true;
        while (hasMore && page <= MAX_ADMIN_HISTORY_PAGES) {
          const r = await fetch(
            `/api/user/history?page=${page}&pageSize=${HISTORY_PAGE_SIZE}`,
          );
          const j = (await r.json().catch(() => ({}))) as Record<
            string,
            unknown
          >;
          if (!r.ok || !j.ok) break;
          if (Array.isArray(j.rows)) {
            merged = merged.concat(j.rows as ResponseRow[]);
          }
          hasMore = Boolean(
            (j.pagination as { hasMore?: boolean } | undefined)?.hasMore,
          );
          if (!hasMore) break;
          page++;
        }
      }

      setRows(merged);
      setViewerRole(role);

      const bRes = await fetch("/api/benchmark");
      const bJson = await bRes.json().catch(() => ({}));

      if (role === "admin" && bRes.status === 503) {
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
    } catch (err) {
      logger.error("[DashboardClient] load error", err);
      setLoadError("Não foi possível carregar o dashboard.");
      setRows([]);
      setViewerRole("user");
    } finally {
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // ── Derived state ──────────────────────────────────────────────────

  /** Rows sorted chronologically ASC (oldest first → trend chart reads left-to-right). */
  const sorted = useMemo(() => {
    const list = Array.isArray(rows) ? rows : [];
    return [...list].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }, [rows]);

  /** Default-select the latest (or preferred) diagnostic. */
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

  /** Clear ?saved from URL after brief toast. */
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
    if (!sorted.length) return null;
    if (selectedId) {
      return (
        sorted.find((r) => r.id === selectedId) ??
        sorted[sorted.length - 1] ??
        null
      );
    }
    return sorted[sorted.length - 1] ?? null;
  }, [sorted, selectedId]);

  /** Rows belonging to the same user as the selected diagnostic. */
  const userRows = useMemo(() => {
    if (!sorted.length) return [];
    if (!isAdminViewer) return sorted;
    if (!selected) return [];
    return sorted.filter((r) => r.user_id === selected.user_id);
  }, [sorted, isAdminViewer, selected]);

  const current = useMemo(
    () => (selected ? rowToResult(selected) : null),
    [selected],
  );

  /** Reset comparison when the primary selection changes. */
  useEffect(() => {
    setCompareWithId(null);
  }, [selectedId]);

  const comparedRow = useMemo(() => {
    if (!compareWithId) return null;
    return userRows.find((r) => r.id === compareWithId) ?? null;
  }, [compareWithId, userRows]);

  const comparedResult = useMemo(
    () => (comparedRow ? rowToResult(comparedRow) : null),
    [comparedRow],
  );

  /** Candidates available for comparison (same user, excluding the selected one). */
  const compareCandidates = useMemo(
    () => userRows.filter((r) => r.id !== selected?.id),
    [userRows, selected?.id],
  );

  const radarLegend = useMemo(() => {
    if (!comparedRow || !selected) return undefined;
    return [
      { label: shortDate(selected.created_at), color: "#171717" },
      { label: shortDate(comparedRow.created_at), color: "#4f46e5" },
    ] as [{ label: string; color: string }, { label: string; color: string }];
  }, [selected, comparedRow]);

  const trendPoints = useMemo(() => {
    if (!userRows.length) return [];
    return userRows.map((r) => ({
      label: shortDate(r.created_at),
      value: Math.round(avgScore(r)),
    }));
  }, [userRows]);

  // ── Early returns ──────────────────────────────────────────────────

  if (!initialized) {
    return (
      <div className="ds-page flex min-h-[40vh] items-center justify-center">
        <p className="ds-body">A carregar…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="ds-page-narrow py-24 text-center">
        <p className="text-base text-red-600">{loadError}</p>
      </div>
    );
  }

  if (rows.length === 0) {
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

  if (!selected || !current) {
    return (
      <div className="ds-page flex min-h-[40vh] items-center justify-center p-6">
        <p className="ds-body">Selecionando diagnóstico…</p>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────

  return (
    <div className="ds-page-narrow space-y-16 pb-24">
      {/* Header: PDF export + sign out */}
      <div className="flex items-center justify-between gap-4">
        <PdfExportButton
          title={`MECA ${new Date(selected?.created_at ?? 0).toLocaleDateString("pt-BR")}`}
          result={current}
          benchmarkNote={Object.entries(benchmark ?? {})
            .map(([k, v]) => `${k}: ${v}`)
            .join("; ")}
        />
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

      {/* Admin banner */}
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

      {/* Admin: global insights */}
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
                {Object.entries(globalInsights.archetypeDistribution ?? {}).map(
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
                    {Math.round(Number(globalInsights.means?.[key] ?? 0))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TOP: Diagnostic tabs ─────────────────────────────────── */}
      {sorted.length > 1 && (
        <section className="space-y-3">
          <p className="text-center text-sm text-gray-500">
            {isAdminViewer ? "Todos os diagnósticos" : "Seus diagnósticos"}
          </p>
          <DiagnosticTabs
            diagnostics={sorted}
            selectedId={selected?.id ?? ""}
            onChange={(id) => {
              setSelectedId(id);
            }}
          />
        </section>
      )}

      {/* 1. Main insight */}
      <section className="space-y-6 text-center">
        <p className="text-sm text-gray-500">
          {isAdminViewer ? "Registo selecionado — arquétipo" : "Seu padrão dominante é"}
        </p>
        <h1 className="ds-heading-xl text-balance">{current.archetype}</h1>
        <p className="ds-body mx-auto max-w-md">
          {new Date(selected?.created_at ?? 0).toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          {isAdminViewer && (
            <span className="mt-2 block text-sm text-gray-500">
              Utilizador:{" "}
              <code className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-900">
                {shortUser(selected?.user_id ?? "")}
              </code>
            </span>
          )}
        </p>
      </section>

      {/* ── MIDDLE: Comparison selector ──────────────────────────── */}
      {compareCandidates.length > 0 && (
        <section className="mx-auto max-w-lg">
          <ComparisonSelector
            candidates={compareCandidates}
            compareWithId={compareWithId}
            onChange={setCompareWithId}
          />
        </section>
      )}

      {/* 2. Radar chart (single or comparison overlay) */}
      <section className="space-y-6">
        <p className="text-center text-sm text-gray-500">Mapa das seis dimensões</p>
        <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-6 py-12">
          <RadarChart
            values={current}
            compareValues={comparedResult}
            legend={radarLegend}
          />
        </div>
      </section>

      {/* 3. Dimension scores */}
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

      {/* 4. Benchmark reference */}
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

      {/* 5. Comparison delta table (only when comparing) */}
      {comparedRow && (
        <section className="space-y-10">
          <div className="space-y-2 text-center">
            <h2 className="ds-heading">Comparação detalhada</h2>
            <p className="ds-body text-sm">
              Diferença entre{" "}
              <strong className="font-medium text-gray-900">{shortDate(selected?.created_at ?? "")}</strong>
              {" "}e{" "}
              <strong className="font-medium text-indigo-600">{shortDate(comparedRow.created_at)}</strong>.
            </p>
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
                    <p className="font-medium tabular-nums text-gray-900">
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

      {/* 6. Evolution trend */}
      {trendPoints.length >= 2 && (
        <section className="space-y-10">
          <div className="space-y-2 text-center">
            <h2 className="ds-heading">Evolução</h2>
            <p className="ds-body text-sm">
              {isAdminViewer
                ? `Índice médio — utilizador ${shortUser(selected?.user_id ?? "")}.`
                : "Índice médio ao longo dos seus diagnósticos."}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-10 md:px-8">
            <TrendLineChart points={trendPoints} />
          </div>
        </section>
      )}

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
