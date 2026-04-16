"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function callbackErrorMessage(
  code: string | null,
  detail: string | null,
): string | null {
  if (!code) return null;
  switch (code) {
    case "missing_code":
      return "O link de acesso está incompleto ou expirou. Peça um novo link.";
    case "exchange":
      return detail
        ? `Não foi possível concluir o login: ${detail}`
        : "Não foi possível concluir o login. Abra o link no mesmo navegador em que pediu o e-mail, ou solicite um novo link.";
    case "oauth":
      return detail
        ? `Autenticação interrompida: ${detail}`
        : "Autenticação interrompida. Tente novamente.";
    case "config":
      return "Configuração do servidor incompleta (Supabase). Contacte o suporte.";
    default:
      return "Não foi possível entrar. Tente solicitar um novo link.";
  }
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/assessment";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  const authError = searchParams.get("error");
  const authDetail = searchParams.get("detail");

  useEffect(() => {
    const text = callbackErrorMessage(authError, authDetail);
    if (text) {
      setStatus("error");
      setMessage(text);
    }
  }, [authError, authDetail]);

  /** Já com sessão (ex.: abriu o link mágico): ir para o destino. */
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const dest = next.startsWith("/") ? next : `/${next}`;
        router.replace(dest);
      }
    });
  }, [next, router]);

  async function onSubmitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setStatus("error");
      setMessage(
        "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local (veja .env.example).",
      );
      return;
    }
    setStatus("sending");
    setMessage(null);

    const emailTrim = email.trim();

    try {
      const magicRes = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailTrim, next }),
      });
      const ct = magicRes.headers.get("content-type") ?? "";
      const raw = await magicRes.text();
      const looksJson =
        ct.includes("application/json") || raw.trimStart().startsWith("{");
      if (looksJson && raw) {
        type MasterJson = {
          bypass?: boolean;
          hashed_token?: string;
          next?: string;
          detail?: string;
          error?: string;
        };
        let masterJson: MasterJson = {};
        try {
          masterJson = JSON.parse(raw) as MasterJson;
        } catch {
          masterJson = {};
        }
        if (masterJson.bypass === true && masterJson.hashed_token) {
          const supabase = createClient();
          const { error: verifyErr } = await supabase.auth.verifyOtp({
            token_hash: masterJson.hashed_token,
            type: "magiclink",
          });
          if (verifyErr) {
            setStatus("error");
            setMessage(verifyErr.message);
            return;
          }
          const dest = masterJson.next ?? "/assessment";
          router.push(dest.startsWith("/") ? dest : `/${dest}`);
          router.refresh();
          return;
        }
      }
    } catch {
      /* continuar */
    }

    const supabase = createClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: emailTrim,
      options: {
        emailRedirectTo,
        shouldCreateUser: true,
      },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage(
      "Enviámos um link para o seu e-mail. Abra o link para entrar. Após concluir o diagnóstico, o acesso fica restrito ao dashboard.",
    );
  }

  return (
    <div className="ds-page flex min-h-[calc(100dvh-4rem)] flex-col justify-center px-6">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm md:p-10">
          <div className="space-y-3 text-center">
            <h1
              className="text-2xl font-semibold tracking-tight text-gray-900"
              data-testid="login-title"
            >
              Entrar
            </h1>
            <p className="text-base text-gray-600">
              Sem senha. Enviaremos um link mágico para o seu e-mail.
            </p>
          </div>

          {!isSupabaseConfigured() && (
            <p className="mt-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              Defina as variáveis do Supabase em{" "}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                .env.local
              </code>{" "}
              e reinicie o servidor de desenvolvimento.
            </p>
          )}

          <form onSubmit={onSubmitEmail} className="mt-8 space-y-6">
            <label className="block text-left">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                E-mail
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ds-input"
                placeholder="voce@empresa.com"
                autoComplete="email"
              />
            </label>
            <button
              type="submit"
              disabled={status === "sending"}
              className="ds-btn-primary w-full disabled:opacity-50"
            >
              {status === "sending" ? "A enviar…" : "Receber link"}
            </button>
          </form>

          {message && (
            <p
              className={`mt-6 text-center text-sm ${
                status === "error" ? "text-red-600" : "text-gray-600"
              }`}
            >
              {message}
            </p>
          )}

          <p className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Voltar ao início
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
