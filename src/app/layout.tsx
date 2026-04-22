import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./critical-fallback.css";
import "./globals.css";
import { AppNav } from "@/components/AppNav";
import { MecaAttribution } from "@/components/MecaAttribution";
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
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body
        className={`${inter.className} flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 text-slate-900 antialiased`}
      >
        <StyleGuard />
        <TailwindFallbackBoundary>
          <AppNav />
          <main className="w-full min-w-0 flex-1 overflow-x-hidden">
            {children}
          </main>
          <footer
            className="mt-auto w-full border-t border-slate-200/60 bg-white/50 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm"
            role="contentinfo"
          >
            <div className="container-meca">
              <MecaAttribution className="text-center" />
            </div>
          </footer>
        </TailwindFallbackBoundary>
      </body>
    </html>
  );
}
