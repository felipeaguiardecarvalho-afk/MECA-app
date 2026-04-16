"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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

  const refreshAccess = useCallback(async () => {
    if (authDisabledClient()) {
      setShowAssessment(true);
      return;
    }
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setEmail(user?.email ?? null);
    if (!user) {
      setShowAssessment(false);
      return;
    }
    const res = await fetch("/api/user/access-state");
    const json = await res.json().catch(() => ({}));
    if (json?.ok && json.has_access_grant && json.can_take_diagnostic) {
      setShowAssessment(true);
    } else {
      setShowAssessment(false);
    }
  }, []);

  useEffect(() => {
    void refreshAccess();
  }, [refreshAccess]);

  async function signOut() {
    if (authDisabledClient()) return;
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setShowAssessment(false);
    setEmail(null);
    router.push("/");
    router.refresh();
  }

  if (authDisabledClient()) {
    return (
      <div className="flex items-center gap-8">
        <Link
          href="/dashboard"
          className="text-sm text-gray-600 transition hover:text-gray-900"
        >
          Dashboard
        </Link>
        <span className="text-xs text-amber-700">Modo sem login</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-8">
      {email ? (
        <>
          {showAssessment && (
            <Link
              href="/assessment"
              className="text-sm text-gray-600 transition hover:text-gray-900"
            >
              Diagnóstico
            </Link>
          )}
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 transition hover:text-gray-900"
          >
            Dashboard
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="text-sm text-gray-600 transition hover:text-gray-900"
          >
            Sair
          </button>
        </>
      ) : (
        <Link
          href="/login"
          className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-900"
        >
          Entrar
        </Link>
      )}
    </div>
  );
}
