"use client";

/**
 * Dados do dashboard: apenas `GET /api/user/history` e estado React.
 * Não persistir pontuações nem linhas de diagnóstico em armazenamento do
 * navegador — ver `no-browser-storage.test.ts`.
 */

import { logger } from "@/lib/logger";
import { diagnosticRowToMECAScores } from "@/lib/meca-scores";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArchetypeCard } from "./ArchetypeCard";
import { ArchetypeMatrix } from "./ArchetypeMatrix";
import { MECARadarChart } from "./RadarChart";
import { DiagnosticSelector } from "./DiagnosticSelector";
import { ComparisonView } from "./ComparisonView";
import { UserSelector, type AdminUserOption } from "./UserSelector";
import Link from "next/link";
import { getArchetype, type MECAScores } from "@/lib/archetypes";
import { PremiumDiagnostic } from "../PremiumDiagnostic";

type HistoryRow = {
  id: string;
  user_id: string;
  created_at: string;
  mentalidade: number;
  engajamento: number;
  cultura: number;
  performance: number;
};

type ViewerRole = "admin" | "user" | null;

type HistoryResponse = {
  ok?: boolean;
  rows?: HistoryRow[];
  viewer?: { role?: "admin" | "user" };
  error?: string;
  detail?: string;
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    hasMore: boolean;
  };
};

const HISTORY_PAGE_SIZE = 100;
const MAX_ADMIN_HISTORY_PAGES = 500;

function historyLoadErrorMessage(data: HistoryResponse): string {
  if (data.error === "mfa_required") {
    return (
      data.detail ??
      "Conclua o segundo fator (MFA) na sua conta antes de aceder ao modo admin."
    );
  }
  if (typeof data.error === "string") {
    return data.detail ? `${data.error}: ${data.detail}` : data.error;
  }
  return "Falha ao carregar o histórico.";
}

type AdminOverviewResponse = {
  ok?: boolean;
  rows?: Array<{ user_id: string; email: string | null; response_count: number }>;
  error?: string;
};

function rowToScores(row: HistoryRow): MECAScores {
  return diagnosticRowToMECAScores(row);
}

function normalizeAdminUsers(
  rows: Array<{ user_id: string; email: string | null; response_count: number }>,
): AdminUserOption[] {
  const map = new Map<string, AdminUserOption>();
  for (const row of rows) {
    const current = map.get(row.user_id);
    const diagnosticsCount = Number(row.response_count) || 0;
    if (!current) {
      map.set(row.user_id, {
        user_id: row.user_id,
        email: row.email ?? "sem-email@local",
        diagnosticsCount,
      });
      continue;
    }
    map.set(row.user_id, {
      user_id: row.user_id,
      email: current.email === "sem-email@local" && row.email ? row.email : current.email,
      diagnosticsCount: Math.max(current.diagnosticsCount, diagnosticsCount),
    });
  }

  return [...map.values()].sort((a, b) => {
    if (b.diagnosticsCount !== a.diagnosticsCount) {
      return b.diagnosticsCount - a.diagnosticsCount;
    }
    return a.email.localeCompare(b.email);
  });
}

const EmptyNotFound: React.FC<{ onStart?: () => void }> = ({ onStart }) => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 px-4 py-12 text-center sm:min-h-[60vh] sm:gap-6 sm:py-16">
    <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-[#f0f6ff] text-[32px]">
      ◆
    </div>
    <div className="space-y-2">
      <h2 className="text-balance text-2xl font-extrabold text-[#1a3a5c] sm:text-3xl">
        Diagnóstico não encontrado
      </h2>
      <p className="mx-auto max-w-sm text-base leading-relaxed text-gray-600 sm:max-w-md sm:text-lg">
        Não há resultados guardados. Complete o diagnóstico para ver o seu
        perfil MECA.
      </p>
    </div>
    <button
      type="button"
      onClick={onStart}
      className="ds-btn-primary inline-flex cursor-pointer items-center justify-center text-sm sm:text-base"
    >
      Iniciar Diagnóstico →
    </button>
  </div>
);

const LoadingState: React.FC = () => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center gap-8 px-4 sm:min-h-[60vh]">
    <div className="w-full max-w-md space-y-4" aria-busy aria-label="A carregar">
      <div className="h-8 w-48 animate-shimmer rounded-xl" />
      <div className="h-40 w-full animate-shimmer rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-32 animate-shimmer rounded-2xl" />
        <div className="h-32 animate-shimmer rounded-2xl" />
      </div>
    </div>
    <p className="text-sm font-medium text-slate-500">A carregar o seu resultado…</p>
  </div>
);

