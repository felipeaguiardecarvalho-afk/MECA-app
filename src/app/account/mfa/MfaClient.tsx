"use client";

/**
 * MFA enroll / challenge UI for the master admin.
 *
 * States:
 *   - `loading`   : fetching factors + AAL on mount
 *   - `enroll`    : no verified TOTP factor yet → show QR + 6-digit input,
 *                   call `challengeAndVerify` to finish registration.
 *   - `challenge` : TOTP already verified, current session is AAL1 → user
 *                   enters code from authenticator to upgrade to AAL2.
 *   - `ready`     : session is AAL2 → show success + unenroll button.
 *   - `error`     : unrecoverable error (e.g. mfa API unavailable).
 *
 * Supabase JS v2 surface used:
 *   auth.mfa.listFactors, auth.mfa.enroll, auth.mfa.challengeAndVerify,
 *   auth.mfa.unenroll, auth.mfa.getAuthenticatorAssuranceLevel.
 *
 * Intentionally uses only the browser Supabase client — never sends the TOTP
 * secret or code to our server; Supabase Auth is the source of truth.
 */

import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Phase = "loading" | "enroll" | "challenge" | "ready" | "error";

type TotpFactor = {
  id: string;
  status: "verified" | "unverified";
  friendly_name?: string | null;
  created_at?: string | null;
};

type EnrollData = {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
};

function formatCode(input: string): string {
  // Keep only digits, cap at 6 (Supabase TOTP code length).
  return input.replace(/\D+/g, "").slice(0, 6);
}

