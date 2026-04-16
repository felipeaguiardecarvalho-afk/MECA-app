"use client";

import { useEffect } from "react";

/**
 * Runtime check alinhado ao snippet original: classe `hidden` → display none.
 */
export function StyleGuard() {
  useEffect(() => {
    const test = document.createElement("div");
    test.className = "hidden";
    document.body.appendChild(test);
    const computed = window.getComputedStyle(test);
    const isWorking = computed.display === "none";
    document.body.removeChild(test);

    if (!isWorking) {
      console.error("Tailwind not working!");
      console.warn(
        "UI BROKEN: Tailwind is not loaded. Check globals.css and layout import.",
      );
    }
  }, []);

  return null;
}
