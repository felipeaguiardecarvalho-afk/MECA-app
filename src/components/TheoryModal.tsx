"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import type { Theory } from "@/lib/meca-theories";

const CLOSE_MS = 220;

type Props = {
  theory: Theory | null;
  pillarName: string;
  onClose: () => void;
};

export function TheoryModal({ theory, pillarName, onClose }: Props) {
  const titleId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!theory) {
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
  }, [theory]);

  const finishClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleClose = useCallback(() => {
    setOpen(false);
    window.setTimeout(finishClose, CLOSE_MS);
  }, [finishClose]);

  useEffect(() => {
    if (!theory) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [theory, handleClose]);

  if (!theory || typeof document === "undefined") return null;

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
        className="relative z-10 max-h-[min(85vh,640px)] w-full max-w-[min(64rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-white/60 bg-white/95 p-4 shadow-premium backdrop-blur-xl sm:p-6"
        initial={false}
        animate={{
          opacity: open ? 1 : 0,
          y: open ? 0 : 16,
          scale: open ? 1 : 0.97,
        }}
        transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-indigo-500/90">
          {pillarName}
        </div>
        <h2 id={titleId} className="break-words text-xl font-bold leading-snug tracking-tight text-slate-900 sm:text-2xl">
          {theory.title}
        </h2>
        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-600">
          {theory.full}
        </p>
        <div className="mt-6 flex justify-end">
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
