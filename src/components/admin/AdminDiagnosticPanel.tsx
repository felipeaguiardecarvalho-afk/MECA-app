"use client";

import type { DiagnosticOverviewRow } from "@/types/admin-diagnostic";
import { useCallback, useEffect, useState } from "react";

export function AdminDiagnosticPanel() {
  const [rows, setRows] = useState<DiagnosticOverviewRow[]>([]);
  const [phase, setPhase] = useState<"loading" | "forbidden" | "ready">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/admin/diagnostic-overview");
    const json = await res.json().catch(() => ({}));
    if (res.status === 403) {
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
        setError(
          typeof json.error === "string" ? json.error : "Não foi possível liberar.",
        );
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

  return (
    <section className="border-b border-amber-200 bg-amber-50/80 px-6 py-8">
      <div className="mx-auto max-w-4xl">
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
                <th className="px-4 py-3 font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-gray-500"
                  >
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
                      {!r.can_take_diagnostic ? (
                        <button
                          type="button"
                          disabled={unlocking === r.user_id}
                          onClick={() => void unlock(r.user_id)}
                          className="rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-950 disabled:opacity-50"
                        >
                          {unlocking === r.user_id
                            ? "A liberar…"
                            : "Liberar novo diagnóstico"}
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
