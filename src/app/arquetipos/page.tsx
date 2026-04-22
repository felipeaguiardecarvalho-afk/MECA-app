"use client";

import { ArquetiposSection } from "@/components/arquetipos/ArquetiposSection";

export default function ArquetiposPage() {
  return (
    <div className="w-full min-w-0 bg-gradient-to-b from-transparent via-white/50 to-indigo-50/20 py-4 sm:py-5 lg:py-7">
      <div className="container-meca pb-4 pt-3 sm:pb-5 sm:pt-4">
        <header className="mb-5 text-center sm:mb-6">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
            Perfis MECA
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Arquétipos MECA
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
            Os 8 perfis comportamentais que explicam seu momento de carreira
            com base nos pilares do MECA.
          </p>
        </header>
        <ArquetiposSection />
      </div>
    </div>
  );
}
