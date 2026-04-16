"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { isTailwindCssApplied } from "@/lib/tailwind-health";
import { UiFallback } from "@/components/UiFallback";

/**
 * Se o CSS do Tailwind falhar, envolve a árvore com estilos inline mínimos.
 */
export function TailwindFallbackBoundary({ children }: { children: ReactNode }) {
  const [tailwindOk, setTailwindOk] = useState<boolean | null>(null);

  useEffect(() => {
    const ok = isTailwindCssApplied();
    if (!ok) {
      console.error("Tailwind not working!");
      console.warn(
        "UI BROKEN: Tailwind is not loaded. Check globals.css and layout import.",
      );
    }
    setTailwindOk(ok);
  }, []);

  if (tailwindOk === false) {
    return <UiFallback>{children}</UiFallback>;
  }

  return (
    <>
      {tailwindOk === true && process.env.NODE_ENV === "development" ? (
        <div
          className="bg-black text-white p-10 rounded-xl pointer-events-none fixed bottom-4 right-4 z-[9999] text-xs shadow-lg"
          aria-hidden
        >
          UI OK
        </div>
      ) : null}
      {children}
    </>
  );
}