export const MECADashboard: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const saved = searchParams.get("saved");

  const [allRows, setAllRows] = useState<HistoryRow[]>([]);
  const [scores, setScores] = useState<MECAScores | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewerRole, setViewerRole] = useState<ViewerRole>(null);
  const [users, setUsers] = useState<AdminUserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Avoid re-forcing selection on every history refetch when `?saved=` is stable. */
  const appliedSavedIdRef = useRef<string | null>(null);

  const isAdmin = viewerRole === "admin";

  const activeRows = useMemo(() => {
    if (!isAdmin) return allRows;
    if (!selectedUserId) return [];
    return allRows.filter((row) => row.user_id === selectedUserId);
  }, [allRows, isAdmin, selectedUserId]);

  /** Active rows sorted newest-first for the selector. */
  const sortedRows = useMemo(
    () =>
      [...activeRows].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [activeRows],
  );

  /** Auto-select: if user hasn't picked yet or rows changed, default to latest (+ previous if 2+). */
  const applyDefaultSelection = useCallback(
    (rows: HistoryRow[]) => {
      if (rows.length === 0) return;
      const sorted = [...rows].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      if (sorted.length === 1) {
        setSelectedIds([sorted[0].id]);
      } else {
        setSelectedIds([sorted[0].id, sorted[1].id]);
      }
    },
    [],
  );

  const fetchHistory = useCallback(async () => {
    setError(null);
    try {
      const firstRes = await fetch(
        `/api/user/history?page=1&pageSize=${HISTORY_PAGE_SIZE}`,
        { cache: "no-store" },
      );
      const data = (await firstRes.json().catch(() => ({}))) as HistoryResponse;

      if (!firstRes.ok || !data.ok) {
        setError(historyLoadErrorMessage(data));
        return;
      }

      const role: ViewerRole = data.viewer?.role === "admin" ? "admin" : "user";
      let rows = (data.rows ?? []) as HistoryRow[];

      if (role === "admin" && data.pagination?.hasMore) {
        let page = 2;
        let hasMore = true;
        while (hasMore && page <= MAX_ADMIN_HISTORY_PAGES) {
          const r = await fetch(
            `/api/user/history?page=${page}&pageSize=${HISTORY_PAGE_SIZE}`,
            { cache: "no-store" },
          );
          const j = (await r.json().catch(() => ({}))) as HistoryResponse;
          if (!r.ok || !j.ok) break;
          rows = rows.concat((j.rows ?? []) as HistoryRow[]);
          hasMore = Boolean(j.pagination?.hasMore);
          if (!hasMore) break;
          page++;
        }
      }

      if (process.env.NODE_ENV === "development") {
        logger.debug("[MECADashboard] /api/user/history", {
          ok: data.ok,
          rowCount: rows.length,
          role,
        });
      }
      setViewerRole(role);
      setAllRows(rows);
      setError(null);

      if (role === "admin") {
        setScores(null);
        const adminRes = await fetch("/api/admin/diagnostic-overview", {
          cache: "no-store",
        });
        const adminData = (await adminRes.json().catch(() => ({}))) as AdminOverviewResponse;
        if (adminRes.ok && adminData.ok && adminData.rows) {
          setUsers(normalizeAdminUsers(adminData.rows));
        } else {
          setUsers([]);
        }
      } else {
        setUsers([]);
        setSelectedUserId(null);
      }

      if (rows.length > 0 && role !== "admin") {
        const latest = [...rows].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0];
        setScores(diagnosticRowToMECAScores(latest));
        setError(null);
      }
    } catch (err) {
      logger.error("[MECADashboard] fetchHistory", err);
      setError("Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  /** Admin defaults to first user in ordered list. */
  useEffect(() => {
    if (!isAdmin) return;
    if (!users.length) return;
    if (selectedUserId && users.some((u) => u.user_id === selectedUserId)) return;
    setSelectedUserId(users[0].user_id);
  }, [isAdmin, users, selectedUserId]);

  /** Reset + auto-select diagnostics when the active user changes. */
  useEffect(() => {
    if (!isAdmin) return;
    if (!selectedUserId) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds([]);
    applyDefaultSelection(activeRows);
  }, [isAdmin, selectedUserId, activeRows, applyDefaultSelection]);

  /** Keep normal-user selection behavior unchanged. */
  useEffect(() => {
    if (isAdmin) return;
    if (activeRows.length > 0 && selectedIds.length === 0) {
      if (saved && activeRows.some((r) => r.id === saved)) return;
      applyDefaultSelection(activeRows);
    }
  }, [isAdmin, activeRows, selectedIds.length, applyDefaultSelection, saved]);

  useEffect(() => {
    if (!saved) appliedSavedIdRef.current = null;
  }, [saved]);

  /**
   * After assessment, `/dashboard?saved=<responseId>` — select that row from
   * API-loaded history (no browser storage).
   */
  useEffect(() => {
    if (isAdmin) return;
    if (loading) return;
    if (!saved) return;
    const hit = activeRows.find((r) => r.id === saved);
    if (!hit) return;
    if (appliedSavedIdRef.current === saved) return;
    appliedSavedIdRef.current = saved;
    setSelectedIds([saved]);
    setScores(diagnosticRowToMECAScores(hit));
  }, [isAdmin, loading, saved, activeRows]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory, saved]);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") {
        void fetchHistory();
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchHistory]);

  /** Toggle a diagnostic in the selection (max 2). */
  const handleToggle = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        let next: string[];
        if (prev.includes(id)) {
          if (prev.length === 1) {
            next = prev;
          } else {
            next = prev.filter((x) => x !== id);
          }
        } else if (prev.length < 2) {
          next = [...prev, id];
        } else {
          next = [prev[1], id];
        }
        return next;
      });
    },
    [],
  );

  const handleClearComparison = useCallback(() => {
    if (sortedRows.length > 0) {
      setSelectedIds([sortedRows[0].id]);
    }
  }, [sortedRows]);

  /** Compute data for comparison or single view. */
  const selectedDiagnostics = useMemo(() => {
    return selectedIds
      .map((id) => activeRows.find((r) => r.id === id))
      .filter((r): r is HistoryRow => r != null)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
  }, [selectedIds, activeRows]);

  const isSafeComparison = useMemo(() => {
    if (!isAdmin || !selectedUserId) return true;
    return selectedDiagnostics.every((d) => d.user_id === selectedUserId);
  }, [isAdmin, selectedUserId, selectedDiagnostics]);

  const isComparing = selectedDiagnostics.length === 2 && isSafeComparison;

  /** For single view, use the selected (or latest) diagnostic. */
  const primaryScores = useMemo(() => {
    if (isAdmin && !selectedUserId) return null;
    if (selectedDiagnostics.length > 0) {
      return rowToScores(selectedDiagnostics[selectedDiagnostics.length - 1]);
    }
    if (sortedRows.length > 0) {
      return rowToScores(sortedRows[0]);
    }
    return scores;
  }, [isAdmin, selectedUserId, selectedDiagnostics, sortedRows, scores]);

  const archetype = useMemo(
    () => (primaryScores ? getArchetype(primaryScores) : null),
    [primaryScores],
  );

  const selectedUser = useMemo(
    () => users.find((u) => u.user_id === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  if (loading && !scores) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] w-full bg-gradient-to-b from-slate-50/90 via-white to-indigo-50/25">
        <LoadingState />
      </div>
    );
  }

  if (error && !scores) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] w-full items-center justify-center bg-[#f8fafc] px-4 py-12">
        <p className="max-w-lg text-center text-base text-red-800 sm:text-lg">{error}</p>
      </div>
    );
  }

  if (isAdmin && users.length === 0 && !loading) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] w-full bg-[#f8fafc] py-10 sm:py-12 lg:py-16">
        <div className="container-meca">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <h2 className="text-balance text-xl font-bold text-[#1a3a5c] sm:text-2xl lg:text-3xl">
            Nenhum usuário disponível
          </h2>
          <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-gray-600 sm:text-lg">
            Não há usuários com diagnósticos para exibir no modo administrador.
          </p>
          </div>
        </div>
      </div>
    );
  }

  if (isAdmin && !selectedUserId) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] w-full space-y-6 bg-[#f8fafc] py-8 sm:space-y-8 sm:py-10 lg:py-12">
        <div className="container-meca">
          <UserSelector
            users={users}
            selectedUserId={selectedUserId}
            onSelect={setSelectedUserId}
          />
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-600 shadow-sm sm:p-8">
            Selecione um usuário para visualizar os diagnósticos
          </div>
        </div>
      </div>
    );
  }

  if (!primaryScores || !archetype) {
    return (
      <div className="min-h-[calc(100dvh-4rem)] w-full bg-[#f8fafc]">
        <EmptyNotFound
          onStart={() => {
            window.location.href = "/assessment";
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] w-full bg-gradient-to-b from-slate-50/90 via-white to-indigo-50/25 font-sans">
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2.5 text-center text-xs text-red-900 sm:px-6 sm:text-sm">
          {error} — a mostrar os dados já carregados do servidor nesta página.
        </div>
      )}

      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f2744] via-[#1a3a5c] to-[#1e3a8a] pb-0 pt-8 sm:pt-10 lg:pt-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 80% 0%, rgba(99,102,241,0.35), transparent), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(59,130,246,0.2), transparent)",
          }}
        />
        <div className="container-meca relative z-[1] space-y-2 sm:space-y-2.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4a90d9] sm:text-sm">
            {isComparing ? "Comparando Diagnósticos" : "Resultado do Diagnóstico"}
          </div>
          <h1 className="text-balance text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl xl:text-5xl">
            {isComparing ? "Evolução MECA" : "Seu Perfil MECA"}
          </h1>
          <p className="max-w-2xl pb-5 text-sm leading-relaxed text-white/60 sm:text-base lg:pb-6 lg:text-lg">
            {isComparing
              ? "Compare dois momentos do seu diagnóstico"
              : "Baseado em 60 perguntas · 20 teorias científicas · 4 pilares"}
          </p>
          {isAdmin && selectedUser && (
            <p className="break-words pb-5 text-xs text-white/80 sm:text-sm lg:pb-6">
              Usuário: {selectedUser.email} ({selectedUser.diagnosticsCount}{" "}
              {selectedUser.diagnosticsCount === 1 ? "diagnóstico" : "diagnósticos"})
            </p>
          )}
          {!isComparing && (
            <div
              className="inline-flex items-center gap-2 rounded-t-lg px-3 py-2 sm:gap-2 sm:px-4"
              style={{ background: archetype.bgColor }}
            >
              <span className="text-xs font-bold text-[#1a3a5c] sm:text-sm">
                {archetype.icon} {archetype.name}
                <span className="ml-2 opacity-70">· {archetype.zoneLabel}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="container-meca space-y-6 py-8 sm:space-y-8 sm:py-10 lg:space-y-10 lg:py-12 xl:py-14">
        {isAdmin && (
          <UserSelector
            users={users}
            selectedUserId={selectedUserId}
            onSelect={setSelectedUserId}
          />
        )}

        {/* Diagnostic selector — only shown when 2+ diagnostics */}
        {sortedRows.length >= 2 && (
          <DiagnosticSelector
            diagnostics={sortedRows}
            selectedIds={selectedIds}
            onToggle={handleToggle}
            onClear={handleClearComparison}
          />
        )}

        {!isSafeComparison ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600 sm:p-8 sm:text-base">
            Não foi possível comparar diagnósticos de usuários diferentes.
          </div>
        ) : isComparing ? (
          /* ── Comparison view ────────────────────────────────── */
          <ComparisonView
            older={{
              id: selectedDiagnostics[0].id,
              created_at: selectedDiagnostics[0].created_at,
              scores: rowToScores(selectedDiagnostics[0]),
            }}
            newer={{
              id: selectedDiagnostics[1].id,
              created_at: selectedDiagnostics[1].created_at,
              scores: rowToScores(selectedDiagnostics[1]),
            }}
          />
        ) : (
          /* ── Single diagnostic view (original) ──────────────── */
          <>
            <div className="mb-6 grid min-w-0 grid-cols-1 gap-6 sm:gap-8 lg:mb-8 lg:grid-cols-2 lg:gap-8 xl:gap-10">
              <div className="ds-card ds-card-interactive min-w-0 p-5 sm:p-6 lg:p-7">
                <MECARadarChart scores={primaryScores} />
              </div>
              <div className="ds-card ds-card-interactive min-w-0 p-5 sm:p-6 lg:p-7">
                <ArchetypeMatrix archetype={archetype} />
              </div>
            </div>
            <div className="mx-auto flex min-w-0 w-full max-w-full flex-col gap-6 sm:max-w-2xl lg:max-w-4xl">
              <div className="flex justify-end">
                <Link href="/fundamentos" className="ds-btn-secondary inline-flex items-center text-sm">
                  Ver fundamentos
                </Link>
              </div>
              <ArchetypeCard
                archetype={archetype}
                scores={primaryScores}
                onActionPlan={() => {
                  const q = saved ? `?saved=${encodeURIComponent(saved)}` : "";
                  router.push(`/plano-de-acao${q}`);
                }}
              />
              {selectedDiagnostics.length > 0 && (
                <PremiumDiagnostic
                  responseId={selectedDiagnostics[selectedDiagnostics.length - 1].id}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MECADashboard;
