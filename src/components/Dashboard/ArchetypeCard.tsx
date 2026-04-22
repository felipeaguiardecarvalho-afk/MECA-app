import React from "react";
import {
  PILAR_COLORS,
  type ArchetypeResult,
  type MECAScores,
} from "@/lib/archetypes";

interface Props {
  archetype: ArchetypeResult;
  scores: MECAScores;
  onActionPlan?: () => void;
}

const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    style={{ flexShrink: 0, marginTop: 2 }}
  >
    <circle cx="7" cy="7" r="7" fill="#1a3a5c" />
    <path
      d="M4 7l2 2 4-4"
      stroke="#fff"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Section: React.FC<{ label: string; children: React.ReactNode; accent?: string }> = ({
  label,
  children,
  accent = "#1a3a5c",
}) => (
  <div
    style={{
      background: "#f8fafc",
      borderLeft: `3px solid ${accent}`,
      borderRadius: "0 8px 8px 0",
      padding: "12px 16px",
      marginBottom: 12,
    }}
  >
    <div
      style={{
        fontSize: 10,
        fontWeight: 800,
        color: "#6b7280",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: 6,
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: 14, fontWeight: 500, color: "#1a3a5c", lineHeight: 1.55 }}>
      {children}
    </div>
  </div>
);

export const ArchetypeCard: React.FC<Props> = ({ archetype, scores, onActionPlan }) => {
  const weakColor = PILAR_COLORS[archetype.weakestPilar];
  const { report } = archetype;

  return (
    <div
      className="group h-full w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-premium backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200/70 hover:shadow-premium-hover"
    >
      <div
        style={{
          background: archetype.bgColor,
          padding: "22px 26px",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 13,
            background: "#1a3a5c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            flexShrink: 0,
            color: "#fff",
          }}
        >
          {archetype.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#6b7280",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 3,
            }}
          >
            {archetype.zoneLabel}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: archetype.textColor,
              letterSpacing: "-0.4px",
              lineHeight: 1.15,
            }}
          >
            {archetype.name}
          </div>
        </div>
      </div>

      <div style={{ padding: "22px 26px" }}>
        <Section label="Diagnóstico">{report.diagnosis}</Section>
        <Section label="Mecânica">{report.mechanics}</Section>
        <Section label="Risco" accent="#c53030">
          {report.risk}
        </Section>
        <Section label="Alavanca" accent="#059669">
          {report.leverage}
        </Section>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "4px 0 18px",
            padding: "10px 14px",
            background: `${weakColor}14`,
            borderRadius: 10,
            border: `1px solid ${weakColor}33`,
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: weakColor,
              color: "#fff",
              fontSize: 12,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {archetype.weakestPilar}
          </div>
          <span style={{ fontSize: 13, color: "#374151" }}>
            <strong>Ponto de atenção:</strong> {archetype.weakestPilarName}{" "}
            <span style={{ color: weakColor, fontWeight: 700 }}>
              ({scores[archetype.weakestPilar]}/100)
            </span>
          </span>
        </div>

        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 10,
            }}
          >
            Plano de ação
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {report.action_plan.map((step, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <CheckIcon />
                <span
                  style={{
                    fontSize: 14,
                    color: "#1a3a5c",
                    lineHeight: 1.55,
                    fontWeight: 500,
                  }}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onActionPlan}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-bold tracking-tight text-white shadow-md shadow-blue-500/25 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]"
        >
          Ver Plano de Ação Completo <span className="text-base">→</span>
        </button>
      </div>
    </div>
  );
};

export default ArchetypeCard;
