"use client";

import { ArchetypeMatrix } from "@/components/Dashboard/ArchetypeMatrix";
import { getArchetype, type MECAScores } from "@/lib/archetypes";

// 50/50/50/50 → fallback (nenhuma das 14 regras dispara). Útil para testar
// visualmente o caminho de "Perfil em transição".
const previewScores: MECAScores = {
  M: 50,
  E: 50,
  C: 50,
  A: 50,
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
