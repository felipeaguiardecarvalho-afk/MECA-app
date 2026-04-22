"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import type { ArchetypePageContent } from "@/lib/archetype-copy";
import { ArchetypeIcon } from "./ArchetypeIcon";

const CLOSE_MS = 220;

type Props = {
  content: ArchetypePageContent | null;
  onClose: () => void;
};

type SectionProps = {
  label: string;
  accent?: string;
  children: React.ReactNode;
};

function Section({ label, accent, children }: SectionProps) {
  return (
    <section className="mt-5 first:mt-6">
      <div
        className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: accent ?? "#94a3b8" }}
      >
        {label}
      </div>
      <div className="text-[15px] leading-relaxed text-slate-700">
        {children}
      </div>
    </section>
  );
}

export function ArchetypeDetailModal({ content, onClose }: Props) {
  const titleId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!content) {
      setOpen(false);
      return;
    }
    setOpen(false);
    const enter = requestAnimationFrame(() => setOpen(true));
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(enter);
      document.body.style.overflow = prevOverflow;
    };
  }, [content]);

  const handleClose = useCallback(() => {
    setOpen(false);
    window.setTimeout(onClose, CLOSE_MS);
  }, [onClose]);

  useEffect(() => {
    if (!content) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [content, handleClose]);

  if (!content || typeof document === "undefined") return null;

  const node = (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center"
      role="presentation"
    >
      <motion.button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-md"
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={handleClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[min(88vh,720px)] w-full max-w-[min(48rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-white/60 bg-white/95 p-5 shadow-premium backdrop-blur-xl sm:p-7"
        initial={false}
        animate={{
          opacity: open ? 1 : 0,
          y: open ? 0 : 18,
          scale: open ? 1 : 0.97,
        }}
        transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-start gap-4">
          <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            <ArchetypeIcon archetypeKey={content.key} className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-indigo-500/90">
              Arquétipo MECA
            </div>
            <h2
              id={titleId}
              className="break-words text-2xl font-bold leading-snug tracking-tight text-slate-900 sm:text-3xl"
            >
              {content.name}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {content.short}
            </p>
          </div>
        </div>

        <Section label="Diagnóstico">{content.diagnosis}</Section>
        <Section label="Mecânica">{content.mechanics}</Section>
        <Section label="Risco" accent="#c53030">
          {content.risk}
        </Section>
        <Section label="Alavanca" accent="#059669">
          {content.leverage}
        </Section>
        <Section label="Plano de ação">
          <ul className="mt-1 space-y-2">
            {content.action_plan.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-[2px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </Section>

        <div className="mt-7 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl bg-gradient-to-r from-slate-900 to-indigo-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(node, document.body);
}
