"use client";

import {
  emptyAnswers,
  MECA_QUESTIONS,
  pillarDisplayLabel,
} from "@/lib/diagnostic-engine";
import {
  DASHBOARD_BOOTSTRAP_KEY,
  diagnosticRowToMECAScores,
} from "@/lib/meca-dashboard-scores";
import { OFFLINE_RESULT_KEY_PREFIX } from "@/lib/meca-offline-result";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const QUESTION_SECONDS = 15;

const E2E_SESSION_FLAG = "__meca_e2e_instant_submitted";

export type AssessmentClientProps = {
  /** Apenas E2E: submete automaticamente todas as respostas como 3 (neutras). */
  e2eInstantDiagnostic?: boolean;
};

export function AssessmentClient({
  e2eInstantDiagnostic = false,
}: AssessmentClientProps) {
  const router = useRouter();
  const initial = useMemo(() => emptyAnswers(), []);
  const [answers, setAnswers] = useState<Record<string, number>>(initial);
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"question" | "sending">("question");
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_SECONDS);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Browser timer handle (`setInterval` is `number` in DOM typings). */
  const countdownInterval = useRef<number | null>(null);
  const submitLock = useRef(false);
  const processingRef = useRef(false);
  const processAnswerRef = useRef<(value: number) => void>(() => {});

  const q = MECA_QUESTIONS[index];
  const total = MECA_QUESTIONS.length;
  const isLast = index === total - 1;
  const qKey = String(q.id);

  const submit = useCallback(async (payload: Record<string, number>) => {
    if (submitLock.current) return;
    submitLock.current = true;
    setSaving(true);
    setError(null);
    setPhase("sending");
    const res = await fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      submitLock.current = false;
      setSaving(false);
      setPhase("question");
      const detail =
        typeof data.detail === "string" ? ` ${data.detail}` : "";
      setError(
        typeof data.error === "string"
          ? `${data.error}${detail}`
          : "Não foi possível salvar.",
      );
      return;
    }

    if (data.diagnostic && typeof data.id === "string") {
      try {
        const scores = diagnosticRowToMECAScores(
          data.diagnostic as {
            mentalidade: number;
            engajamento: number;
            cultura: number;
            performance: number;
          },
        );
        sessionStorage.setItem(
          DASHBOARD_BOOTSTRAP_KEY,
          JSON.stringify({
            id: data.id,
            scores,
            at: Date.now(),
          }),
        );
      } catch {
        /* ignore */
      }
    }

    if (
      data.persisted === false &&
      data.diagnostic &&
      typeof data.id === "string"
    ) {
      const d = data.diagnostic as {
        mentalidade: number;
        engajamento: number;
        cultura: number;
        performance: number;
        direction: number;
        capacity: number;
        archetype: string;
      };
      const row = {
        id: data.id,
        user_id: "local-offline",
        created_at: new Date().toISOString(),
        mentalidade: d.mentalidade,
        engajamento: d.engajamento,
        cultura: d.cultura,
        performance: d.performance,
        direction: d.direction,
        capacity: d.capacity,
        archetype: d.archetype,
      };
      try {
        sessionStorage.setItem(
          `${OFFLINE_RESULT_KEY_PREFIX}${data.id}`,
          JSON.stringify(row),
        );
      } catch {
        /* ignore quota / private mode */
      }
    }

    router.push(`/dashboard?saved=${encodeURIComponent(data.id)}`);
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (!e2eInstantDiagnostic) return;
    if (typeof window === "undefined") return;
    let skip = false;
    try {
      if (sessionStorage.getItem(E2E_SESSION_FLAG)) skip = true;
      else sessionStorage.setItem(E2E_SESSION_FLAG, "1");
    } catch {
      return;
    }
    if (skip) return;
    void submit(emptyAnswers());
  }, [e2eInstantDiagnostic, submit]);

  const processAnswer = useCallback(
    (value: number) => {
      if (processingRef.current || phase !== "question") return;
      processingRef.current = true;
      if (countdownInterval.current) {
        window.clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
      setAnswers((prev) => {
        const next = { ...prev, [qKey]: value };
        if (advanceTimer.current) clearTimeout(advanceTimer.current);
        if (!isLast) {
          advanceTimer.current = setTimeout(() => {
            setIndex((i) => i + 1);
            processingRef.current = false;
          }, 320);
        } else {
          advanceTimer.current = setTimeout(() => {
            void submit(next);
            processingRef.current = false;
          }, 320);
        }
        return next;
      });
    },
    [qKey, isLast, phase, submit],
  );

  processAnswerRef.current = processAnswer;

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      if (countdownInterval.current) {
        window.clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
    };
  }, []);

  useEffect(() => {
    processingRef.current = false;
  }, [index]);

  useEffect(() => {
    if (e2eInstantDiagnostic) return;
    if (phase !== "question") return;
    setSecondsLeft(QUESTION_SECONDS);
    let left = QUESTION_SECONDS;
    const tick = window.setInterval(() => {
      left -= 1;
      setSecondsLeft(Math.max(0, left));
      if (left <= 0) {
        window.clearInterval(tick);
        countdownInterval.current = null;
        processAnswerRef.current(3);
      }
    }, 1000);
    countdownInterval.current = tick;
    return () => {
      window.clearInterval(tick);
      countdownInterval.current = null;
    };
  }, [e2eInstantDiagnostic, index, phase]);

  function onPick(value: number) {
    if (processingRef.current) return;
    processAnswer(value);
  }

  if (phase === "sending") {
    return (
      <div className="ds-page flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center text-center">
        <div className="max-w-2xl space-y-6">
          <p className="text-4xl font-semibold tracking-tight text-gray-900 md:text-5xl">
            A preparar o seu mapa…
          </p>
          <p className="ds-body">Só um instante.</p>
        </div>
      </div>
    );
  }

  const progressPct = ((index + 1) / total) * 100;

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col justify-center px-6 py-16">
      <div className="mx-auto mb-10 w-full max-w-2xl">
        <div className="h-px w-full overflow-hidden bg-gray-100">
          <div
            className="h-full bg-gray-900 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-12 text-center">
        <p className="text-sm text-gray-500">{pillarDisplayLabel(q.pillar)}</p>

        <p className="text-2xl font-semibold tabular-nums text-gray-900">
          {secondsLeft}s
        </p>

        <h1 className="text-balance text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
          {q.text}
        </h1>

        <div className="flex justify-center gap-3">
          {[1, 2, 3, 4, 5].map((n) => {
            const selected = answers[qKey] === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onPick(n)}
                disabled={saving}
                className={`flex h-12 w-12 items-center justify-center rounded-xl text-base font-semibold transition md:h-14 md:w-14 md:text-lg ${
                  selected
                    ? "bg-black text-white"
                    : "border border-gray-200 bg-white text-gray-900 hover:border-gray-300"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            1 — discordo totalmente · 5 — concordo totalmente · tempo esgotado = 3
          </p>
          <p className="text-sm tabular-nums text-gray-400">
            {String(index + 1).padStart(2, "0")} — {String(total).padStart(2, "0")}
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
