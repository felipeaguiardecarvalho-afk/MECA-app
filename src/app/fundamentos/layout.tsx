import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Fundamentos",
  description:
    "Entenda as teorias por trás do seu diagnóstico — pilares Mentalidade, Engajamento, Cultura e Alta performance.",
};

export default function FundamentosLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return children;
}
