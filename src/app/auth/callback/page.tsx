import { Suspense } from "react";
import { AuthCallbackClient } from "./AuthCallbackClient";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"
            aria-hidden
          />
          <p className="text-sm text-slate-600">A carregar…</p>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
