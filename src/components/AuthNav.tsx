"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function authDisabledClient(): boolean {
  return (
    process.env.NEXT_PUBLIC_DISABLE_AUTH === "true" ||
    process.env.NEXT_PUBLIC_DISABLE_AUTH === "1"
  );
}

export function AuthNav() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);

  useEffect(() => {
    if (authDisabledClient()) {
      setHasSession(true);
      setShowAssessment(true);
      setAuthResolved(true);
      return;
    }

    if (!isSupabaseConfigured()) {
      setAuthResolved(true);
      return;
    }

    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user ?? null;
        setHasSession(Boolean(session));
        setEmail(user?.email ?? null);

        if (!user) {
          setShowAssessment(false);
          setAuthResolved(true);
          return;
        }

        try {
          const res = await fetch("/api/user/access-state");
          const json = await res.json().catch(() => ({}));
          setShowAssessment(
            Boolean(json?.ok && json.can_take_diagnostic === true),
          );
        } catch {
          setShowAssessment(false);
        } finally {
          setAuthResolved(true);
        }
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    try {
      if (!authDisabledClient() && isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
    } catch {
      // Garante navegação mesmo se logout falhar.
    } finally {
      setHasSession(false);
      setEmail(null);
      setShowAssessment(false);
      router.push("/");
      router.refresh();
    }
  }

  if (authDisabledClient()) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <Link
          href="/dashboard"
          className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 transition-all duration-300 hover:bg-white/80 hover:text-slate-900 sm:text-sm"
        >
          Dashboard
        </Link>
        <button
          type="button"
          onClick={() => void signOut()}
          className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-500 underline-offset-4 transition-all duration-300 hover:bg-slate-100/80 hover:text-slate-800 sm:text-sm"
        >
          Sair
        </button>
        <span className="hidden text-xs text-amber-700 sm:inline">Modo sem login</span>
      </div>
    );
  }

  const isLoggedIn = hasSession || email !== null;

  /** Evita “buraco” no header enquanto a sessão resolve (Supabase / access-state). */
  if (!authResolved) {
    return (
      <Link
        href="/login"
        className="ds-btn-primary inline-flex shrink-0 !px-4 !py-2 text-xs opacity-80 animate-pulse sm:!px-5 sm:!py-2.5 sm:text-sm"
        aria-busy="true"
        aria-label="A carregar sessão"
      >
        Entrar
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
      {showAssessment && (
        <Link
          href="/diagnostico"
          className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 transition-all duration-300 hover:bg-white/80 hover:text-slate-900 sm:text-sm"
        >
          Diagnóstico
        </Link>
      )}

      {isLoggedIn && (
        <Link
          href="/dashboard"
          className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-600 transition-all duration-300 hover:bg-white/80 hover:text-slate-900 sm:text-sm"
        >
          Dashboard
        </Link>
      )}

      {isLoggedIn ? (
        <button
          type="button"
          onClick={() => void signOut()}
          className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-500 underline-offset-4 transition-all duration-300 hover:bg-slate-100/80 hover:text-slate-800 sm:text-sm"
        >
          Sair
        </button>
      ) : (
        <Link
          href="/login"
          className="ds-btn-primary inline-flex shrink-0 !px-4 !py-2 text-xs sm:!px-5 sm:!py-2.5 sm:text-sm"
        >
          Entrar
        </Link>
      )}
    </div>
  );
}
