"use client";

import {
  emptyAnswers,
  MECA_QUESTIONS,
  pillarDisplayLabel,
} from "@/lib/diagnostic-engine";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const QUESTION_SECONDS = 15;

/**
 * Module-level guard preventing the E2E instant-diagnostic path from
 * double-submitting under React StrictMode (which mounts effects twice
 * in dev). Pure in-memory flag — nothing persisted to the browser.
 * See `src/__tests__/no-browser-storage.test.ts` for the enforcement
 * that forbids any storage-backed replacement.
 */
let e2eInstantSubmitted = false;

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

    // Intentionally no browser-storage writes here. Scores/archetype are PII
    // and must be re-fetched from `GET /api/user/history` on the next page;
    // the dashboard's existing loading state absorbs the brief round-trip.

    router.push(`/dashboard?saved=${encodeURIComponent(data.id)}`);
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (!e2eInstantDiagnostic) return;
    if (typeof window === "undefined") return;
    if (e2eInstantSubmitted) return;
    e2eInstantSubmitted = true;
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
      <section className="flex min-h-[calc(100dvh-4rem)] w-full flex-col items-center justify-center py-12 sm:py-16 lg:py-24">
        <div className="container-meca text-center">
          <div className="mx-auto max-w-2xl space-y-6 sm:space-y-8">
            <p className="text-balance text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              A preparar o seu mapa…
            </p>
            <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
              Só um instante.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const progressPct = ((index + 1) / total) * 100;

  return (
    <section className="flex min-h-[calc(100dvh-4rem)] w-full flex-col justify-center py-12 sm:py-16 lg:py-24">
      <div className="container-meca">
        <div className="mx-auto mb-8 w-full max-w-6xl sm:mb-10">
          <div className="h-px w-full overflow-hidden bg-gray-100">
            <div
              className="h-full bg-gray-900 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="mx-auto min-w-0 max-w-6xl space-y-6 text-center sm:space-y-10 lg:space-y-12">
        <p className="text-sm text-gray-500">{pillarDisplayLabel(q.pillar)}</p>

        <p className="text-xl font-semibold tabular-nums text-gray-900 sm:text-2xl">
          {secondsLeft}s
        </p>

        <h1 className="text-balance break-words text-2xl font-semibold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
          {q.text}
        </h1>

        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5].map((n) => {
            const selected = answers[qKey] === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onPick(n)}
                disabled={saving}
                className={`flex h-11 w-11 touch-manipulation items-center justify-center rounded-xl text-base font-semibold transition sm:h-12 sm:w-12 md:h-14 md:w-14 md:text-lg ${
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
    </section>
  );
}
