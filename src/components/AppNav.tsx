"use client";

import { AuthNav } from "@/components/AuthNav";
import Link from "next/link";

export function AppNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-[15px] font-semibold tracking-tight text-gray-900"
        >
          MECA
        </Link>
        <AuthNav />
      </div>
    </header>
  );
}
