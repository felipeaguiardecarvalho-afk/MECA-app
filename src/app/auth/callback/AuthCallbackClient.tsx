"use client";

import { recoverSessionFromImplicitHash } from "@/lib/auth/implicit-session-from-hash";
import { sanitizeNextParam } from "@/lib/auth/post-login-redirect";
import { logger } from "@/lib/logger";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const VERIFY_OTP_TYPES = new Set<EmailOtpType>([
  "magiclink",
  "email",
  "signup",
]);

/**
 * Troca `code` (PKCE), `token_hash`+`type` (links do GoTrue) ou tokens no **hash**
 * (fluxo implícito — o servidor nunca vê o fragmento, por isso não pode ser Route Handler).
 */
export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hint, setHint] = useState("A concluir o login…");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    void (async () => {
      if (!isSupabaseConfigured()) {
        router.replace("/login?error=config");
        return;
      }

      const nextRaw = searchParams.get("next");
      const next = sanitizeNextParam(nextRaw);

      const oauthError = searchParams.get("error");
      const oauthDesc = searchParams.get("error_description");
      if (oauthError) {
        const q = new URLSearchParams();
        q.set("next", next);
        q.set("error", "oauth");
        if (oauthDesc) q.set("detail", oauthDesc);
        router.replace(`/login?${q.toString()}`);
        return;
      }

      const supabase = createClient();
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const otpTypeRaw = searchParams.get("type");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          logger.error("[auth/callback] exchangeCodeForSession failed", error);
          router.replace(
            `/login?next=${encodeURIComponent(next)}&error=exchange`,
          );
          return;
        }
        router.replace(next.startsWith("/") ? next : `/${next}`);
        return;
      }

      if (
        tokenHash &&
        otpTypeRaw &&
        VERIFY_OTP_TYPES.has(otpTypeRaw as EmailOtpType)
      ) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: otpTypeRaw as EmailOtpType,
        });
        if (error) {
          logger.error("[auth/callback] verifyOtp failed", error);
          router.replace(
            `/login?next=${encodeURIComponent(next)}&error=exchange`,
          );
          return;
        }
        router.replace(next.startsWith("/") ? next : `/${next}`);
        return;
      }

      setHint("A validar sessão…");
      if (
        typeof window !== "undefined" &&
        window.location.hash?.includes("access_token")
      ) {
        const result = await recoverSessionFromImplicitHash(supabase);
        if (result.ok) {
          router.replace(next.startsWith("/") ? next : `/${next}`);
          return;
        }
        router.replace(
          `/login?next=${encodeURIComponent(next)}&error=exchange`,
        );
        return;
      }

      router.replace(
        `/login?next=${encodeURIComponent(next)}&error=missing_code`,
      );
    })();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-6">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"
        aria-hidden
      />
      <p className="text-sm text-slate-600">{hint}</p>
    </div>
  );
}
