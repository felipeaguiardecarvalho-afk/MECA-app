import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Arquétipos",
  description:
    "Os 8 perfis comportamentais que explicam seu momento de carreira com base nos pilares do MECA.",
};

export default function ArquetiposLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return children;
}
