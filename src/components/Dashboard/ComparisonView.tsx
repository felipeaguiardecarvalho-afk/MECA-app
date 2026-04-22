"use client";

import React from "react";
import { MECARadarChart } from "./RadarChart";
import {
  getArchetype,
  type MECAScores,
  PILAR_COLORS,
  PILAR_NAMES,
} from "@/lib/archetypes";

interface DiagnosticData {
  id: string;
  created_at: string;
  scores: MECAScores;
}

interface Props {
  older: DiagnosticData;
  newer: DiagnosticData;
}

function formatDateFull(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const PILLARS: Array<keyof MECAScores> = ["M", "E", "C", "A"];

function deltaLabel(delta: number): string {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `${delta}`;
  return "0";
}

function DeltaRow({
  pilar,
  olderVal,
  newerVal,
}: {
  pilar: keyof MECAScores;
  olderVal: number;
  newerVal: number;
}) {
  const delta = newerVal - olderVal;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            background: PILAR_COLORS[pilar],
            color: "#fff",
            fontSize: 11,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {pilar}
        </span>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
          {PILAR_NAMES[pilar]}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "flex-end",
          rowGap: 6,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "#9ca3af",
            fontWeight: 500,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {olderVal}
        </span>
        <span style={{ color: "#d1d5db" }}>→</span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#1a3a5c",
          }}
        >
          {newerVal}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color:
              delta > 0 ? "#059669" : delta < 0 ? "#dc2626" : "#9ca3af",
            minWidth: 32,
            textAlign: "right",
          }}
        >
          {deltaLabel(delta)}
        </span>
      </div>
    </div>
  );
}

export const ComparisonView: React.FC<Props> = ({ older, newer }) => {
  const archetypeOlder = getArchetype(older.scores);
  const archetypeNewer = getArchetype(newer.scores);

  return (
    <div className="min-w-0 space-y-8">
      {/* Side-by-side radar + archetype — fluid 1 → 2 columns at md+ */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:gap-10">
        {/* LEFT — older */}
        <div
          className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_4px_24px_rgba(26,58,92,0.07)]"
        >
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid #f3f4f6",
              background: "#fafbfc",
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                fontWeight: 500,
                marginBottom: 2,
              }}
            >
              Diagnóstico anterior
            </p>
            <p
              style={{ fontSize: 14, fontWeight: 700, color: "#1a3a5c" }}
            >
              {formatDateFull(older.created_at)}
            </p>
          </div>
          <div style={{ padding: 24 }}>
            <MECARadarChart scores={older.scores} />
          </div>
          <div
            style={{
              padding: "16px 24px 20px",
              borderTop: "1px solid #f3f4f6",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: archetypeOlder.bgColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {archetypeOlder.icon}
              </div>
              <div>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Arquétipo
                </p>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#1a3a5c",
                  }}
                >
                  {archetypeOlder.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — newer */}
        <div
          className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_4px_24px_rgba(26,58,92,0.07)]"
        >
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid #f3f4f6",
              background: "#eef3f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  fontWeight: 500,
                  marginBottom: 2,
                }}
              >
                Diagnóstico mais recente
              </p>
              <p
                style={{ fontSize: 14, fontWeight: 700, color: "#1a3a5c" }}
              >
                {formatDateFull(newer.created_at)}
              </p>
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                background: "#1a3a5c",
                color: "#fff",
                padding: "3px 8px",
                borderRadius: 5,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Mais recente
            </span>
          </div>
          <div style={{ padding: 24 }}>
            <MECARadarChart scores={newer.scores} />
          </div>
          <div
            style={{
              padding: "16px 24px 20px",
              borderTop: "1px solid #f3f4f6",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: archetypeNewer.bgColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {archetypeNewer.icon}
              </div>
              <div>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Arquétipo
                </p>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#1a3a5c",
                  }}
                >
                  {archetypeNewer.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delta table */}
      <div className="min-w-0 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_4px_24px_rgba(26,58,92,0.07)] sm:p-6 md:p-8">
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#1a3a5c",
            marginBottom: 4,
          }}
        >
          Evolução por pilar
        </h3>
        <p
          style={{
            fontSize: 12,
            color: "#9ca3af",
            marginBottom: 14,
          }}
        >
          {formatDateFull(older.created_at)} → {formatDateFull(newer.created_at)}
        </p>
        {PILLARS.map((p) => (
          <DeltaRow
            key={p}
            pilar={p}
            olderVal={older.scores[p]}
            newerVal={newer.scores[p]}
          />
        ))}
      </div>
    </div>
  );
};

export default ComparisonView;