export function MfaClient({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const supabase: SupabaseClient = useMemo(() => createClient(), []);

  const [phase, setPhase] = useState<Phase>("loading");
  const [aal, setAal] = useState<string | null>(null);
  const [factor, setFactor] = useState<TotpFactor | null>(null);
  const [enroll, setEnroll] = useState<EnrollData | null>(null);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    setMessage(null);

    const { data: aalData, error: aalErr } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalErr) {
      setError(`Falha a consultar AAL: ${aalErr.message}`);
      setPhase("error");
      return;
    }
    const currentLevel = aalData?.currentLevel ?? null;
    setAal(currentLevel);

    const { data: factorsData, error: factorsErr } =
      await supabase.auth.mfa.listFactors();
    if (factorsErr) {
      setError(`Falha a listar fatores: ${factorsErr.message}`);
      setPhase("error");
      return;
    }

    const totpList = (factorsData?.totp ?? []) as TotpFactor[];
    const verified = totpList.find((f) => f.status === "verified") ?? null;
    const pending = totpList.find((f) => f.status === "unverified") ?? null;

    if (verified && currentLevel === "aal2") {
      setFactor(verified);
      setEnroll(null);
      setPhase("ready");
      return;
    }

    if (verified && currentLevel !== "aal2") {
      setFactor(verified);
      setEnroll(null);
      setPhase("challenge");
      return;
    }

    // No verified TOTP yet. Reuse a pending factor if one already exists so we
    // don't pile up orphaned `unverified` rows on every visit.
    if (pending) {
      // `enroll` with the same friendly name on a pending factor returns the
      // existing one instead of erroring; this surfaces its QR again.
      const { data: enrollData, error: enrollErr } =
        await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: pending.friendly_name ?? "MECA Admin",
        });
      if (enrollErr || !enrollData) {
        setError(
          `Não foi possível retomar o registo: ${enrollErr?.message ?? "sem dados"}.`,
        );
        setPhase("error");
        return;
      }
      setFactor({ id: enrollData.id, status: "unverified" });
      setEnroll({
        factorId: enrollData.id,
        qrCode: enrollData.totp.qr_code,
        secret: enrollData.totp.secret,
        uri: enrollData.totp.uri,
      });
      setPhase("enroll");
      return;
    }

    // Fresh enroll.
    const { data: enrollData, error: enrollErr } =
      await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "MECA Admin",
      });
    if (enrollErr || !enrollData) {
      setError(
        `Não foi possível iniciar o registo: ${enrollErr?.message ?? "sem dados"}.`,
      );
      setPhase("error");
      return;
    }
    setFactor({ id: enrollData.id, status: "unverified" });
    setEnroll({
      factorId: enrollData.id,
      qrCode: enrollData.totp.qr_code,
      secret: enrollData.totp.secret,
      uri: enrollData.totp.uri,
    });
    setPhase("enroll");
  }, [supabase]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function submitCode() {
    if (!factor) return;
    const clean = formatCode(code);
    if (clean.length !== 6) {
      setError("Introduza os 6 dígitos do código TOTP.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    const { error: verifyErr } = await supabase.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code: clean,
    });
    setSubmitting(false);
    if (verifyErr) {
      setError(verifyErr.message);
      return;
    }
    setCode("");
    setMessage(
      phase === "enroll"
        ? "Registo concluído. A sua sessão foi elevada para AAL2."
        : "Código aceite. Sessão elevada para AAL2.",
    );
    // Re-read server state so subsequent API calls see the new AAL immediately.
    router.refresh();
    await refresh();
  }

  async function unenroll() {
    if (!factor) return;
    const ok = window.confirm(
      "Remover o autenticador? Depois disto, voltará a ser necessário registar um novo dispositivo para aceder ao painel admin.",
    );
    if (!ok) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);
    const { error: unErr } = await supabase.auth.mfa.unenroll({
      factorId: factor.id,
    });
    setSubmitting(false);
    if (unErr) {
      setError(unErr.message);
      return;
    }
    setMessage("Fator removido. Registe um novo autenticador para continuar.");
    router.refresh();
    await refresh();
  }

  if (phase === "loading") {
    return <p className="text-sm text-gray-500">A carregar…</p>;
  }

  if (phase === "error") {
    return (
      <div
        className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        role="alert"
      >
        <p className="font-semibold">Não foi possível preparar o MFA.</p>
        <p className="mt-1">{error}</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-3 rounded-lg bg-red-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-950"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatusBanner aal={aal} phase={phase} email={userEmail} />

      {phase === "enroll" && enroll && (
        <EnrollView
          enroll={enroll}
          code={code}
          setCode={setCode}
          submitting={submitting}
          onSubmit={() => void submitCode()}
          error={error}
        />
      )}

      {phase === "challenge" && factor && (
        <ChallengeView
          friendlyName={factor.friendly_name ?? "Autenticador registado"}
          code={code}
          setCode={setCode}
          submitting={submitting}
          onSubmit={() => void submitCode()}
          error={error}
        />
      )}

      {phase === "ready" && factor && (
        <ReadyView
          friendlyName={factor.friendly_name ?? "Autenticador registado"}
          createdAt={factor.created_at}
          onUnenroll={() => void unenroll()}
          submitting={submitting}
          error={error}
        />
      )}

      {message && (
        <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {message}
        </p>
      )}

      <nav className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/dashboard"
          className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-50"
        >
          ← Voltar ao dashboard
        </Link>
      </nav>
    </div>
  );
}

