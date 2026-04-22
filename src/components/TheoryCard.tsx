"use client";

import type { Theory } from "@/lib/meca-theories";
import { BookOpen } from "lucide-react";

type Props = {
  theory: Theory;
  onOpen: (theory: Theory) => void;
};

export function TheoryCard({ theory, onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={() => onOpen(theory)}
      className={[
        "group flex h-full w-full flex-col justify-between rounded-2xl border border-slate-200/70 bg-white/85 p-5 text-left shadow-md backdrop-blur-md",
        "transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200/80 hover:shadow-premium-hover",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
      ].join(" ")}
    >
      <div>
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-indigo-50 text-indigo-600 shadow-sm transition-all duration-300 group-hover:from-indigo-600 group-hover:to-blue-600 group-hover:text-white group-hover:shadow-glow-sm">
          <BookOpen className="h-5 w-5" aria-hidden />
        </div>
        <h3 className="text-base font-bold tracking-tight text-slate-900">
          {theory.title}{" "}
          <span className="text-sm font-normal text-slate-400">({theory.originalName})</span>
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {theory.short}
        </p>
      </div>
      <span className="mt-4 text-xs font-semibold text-indigo-600 transition-colors group-hover:text-indigo-700">
        Ver detalhes →
      </span>
    </button>
  );
}
