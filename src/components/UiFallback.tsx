import type { ReactNode } from "react";

export function UiFallback({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: "40px 24px",
        maxWidth: "800px",
        margin: "0 auto",
        lineHeight: 1.5,
        color: "#111827",
        background: "#fff",
      }}
    >
      {children}
    </div>
  );
}
