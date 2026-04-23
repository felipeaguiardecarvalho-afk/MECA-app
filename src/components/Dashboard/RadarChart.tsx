"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- tipos do tick/tooltip do Recharts */
import React, { useId } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import { type MECAScores, PILAR_COLORS } from '@/lib/archetypes';

interface Props { scores: MECAScores; }

const PILAR_LABELS: Record<keyof MECAScores, string> = {
  M: 'Mentalidade\nEmpreendedora',
  E: 'Engajamento\nAutêntico',
  C: 'Cultura como\nMotor',
  A: 'Alta\nPerformance',
};

const PILAR_FULL: Record<keyof MECAScores, string> = {
  M: 'Mentalidade Empreendedora',
  E: 'Engajamento Autêntico',
  C: 'Cultura como Motor de Crescimento',
  A: 'Alta Performance',
};

const CustomLabel = ({ x, y, payload }: any) => {
  const lines = payload.value.split('\n');
  return (
    <g>
      {lines.map((line: string, i: number) => (
        <text key={i} x={x} y={y + (i - (lines.length - 1) / 2) * 16}
          textAnchor="middle" fill="#1a3a5c" fontSize={12} fontWeight={600}>
          {line}
        </text>
      ))}
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a3a5c', color: '#fff', padding: '8px 14px', borderRadius: 8, fontSize: 13 }}>
      <strong>{payload[0].payload.pilar.replace('\n', ' ')}</strong>: {payload[0].value}/100
    </div>
  );
};

export const MECARadarChart: React.FC<Props> = ({ scores }) => {
  const gradId = useId().replace(/:/g, "");
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const radarData = [
    { pilar: PILAR_LABELS.M, value: scores.M, fullMark: 100 },
    { pilar: PILAR_LABELS.E, value: scores.E, fullMark: 100 },
    { pilar: PILAR_LABELS.C, value: scores.C, fullMark: 100 },
    { pilar: PILAR_LABELS.A, value: scores.A, fullMark: 100 },
  ];
  const pillars: Array<keyof MECAScores> = ['M', 'E', 'C', 'A'];

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a3a5c', marginBottom: 4 }}>
        Seus 4 Pilares MECA
      </h2>
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
        Baseado em 60 perguntas · 20 teorias científicas
      </p>
      <div className="h-[520px] w-full min-w-0 sm:h-[560px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          data={radarData}
          outerRadius={isMobile ? "78%" : "62%"}
          margin={
            isMobile
              ? { top: 12, right: 10, bottom: 12, left: 10 }
              : { top: 22, right: 34, bottom: 22, left: 34 }
          }
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.42} />
              <stop offset="55%" stopColor="#3b82f6" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.08} />
            </linearGradient>
          </defs>
          <PolarGrid stroke="#e2e8f0" strokeWidth={1} />
          <PolarAngleAxis dataKey="pilar" tick={<CustomLabel />} tickLine={false} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickCount={5} />
          <Radar name="MECA" dataKey="value" stroke="#1e3a8a" strokeWidth={2.5}
            fill={`url(#${gradId})`} fillOpacity={1}
            dot={{ fill: '#1e40af', r: 5, strokeWidth: 2, stroke: '#fff' }} />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
      </div>
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {pillars.map((key) => (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 26, height: 26, borderRadius: 6, background: PILAR_COLORS[key], color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {key}
                </span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{PILAR_FULL[key]}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1a3a5c', minWidth: 42, textAlign: 'right' }}>
                {scores[key]}/100
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: '#e5e7eb', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, width: `${scores[key]}%`, background: PILAR_COLORS[key], transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MECARadarChart;
