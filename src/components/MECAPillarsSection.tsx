"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MECA_PILLARS, type Pillar, type Theory } from "@/lib/meca-theories";
import { MECATabs } from "./MECATabs";
import { TheoryCard } from "./TheoryCard";
import { TheoryModal } from "./TheoryModal";

function pillarNameForTheory(theory: Theory | null): string {
  if (!theory) return "";
  for (const p of MECA_PILLARS) {
    if (p.theories.some((t) => t.id === theory.id)) return p.name;
  }
  return "";
}

function parsePillarParam(raw: string | null): Pillar["id"] {
  if (raw === "E" || raw === "C" || raw === "A" || raw === "M") return raw;
  return "M";
}

export function MECAPillarsSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activePillar = parsePillarParam(searchParams.get("pillar"));
  const [selectedTheory, setSelectedTheory] = useState<Theory | null>(null);

  const setActivePillar = useCallback(
    (id: Pillar["id"]) => {
      router.replace(`/fundamentos?pillar=${id}`, { scroll: false });
    },
    [router],
  );

  const pillar = useMemo(
    () => MECA_PILLARS.find((p) => p.id === activePillar) ?? MECA_PILLARS[0],
    [activePillar],
  );

  const modalPillarName = useMemo(() => pillarNameForTheory(selectedTheory), [selectedTheory]);

  return (
    <section
      className="ds-card h-full p-6 sm:p-7 lg:p-9"
      aria-label="Conteúdo por pilar do método MECA"
    >
      <MECATabs pillars={MECA_PILLARS} activePillar={activePillar} onChange={setActivePillar} />

      <div
        id={`meca-panel-${pillar.id}`}
        role="tabpanel"
        aria-labelledby={`meca-tab-${pillar.id}`}
        className="mt-6"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7">
          {pillar.theories.map((t) => (
            <TheoryCard key={t.id} theory={t} onOpen={setSelectedTheory} />
          ))}
        </div>
      </div>

      <TheoryModal
        theory={selectedTheory}
        pillarName={modalPillarName || pillar.name}
        onClose={() => setSelectedTheory(null)}
      />
    </section>
  );
}
