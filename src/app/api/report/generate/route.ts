import { requireAdminWithMfa } from "@/lib/auth/require-admin-mfa";
import { getActionPlan } from "@/lib/action-plan";
import { logAdminAction } from "@/lib/admin-audit-log";
import { logger } from "@/lib/logger";
import { getPillarRanking } from "@/lib/meca-interpretation";
import type { PillarInterpretation } from "@/lib/meca-interpretation";
import { getLowestTheories } from "@/lib/meca-theories";
import type { ScoredTheory } from "@/lib/meca-theories";
import {
  sanitizePdfHtmlDocument,
  sanitizePdfText,
} from "@/lib/pdf-report-html";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  archetypesInZone,
  getArchetype,
  ZONES,
  type ArchetypeResult,
  type MECAScores,
  type ZoneKey,
} from "@/lib/archetypes";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Vercel / serverless: PDF + Puppeteer precisam de mais tempo que o default (~10s). Plano Pro+ recomendado. */
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// DESIGN SYSTEM
// ---------------------------------------------------------------------------

const PILLAR_COLOR: Record<string, string> = {
  mentalidade: "#4a90d9",
  engajamento: "#2ecc71",
  cultura: "#f39c12",
  performance: "#9b59b6",
};

const PILLAR_LABEL: Record<string, string> = {
  mentalidade: "Mentalidade Empreendedora",
  engajamento: "Engajamento Autêntico",
  cultura: "Cultura como Motor",
  performance: "Alta Performance",
};

const RANGE_BADGE: Record<PillarInterpretation["range"], { label: string; fg: string; bg: string }> = {
  critical: { label: "Crítico",       fg: "#7f1d1d", bg: "#fee2e2" },
  low:      { label: "Baixo",         fg: "#92400e", bg: "#fef3c7" },
  moderate: { label: "Moderado",      fg: "#475569", bg: "#f1f5f9" },
  high:     { label: "Bom",           fg: "#065f46", bg: "#d1fae5" },
  excellent:{ label: "Excelente",     fg: "#14532d", bg: "#bbf7d0" },
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|\s|-)([a-zà-ú])/g, (_, pre, c) => `${pre}${c.toUpperCase()}`);
}

function deriveDisplayName(raw: string | null | undefined, email: string): string | null {
  const cleaned = (raw ?? "").trim();
  if (cleaned.length > 1) return cleaned;
  const local = email.split("@")[0] ?? "";
  if (!local) return null;
  const nice = local.replace(/[._-]+/g, " ").trim();
  return nice.length > 1 ? titleCase(nice) : null;
}

function buildTheorySections(theories: ScoredTheory[]): string {
  return theories
    .map((t, idx) => {
      const color = PILLAR_COLOR[t.pillar] ?? "#4a90d9";
      const pillarName = sanitizePdfText(PILLAR_LABEL[t.pillar] ?? String(t.pillar));
      const name = sanitizePdfText(t.name);
      const diagnostico = sanitizePdfText(t.diagnostico);
      const fundamentacao = sanitizePdfText(t.fundamentacao);
      const impacto = sanitizePdfText(t.impacto);
      const resultado = sanitizePdfText(t.resultado);
      const acoes = t.acoes
        .map(
          (a, i) => `
          <li class="theory-action-item">
            <span class="theory-action-num" style="background:${color}">${i + 1}</span>
            <span>${sanitizePdfText(a)}</span>
          </li>`,
        )
        .join("");

      return `
    <div class="theory-card" style="border-left:5px solid ${color}">
      <div class="theory-header">
        <div class="theory-header-main">
          <span class="theory-index">Teoria ${idx + 1} de ${theories.length}</span>
          <h3 class="theory-name">${name}</h3>
          <span class="theory-pillar" style="color:${color}">${pillarName}</span>
        </div>
        <div class="theory-score-wrap">
          <span class="theory-score-num" style="color:${color}">${t.score}</span>
          <span class="theory-score-label" style="color:${color}">/100</span>
        </div>
      </div>

      <div class="theory-section">
        <div class="theory-section-label">Diagnóstico</div>
        <p class="theory-section-text">${diagnostico}</p>
      </div>

      <div class="theory-section">
        <div class="theory-section-label">Fundamentação teórica</div>
        <p class="theory-section-text">${fundamentacao}</p>
      </div>

      <div class="theory-section">
        <div class="theory-section-label">Impacto na prática</div>
        <p class="theory-section-text">${impacto}</p>
      </div>

      <div class="theory-section">
        <div class="theory-section-label">Plano de ação</div>
        <ul class="theory-action-list">${acoes}</ul>
      </div>

      <div class="theory-result">
        <span class="theory-result-label">Resultado esperado</span>
        <p class="theory-result-text">${resultado}</p>
      </div>
    </div>`;
    })
    .join("\n");
}

// ---------------------------------------------------------------------------
// RADAR CHART (pure SVG — no Chart.js dependency, print-safe)
// ---------------------------------------------------------------------------

