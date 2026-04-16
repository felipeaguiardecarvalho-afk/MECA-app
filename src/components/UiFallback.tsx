import type { ReactNode } from "react";

export function UiFallback({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "system-ui",
        padding: "40px",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      {children}
    </div>
  );
}
