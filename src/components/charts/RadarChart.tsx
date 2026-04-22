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

/** Primary dataset label shown in the legend. */
type LegendEntry = { label: string; color: string };

type Props = {
  values: Record<MetricKey, number>;
  /** Optional second dataset for comparison. */
  compareValues?: Record<MetricKey, number> | null;
  /** Labels shown in the legend when compareValues is provided. */
  legend?: [LegendEntry, LegendEntry];
  className?: string;
};

const PRIMARY_STROKE = "#171717";
const COMPARE_STROKE = "#4f46e5"; // indigo-600

function buildPath(values: Record<MetricKey, number>, cx: number, cy: number, maxR: number): string {
  const points = LABELS.map((lbl, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / LABELS.length;
    const v = values[lbl.key] / 100;
    const r = maxR * Math.min(1, Math.max(0, v));
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  });
  return `M ${points.join(" L ")} Z`;
}

export function RadarChart({ values, compareValues, legend, className = "" }: Props) {
  const cx = 100;
  const cy = 100;
  const maxR = 72;
  const n = LABELS.length;

  const primaryPath = buildPath(values, cx, cy, maxR);
  const comparePath = compareValues ? buildPath(compareValues, cx, cy, maxR) : null;

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
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      }).join(" ")}
    />
  ));

  const axisLines = LABELS.map((_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return (
      <line
        key={i}
        x1={cx}
        y1={cy}
        x2={cx + maxR * Math.cos(angle)}
        y2={cy + maxR * Math.sin(angle)}
        stroke="currentColor"
        strokeWidth={0.35}
        className="text-zinc-200"
      />
    );
  });

  const labelEls = LABELS.map((lbl, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const lr = maxR + 14;
    return (
      <text
        key={lbl.key}
        x={cx + lr * Math.cos(angle)}
        y={cy + lr * Math.sin(angle)}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-gray-500 text-[8px] font-medium uppercase tracking-wider md:text-[9px]"
      >
        {lbl.short}
      </text>
    );
  });

  const showLegend = comparePath !== null && legend;

  return (
    <div className={`relative mx-auto w-full max-w-[min(100%,420px)] ${className}`}>
      <svg viewBox="0 0 200 200" className="h-auto w-full overflow-visible">
        <defs>
          <linearGradient id="mecaRadarFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={PRIMARY_STROKE} stopOpacity={0.45} />
            <stop offset="100%" stopColor="#525252" stopOpacity={0.2} />
          </linearGradient>
          <linearGradient id="mecaRadarCompareFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={COMPARE_STROKE} stopOpacity={0.35} />
            <stop offset="100%" stopColor={COMPARE_STROKE} stopOpacity={0.1} />
          </linearGradient>
        </defs>

        {gridRings}
        {axisLines}

        {/* Compare dataset rendered first (below primary) */}
        {comparePath && (
          <path
            d={comparePath}
            fill="url(#mecaRadarCompareFill)"
            fillOpacity={1}
            stroke={COMPARE_STROKE}
            strokeWidth={1.2}
            strokeDasharray="3 2"
          />
        )}

        {/* Primary dataset */}
        <path
          d={primaryPath}
          fill="url(#mecaRadarFill)"
          fillOpacity={0.35}
          stroke={PRIMARY_STROKE}
          strokeWidth={1.2}
        />

        {labelEls}
      </svg>

      {/* Legend */}
      {showLegend && (
        <div className="mt-3 flex items-center justify-center gap-5 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-5 rounded-sm"
              style={{ background: legend[0].color }}
            />
            {legend[0].label}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-5 rounded-sm border border-dashed"
              style={{ borderColor: legend[1].color, background: `${legend[1].color}30` }}
            />
            {legend[1].label}
          </span>
        </div>
      )}
    </div>
  );
}
