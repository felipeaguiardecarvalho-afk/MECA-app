"use client";

import { useEffect, useRef } from "react";

export type Diagnostic = {
  id: string;
  created_at: string;
};

type Props = {
  diagnostics: Diagnostic[];
  selectedId: string;
  onChange: (id: string) => void;
};

const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

function formatDate(iso: string): string {
  const date = new Date(iso);
  return isNaN(date.getTime()) ? "—" : fmt.format(date);
}

export function DiagnosticTabs({ diagnostics, selectedId, onChange }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  /** Scroll active tab into view on selection change without layout thrash. */
  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [selectedId]);

  if (!diagnostics.length) return null;

  return (
    <div className="relative">
      {/* Left fade gradient — visual hint for overflow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-10 h-full w-6 bg-gradient-to-r from-white to-transparent"
      />

      <div
        ref={listRef}
        role="tablist"
        aria-label="Diagnósticos"
        className="flex gap-1 overflow-x-auto scroll-smooth pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {diagnostics.map((d, i) => {
          const isActive = d.id === selectedId;
          const label = formatDate(d.created_at);
          const index = i + 1;

          return (
            <button
              key={d.id}
              ref={isActive ? activeRef : undefined}
              role="tab"
              aria-selected={isActive}
              aria-label={`Diagnóstico ${index} — ${label}`}
              onClick={() => onChange(d.id)}
              className={[
                "relative shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2",
                isActive
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
              ].join(" ")}
            >
              <span className="block tabular-nums">{label}</span>
              {diagnostics.length > 1 && (
                <span
                  className={[
                    "mt-0.5 block text-center text-[10px] leading-none tabular-nums",
                    isActive ? "text-gray-300" : "text-gray-400",
                  ].join(" ")}
                >
                  #{index}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right fade gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 z-10 h-full w-6 bg-gradient-to-l from-white to-transparent"
      />
    </div>
  );
}
