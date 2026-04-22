"use client";

import type { DiagnosticOverviewRow } from "@/types/admin-diagnostic";
import type { UserResponseRow } from "@/app/api/admin/user-responses/route";
import { useCallback, useEffect, useRef, useState } from "react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ResponseDropdown({
  userId,
  email,
  responseCount,
  generatingPdf,
  onGenerate,
}: {
  userId: string;
  email: string | null;
  responseCount: number;
  generatingPdf: string | null;
  onGenerate: (userId: string, email: string | null, responseId?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [responses, setResponses] = useState<UserResponseRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  async function fetchResponses() {
    if (responses) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/user-responses?user_id=${encodeURIComponent(userId)}`);
      const json = await res.json();
      if (json.ok) setResponses(json.rows as UserResponseRow[]);
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    if (responseCount === 1) {
      // Only one diagnostic — generate directly without dropdown
      onGenerate(userId, email);
      return;
    }
    setOpen((v) => !v);
    void fetchResponses();
  }

  const isGenerating = generatingPdf === userId || generatingPdf?.startsWith(`${userId}:`);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        disabled={!!isGenerating}
        onClick={handleOpen}
        className="rounded-lg bg-[#1a3a5c] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#152d45] disabled:opacity-50"
      >
        {isGenerating ? "Gerando…" : "Gerar Relatório PDF"}
        {responseCount > 1 && !isGenerating && (
          <span className="ml-1.5 opacity-70">▾</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-72 rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-3 py-2 text-xs font-bold uppercase tracking-wide text-gray-500">
            Selecionar diagnóstico
          </div>
          {loading ? (
            <div className="px-3 py-4 text-center text-xs text-gray-400">Carregando…</div>
          ) : responses && responses.length > 0 ? (
            <ul className="max-h-64 overflow-y-auto py-1">
              {responses.map((r, idx) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onGenerate(userId, email, r.id);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50"
                  >
                    <div>
                      <div className="text-xs font-semibold text-gray-700">
                        {idx === 0 ? "Mais recente" : `Diagnóstico ${responses.length - idx}`}
                      </div>
                      <div className="text-xs text-gray-400">{formatDate(r.created_at)}</div>
                    </div>
                    <div className="ml-2 shrink-0 text-right text-xs tabular-nums text-gray-500">
                      <div>M {r.mentalidade} · E {r.engajamento}</div>
                      <div>C {r.cultura} · A {r.performance}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-4 text-center text-xs text-gray-400">Sem diagnósticos.</div>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminDiagnosticPanel() {
  const [rows, setRows] = useState<DiagnosticOverviewRow[]>([]);
  const [phase, setPhase] = useState<
    "loading" | "forbidden" | "mfa_required" | "ready"
  >("loading");
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/admin/diagnostic-overview");
    const json = await res.json().catch(() => ({}));
    if (res.status === 403 || res.status === 401) {
      // `mfa_required` still comes back as 403; distinguish via `error` code so
      // the master admin sees an actionable message instead of a silent hide.
      if (json?.error === "mfa_required") {
        setPhase("mfa_required");
        return;
      }
      setPhase("forbidden");
      return;
    }
    if (!res.ok || !json.ok) {
      setPhase("ready");
      setError(typeof json.error === "string" ? json.error : "Falha ao carregar.");
      setRows([]);
      return;
    }
    setRows((json.rows as DiagnosticOverviewRow[]) ?? []);
    setPhase("ready");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function generatePdf(userId: string, email: string | null, responseId?: string) {
    const key = responseId ? `${userId}:${responseId}` : userId;
    setGeneratingPdf(key);
    setError(null);
    try {
      let url = `/api/report/generate?user_id=${encodeURIComponent(userId)}`;
      if (responseId) url += `&response_id=${encodeURIComponent(responseId)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(typeof json.error === "string" ? json.error : "Não foi possível gerar o PDF.");
        return;
      }
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName = (email ?? userId).replace(/[^a-z0-9]/gi, "_").toLowerCase();
      a.href = objUrl;
      a.download = `relatorio-meca-${safeName}.pdf`;
      a.click();
      URL.revokeObjectURL(objUrl);
    } finally {
      setGeneratingPdf(null);
    }
  }

  async function unlock(userId: string) {
    setUnlocking(userId);
    setError(null);
    try {
      const res = await fetch("/api/admin/unlock-diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(typeof json.error === "string" ? json.error : "Não foi possível liberar.");
        return;
      }
      await load();
    } finally {
      setUnlocking(null);
    }
  }

  if (phase === "loading" || phase === "forbidden") {
    return null;
  }

  if (phase === "mfa_required") {
    return (
      <section className="border-b border-red-200 bg-red-50/80 py-6 sm:py-8">
        <div className="container-meca">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-red-900 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              MFA obrigatório
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wide text-red-900">
              Autenticação de dois fatores necessária
            </h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-red-950/90">
            O painel administrativo só é acessível a partir de sessões verificadas
            com um segundo fator (TOTP). Registe um autenticador ou faça o desafio
            para elevar esta sessão a AAL2.
          </p>
          <div className="mt-3">
            <a
              href="/account/mfa"
              className="inline-flex items-center rounded-lg bg-red-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-950"
            >
              Configurar MFA
            </a>
          </div>
          <p className="mt-3 text-xs text-red-900/70">
            Enquanto AAL2 não estiver presente, todas as rotas
            <code className="mx-1 rounded bg-red-100 px-1 py-0.5 text-[11px]">/api/admin/*</code>
            respondem <strong>403 mfa_required</strong>.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-amber-200 bg-amber-50/80 py-6 sm:py-8">
      <div className="container-meca">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-amber-900 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            Modo Admin
          </span>
          <h2 className="text-sm font-bold uppercase tracking-wide text-amber-900">
            Diagnósticos — todos os utilizadores
          </h2>
        </div>
        <p className="mt-2 text-sm text-amber-950/80">
          Lista de quem tem código de acesso. Use &quot;Liberar novo diagnóstico&quot;
          para permitir um novo envio.
        </p>
        {error && (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <div className="mt-4 overflow-x-auto rounded-xl border border-amber-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="px-4 py-3 font-semibold">E-mail</th>
                <th className="px-4 py-3 font-semibold">Respostas</th>
                <th className="px-4 py-3 font-semibold">Pode refazer</th>
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">Relatório</th>
                <th className="px-4 py-3 font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    Nenhum acesso registado.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.user_id} className="border-b border-gray-100">
                    <td className="px-4 py-3 text-gray-900">
                      {r.email ?? `${r.user_id.slice(0, 8)}…`}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-700">
                      {r.response_count}
                    </td>
                    <td className="px-4 py-3">
                      {r.can_take_diagnostic ? (
                        <span className="text-green-700">Sim</span>
                      ) : (
                        <span className="text-gray-600">Não</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {r.code}
                    </td>
                    <td className="px-4 py-3">
                      {r.response_count > 0 ? (
                        <ResponseDropdown
                          userId={r.user_id}
                          email={r.email}
                          responseCount={r.response_count}
                          generatingPdf={generatingPdf}
                          onGenerate={generatePdf}
                        />
                      ) : (
                        <span className="text-xs text-gray-400">Sem diagnóstico</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!r.can_take_diagnostic ? (
                        <button
                          type="button"
                          disabled={unlocking === r.user_id}
                          onClick={() => void unlock(r.user_id)}
                          className="rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-950 disabled:opacity-50"
                        >
                          {unlocking === r.user_id ? "A liberar…" : "Liberar novo diagnóstico"}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
