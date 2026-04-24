"use client";

import { ArchetypeMatrix } from "@/components/Dashboard/ArchetypeMatrix";
import { getArchetype, type MECAScores } from "@/lib/archetypes";

const previewScores: MECAScores = {
  M: 63,
  E: 40,
  C: 73,
  A: 52,
};

export default function PreviewMatrizPage() {
  const archetype = getArchetype(previewScores);

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", padding: "24px 16px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <ArchetypeMatrix archetype={archetype} />
      </div>
    </main>
  );
}
