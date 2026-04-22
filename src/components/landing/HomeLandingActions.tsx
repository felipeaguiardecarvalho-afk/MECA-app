"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AccessState = {
  can_take_diagnostic: boolean;
  has_completed_diagnostic: boolean;
  has_access_grant: boolean;
};

function authDisabledClient(): boolean {
  return (
    process.env.NEXT_PUBLIC_DISABLE_AUTH === "true" ||
    process.env.NEXT_PUBLIC_DISABLE_AUTH === "1"
  );
}

export function HomeLandingActions() {
  const router = useRouter();
  const [state, setState] = useState<AccessState | null>(null);

  useEffect(() => {
    if (authDisabledClient()) {
      setState({
        can_take_diagnostic: true,
        has_completed_diagnostic: false,
        has_access_grant: true,
      });
      return;
    }
    if (!isSupabaseConfigured()) {
      setState(null);
      return;
    }
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setState(null);
        return;
      }
      void fetch("/api/user/access-state")
        .then((r) => r.json())
        .then((json) => {
          if (json?.ok) {
            setState({
              can_take_diagnostic: json.can_take_diagnostic === true,
              has_completed_diagnostic: json.has_completed_diagnostic === true,
              has_access_grant: json.has_access_grant === true,
            });
          } else {
            setState(null);
          }
        })
        .catch(() => setState(null));
    });
  }, []);

  if (authDisabledClient()) {
    return (
      <Link href="/diagnostico" className="ds-btn-primary">
        Iniciar Diagnóstico MECA
      </Link>
    );
  }

  /** Visitante sem sessão: mostra a introdução antes do fluxo protegido. */
  if (state === null) {
    return (
      <button
        type="button"
        onClick={() => {
          router.push("/diagnostico");
        }}
        className="ds-btn-primary"
      >
        Iniciar Diagnóstico MECA
      </button>
    );
  }

  if (!state.can_take_diagnostic && state.has_completed_diagnostic) {
    return (
      <Link href="/dashboard" className="ds-btn-primary">
        Ver o meu dashboard
      </Link>
    );
  }

  if (state.can_take_diagnostic) {
    return (
      <Link href="/diagnostico" className="ds-btn-primary">
        Iniciar Diagnóstico MECA
      </Link>
    );
  }

  return (
    <Link href="/dashboard" className="ds-btn-primary">
      Ver o meu dashboard
    </Link>
  );
}
