"use client";

import type { MetricKey } from "@/lib/types";

const LABELS: { key: MetricKey; short: string }[] = [
  { key: "mentalidade", short: "Mental." },
  { key: "engajamento", short: "Engaj." },
  { key: "cultura", short: "Cultura" },
  { key: "performance", short: "Perform." },
  { key: "direction", short: "Direção" },
  { key: "capacity", short: "Capac." },
];

type Props = {
  values: Record<MetricKey, number>;
  className?: string;
};

export function RadarChart({ values, className = "" }: Props) {
  const cx = 100;
  const cy = 100;
  const maxR = 72;
  const n = 6;
  const points: string[] = [];
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const v = values[LABELS[i].key] / 100;
    const r = maxR * Math.min(1, Math.max(0, v));
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  const pathD = `M ${points.join(" L ")} Z`;

  const gridRings = [0.25, 0.5, 0.75, 1].map((t) => (
    <polygon
      key={t}
      fill="none"
      stroke="currentColor"
      strokeWidth={0.35}
      className="text-zinc-200"
      points={Array.from({ length: n }, (_, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const r = maxR * t;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        return `${x},${y}`;
      }).join(" ")}
    />
  ));

  const axisLines = LABELS.map((_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const x2 = cx + maxR * Math.cos(angle);
    const y2 = cy + maxR * Math.sin(angle);
    return (
      <line
        key={i}
        x1={cx}
        y1={cy}
        x2={x2}
        y2={y2}
        stroke="currentColor"
        strokeWidth={0.35}
        className="text-zinc-200"
      />
    );
  });

  const labels = LABELS.map((lbl, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const lr = maxR + 14;
    const x = cx + lr * Math.cos(angle);
    const y = cy + lr * Math.sin(angle);
    return (
      <text
        key={lbl.key}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-gray-500 text-[8px] font-medium uppercase tracking-wider md:text-[9px]"
      >
        {lbl.short}
      </text>
    );
  });

  return (
    <div className={`relative mx-auto w-full max-w-[min(100%,420px)] ${className}`}>
      <svg viewBox="0 0 200 200" className="h-auto w-full overflow-visible">
        {gridRings}
        {axisLines}
        <path
          d={pathD}
          fill="url(#mecaRadarFill)"
          fillOpacity={0.35}
          stroke="currentColor"
          strokeWidth={1.2}
          className="text-gray-900"
        />
        <defs>
          <linearGradient id="mecaRadarFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#171717" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#525252" stopOpacity={0.2} />
          </linearGradient>
        </defs>
        {labels}
      </svg>
    </div>
  );
}
