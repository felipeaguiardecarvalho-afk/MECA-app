"use client";

import { AuthNav } from "@/components/AuthNav";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNav() {
  const pathname = usePathname();
  const onFundamentos = pathname === "/fundamentos";
  const onArquetipos = pathname === "/arquetipos";

  const tabClass = (active: boolean) =>
    [
      "whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-300 sm:px-4 sm:py-2 sm:text-sm",
      active
        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
        : "text-slate-600 hover:bg-white/80 hover:text-slate-900",
    ].join(" ");

  return (
    <header className="sticky top-0 z-50 w-full min-w-0 border-b border-white/40 bg-white/75 pt-[env(safe-area-inset-top)] shadow-sm shadow-slate-900/5 backdrop-blur-xl supports-[backdrop-filter]:bg-white/65">
      <div className="container-meca flex flex-col gap-2 py-2 sm:gap-0 sm:py-0">
        {/*
          Grid: [logo][nav centrada][auth] — coluna final fixa para Entrar/Sair.
        */}
        <div className="grid min-h-12 w-full min-w-0 grid-cols-[auto_1fr_auto] items-center gap-x-3 sm:min-h-14 sm:gap-x-4">
          <div className="flex min-w-0 items-center">
            <Link
              href="/"
              className="bg-gradient-to-r from-slate-900 to-indigo-800 bg-clip-text text-[15px] font-bold tracking-tight text-transparent transition-opacity hover:opacity-90"
            >
              MECA
            </Link>
          </div>

          <nav
            className="flex min-w-0 items-center justify-self-center gap-1 rounded-2xl border border-slate-200/60 bg-slate-100/50 p-1 shadow-inner backdrop-blur-sm"
            aria-label="Seções do MECA"
          >
            <Link href="/fundamentos" className={tabClass(onFundamentos)}>
              Fundamentos
            </Link>
            <Link href="/arquetipos" className={tabClass(onArquetipos)}>
              Arquétipos
            </Link>
          </nav>

          <div className="flex min-w-[7rem] items-center justify-end justify-self-end sm:min-w-0">
            <AuthNav />
          </div>
        </div>
      </div>
    </header>
  );
}
