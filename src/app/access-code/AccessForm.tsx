"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function AccessForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/assessment";
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [provisionState, setProvisionState] = useState<
    "checking" | "need_org_code" | "bootstrap_failed"
  >("checking");

  useEffect(() => {
    let cancelled = false;

    async function provisionEmailAccess() {
      const stateRes = await fetch("/api/user/access-state");
      const stateJson = await stateRes.json().catch(() => ({}));

      if (cancelled) return;

      if (stateRes.status === 401) {
        setProvisionState("need_org_code");
        return;
      }

      function redirectIfGranted(json: {
        has_access_grant?: boolean;
        can_take_diagnostic?: boolean;
      }) {
        if (!json?.has_access_grant) return false;
        if (json.can_take_diagnostic === true) {
          const dest =
            next.startsWith("/") && !next.startsWith("//") ? next : "/assessment";
          const safe =
            dest === "/access-code" || dest.startsWith("/access-code")
              ? "/assessment"
              : dest;
          router.replace(safe);
          return true;
        }
        router.replace("/dashboard");
        return true;
      }

      if (stateRes.ok && stateJson?.ok && redirectIfGranted(stateJson)) {
        return;
      }

      const boot = await fetch("/api/auth/bootstrap-email-grant", {
        method: "POST",
      });
      const bootJson = await boot.json().catch(() => ({}));

      if (cancelled) return;

      if (boot.ok && bootJson?.ok) {
        const again = await fetch("/api/user/access-state");
        const againJson = await again.json().catch(() => ({}));
        if (again.ok && againJson?.ok && redirectIfGranted(againJson)) {
          return;
        }
      }

      setProvisionState(
        bootJson?.error === "no_service_role"
          ? "bootstrap_failed"
          : "need_org_code",
      );
    }

    void provisionEmailAccess();

    return () => {
      cancelled = true;
    };
  }, [next, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    const res = await fetch("/api/access-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      setStatus("error");
      setError(
        mapError(data.error) ??
          "Código inválido ou indisponível. Verifique com quem emitiu o acesso.",
      );
      return;
    }
    setStatus("idle");
    router.push(next);
    router.refresh();
  }

  if (provisionState === "checking") {
    return (
      <div className="ds-page flex min-h-[calc(100dvh-4rem)] flex-col justify-center">
        <div className="mx-auto w-full max-w-md space-y-6 text-center">
          <p className="ds-body text-gray-600">A preparar o seu acesso…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-page flex min-h-[calc(100dvh-4rem)] flex-col justify-center">
      <div className="mx-auto w-full max-w-md space-y-10">
        <div className="space-y-4 text-center">
          <h1 className="ds-heading">Código da organização</h1>
          <p className="ds-body">
            Este passo só é necessário se a sua empresa lhe tiver dado um código
            (ex. MECA-…). Quem entra só com e-mail deve receber o acesso
            automaticamente — experimente{" "}
            <Link href="/assessment" className="font-medium text-gray-900 underline">
              abrir o diagnóstico
            </Link>{" "}
            ou{" "}
            <Link href="/login" className="font-medium text-gray-900 underline">
              voltar ao login
            </Link>
            .
          </p>
          {provisionState === "bootstrap_failed" && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
              O acesso por e-mail precisa da função SQL no Supabase ou de{" "}
              <code className="rounded bg-amber-100 px-1 text-xs">
                SUPABASE_SERVICE_ROLE_KEY
              </code>{" "}
              no servidor. Aplique a migração{" "}
              <code className="rounded bg-amber-100 px-1 text-xs">
                0005_ensure_email_access_grant.sql
              </code>{" "}
              (ou faça <code className="rounded bg-amber-100 px-1 text-xs">supabase db push</code>
              ) e reinicie a app.
            </p>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-8">
          <label className="block text-left">
            <span className="ds-small font-medium text-gray-700">Código</span>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="ds-input font-mono"
              placeholder="MECA-…"
              autoComplete="off"
            />
          </label>
          <button
            type="submit"
            disabled={status === "loading"}
            className="ds-btn-primary w-full disabled:opacity-50"
          >
            {status === "loading" ? "A validar…" : "Continuar"}
          </button>
        </form>

        {error && (
          <p className="text-center text-sm text-red-600">{error}</p>
        )}

        <p className="text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
            Voltar ao início
          </Link>
        </p>
      </div>
    </div>
  );
}

function mapError(code: string | undefined): string | null {
  switch (code) {
    case "invalid":
      return "Código não encontrado.";
    case "inactive":
      return "Este código está desativado.";
    case "expired":
      return "Este código expirou.";
    case "limit_exceeded":
      return "Limite de uso deste código foi atingido.";
    case "code_already_used":
      return "Este código já foi utilizado. Cada código só pode ser usado uma vez.";
    case "unauthenticated":
      return "Faça login antes de validar o código.";
    default:
      return null;
  }
}
