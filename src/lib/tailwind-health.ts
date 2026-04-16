/**
 * Verifica se utilitários Tailwind críticos estão aplicados (hidden + bg-black + rounded).
 */

export function isTailwindCssApplied(): boolean {
  if (typeof window === "undefined") return true;

  const testHidden = document.createElement("div");
  testHidden.className = "hidden";
  document.body.appendChild(testHidden);
  const hiddenOk = window.getComputedStyle(testHidden).display === "none";
  document.body.removeChild(testHidden);
  if (!hiddenOk) return false;

  const testSurface = document.createElement("div");
  testSurface.className = "bg-black text-white p-10 rounded-xl";
  document.body.appendChild(testSurface);
  const bg = window.getComputedStyle(testSurface).backgroundColor;
  const radius = window.getComputedStyle(testSurface).borderRadius;
  document.body.removeChild(testSurface);

  const bgOk = bg === "rgb(0, 0, 0)" || bg === "rgb(0,0,0)";
  const roundedOk =
    radius !== "0px" && radius !== "" && parseFloat(radius) > 0;

  return bgOk && roundedOk;
}
