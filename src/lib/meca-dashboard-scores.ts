import type { MECAScores } from "@/utils/archetypeEngine";

/** sessionStorage: resultado imediato após POST /api/score (evita esperar pelo histórico). */
export const DASHBOARD_BOOTSTRAP_KEY = "meca_dashboard_bootstrap";

export type DashboardBootstrapPayload = {
  id: string;
  scores: MECAScores;
  at: number;
};

export function diagnosticRowToMECAScores(row: {
  mentalidade: number;
  engajamento: number;
  cultura: number;
  performance: number;
}): MECAScores {
  return {
    M: Math.round(Number(row.mentalidade)),
    E: Math.round(Number(row.engajamento)),
    C: Math.round(Number(row.cultura)),
    A: Math.round(Number(row.performance)),
  };
}

export function readDashboardBootstrap(): DashboardBootstrapPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DASHBOARD_BOOTSTRAP_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as DashboardBootstrapPayload;
    if (
      p?.id &&
      p?.scores &&
      typeof p.scores.M === "number" &&
      typeof p.scores.E === "number" &&
      typeof p.scores.C === "number" &&
      typeof p.scores.A === "number"
    ) {
      return p;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function clearDashboardBootstrap(): void {
  try {
    sessionStorage.removeItem(DASHBOARD_BOOTSTRAP_KEY);
  } catch {
    /* ignore */
  }
}
