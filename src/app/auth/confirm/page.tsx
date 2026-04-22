"use client";

import { sanitizeNextParam } from "@/lib/auth/post-login-redirect";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Implicit flow has been removed. Keep this route only as a backwards-safe
 * landing page that forwards users to the PKCE callback flow.
 */
export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AuthConfirmRedirect />
    </Suspense>
  );
}

function AuthConfirmRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeNextParam(searchParams.get("next"));

  useEffect(() => {
    const url = new URL("/auth/callback", window.location.origin);
    url.searchParams.set("next", next);
    /** Preserva `#access_token=…` (fluxo implícito); `router`/`URL` sozinhos apagam o hash. */
    const dest = url.pathname + url.search + (window.location.hash || "");
    router.replace(dest);
  }, [next, router]);

  return <LoadingState />;
}

function LoadingState() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#1a3a5c]" />
      <p className="text-sm text-gray-500">A redirecionar para o callback seguro…</p>
    </div>
  );
}