function buildRadarChart(scores: MECAScores): string {
  const cx = 130;
  const cy = 130;
  const maxR = 90;

  type Axis = {
    key: keyof MECAScores;
    labelShort: string;
    angleDeg: number;
    color: string;
  };

  const axes: Axis[] = [
    { key: "M", labelShort: "Mentalidade",  angleDeg: -90, color: PILLAR_COLOR.mentalidade },
    { key: "E", labelShort: "Engajamento",  angleDeg:   0, color: PILLAR_COLOR.engajamento },
    { key: "C", labelShort: "Cultura",      angleDeg:  90, color: PILLAR_COLOR.cultura },
    { key: "A", labelShort: "Performance",  angleDeg: 180, color: PILLAR_COLOR.performance },
  ];

  const toRad = (d: number) => (d * Math.PI) / 180;
  const pointAt = (angleDeg: number, pct: number): [number, number] => {
    const r = maxR * (pct / 100);
    const a = toRad(angleDeg);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const fmt = (n: number) => n.toFixed(1);

  // Concentric grid rings (25 / 50 / 75 / 100)
  const gridRings = [25, 50, 75, 100]
    .map((pct) => {
      const pts = axes
        .map((ax) => pointAt(ax.angleDeg, pct))
        .map(([x, y]) => `${fmt(x)},${fmt(y)}`)
        .join(" ");
      const stroke = pct === 100 ? "#cbd5e1" : "#e2e8f0";
      return `<polygon points="${pts}" fill="none" stroke="${stroke}" stroke-width="1" />`;
    })
    .join("");

  // Radial axis lines
  const axisLines = axes
    .map((ax) => {
      const [x, y] = pointAt(ax.angleDeg, 100);
      return `<line x1="${cx}" y1="${cy}" x2="${fmt(x)}" y2="${fmt(y)}" stroke="#e2e8f0" stroke-width="1" />`;
    })
    .join("");

  // Data polygon
  const dataPts = axes.map((ax) => pointAt(ax.angleDeg, scores[ax.key]));
  const polygon = `<polygon points="${dataPts
    .map(([x, y]) => `${fmt(x)},${fmt(y)}`)
    .join(" ")}" fill="#4a90d9" fill-opacity="0.18" stroke="#4a90d9" stroke-width="2.2" stroke-linejoin="round" />`;

  // Data points (colored per pillar, matching pillar bar colors)
  const dots = dataPts
    .map(([x, y], i) => {
      const color = axes[i].color;
      return `<circle cx="${fmt(x)}" cy="${fmt(y)}" r="4.5" fill="#fff" stroke="${color}" stroke-width="2.5" />`;
    })
    .join("");

  // Tick labels on the north axis (subtle scale hints)
  const tickLabels = [25, 50, 75, 100]
    .map((pct) => {
      const [, y] = pointAt(-90, pct);
      return `<text x="${cx + 4}" y="${fmt(y)}" fill="#cbd5e1" font-size="8" dy="0.35em">${pct}</text>`;
    })
    .join("");

  // Axis labels + score
  const labelGap = 18;
  const labels = axes
    .map((ax) => {
      const a = toRad(ax.angleDeg);
      const lx = cx + (maxR + labelGap) * Math.cos(a);
      const ly = cy + (maxR + labelGap) * Math.sin(a);
      let anchor: "start" | "middle" | "end" = "middle";
      if (Math.cos(a) > 0.3) anchor = "start";
      else if (Math.cos(a) < -0.3) anchor = "end";
      const val = scores[ax.key];
      return `
        <g>
          <text x="${fmt(lx)}" y="${fmt(ly - 5)}" text-anchor="${anchor}" fill="#475569" font-size="9.5" font-weight="700" letter-spacing="0.12em">${ax.labelShort.toUpperCase()}</text>
          <text x="${fmt(lx)}" y="${fmt(ly + 10)}" text-anchor="${anchor}" fill="${ax.color}" font-size="13" font-weight="800">${val}</text>
        </g>`;
    })
    .join("");

  return `
    <svg viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg" class="radar-svg" role="img" aria-label="Gráfico radar dos quatro pilares MECA">
      ${gridRings}
      ${axisLines}
      ${tickLabels}
      ${polygon}
      ${dots}
      ${labels}
    </svg>`;
}

// ---------------------------------------------------------------------------
// QUADRANT GRAPH (pure CSS — matches app's ArchetypeMatrix)
// ---------------------------------------------------------------------------

function buildQuadrantGraph(archetype: ArchetypeResult): string {
  const ZONE_ORDER: { key: ZoneKey; gridArea: string }[] = [
    { key: "potencial_desperdicado", gridArea: "tl" },
    { key: "aceleracao",             gridArea: "tr" },
    { key: "invisibilidade",         gridArea: "bl" },
    { key: "esforco_invisivel",      gridArea: "br" },
  ];

  const cells = ZONE_ORDER.map(({ key, gridArea }) => {
    const zone = ZONES[key];
    const isActive = archetype.zone === key;
    const chips = archetypesInZone(key)
      .map((a) => {
        const current = a.key === archetype.key;
        return `<div class="quad-chip ${current ? "quad-chip-current" : ""}">
          <span class="quad-chip-icon">${sanitizePdfText(a.icon)}</span>
          <span class="quad-chip-label">${sanitizePdfText(a.name)}</span>
        </div>`;
      })
      .join("");

    return `
      <div class="quad-cell ${isActive ? "quad-cell-active" : ""}"
           style="grid-area:${gridArea}; background:${zone.bgColor};">
        <div class="quad-zone-label" style="color:${zone.textColor}">
          ${sanitizePdfText(zone.label)}
        </div>
        <div class="quad-chips">${chips}</div>
      </div>`;
  }).join("");

  const dotLeft = Math.max(2, Math.min(98, archetype.xScore));
  const dotTop = Math.max(2, Math.min(98, 100 - archetype.yScore));

  return `
    <div class="quad-wrap">
      <div class="quad-axis-y">
        <span class="quad-axis-y-label">Direção e Sistema (C+E)</span>
      </div>
      <div class="quad-matrix-wrap">
        <div class="quad-matrix">
          ${cells}
          <div class="quad-dot" style="left:${dotLeft}%; top:${dotTop}%;">
            <div class="quad-dot-glow"></div>
            <div class="quad-dot-core"></div>
            <div class="quad-dot-label">Você está aqui</div>
          </div>
        </div>
        <div class="quad-axis-x">
          <span class="quad-axis-x-label">Capacidade (A)</span>
        </div>
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// EXECUTIVE SUMMARY (composes only APPROVED archetype texts with connectors)
// ---------------------------------------------------------------------------

function buildExecutiveSummary(archetype: ArchetypeResult, weakest: string): string {
  const zone = sanitizePdfText(archetype.zoneLabel);
  const mechanics = sanitizePdfText(archetype.report.mechanics);
  const risk = sanitizePdfText(archetype.report.risk);
  const leverage = sanitizePdfText(archetype.report.leverage);
  const weakestSafe = sanitizePdfText(weakest);

  return `
    <div class="exec-block exec-block-moment">
      <div class="exec-block-head">
        <span class="exec-block-dot" style="background:#1a3a5c"></span>
        <span class="exec-block-label">Seu momento</span>
      </div>
      <p class="exec-block-text">
        Seu momento atual posiciona você na <strong>${zone}</strong>. ${mechanics}
      </p>
    </div>

    <div class="exec-block exec-block-risk">
      <div class="exec-block-head">
        <span class="exec-block-dot" style="background:#dc2626"></span>
        <span class="exec-block-label">Risco a gerenciar</span>
      </div>
      <p class="exec-block-text">${risk}</p>
    </div>

    <div class="exec-block exec-block-leverage">
      <div class="exec-block-head">
        <span class="exec-block-dot" style="background:#059669"></span>
        <span class="exec-block-label">Alavanca de crescimento</span>
      </div>
      <p class="exec-block-text">${leverage}</p>
    </div>

    <div class="exec-footnote">
      <span class="exec-footnote-label">Pilar de maior alavancagem</span>
      <span class="exec-footnote-value">${weakestSafe}</span>
    </div>`;
}

// ---------------------------------------------------------------------------
// MAIN HTML TEMPLATE
// ---------------------------------------------------------------------------

function buildHtml(params: {
  userName: string | null;
  email: string;
  scores: MECAScores;
  generatedAt: string;
  theories: ScoredTheory[];
}): string {
  const { userName, email, scores, generatedAt, theories } = params;
  const emailSafe = sanitizePdfText(email);
  const generatedAtSafe = sanitizePdfText(generatedAt);
  const userNameSafe = userName ? sanitizePdfText(userName) : "";

  const archetype = getArchetype(scores);
  const plan = getActionPlan(scores);
  const ranking = getPillarRanking(scores);

  // Weakest = lowest, strongest = highest (ranking is ascending)
  const weakestPillar = ranking[0];
  const strongestPillar = ranking[ranking.length - 1];

  // -------- Archetype text ------------------------------------------------
  const archetypeName = sanitizePdfText(archetype.name);
  const archetypeZone = sanitizePdfText(archetype.zoneLabel);
  const archetypeDiagnosis = sanitizePdfText(archetype.report.diagnosis);
  const archetypeMechanics = sanitizePdfText(archetype.report.mechanics);
  const archetypeRisk = sanitizePdfText(archetype.report.risk);
  const archetypeLeverage = sanitizePdfText(archetype.report.leverage);

  const archetypeActionPlan = archetype.report.action_plan
    .map(
      (step, i) => `
        <li class="arch-step">
          <span class="arch-step-num">${i + 1}</span>
          <span class="arch-step-text">${sanitizePdfText(step)}</span>
        </li>`,
    )
    .join("");

  // -------- Pillar bars (ordered by ranking: weakest → strongest) ---------
  const pillarBars = ranking
    .map((p) => {
      const color = PILLAR_COLOR[p.dbName] ?? "#4a90d9";
      const width = Math.max(2, Math.min(100, p.score));
      const isWeakest = p.key === weakestPillar.key;
      const isStrongest =
        p.key === strongestPillar.key && strongestPillar.key !== weakestPillar.key;
      const callout = isWeakest
        ? `<span class="pillar-callout pillar-callout-weak">Maior alavancagem</span>`
        : isStrongest
        ? `<span class="pillar-callout pillar-callout-strong">Ponto forte</span>`
        : "";
      const badge = RANGE_BADGE[p.range];
      return `
      <div class="pillar-card ${isWeakest ? "pillar-card-weak" : ""} ${isStrongest ? "pillar-card-strong" : ""}">
        <div class="pillar-card-top">
          <div class="pillar-card-title">
            <span class="pillar-dot" style="background:${color}"></span>
            <span class="pillar-name">${sanitizePdfText(p.fullName)}</span>
            ${callout}
          </div>
          <div class="pillar-card-score">
            <span class="pillar-score-num" style="color:${color}">${p.score}</span>
            <span class="pillar-score-unit">/100</span>
            <span class="pillar-badge" style="color:${badge.fg}; background:${badge.bg}">${badge.label}</span>
          </div>
        </div>
        <div class="pillar-bar">
          <div class="pillar-bar-fill" style="width:${width}%; background:linear-gradient(90deg, ${color}cc, ${color})"></div>
        </div>
        <p class="pillar-interp">${sanitizePdfText(p.text)}</p>
      </div>`;
    })
    .join("\n");

  // -------- Main action plan (based on weakest pillar) --------------------
  const planTitle = sanitizePdfText(plan.title);
  const planDesc = sanitizePdfText(plan.description);
  const planPillar = sanitizePdfText(plan.pillar);

  const mainPlanActions = plan.actions
    .map(
      (a, i) => `
      <li class="action-step">
        <div class="action-step-check"></div>
        <span class="action-step-num">${i + 1}</span>
        <div class="action-step-body">
          <span class="action-step-meta">Passo ${i + 1}</span>
          <div class="action-step-text">${sanitizePdfText(a)}</div>
        </div>
      </li>`,
    )
    .join("\n");

  // -------- Hero section --------------------------------------------------
  const heroImpactPhrase = archetypeMechanics;

  const quadrantGraph = buildQuadrantGraph(archetype);
  const executiveSummary = buildExecutiveSummary(
    archetype,
    archetype.weakestPilarName,
  );

  const coverLines: string[] = [];
  if (userNameSafe) coverLines.push(`<div class="cover-recipient-name">${userNameSafe}</div>`);
  coverLines.push(`<div class="cover-recipient-email">${emailSafe}</div>`);
  coverLines.push(`<div class="cover-recipient-date">${generatedAtSafe}</div>`);

  const raw = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relatório de Diagnóstico MECA</title>
<style>
  /* ---------- RESET & BASE ---------- */
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    font-family: 'Inter', 'Segoe UI', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
    color: #0f172a;
    background: #fff;
    font-size: 14px;
    line-height: 1.62;
    -webkit-font-smoothing: antialiased;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    orphans: 3;
    widows: 3;
  }
  @page { size: A4; margin: 0.5cm 0; }

  /* ---------- PAGE FRAMEWORK ----------
     Sections are logical blocks in natural flow.
     We avoid fixed-height cages so SOFT content can continue filling pages.
     No overflow:hidden and no forced break-before on every section. */
  .page {
    position: relative;
    width: 210mm;
    padding: 12mm 18mm 14mm;
    break-before: auto;
    page-break-before: auto;
  }
  .page + .page { padding-top: 10mm; }

  /* Atomic block helper — wrap title + first-content to prevent orphan titles. */
  .keep-together {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  /* Add consistent breathing room before the engine decides where to break. */
  .section-end-spacer { height: 18px; }

  /* Section head: treated as part of the first-block group, never orphans. */
  .page-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 12px;
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 18px;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #94a3b8;
    break-after: avoid-page;
    page-break-after: avoid;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .page-head-brand { font-weight: 700; color: #1a3a5c; letter-spacing: 0.22em; }
  .page-head-brand span { color: #4a90d9; }

  /* ---------- TYPOGRAPHY ---------- */
  .eyebrow {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    color: #64748b;
    font-weight: 700;
    break-after: avoid-page;
    page-break-after: avoid;
  }
  .section-title {
    font-size: 22px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.3px;
    line-height: 1.25;
    margin-top: 6px;
    break-after: avoid-page;
    page-break-after: avoid;
  }
  .section-kicker {
    font-size: 12.5px;
    color: #64748b;
    margin-top: 8px;
    max-width: 640px;
    line-height: 1.58;
    break-after: avoid-page;
    page-break-after: avoid;
  }
  .divider-soft {
    height: 1px;
    background: linear-gradient(90deg, #e2e8f0, transparent);
    margin: 18px 0;
  }

  /* ---------- PAGINATION RULES (atomic blocks) ----------
     Any block that must not split mid-content gets break-inside: avoid.
     The engine measures the block and pushes it to the next page if
     it does not fit — this is the "block-based layout" model. */
  .exec-block,
  .exec-footnote,
  .pillar-card,
  .pillars-overview,
  .quad-wrap,
  .hero-intro,
  .hero-coords,
  .arch-opener,
  .arch-identity,
  .arch-block,
  .action-hero-opener,
  .action-step,
  .theories-opener,
  .closing-card {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Action hero: the container itself may span pages if the checklist is long;
     but the opener (eyebrow + title + desc + label) must travel with the first
     step to avoid an orphan header. */
  .action-hero-inner > .action-hero-opener + .action-list > .action-step:first-child {
    break-before: avoid-page;
    page-break-before: avoid;
  }

  /* Keep each section opener attached to its first paragraph/block. */
  .page > .eyebrow + .section-title + .section-kicker,
  .theories-opener > .eyebrow + .section-title + .theories-intro {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Keep the "Leitura detalhada" title glued to the first pillar-card:
     pillars-detailed is a logical group but long, so we don't set
     break-inside:avoid. Instead keep the title+first item together via
     its own first-item rule. */
  .pillars-detailed { margin-top: 8px; }
  .pillars-detailed .pillars-section-title {
    break-after: avoid-page;
    page-break-after: avoid;
  }
  .pillars-detailed .pillars-grid > .pillar-card:first-child {
    break-before: avoid-page;
    page-break-before: avoid;
  }

  /* Paragraph typography: avoid 1-2 line orphans/widows. */
  p { orphans: 3; widows: 3; }

  /* ================================================================== */
  /*                           1 · COVER PAGE                           */
  /* ================================================================== */

  .cover {
    padding: 0;
    display: flex;
    flex-direction: column;
    background: linear-gradient(160deg, #0b2544 0%, #1a3a5c 55%, #254d75 100%);
    color: #fff;
    width: 210mm;
    height: calc(297mm - 1cm);
    position: relative;
    overflow: hidden;
    break-inside: avoid;
    page-break-inside: avoid;
    break-after: page;
    page-break-after: always;
  }
  .cover::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 85% 15%, rgba(74,144,217,0.30), transparent 42%),
      radial-gradient(circle at 10% 85%, rgba(46,204,113,0.18), transparent 45%);
    pointer-events: none;
  }
  .cover-inner {
    position: relative;
    z-index: 1;
    padding: 26mm 20mm 22mm;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .cover-brand {
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #fff;
  }
  .cover-brand span { color: #7ab6ff; }
  .cover-brand-tagline {
    font-size: 10px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.55);
    margin-top: 6px;
  }

  .cover-middle { margin-top: 70mm; }
  .cover-eyebrow {
    font-size: 11px;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: #7ab6ff;
    font-weight: 700;
  }
  .cover-title {
    font-size: 46px;
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -1.2px;
    margin-top: 14px;
    max-width: 150mm;
  }
  .cover-subtitle {
    margin-top: 18px;
    font-size: 14px;
    color: rgba(255,255,255,0.72);
    max-width: 140mm;
    line-height: 1.6;
  }

  .cover-accent {
    margin-top: 26px;
    height: 3px;
    width: 72px;
    background: linear-gradient(90deg, #7ab6ff, #2ecc71);
    border-radius: 2px;
  }

  .cover-recipient {
    margin-top: auto;
    padding-top: 26px;
    border-top: 1px solid rgba(255,255,255,0.16);
  }
  .cover-recipient-label {
    font-size: 10px;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.55);
    margin-bottom: 10px;
  }
  .cover-recipient-name {
    font-size: 22px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 6px;
    letter-spacing: -0.2px;
  }
  .cover-recipient-email {
    font-size: 14px;
    color: rgba(255,255,255,0.75);
  }
  .cover-recipient-date {
    font-size: 12px;
    color: rgba(255,255,255,0.55);
    margin-top: 8px;
    letter-spacing: 0.05em;
  }

  .cover-confidential {
    margin-top: 22px;
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.4);
  }

  /* ================================================================== */
  /*                       2 · HERO (ARCHETYPE + GRAPH)                 */
  /* ================================================================== */

  .hero-page {
    padding-top: 18mm;
    break-before: page;
    page-break-before: always;
  }

  .hero-eyebrow { color: #4a90d9; letter-spacing: 0.28em; font-weight: 700; font-size: 10px; text-transform: uppercase; }
  .hero-zone {
    display: inline-block;
    margin-top: 10px;
    padding: 5px 12px;
    border-radius: 999px;
    background: ${archetype.bgColor};
    color: ${archetype.textColor};
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .hero-title {
    display: flex;
    align-items: baseline;
    gap: 14px;
    font-size: 56px;
    font-weight: 800;
    letter-spacing: -1.4px;
    line-height: 1.05;
    color: #0f172a;
    margin-top: 14px;
  }
  .hero-title-icon {
    font-size: 42px;
    line-height: 1;
    display: inline-block;
    transform: translateY(-2px);
  }
  .hero-impact {
    font-size: 16px;
    color: #334155;
    margin-top: 16px;
    max-width: 155mm;
    line-height: 1.55;
    font-weight: 500;
  }

  .hero-graph-label {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
    margin-bottom: 10px;
  }
  .hero-graph-label-line {
    flex: 1;
    height: 1px;
    background: #e2e8f0;
  }
  .hero-graph-label-text {
    font-size: 10px;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: #64748b;
    font-weight: 700;
  }

  /* ---------- QUADRANT GRAPH ---------- */
  .quad-wrap {
    display: grid;
    grid-template-columns: 20px 1fr;
    gap: 12px;
    margin-top: 6px;
  }
  .quad-axis-y {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    text-align: center;
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #64748b;
    font-weight: 700;
    padding-top: 4px;
  }
  .quad-matrix-wrap { display: flex; flex-direction: column; }
  .quad-matrix {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 0.72;
    display: grid;
    grid-template-areas: "tl tr" "bl br";
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 6px;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 6px;
    background: #f8fafc;
  }
  .quad-cell {
    position: relative;
    border-radius: 10px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    opacity: 0.72;
    transition: opacity 0.2s;
  }
  .quad-cell-active {
    opacity: 1;
    box-shadow: inset 0 0 0 2px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06);
  }
  .quad-zone-label {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
  .quad-chips {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .quad-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.7);
    border: 1px solid rgba(15,23,42,0.06);
    border-radius: 999px;
    padding: 3px 9px 3px 7px;
    font-size: 10px;
    color: #334155;
    line-height: 1.3;
  }
  .quad-chip-current {
    background: #0f172a;
    color: #fff;
    border-color: #0f172a;
    font-weight: 700;
    box-shadow: 0 2px 6px rgba(15,23,42,0.2);
  }
  .quad-chip-icon { font-size: 10px; }
  .quad-chip-label { font-size: 10px; white-space: nowrap; }

  .quad-dot {
    position: absolute;
    transform: translate(-50%, -50%);
    z-index: 5;
  }
  .quad-dot-glow {
    position: absolute;
    left: 50%; top: 50%;
    transform: translate(-50%, -50%);
    width: 34px; height: 34px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(74,144,217,0.45) 0%, rgba(74,144,217,0) 70%);
  }
  .quad-dot-core {
    position: relative;
    width: 14px; height: 14px;
    border-radius: 50%;
    background: #0f172a;
    border: 3px solid #fff;
    box-shadow: 0 2px 8px rgba(15,23,42,0.35);
  }
  .quad-dot-label {
    position: absolute;
    left: 20px; top: -8px;
    background: #0f172a;
    color: #fff;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 3px 8px;
    border-radius: 6px;
    white-space: nowrap;
    box-shadow: 0 2px 6px rgba(15,23,42,0.25);
  }

  .quad-axis-x {
    text-align: center;
    margin-top: 10px;
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #64748b;
    font-weight: 700;
  }

  .hero-coords {
    display: flex;
    gap: 20px;
    margin-top: 14px;
    font-size: 11px;
    color: #475569;
  }
  .hero-coord strong {
    display: block;
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    margin-top: 2px;
  }
  .hero-coord-label {
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #94a3b8;
    font-weight: 700;
  }

  /* ================================================================== */
  /*                   3 · EXECUTIVE SUMMARY + PILLARS                  */
  /* ================================================================== */

  .exec-stack {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .exec-block {
    padding: 18px 22px 20px;
    border-radius: 14px;
    background: #fff;
    border: 1px solid #e2e8f0;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .exec-block-moment   {
    background: linear-gradient(135deg, #f8fafc 0%, #eef4fb 100%);
    border-color: #dbeafe;
    border-left: 4px solid #1a3a5c;
  }
  .exec-block-risk     {
    background: #fff7f7;
    border-color: #fecaca;
    border-left: 4px solid #dc2626;
  }
  .exec-block-leverage {
    background: #f5fdf9;
    border-color: #bbf7d0;
    border-left: 4px solid #059669;
  }

  .exec-block-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
  .exec-block-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }
  .exec-block-label {
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #0f172a;
  }
  .exec-block-risk .exec-block-label     { color: #991b1b; }
  .exec-block-leverage .exec-block-label { color: #065f46; }

  .exec-block-text {
    font-size: 14px;
    color: #1e293b;
    line-height: 1.65;
    margin: 0;
  }
  .exec-block strong { color: #0f172a; }

  .exec-footnote {
    margin-top: 6px;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 12px 16px;
    background: #0f172a;
    color: #fff;
    border-radius: 10px;
  }
  .exec-footnote-label {
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.55);
    font-weight: 700;
  }
  .exec-footnote-value {
    font-size: 14px;
    font-weight: 800;
    letter-spacing: -0.2px;
    color: #fff;
  }

  /* ---------- PILLARS OVERVIEW (radar + legend) ---------- */
  .pillars-overview {
    margin-top: 20px;
    padding: 20px 22px 16px;
    background: linear-gradient(180deg, #fafbfc 0%, #f1f5f9 100%);
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .pillars-overview-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 10px;
  }
  .pillars-overview-title {
    font-size: 11px;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: #1e293b;
    font-weight: 800;
  }
  .pillars-overview-hint {
    font-size: 10px;
    color: #94a3b8;
    letter-spacing: 0.08em;
  }
  .radar-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 0 4px;
  }
  .radar-svg {
    width: 320px;
    max-width: 100%;
    height: auto;
  }

  /* ---------- PILLAR CARDS ---------- */
  .pillars-section-title {
    margin-top: 20px;
    margin-bottom: 12px;
    font-size: 11px;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: #1e293b;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .pillars-section-title::after {
    content: "";
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, #e2e8f0, transparent);
  }
  .pillars-grid { display: flex; flex-direction: column; gap: 12px; }
  .pillar-card {
    padding: 14px 18px 16px;
    border-radius: 12px;
    background: #fff;
    border: 1px solid #e2e8f0;
    page-break-inside: avoid;
    break-inside: avoid;
    position: relative;
    overflow: hidden;
  }
  .pillar-card-weak   {
    border-color: #fecaca;
    background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
    border-left: 6px solid #dc2626;
    padding: 22px 24px 24px;
    box-shadow: 0 4px 14px rgba(220,38,38,0.08);
  }
  .pillar-card-strong {
    border-color: #bbf7d0;
    background: linear-gradient(135deg, #f4fdf7 0%, #e7fbee 100%);
    border-left: 6px solid #059669;
  }

  .pillar-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    gap: 12px;
  }
  .pillar-card-title { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .pillar-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  .pillar-name { font-size: 14.5px; font-weight: 700; color: #0f172a; }
  .pillar-callout {
    font-size: 9px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    font-weight: 800;
    padding: 3px 9px;
    border-radius: 999px;
  }
  .pillar-callout-weak   { background: #fee2e2; color: #991b1b; }
  .pillar-callout-strong { background: #dcfce7; color: #166534; }

  .pillar-card-score { display: flex; align-items: center; gap: 10px; }
  .pillar-score-num { font-size: 22px; font-weight: 800; line-height: 1; }
  .pillar-card-weak .pillar-score-num { font-size: 28px; }
  .pillar-score-unit { font-size: 11px; color: #94a3b8; font-weight: 600; }
  .pillar-badge {
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-weight: 800;
    padding: 3px 9px;
    border-radius: 999px;
  }

  .pillar-bar {
    height: 8px;
    background: #eef2f7;
    border-radius: 999px;
    overflow: hidden;
    margin: 8px 0 10px;
  }
  .pillar-card-weak .pillar-bar {
    height: 10px;
    background: #fecaca;
  }
  .pillar-card-strong .pillar-bar {
    background: #bbf7d0;
  }
  .pillar-bar-fill {
    height: 100%;
    border-radius: 999px;
  }
  .pillar-interp {
    font-size: 12.5px;
    color: #475569;
    line-height: 1.62;
  }
  .pillar-card-weak .pillar-interp   { color: #3f1b1b; }
  .pillar-card-strong .pillar-interp { color: #14532d; }

  /* ================================================================== */
  /*                     4 · ARCHETYPE DEEP DIVE                        */
  /* ================================================================== */

  /* Identity banner */
  .arch-identity {
    margin-top: 18px;
    padding: 20px 22px 22px;
    border-radius: 16px;
    background: linear-gradient(135deg, #0b2544 0%, #1a3a5c 55%, #254d75 100%);
    color: #fff;
    position: relative;
    overflow: hidden;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .arch-identity::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 90% 20%, rgba(122,182,255,0.25), transparent 40%);
    pointer-events: none;
  }
  .arch-identity-zone {
    position: relative;
    display: inline-block;
    padding: 4px 12px;
    border-radius: 999px;
    background: rgba(122,182,255,0.16);
    color: #cfe3ff;
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    font-weight: 800;
  }
  .arch-identity-name {
    position: relative;
    display: flex;
    align-items: baseline;
    gap: 14px;
    margin-top: 14px;
    font-size: 36px;
    font-weight: 800;
    letter-spacing: -0.8px;
    line-height: 1.1;
  }
  .arch-identity-icon {
    font-size: 28px;
    line-height: 1;
    display: inline-block;
    transform: translateY(-2px);
  }
  .arch-identity-tagline {
    position: relative;
    margin-top: 10px;
    font-size: 13px;
    color: rgba(255,255,255,0.75);
    line-height: 1.7;
    max-width: 150mm;
  }

  /* Grid */
  .arch-grid { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
  .arch-block {
    padding: 16px 18px;
    border-radius: 14px;
    background: #fff;
    border: 1px solid #e2e8f0;
    page-break-inside: avoid;
    break-inside: avoid;
    position: relative;
  }
  .arch-block-risk     {
    border-left: 4px solid #dc2626;
    background: linear-gradient(135deg, #fff7f7 0%, #fff0f0 100%);
    border-color: #fecaca;
  }
  .arch-block-leverage {
    border-left: 4px solid #059669;
    background: linear-gradient(135deg, #f5fdf9 0%, #ecfbf2 100%);
    border-color: #bbf7d0;
  }
  .arch-block-plan     {
    background: linear-gradient(135deg, #0b2544 0%, #1a3a5c 100%);
    color: #fff;
    border: none;
    padding: 26px 28px;
  }

  .arch-block-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .arch-block-label {
    display: inline-block;
    font-size: 10.5px;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    font-weight: 800;
    color: #94a3b8;
  }
  .arch-block-risk .arch-block-label     { color: #dc2626; }
  .arch-block-leverage .arch-block-label { color: #059669; }
  .arch-block-plan .arch-block-label     { color: #7ab6ff; }

  .arch-block-tag {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 999px;
    background: #f1f5f9;
    color: #475569;
  }
  .arch-block-risk .arch-block-tag     { background: #fee2e2; color: #991b1b; }
  .arch-block-leverage .arch-block-tag { background: #dcfce7; color: #166534; }

  .arch-block p { font-size: 13.5px; color: #1e293b; line-height: 1.62; }
  .arch-block-plan p, .arch-block-plan .arch-step-text { color: #e2e8f0; }

  .arch-steps {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 6px;
  }
  .arch-step {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .arch-step:last-child { border-bottom: none; padding-bottom: 0; }
  .arch-step-num {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px; height: 26px;
    border-radius: 8px;
    background: rgba(122,182,255,0.18);
    color: #cfe3ff;
    font-size: 12px;
    font-weight: 800;
    margin-top: 1px;
    border: 1px solid rgba(122,182,255,0.3);
  }
  .arch-step-text { font-size: 13.5px; line-height: 1.7; }

  /* ================================================================== */
  /*                     5 · ACTION PLAN (HIGH EMPHASIS)                */
  /* ================================================================== */

  .action-hero {
    margin-top: 18px;
    padding: 22px 24px 24px;
    border-radius: 18px;
    background: linear-gradient(135deg, #0b2544 0%, #1a3a5c 100%);
    color: #fff;
    position: relative;
    overflow: hidden;
    page-break-inside: auto;
    break-inside: auto;
  }
  .action-hero::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 92% 8%, rgba(122,182,255,0.25), transparent 45%);
    pointer-events: none;
  }
  .action-hero-inner { position: relative; }
  .action-hero-eyebrow {
    display: inline-block;
    font-size: 10px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: #7ab6ff;
    font-weight: 800;
    padding: 4px 10px;
    background: rgba(122,182,255,0.12);
    border-radius: 999px;
  }
  .action-hero-pillar {
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.55);
    margin-top: 14px;
    font-weight: 700;
  }
  .action-hero-title {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.6px;
    margin-top: 6px;
    line-height: 1.2;
  }
  .action-hero-desc {
    font-size: 13.5px;
    color: rgba(255,255,255,0.78);
    line-height: 1.62;
    margin-top: 10px;
    max-width: 150mm;
  }
  .action-hero-divider {
    height: 1px;
    background: linear-gradient(90deg, rgba(255,255,255,0.24), transparent);
    margin: 14px 0 12px;
  }

  .action-list-label {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
    margin-bottom: 8px;
  }

  .action-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .action-step {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 12px 14px;
    transition: background 0.15s;
  }
  .action-step-check {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border-radius: 7px;
    border: 2px solid rgba(122,182,255,0.65);
    background: transparent;
    margin-top: 2px;
    position: relative;
  }
  .action-step-num {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 7px;
    background: rgba(122,182,255,0.16);
    color: #cfe3ff;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.02em;
    border: 1px solid rgba(122,182,255,0.35);
    margin-top: 1px;
  }
  .action-step-body { flex: 1; min-width: 0; }
  .action-step-meta {
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: rgba(122,182,255,0.75);
    display: block;
    margin-bottom: 4px;
  }
  .action-step-text {
    font-size: 13px;
    color: rgba(255,255,255,0.94);
    line-height: 1.62;
  }

  /* ================================================================== */
  /*                      6 · THEORIES (APPENDIX)                       */
  /* ================================================================== */

  .theories-intro {
    font-size: 13px;
    color: #475569;
    line-height: 1.62;
    margin-top: 10px;
    margin-bottom: 16px;
    max-width: 160mm;
  }
  .theory-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    margin-bottom: 14px;
    overflow: hidden;
    box-shadow: 0 2px 6px rgba(15,23,42,0.04);
    page-break-inside: auto;
    break-inside: auto;
  }
  .theory-header,
  .theory-section,
  .theory-result,
  .theory-action-item {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .theory-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16px 18px 14px;
    border-bottom: 1px solid #f1f5f9;
    background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
  }
  .theory-header-main { flex: 1; min-width: 0; padding-right: 16px; }
  .theory-index {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: #94a3b8;
    display: block;
    margin-bottom: 4px;
  }
  .theory-name {
    font-size: 17px;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 4px;
    letter-spacing: -0.2px;
  }
  .theory-pillar {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
  }
  .theory-score-wrap { flex-shrink: 0; display: flex; align-items: baseline; gap: 2px; }
  .theory-score-num { font-size: 34px; font-weight: 900; line-height: 1; }
  .theory-score-label { font-size: 12px; font-weight: 700; }

  .theory-section { padding: 12px 18px 0; }
  .theory-section + .theory-section {
    margin-top: 4px;
    padding-top: 12px;
    border-top: 1px dashed #eef2f7;
  }
  .theory-section-label {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    color: #94a3b8;
    margin-bottom: 10px;
  }
  .theory-section-text {
    font-size: 12.5px;
    color: #374151;
    line-height: 1.6;
    margin: 0;
  }
  .theory-action-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
    padding: 0;
  }
  .theory-action-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: #f8fafc;
    border-radius: 10px;
    padding: 9px 10px;
    font-size: 12px;
    color: #374151;
    line-height: 1.58;
  }
  .theory-action-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px; height: 22px;
    border-radius: 6px;
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .theory-result {
    margin: 12px 18px 14px;
    padding: 10px 12px;
    background: #f0f9ff;
    border-radius: 12px;
    border: 1px solid #bae6fd;
  }
  .theory-result-label {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: #0369a1;
    display: block;
    margin-bottom: 5px;
  }
  .theory-result-text {
    font-size: 12.5px;
    color: #0c4a6e;
    line-height: 1.55;
    margin: 0;
    font-style: italic;
  }

  /* ================================================================== */
  /*                       7 · CLOSING PAGE                             */
  /* ================================================================== */

  .closing-card {
    margin-top: 20px;
    padding: 20px 22px;
    border-radius: 18px;
    background: linear-gradient(160deg, #f8fafc 0%, #eef2f7 100%);
    border: 1px solid #e2e8f0;
    position: relative;
    overflow: hidden;
  }
  .closing-card::before {
    content: "";
    position: absolute;
    top: 0; left: 0;
    width: 48px;
    height: 4px;
    background: linear-gradient(90deg, #1a3a5c, #4a90d9);
    border-radius: 0 0 4px 0;
  }
  .closing-eyebrow {
    font-size: 10px;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: #4a90d9;
    font-weight: 800;
    margin-bottom: 14px;
  }
  .closing-title {
    font-size: 22px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.3px;
    margin-bottom: 12px;
  }
  .closing-text {
    font-size: 13px;
    color: #475569;
    line-height: 1.62;
    max-width: 155mm;
  }

</style>
</head>
<body>

<!-- ================================================================== -->
<!-- PAGE 1 · COVER                                                      -->
<!-- ================================================================== -->
<div class="cover">
  <div class="cover-inner">
    <div>
      <div class="cover-brand">ME<span>CA</span></div>
      <div class="cover-brand-tagline">Mentalidade · Engajamento · Cultura · Alta Performance</div>
    </div>

    <div class="cover-middle">
      <div class="cover-eyebrow">Relatório pessoal · confidencial</div>
      <h1 class="cover-title">Relatório de Diagnóstico MECA</h1>
      <p class="cover-subtitle">
        Leitura estratégica do seu momento de carreira — arquétipo comportamental,
        mapeamento dos quatro pilares e plano de ação priorizado.
      </p>
      <div class="cover-accent"></div>
    </div>

    <div class="cover-recipient">
      <div class="cover-recipient-label">Preparado para</div>
      ${coverLines.join("\n      ")}
    </div>

    <div class="cover-confidential">
      Documento pessoal e intransferível · © ${new Date().getFullYear()} MECA
    </div>
  </div>
</div>

<!-- ================================================================== -->
<!-- PAGE 2 · HERO — ARCHETYPE + QUADRANT                                -->
<!-- ================================================================== -->
<section class="page hero-page">
  <div class="page-head">
    <span class="page-head-brand">ME<span>CA</span> · Relatório</span>
    <span>${emailSafe}</span>
  </div>

  <div class="hero-intro">
    <div class="hero-eyebrow">Seu arquétipo</div>
    <div class="hero-zone">${archetypeZone}</div>
    <h1 class="hero-title">
      <span class="hero-title-icon">${sanitizePdfText(archetype.icon)}</span>
      <span>${archetypeName}</span>
    </h1>
    <p class="hero-impact">${sanitizePdfText(heroImpactPhrase)}</p>
  </div>

  <div class="keep-together">
    <div class="hero-graph-label">
      <span class="hero-graph-label-text">Sua posição atual</span>
      <span class="hero-graph-label-line"></span>
    </div>
    ${quadrantGraph}
  </div>

  <div class="hero-coords">
    <div class="hero-coord">
      <span class="hero-coord-label">Capacidade (A)</span>
      <strong>${archetype.xScore.toFixed(0)}</strong>
    </div>
    <div class="hero-coord">
      <span class="hero-coord-label">Direção e Sistema (C+E)/2</span>
      <strong>${archetype.yScore.toFixed(0)}</strong>
    </div>
    <div class="hero-coord">
      <span class="hero-coord-label">Pilar de maior alavancagem</span>
      <strong>${sanitizePdfText(archetype.weakestPilarName)}</strong>
    </div>
  </div>
</section>

<!-- ================================================================== -->
<!-- PAGE 3 · EXECUTIVE SUMMARY                                          -->
<!-- ================================================================== -->
<section class="page">
  <div class="page-head">
    <span class="page-head-brand">ME<span>CA</span> · Relatório</span>
    <span>Resumo executivo</span>
  </div>

  <div class="eyebrow">Resumo do seu momento</div>
  <h2 class="section-title">Onde você está e o que está limitando o crescimento</h2>
  <p class="section-kicker">
    Síntese estratégica derivada do seu arquétipo, dos seus quatro pilares e da
    posição no mapa comportamental MECA.
  </p>

  <div class="exec-stack">
    ${executiveSummary}
  </div>
</section>

<!-- ================================================================== -->
<!-- PAGE 4 · PILLARS IN DETAIL                                          -->
<!-- ================================================================== -->
<section class="page">
  <div class="page-head">
    <span class="page-head-brand">ME<span>CA</span> · Relatório</span>
    <span>Pilares em detalhe</span>
  </div>

  <div class="eyebrow">Quatro pilares</div>
  <h2 class="section-title">Leitura por pilar — do mais fraco ao mais forte</h2>
  <p class="section-kicker">
    Cada pilar é avaliado numa escala de 0 a 100. O pilar marcado como
    <em>maior alavancagem</em> é o que tem maior potencial de destravar o seu
    próximo nível.
  </p>

  <div class="pillars-overview">
    <div class="pillars-overview-header">
      <span class="pillars-overview-title">Visão geral dos pilares</span>
      <span class="pillars-overview-hint">Escala 0 a 100</span>
    </div>
    <div class="radar-wrap">
      ${buildRadarChart(scores)}
    </div>
  </div>

  <div class="pillars-detailed">
    <div class="pillars-section-title">Leitura detalhada</div>
    <div class="pillars-grid">
      ${pillarBars}
    </div>
  </div>
</section>

<!-- ================================================================== -->
<!-- PAGE 5 · ARCHETYPE DEEP DIVE                                        -->
<!-- ================================================================== -->
<section class="page">
  <div class="page-head">
    <span class="page-head-brand">ME<span>CA</span> · Relatório</span>
    <span>Seu arquétipo</span>
  </div>

  <div class="arch-opener">
    <div class="eyebrow">Seu arquétipo</div>
    <h2 class="section-title">Identidade comportamental</h2>
    <p class="section-kicker">
      Leitura aprofundada do seu arquétipo. Estrutura: Diagnóstico · Mecânica ·
      Risco · Alavanca · Plano de ação.
    </p>

    <div class="arch-identity">
      <div class="arch-identity-zone">${archetypeZone}</div>
      <div class="arch-identity-name">
        <span class="arch-identity-icon">${sanitizePdfText(archetype.icon)}</span>
        <span>${archetypeName}</span>
      </div>
      <p class="arch-identity-tagline">${archetypeMechanics}</p>
    </div>
  </div>

  <div class="arch-grid">
    <div class="arch-block">
      <div class="arch-block-head">
        <span class="arch-block-label">Diagnóstico</span>
      </div>
      <p>${archetypeDiagnosis}</p>
    </div>

    <div class="arch-block">
      <div class="arch-block-head">
        <span class="arch-block-label">Mecânica</span>
      </div>
      <p>${archetypeMechanics}</p>
    </div>

    <div class="arch-block arch-block-risk">
      <div class="arch-block-head">
        <span class="arch-block-label">Risco</span>
        <span class="arch-block-tag">Atenção</span>
      </div>
      <p>${archetypeRisk}</p>
    </div>

    <div class="arch-block arch-block-leverage">
      <div class="arch-block-head">
        <span class="arch-block-label">Alavanca</span>
        <span class="arch-block-tag">Oportunidade</span>
      </div>
      <p>${archetypeLeverage}</p>
    </div>

    <div class="arch-block arch-block-plan">
      <div class="arch-block-head">
        <span class="arch-block-label">Plano de ação do arquétipo</span>
      </div>
      <ul class="arch-steps">
        ${archetypeActionPlan}
      </ul>
    </div>
  </div>
</section>

<!-- ================================================================== -->
<!-- PAGE 6 · ACTION PLAN (PILLAR-BASED)                                 -->
<!-- ================================================================== -->
<section class="page">
  <div class="page-head">
    <span class="page-head-brand">ME<span>CA</span> · Relatório</span>
    <span>Plano de ação</span>
  </div>

  <div class="eyebrow">Próximos passos prioritários</div>
  <h2 class="section-title">O que fazer a seguir</h2>
  <p class="section-kicker">
    Plano específico construído a partir do seu pilar de maior alavancagem.
    Ações sequenciais e acionáveis.
  </p>

  <div class="action-hero">
    <div class="action-hero-inner">
      <div class="action-hero-opener">
        <span class="action-hero-eyebrow">Plano priorizado</span>
        <div class="action-hero-pillar">Pilar foco · ${planPillar}</div>
        <div class="action-hero-title">${planTitle}</div>
        <p class="action-hero-desc">${planDesc}</p>
        <div class="action-hero-divider"></div>
        <div class="action-list-label">Checklist · Execute na ordem</div>
      </div>
      <ul class="action-list">
        ${mainPlanActions}
      </ul>
    </div>
  </div>
</section>

<!-- ================================================================== -->
<!-- PAGE 7+ · THEORIES APPENDIX                                         -->
<!-- ================================================================== -->
<section class="page">
  <div class="page-head">
    <span class="page-head-brand">ME<span>CA</span> · Relatório</span>
    <span>Fundamentos aplicados</span>
  </div>

  <div class="theories-opener">
    <div class="eyebrow">Fundamentos aplicados ao seu caso</div>
    <h2 class="section-title">Teorias que mais impactam a sua trajetória hoje</h2>
    <p class="theories-intro">
      As teorias abaixo foram selecionadas automaticamente com base nas suas menores
      pontuações individuais. Cada uma representa um padrão de comportamento que,
      quando desenvolvido, gera impacto direto na sua performance e trajetória
      profissional. O diagnóstico, a fundamentação e o plano de ação foram
      personalizados com base nas suas respostas.
    </p>
  </div>

  ${buildTheorySections(theories)}

  <div class="closing-card">
    <div class="closing-eyebrow">Continuidade</div>
    <div class="closing-title">Próximo passo</div>
    <p class="closing-text">
      Este documento é uma fotografia do seu momento atual. O diagnóstico MECA foi
      desenhado para ser revisitado ao longo do tempo — cada novo diagnóstico
      gera um novo mapa comportamental e permite medir a evolução entre pontos.
      Use este relatório como referência estratégica e volte ao método sempre que
      houver uma mudança relevante no seu contexto de carreira.
    </p>
  </div>
</section>

</body>
</html>`;

  return sanitizePdfHtmlDocument(raw);
}

// ---------------------------------------------------------------------------
// PUPPETEER RENDERING
// ---------------------------------------------------------------------------

async function renderPdfWithPuppeteer(html: string): Promise<Uint8Array> {
  const puppeteer = await import("puppeteer");
  const isProduction = process.env.NODE_ENV === "production";
  const launchArgs = isProduction
    ? []
    : ["--no-sandbox", "--disable-setuid-sandbox"];

  const browser = await puppeteer.default.launch({
    headless: true,
    args: launchArgs,
  });

  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const u = req.url();
    const allowed = ["data:", "about:"];
    if (!allowed.some((p) => u.startsWith(p))) {
      void req.abort();
    } else {
      void req.continue();
    }
  });

  try {
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 450);
        }),
    );
    const buf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0.5cm", right: "0", bottom: "0.5cm", left: "0" },
    });
    return new Uint8Array(buf);
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------------------
// ROUTE
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const guard = await requireAdminWithMfa(supabase);
  if (!guard.ok) return guard.response;
  const { user: adminUser } = guard;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  const responseId = searchParams.get("response_id");
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "user_id required" },
      { status: 400 },
    );
  }

  const service = createServiceRoleClient();
  if (!service) {
    return NextResponse.json(
      { ok: false, error: "service_role_required" },
      { status: 503 },
    );
  }

  // Get user email + name from auth metadata
  const { data: authUser, error: authErr } =
    await service.auth.admin.getUserById(userId);
  if (authErr || !authUser?.user) {
    return NextResponse.json(
      { ok: false, error: "user_not_found" },
      { status: 404 },
    );
  }
  const email = authUser.user.email ?? userId;

  const meta = (authUser.user.user_metadata ?? {}) as Record<string, unknown>;
  const rawName =
    (typeof meta.full_name === "string" ? meta.full_name : null) ??
    (typeof meta.name === "string" ? meta.name : null);
  const userName = deriveDisplayName(rawName, email);

  // Get specific or latest diagnostic
  let query = service
    .from("responses")
    .select("mentalidade, engajamento, cultura, performance, answers, created_at")
    .eq("user_id", userId);
  if (responseId) {
    query = query.eq("id", responseId);
  } else {
    query = query.order("created_at", { ascending: false }).limit(1);
  }
  const { data: rows, error: rowErr } = await query;

  if (rowErr) {
    return NextResponse.json({ ok: false, error: rowErr.message }, { status: 500 });
  }
  if (!rows || rows.length === 0) {
    return NextResponse.json(
      { ok: false, error: "no_diagnostic_found" },
      { status: 404 },
    );
  }

  const row = rows[0] as {
    mentalidade: number;
    engajamento: number;
    cultura: number;
    performance: number;
    answers: Record<string, number> | null;
    created_at: string;
  };

  const scores: MECAScores = {
    M: Math.round(Number(row.mentalidade)),
    E: Math.round(Number(row.engajamento)),
    C: Math.round(Number(row.cultura)),
    A: Math.round(Number(row.performance)),
  };

  const answers: Record<string, number> = row.answers ?? {};
  const theories = getLowestTheories(answers, 4);

  const generatedAt = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const html = buildHtml({ userName, email, scores, generatedAt, theories });

  let pdfBuffer: Uint8Array;
  try {
    pdfBuffer = await renderPdfWithPuppeteer(html);
  } catch (err) {
    logger.error("[report/generate] puppeteer error", err);
    await logAdminAction({
      action: "generate_report",
      adminUserId: adminUser.id,
      adminEmail: adminUser.email ?? null,
      targetUserId: userId,
      targetUserEmail: email,
      metadata: {
        response_id: responseId ?? null,
        outcome: "pdf_generation_failed",
      },
    });
    return NextResponse.json(
      { ok: false, error: "pdf_generation_failed" },
      { status: 500 },
    );
  }

  await logAdminAction({
    action: "generate_report",
    adminUserId: adminUser.id,
    adminEmail: adminUser.email ?? null,
    targetUserId: userId,
    targetUserEmail: email,
    metadata: {
      response_id: responseId ?? null,
      response_created_at: row.created_at,
      pdf_bytes: pdfBuffer.byteLength,
      outcome: "success",
    },
  });

  const safeName = email.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="relatorio-meca-${safeName}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
