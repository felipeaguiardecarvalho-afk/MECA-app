"use client";

import React, { useEffect, useState } from "react";
import {
  ARCHETYPES,
  ZONES,
  archetypesInZone,
  type ArchetypeResult,
  type ZoneKey,
} from "@/lib/archetypes";

interface Props {
  archetype: ArchetypeResult;
}

const ZONE_GRID: Record<ZoneKey, string> = {
  potencial_desperdicado: "1 / 1 / 2 / 2",
  aceleracao: "1 / 2 / 2 / 3",
  invisibilidade: "2 / 1 / 3 / 2",
  esforco_invisivel: "2 / 2 / 3 / 3",
};

const ZONE_ORDER: ZoneKey[] = [
  "potencial_desperdicado",
  "aceleracao",
  "invisibilidade",
  "esforco_invisivel",
];

export const ArchetypeMatrix: React.FC<Props> = ({ archetype }) => {
  const [animated, setAnimated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const dotX = `${archetype.xScore}%`;
  const dotY = `${100 - archetype.yScore}%`;

  return (
    <div style={{ width: "100%" }}>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#1a3a5c",
          marginBottom: 4,
        }}
      >
        Arquétipo MECA
      </h2>
      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
        Sua posição nas 4 zonas e nos 8 arquétipos do método
      </p>

      <div
        style={{
          position: "relative",
          paddingTop: isMobile ? 28 : 36,
          paddingBottom: isMobile ? 28 : 36,
          paddingLeft: isMobile ? 12 : 96,
          paddingRight: isMobile ? 18 : 96,
        }}
      >
        {/* Axis labels — X = Capacidade (horizontal), Y = Direção e Sistema (vertical) */}
        <div
          style={{
            position: "absolute",
            top: 4,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: isMobile ? 10 : 12,
            fontWeight: 700,
            color: "#1a3a5c",
            whiteSpace: "nowrap",
            textAlign: "center",
          }}
        >
          ↑ ALTA DIREÇÃO E SISTEMA
          {!isMobile ? (
            <div
              style={{ fontSize: 10, fontWeight: 500, color: "#6b7280", marginTop: 2 }}
            >
              Leitura de contexto · Posicionamento · Engajamento (C+E)
            </div>
          ) : null}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 4,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: isMobile ? 10 : 12,
            fontWeight: 700,
            color: "#1a3a5c",
            whiteSpace: "nowrap",
            textAlign: "center",
          }}
        >
          ↓ BAIXA DIREÇÃO E SISTEMA
        </div>
        <div
          style={{
            position: "absolute",
            left: 4,
            top: "50%",
            transform: "translateY(-50%) rotate(-90deg)",
            transformOrigin: "center",
            fontSize: isMobile ? 10 : 12,
            fontWeight: 700,
            color: "#1a3a5c",
            whiteSpace: "nowrap",
            width: isMobile ? 120 : 180,
            textAlign: "center",
          }}
        >
          ← BAIXA CAPACIDADE
        </div>
        <div
          style={{
            position: "absolute",
            right: isMobile ? -30 : -60,
            top: "50%",
            transform: "translateY(-50%) rotate(90deg)",
            transformOrigin: "center",
            fontSize: isMobile ? 10 : 12,
            fontWeight: 700,
            color: "#1a3a5c",
            whiteSpace: "nowrap",
            width: isMobile ? 120 : 180,
            textAlign: "center",
          }}
        >
          ALTA CAPACIDADE →
        </div>

        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            aspectRatio: "1 / 1",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            overflow: "hidden",
            background: "#ffffff",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              bottom: 0,
              width: 1.5,
              background: "#94a3b8",
              zIndex: 2,
              transform: "translateX(-50%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: 1.5,
              background: "#94a3b8",
              zIndex: 2,
              transform: "translateY(-50%)",
            }}
          />

          {ZONE_ORDER.map((zoneKey) => {
            const zone = ZONES[zoneKey];
            const archetypesHere = archetypesInZone(zoneKey);
            const isActive = archetype.positionZone === zoneKey;
            return (
              <div
                key={zoneKey}
                style={{
                  gridArea: ZONE_GRID[zoneKey],
                  background: zone.bgColor,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  padding: isMobile ? "8px 6px 12px" : "14px 12px 20px",
                  opacity: isActive ? 1 : 0.75,
                  transition: "opacity 0.5s ease",
                  gap: isMobile ? 6 : 10,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: isMobile ? 9 : 10,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: zone.textColor,
                    opacity: 0.85,
                  }}
                >
                  {zone.label}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: isMobile ? 4 : 6,
                  }}
                >
                  {archetypesHere.map((a) => {
                    const isUser = a.key === archetype.key;
                    return (
                      <span
                        key={a.key}
                        style={{
                          fontSize: isMobile ? 9 : 10.5,
                          fontWeight: isUser ? 800 : 600,
                          color: isUser ? "#ffffff" : zone.textColor,
                          background: isUser ? "#1a3a5c" : "rgba(255,255,255,0.7)",
                          padding: isMobile ? "3px 6px" : "4px 8px",
                          borderRadius: 999,
                          border: isUser
                            ? "1.5px solid #1a3a5c"
                            : "1px solid rgba(0,0,0,0.08)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span style={{ marginRight: 4 }}>{a.icon}</span>
                        {a.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* User position dot with glow */}
          <div
            style={{
              position: "absolute",
              left: dotX,
              top: dotY,
              transform: "translate(-50%, -50%)",
              zIndex: 10,
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(26,58,92,0.22)",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                animation: "mecaPulse 2s infinite",
              }}
            />
            <div
              title={`${archetype.name} | Capacidade (A): ${Math.round(archetype.xScore)} | Direção e Sistema (C+E): ${Math.round(archetype.yScore)}`}
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#1a3a5c",
                border: "3px solid #ffffff",
                boxShadow: "0 3px 10px rgba(26,58,92,0.5)",
                cursor: "pointer",
                transform: animated ? "scale(1)" : "scale(0)",
                transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1)",
                position: "relative",
                zIndex: 2,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: isMobile ? 16 : 28,
                top: isMobile ? -14 : -18,
                background: "#1a3a5c",
                color: "#fff",
                fontSize: isMobile ? 9 : 10,
                fontWeight: 700,
                padding: isMobile ? "2px 6px" : "3px 8px",
                borderRadius: 6,
                whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(26,58,92,0.3)",
                opacity: animated ? 1 : 0,
                transition: "opacity 0.5s ease",
              }}
            >
              Você está aqui
            </div>
          </div>
        </div>
      </div>

      {/* Score readouts aligned with the new axes */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 14,
          padding: "10px 14px",
          background: "#f8fafc",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>
            Capacidade (A)
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1a3a5c" }}>
            {Math.round(archetype.xScore)}
            <span style={{ fontSize: 12, fontWeight: 500, color: "#9ca3af" }}>
              /100
            </span>
          </div>
        </div>
        <div style={{ width: 1, background: "#e5e7eb" }} />
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>
            Direção e Sistema (C+E)
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1a3a5c" }}>
            {Math.round(archetype.yScore)}
            <span style={{ fontSize: 12, fontWeight: 500, color: "#9ca3af" }}>
              /100
            </span>
          </div>
        </div>
        <div style={{ width: 1, background: "#e5e7eb" }} />
        <div style={{ textAlign: "center", flex: 1.3 }}>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2 }}>
            Arquétipo
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#1a3a5c",
              lineHeight: 1.2,
            }}
          >
            {ARCHETYPES[archetype.key].icon} {archetype.name}
          </div>
        </div>
      </div>

      <style>{`@keyframes mecaPulse { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.65} 50%{transform:translate(-50%,-50%) scale(1.8);opacity:0} }`}</style>
    </div>
  );
};

export default ArchetypeMatrix;
