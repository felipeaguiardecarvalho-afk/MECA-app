"use client";

type Point = { label: string; value: number };

type Props = {
  points: Point[];
  className?: string;
};

export function TrendLineChart({ points, className = "" }: Props) {
  if (points.length < 2) return null;

  const w = 560;
  const h = 200;
  const pad = { top: 16, right: 16, bottom: 36, left: 16 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;

  const values = points.map((p) => p.value);
  const minV = Math.min(0, ...values) - 5;
  const maxV = Math.max(100, ...values) + 5;
  const scaleY = (v: number) =>
    pad.top + innerH - ((v - minV) / (maxV - minV)) * innerH;
  const scaleX = (i: number) =>
    pad.left + (i / Math.max(1, points.length - 1)) * innerW;

  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(p.value)}`)
    .join(" ");

  return (
    <div className={`w-full ${className}`}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = pad.top + t * innerH;
          return (
            <line
              key={t}
              x1={pad.left}
              y1={y}
              x2={w - pad.right}
              y2={y}
              stroke="currentColor"
              strokeWidth={0.5}
              className="text-zinc-100"
            />
          );
        })}
        <path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-900"
        />
        {points.map((p, i) => (
          <g key={p.label}>
            <circle
              cx={scaleX(i)}
              cy={scaleY(p.value)}
              r={4}
              className="fill-white stroke-gray-900"
              strokeWidth={2}
            />
            <text
              x={scaleX(i)}
              y={h - 8}
              textAnchor="middle"
              className="fill-gray-500 text-[9px]"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
