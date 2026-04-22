"use client";

import type { ArchetypePageContent } from "@/lib/archetype-copy";
import { ArchetypeIcon } from "./ArchetypeIcon";

type Props = {
  content: ArchetypePageContent;
  onOpen: (content: ArchetypePageContent) => void;
};

export function ArchetypeGridCard({ content, onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={() => onOpen(content)}
      aria-label={`Ver detalhes do arquétipo ${content.name}`}
      className={[
        "group flex h-full w-full flex-col justify-between rounded-2xl border border-slate-200/70 bg-white/90 p-6 text-left shadow-md backdrop-blur-md",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:border-indigo-200/80 hover:shadow-premium-hover",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
      ].join(" ")}
    >
      <div>
        <div
          className={[
            "mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg",
            "bg-slate-100 text-slate-700 transition-colors duration-200",
            "group-hover:bg-slate-900 group-hover:text-white",
          ].join(" ")}
        >
          <ArchetypeIcon archetypeKey={content.key} className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 sm:text-[17px]">
          {content.name}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          {content.short}
        </p>
      </div>
      <span className="mt-4 text-xs font-medium text-gray-500 transition-colors group-hover:text-slate-900">
        Ver detalhes →
      </span>
    </button>
  );
}
