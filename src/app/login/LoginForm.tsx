"use client";

import { recoverSessionFromImplicitHash } from "@/lib/auth/implicit-session-from-hash";
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
  const next = searchParams.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);
  /** null = a carregar; só mostramos o aviso âmbar em dev se o servidor disser que não há SMTP. */
  const [outboundEmailConfigured, setOutboundEmailConfigured] = useState<
    boolean | null
  >(null);

  const authError = searchParams.get("error");
  const authDetail = searchParams.get("detail");

  /**
   * Supabase redirect with implicit tokens in `#access_token=...` (Site URL → /login).
   * Server callback never sees the hash; PKCE client ignores it unless we setSession here.
   */
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    if (typeof window === "undefined") return;
    if (!window.location.hash?.includes("access_token")) return;

    const supabase = createClient();
    void (async () => {
      const result = await recoverSessionFromImplicitHash(supabase);
      if (!result.ok) {
        setStatus("error");
        setMessage(
          "Não foi possível concluir o login a partir do link. Peça um novo link.",
        );
        return;
      }
      const dest = next.startsWith("/") ? next : `/${next}`;
      router.replace(dest);
    })();
  }, [next, router]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.hash?.includes("access_token")
    ) {
      return;
    }
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

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !isSupabaseConfigured()) return;
    void fetch("/api/auth/email-outbound")
      .then((r) => r.json() as Promise<{ outboundConfigured?: boolean }>)
      .then((d) =>
        setOutboundEmailConfigured(Boolean(d?.outboundConfigured)),
      )
      .catch(() => setOutboundEmailConfigured(false));
  }, []);

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

    /**
     * Só o servidor envia o e-mail (generateLink + Gmail/Resend). Não usar
     * signInWithOtp aqui — o SMTP do projeto Supabase costuma estar vazio e
     * devolve erro enganador quando o utilizador já configurou Gmail na app.
     */
    try {
      const apiRes = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailTrim, next }),
      });

      if (apiRes.status === 429) {
        setStatus("error");
        setMessage(
          "Muitos pedidos de link. Aguarde cerca de um minuto e tente novamente.",
        );
        return;
      }

      if (apiRes.ok) {
        setStatus("sent");
        setMessage(
          "Se existir uma conta com este e-mail, receberá um link para entrar em instantes. Verifique a caixa de entrada e o spam.",
        );
        return;
      }

      setStatus("error");
      setMessage(
        "O servidor não concluiu o pedido. Confirme SUPABASE_SERVICE_ROLE_KEY no .env.local e envio por Gmail (GMAIL_USER + GMAIL_APP_PASSWORD) ou Resend (RESEND_API_KEY). Reinicie o servidor após alterar as variáveis.",
      );
    } catch {
      setStatus("error");
      setMessage(
        "Erro de rede. Verifique a sua ligação e tente novamente.",
      );
    }
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

          {process.env.NODE_ENV === "development" &&
            isSupabaseConfigured() &&
            outboundEmailConfigured === false && (
            <p className="mt-6 rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-left text-xs leading-relaxed text-amber-950">
              <strong className="font-semibold">Desenvolvimento local:</strong> o
              link mágico só chega ao e-mail se configurar envio em{" "}
              <code className="rounded bg-amber-100/80 px-1 py-0.5 font-mono text-[11px]">
                .env.local
              </code>
              :{" "}
              <code className="font-mono text-[11px]">RESEND_API_KEY</code>{" "}
              (Resend) ou{" "}
              <code className="font-mono text-[11px]">GMAIL_USER</code> +{" "}
              <code className="font-mono text-[11px]">
                GMAIL_APP_PASSWORD
              </code>
              . Sem isso, o pedido parece aceite mas a mensagem{" "}
              <span className="font-medium">não é enviada</span> — veja o
              terminal do <code className="font-mono text-[11px]">npm run dev</code>{" "}
              (mensagem{" "}
              <code className="font-mono text-[11px]">
                [magic-link] DEV fallback
              </code>
              ).
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
