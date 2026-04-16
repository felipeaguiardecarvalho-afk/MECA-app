"use client";

import {
  clearDashboardBootstrap,
  diagnosticRowToMECAScores,
  readDashboardBootstrap,
} from "@/lib/meca-dashboard-scores";
import { pickLatestRow } from "@/lib/meca-history-utils";
import { OFFLINE_RESULT_KEY_PREFIX } from "@/lib/meca-offline-result";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArchetypeCard } from "./ArchetypeCard";
import { ArchetypeMatrix } from "./ArchetypeMatrix";
import { MECARadarChart } from "./RadarChart";
import { getArchetype, type MECAScores } from "../../utils/archetypeEngine";

type HistoryRow = {
  id: string;
  created_at: string;
  mentalidade: number;
  engajamento: number;
  cultura: number;
  performance: number;
};

function readOfflineRowForSaved(saved: string): HistoryRow | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${OFFLINE_RESULT_KEY_PREFIX}${saved}`);
    if (!raw) return null;
    return JSON.parse(raw) as HistoryRow;
  } catch {
    return null;
  }
}

const EmptyNotFound: React.FC<{ onStart?: () => void }> = ({ onStart }) => (
  <div
    style={{
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 20,
      textAlign: "center",
      padding: 40,
    }}
  >
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: 18,
        background: "#f0f6ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 32,
      }}
    >
      ◆
    </div>
    <div>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#1a3a5c",
          marginBottom: 8,
        }}
      >
        Diagnóstico não encontrado
      </h2>
      <p
        style={{
          fontSize: 15,
          color: "#6b7280",
          maxWidth: 360,
          lineHeight: 1.6,
        }}
      >
        Não há resultados guardados. Complete o diagnóstico para ver o seu
        perfil MECA.
      </p>
    </div>
    <button
      type="button"
      onClick={onStart}
      style={{
        padding: "13px 28px",
        background: "#1a3a5c",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        fontSize: 15,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      Iniciar Diagnóstico →
    </button>
  </div>
);

const LoadingState: React.FC = () => (
  <div
    style={{
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        border: "3px solid #e5e7eb",
        borderTopColor: "#1a3a5c",
        borderRadius: "50%",
        animation: "mecaSpin 0.8s linear infinite",
      }}
    />
    <p style={{ fontSize: 15, color: "#6b7280" }}>A carregar o seu resultado…</p>
    <style>{`@keyframes mecaSpin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export const MECADashboard: React.FC = () => {
  const router = useRouter();
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
        const msg =
          typeof data.error === "string"
            ? data.error
            : "Falha ao carregar o histórico.";
        setError(msg);
        return;
      }

      const rows = (data.rows ?? []) as HistoryRow[];
      const latest = pickLatestRow(rows);

      if (latest) {
        setScores(diagnosticRowToMECAScores(latest));
        setError(null);
        const boot = readDashboardBootstrap();
        if (boot?.id === latest.id) {
          clearDashboardBootstrap();
        }
      }
    } catch {
      setError("Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const archetype = useMemo(
    () => (scores ? getArchetype(scores) : null),
    [scores],
  );

  if (loading && !scores) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <LoadingState />
      </div>
    );
  }

  if (error && !scores) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <p style={{ color: "#b91c1c", textAlign: "center" }}>{error}</p>
      </div>
    );
  }

  if (!scores || !archetype) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <EmptyNotFound
          onStart={() => {
            window.location.href = "/assessment";
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0;font-family:'DM Sans',sans-serif}`}</style>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            borderBottom: "1px solid #fecaca",
            padding: "10px 24px",
            textAlign: "center",
            fontSize: 13,
            color: "#991b1b",
          }}
        >
          {error} — a mostrar o último resultado disponível localmente.
        </div>
      )}

      <div style={{ background: "#1a3a5c", padding: "28px 32px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#4a90d9",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Resultado do Diagnóstico
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.5px",
              lineHeight: 1.15,
            }}
          >
            Seu Perfil MECA
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.6)",
              marginTop: 6,
              paddingBottom: 20,
            }}
          >
            Baseado em 60 perguntas · 20 teorias científicas · 4 pilares
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: archetype.bgColor,
              padding: "8px 16px",
              borderRadius: "10px 10px 0 0",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a3a5c" }}>
              ◆ {archetype.name}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 32px 48px" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 32,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 24px rgba(26,58,92,0.07)",
              padding: 28,
            }}
          >
            <MECARadarChart scores={scores} />
          </div>
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 24px rgba(26,58,92,0.07)",
              padding: 28,
            }}
          >
            <ArchetypeMatrix archetype={archetype} />
          </div>
        </div>
        <ArchetypeCard
          archetype={archetype}
          scores={scores}
          onActionPlan={() => {
            const q = saved ? `?saved=${encodeURIComponent(saved)}` : "";
            router.push(`/plano-de-acao${q}`);
          }}
        />
      </div>
    </div>
  );
};

export default MECADashboard;
