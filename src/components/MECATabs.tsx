"use client";

import type { Pillar } from "@/lib/meca-theories";

type Props = {
  pillars: Pillar[];
  activePillar: Pillar["id"];
  onChange: (id: Pillar["id"]) => void;
};

export function MECATabs({ pillars, activePillar, onChange }: Props) {
  return (
    <div className="w-full">
      <div
        role="tablist"
        aria-label="Pilares MECA"
        className="grid w-full grid-cols-4 gap-1.5 rounded-2xl border border-slate-200/70 bg-slate-100/60 p-1.5 shadow-inner backdrop-blur-sm sm:gap-2 sm:p-2"
      >
        {pillars.map((p) => {
          const isActive = p.id === activePillar;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              id={`meca-tab-${p.id}`}
              aria-controls={`meca-panel-${p.id}`}
              onClick={() => onChange(p.id)}
              className={[
                "flex min-h-[4.75rem] w-full flex-col items-center justify-center rounded-xl py-3 text-center text-sm font-semibold transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                isActive
                  ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                  : "text-slate-600 hover:bg-white/90 hover:text-slate-900 hover:shadow-sm",
              ].join(" ")}
            >
              <span className="block text-base font-bold leading-none tracking-tight">
                {p.id}
              </span>
              <span
                className={[
                  "mt-1.5 block max-w-full px-0.5 text-[10px] font-medium leading-tight sm:text-[11px]",
                  isActive ? "text-white/95" : "text-slate-500",
                ].join(" ")}
              >
                {p.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