function StatusBanner({
  aal,
  phase,
  email,
}: {
  aal: string | null;
  phase: Phase;
  email: string;
}) {
  const tone =
    phase === "ready"
      ? { bg: "bg-green-50", border: "border-green-200", text: "text-green-900" }
      : phase === "challenge"
        ? { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900" }
        : { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900" };

  return (
    <div className={`rounded-xl border ${tone.border} ${tone.bg} p-4`}>
      <p className={`text-xs font-bold uppercase tracking-wide ${tone.text}`}>
        Sessão actual
      </p>
      <p className="mt-1 text-sm text-gray-800">
        <strong>{email}</strong> · AAL actual:{" "}
        <code className="rounded bg-white px-1 py-0.5 text-xs">
          {aal ?? "desconhecido"}
        </code>
      </p>
    </div>
  );
}

function EnrollView({
  enroll,
  code,
  setCode,
  submitting,
  onSubmit,
  error,
}: {
  enroll: EnrollData;
  code: string;
  setCode: (v: string) => void;
  submitting: boolean;
  onSubmit: () => void;
  error: string | null;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">
        1. Registar autenticador
      </h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-700">
        <li>
          Instale um autenticador TOTP (Google Authenticator, 1Password, Authy,
          Bitwarden…).
        </li>
        <li>Leia o QR code abaixo.</li>
        <li>Introduza o código de 6 dígitos gerado para concluir.</li>
      </ol>

      <div className="mt-5 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        {/* Supabase returns a data-URL SVG — safe to render as <img src>. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={enroll.qrCode}
          alt="QR code TOTP"
          width={192}
          height={192}
          className="rounded-lg border border-gray-200 bg-white p-2"
        />
        <div className="text-xs text-gray-600">
          <p>Não consegue ler o QR? Adicione manualmente:</p>
          <p className="mt-1 break-all font-mono text-[11px] text-gray-800">
            {enroll.secret}
          </p>
          <p className="mt-3 text-gray-500">
            URI:{" "}
            <span className="break-all font-mono text-[10px]">
              {enroll.uri}
            </span>
          </p>
        </div>
      </div>

      <form
        className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <label className="flex-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            Código de 6 dígitos
          </span>
          <input
            value={code}
            onChange={(e) => setCode(formatCode(e.target.value))}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={6}
            disabled={submitting}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-lg tracking-widest focus:border-[#1a3a5c] focus:outline-none focus:ring-1 focus:ring-[#1a3a5c]"
            placeholder="••••••"
          />
        </label>
        <button
          type="submit"
          disabled={submitting || code.length !== 6}
          className="rounded-lg bg-[#1a3a5c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#152d45] disabled:opacity-50"
        >
          {submitting ? "A verificar…" : "Confirmar"}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

function ChallengeView({
  friendlyName,
  code,
  setCode,
  submitting,
  onSubmit,
  error,
}: {
  friendlyName: string;
  code: string;
  setCode: (v: string) => void;
  submitting: boolean;
  onSubmit: () => void;
  error: string | null;
}) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
      <h2 className="text-lg font-bold text-amber-900">
        Elevar sessão para AAL2
      </h2>
      <p className="mt-1 text-sm text-amber-950/80">
        Já existe um autenticador registado (<strong>{friendlyName}</strong>).
        Introduza o código actual para desbloquear o painel admin.
      </p>

      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <label className="flex-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-900">
            Código de 6 dígitos
          </span>
          <input
            value={code}
            onChange={(e) => setCode(formatCode(e.target.value))}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={6}
            disabled={submitting}
            autoFocus
            className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 font-mono text-lg tracking-widest focus:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-700"
            placeholder="••••••"
          />
        </label>
        <button
          type="submit"
          disabled={submitting || code.length !== 6}
          className="rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-950 disabled:opacity-50"
        >
          {submitting ? "A verificar…" : "Verificar código"}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

function ReadyView({
  friendlyName,
  createdAt,
  onUnenroll,
  submitting,
  error,
}: {
  friendlyName: string;
  createdAt: string | null | undefined;
  onUnenroll: () => void;
  submitting: boolean;
  error: string | null;
}) {
  return (
    <section className="rounded-2xl border border-green-200 bg-green-50/60 p-5 shadow-sm">
      <h2 className="text-lg font-bold text-green-900">MFA activo (AAL2)</h2>
      <p className="mt-1 text-sm text-green-950/80">
        Dispositivo registado:{" "}
        <strong>{friendlyName}</strong>
        {createdAt && (
          <span className="text-green-900/70">
            {" "}· desde {new Date(createdAt).toLocaleString("pt-PT")}
          </span>
        )}
        . O painel admin e as APIs
        <code className="mx-1 rounded bg-white px-1 py-0.5 text-[11px]">
          /api/admin/*
        </code>
        estão desbloqueados nesta sessão.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/dashboard"
          className="rounded-lg bg-green-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-950"
        >
          Ir para o dashboard
        </Link>
        <button
          type="button"
          onClick={onUnenroll}
          disabled={submitting}
          className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-800 transition hover:bg-red-50 disabled:opacity-50"
        >
          Remover autenticador
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
