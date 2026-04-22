"use client";

import { useCallback, useState } from "react";
import {
  ARCHETYPE_PAGE_CONTENT,
  ARCHETYPE_PAGE_ORDER,
  type ArchetypePageContent,
} from "@/lib/archetype-copy";
import { ArchetypeGridCard } from "./ArchetypeGridCard";
import { ArchetypeDetailModal } from "./ArchetypeDetailModal";

export function ArquetiposSection() {
  const [selected, setSelected] = useState<ArchetypePageContent | null>(null);

  const handleOpen = useCallback((content: ArchetypePageContent) => {
    setSelected(content);
  }, []);

  const handleClose = useCallback(() => setSelected(null), []);

  return (
    <section
      className="ds-card h-full p-6 sm:p-7 lg:p-9"
      aria-label="Os 8 arquétipos MECA"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7 xl:grid-cols-4 xl:gap-6">
        {ARCHETYPE_PAGE_ORDER.map((key) => (
          <ArchetypeGridCard
            key={key}
            content={ARCHETYPE_PAGE_CONTENT[key]}
            onOpen={handleOpen}
          />
        ))}
      </div>

      <ArchetypeDetailModal content={selected} onClose={handleClose} />
    </section>
  );
}
