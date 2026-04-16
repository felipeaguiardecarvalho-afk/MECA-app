/**
 * CRITICAL FILE — DO NOT MODIFY STRUCTURE
 * Breaking this file will destroy the UI
 */
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppNav } from "@/components/AppNav";
import { StyleGuard } from "@/components/StyleGuard";
import { TailwindFallbackBoundary } from "@/components/TailwindFallbackBoundary";
import { getMetadataBase } from "@/lib/env";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "MECA",
    template: "%s · MECA",
  },
  description:
    "Inteligência comportamental em ambientes de alta performance — diagnóstico profundo de como você pensa, decide e executa.",
  applicationName: "MECA",
  openGraph: {
    title: "MECA",
    description:
      "Inteligência comportamental em ambientes de alta performance.",
    type: "website",
    siteName: "MECA",
  },
  twitter: {
    card: "summary_large_image",
    title: "MECA",
    description:
      "Inteligência comportamental em ambientes de alta performance.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body
        className={`${inter.className} bg-white text-gray-900 antialiased`}
      >
        <StyleGuard />
        <TailwindFallbackBoundary>
          <AppNav />
          <main className="w-full min-h-[calc(100vh-4rem)] bg-white">
            {children}
          </main>
        </TailwindFallbackBoundary>
      </body>
    </html>
  );
}
