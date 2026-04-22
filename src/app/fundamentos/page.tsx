"use client";

import { Suspense } from "react";
import { MECAPillarsSection } from "@/components/MECAPillarsSection";

function PillarsFallback() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-3 px-2 py-4" aria-busy aria-label="A carregar">
      <div className="h-10 w-full animate-shimmer rounded-2xl" />
      <div className="h-48 w-full animate-shimmer rounded-2xl" />
    </div>
  );
}

export default function FundamentosPage() {
  return (
    <div className="w-full min-w-0 bg-gradient-to-b from-transparent via-white/50 to-indigo-50/20 py-4 sm:py-5 lg:py-7">
      <div className="container-meca pb-4 pt-3 sm:pb-5 sm:pt-4">
        <header className="mb-5 text-center sm:mb-6">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
            Base científica
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Fundamentos do Método MECA
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
            Entenda as teorias por trás do seu diagnóstico
          </p>
        </header>
        <Suspense fallback={<PillarsFallback />}>
          <MECAPillarsSection />
        </Suspense>
      </div>
    </div>
  );
}
