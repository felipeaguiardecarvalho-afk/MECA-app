/**
 * Validação da engine de arquétipos contra dados reais do banco.
 *
 * Conecta ao Supabase via service role, busca todas as respostas e
 * verifica consistência do novo motor de 14 arquétipos.
 *
 * Uso:
 *   NEXT_PUBLIC_SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx scripts/validate-archetypes-db.ts
 *
 * Ou com .env.local preenchido:
 *   node -r dotenv/config --loader tsx scripts/validate-archetypes-db.ts
 */

import { createClient } from "@supabase/supabase-js";
import { getArchetype, classifyArchetype, ARCHETYPE_NAMES, type MECAScores } from "../src/lib/archetypes";
import { getActionPlan } from "../src/lib/action-plan";

// ---------------------------------------------------------------------------
// DB ROW TYPE
// ---------------------------------------------------------------------------

type ResponseRow = {
  id: string;
  user_id: string;
  created_at: string;
  mentalidade: number;
  engajamento: number;
  cultura: number;
  performance: number;
  direction: number;
  capacity: number;
  archetype: string;
  answers: Record<string, number> | null;
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function toMECA(row: ResponseRow): MECAScores {
  return {
    M: Math.round(Number(row.mentalidade)),
    E: Math.round(Number(row.engajamento)),
    C: Math.round(Number(row.cultura)),
    A: Math.round(Number(row.performance)),
  };
}

function pad(s: string, n: number) {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function pct(n: number, total: number) {
  return total === 0 ? "  0.0%" : `${((n / total) * 100).toFixed(1).padStart(5)}%`;
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "\n❌  Variáveis de ambiente ausentes.\n" +
      "   Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de executar.\n"
    );
    process.exit(1);
  }

  const db = createClient(url, key, {
    auth: { persistSession: false },
  });

  console.log("\n📊  Buscando respostas do banco...");
  const { data: rows, error } = await db
    .from("responses")
    .select("id, user_id, created_at, mentalidade, engajamento, cultura, performance, direction, capacity, archetype, answers")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("❌  Erro ao consultar banco:", error.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log("⚠️  Nenhuma resposta encontrada no banco.");
    process.exit(0);
  }

  console.log(`✅  ${rows.length} respostas encontradas.\n`);

  // ─── Counters ──────────────────────────────────────────────────────────────

  let errors = 0;
  let archetypeChanged = 0;
  let actionPlanChanged = 0;

  const newDist: Record<string, number> = {};
  const oldDist: Record<string, number> = {};
  const changePairs: Array<{ old: string; new: string; count: number }> = [];
  const changePairMap: Record<string, number> = {};
  const invalidKeys: string[] = [];

  const pillarDist: Record<string, number> = {};

  // ─── Process each row ──────────────────────────────────────────────────────

  for (const row of rows as ResponseRow[]) {
    try {
      const scores = toMECA(row);
      const result = getArchetype(scores);
      const plan = getActionPlan(scores, row.answers ?? null);

      // Archetype distribution (new engine)
      newDist[result.name] = (newDist[result.name] ?? 0) + 1;

      // Old archetype distribution (from DB column)
      const oldName = row.archetype ?? "—";
      oldDist[oldName] = (oldDist[oldName] ?? 0) + 1;

      // Changed archetype?
      if (result.name !== oldName) {
        archetypeChanged++;
        const pairKey = `${oldName} → ${result.name}`;
        changePairMap[pairKey] = (changePairMap[pairKey] ?? 0) + 1;
      }

      // Validate archetype key is in ARCHETYPE_NAMES
      if (!ARCHETYPE_NAMES.includes(result.name)) {
        invalidKeys.push(`${row.id}: "${result.name}" não é um nome canônico`);
      }

      // Action plan pillar distribution
      pillarDist[plan.pillar] = (pillarDist[plan.pillar] ?? 0) + 1;

      // Old action plan (simulate with old archetype if it changed)
      if (result.name !== oldName) {
        actionPlanChanged++;
      }

    } catch (err) {
      errors++;
      console.error(`  ⚠️  Erro em row ${row.id}:`, err);
    }
  }

  // ─── Build change pairs list ────────────────────────────────────────────────

  for (const [pair, count] of Object.entries(changePairMap)) {
    const [old, newA] = pair.split(" → ");
    changePairs.push({ old, new: newA, count });
  }
  changePairs.sort((a, b) => b.count - a.count);

  // ─── OUTPUT ────────────────────────────────────────────────────────────────

  const total = rows.length;
  const stable = total - archetypeChanged - errors;

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  MECA — Validação da engine 14-arquétipos vs banco de dados");
  console.log("═══════════════════════════════════════════════════════════════\n");

  console.log(`  Total de respostas:          ${total}`);
  console.log(`  Resultados sem alteração:    ${stable}  (${pct(stable, total)})`);
  console.log(`  Arquétipo alterado:          ${archetypeChanged}  (${pct(archetypeChanged, total)})`);
  console.log(`  Erros de processamento:      ${errors}`);
  if (invalidKeys.length > 0) {
    console.log(`\n  ⚠️  Chaves inválidas geradas: ${invalidKeys.length}`);
    for (const k of invalidKeys.slice(0, 5)) console.log(`      ${k}`);
  } else {
    console.log(`  Chaves canônicas:            ✅  todas válidas`);
  }

  // ─── New archetype distribution ─────────────────────────────────────────────

  console.log("\n───────────────────────────────────────────────────────────────");
  console.log("  DISTRIBUIÇÃO — nova engine (14 arquétipos)");
  console.log("───────────────────────────────────────────────────────────────");
  const sortedNew = Object.entries(newDist).sort((a, b) => b[1] - a[1]);
  for (const [name, count] of sortedNew) {
    console.log(`  ${pad(name, 30)} ${String(count).padStart(4)}  ${pct(count, total)}`);
  }

  // ─── Old archetype distribution ──────────────────────────────────────────────

  console.log("\n───────────────────────────────────────────────────────────────");
  console.log("  DISTRIBUIÇÃO — engine anterior (banco de dados)");
  console.log("───────────────────────────────────────────────────────────────");
  const sortedOld = Object.entries(oldDist).sort((a, b) => b[1] - a[1]);
  for (const [name, count] of sortedOld) {
    const isNew = !ARCHETYPE_NAMES.includes(name);
    const tag = isNew ? "  ← nome legado" : "";
    console.log(`  ${pad(name, 30)} ${String(count).padStart(4)}  ${pct(count, total)}${tag}`);
  }

  // ─── Archetype transitions ────────────────────────────────────────────────

  if (changePairs.length > 0) {
    console.log("\n───────────────────────────────────────────────────────────────");
    console.log("  TRANSIÇÕES — arquétipos que mudaram com a nova engine");
    console.log("───────────────────────────────────────────────────────────────");
    for (const { old, new: newA, count } of changePairs) {
      console.log(`  ${pad(old, 28)} → ${pad(newA, 28)} ×${count}`);
    }
  }

  // ─── Action plan pillar distribution ─────────────────────────────────────

  console.log("\n───────────────────────────────────────────────────────────────");
  console.log("  PLANO DE AÇÃO — pilar de foco (gargalo mais frequente)");
  console.log("───────────────────────────────────────────────────────────────");
  const sortedPillar = Object.entries(pillarDist).sort((a, b) => b[1] - a[1]);
  for (const [pillar, count] of sortedPillar) {
    console.log(`  ${pad(pillar, 30)} ${String(count).padStart(4)}  ${pct(count, total)}`);
  }

  // ─── Final verdict ────────────────────────────────────────────────────────

  console.log("\n═══════════════════════════════════════════════════════════════");
  if (errors === 0 && invalidKeys.length === 0) {
    console.log("  ✅  Engine consistente — nenhum erro de processamento.");
  } else {
    console.log(`  ⚠️  ${errors} erros + ${invalidKeys.length} chaves inválidas — revisar.`);
  }

  const newArchetypesHit = Object.keys(newDist).filter(name =>
    !["Executor Isolado","Útil Sem Direção","Estrategista Estagnado","Protagonista Desalinhado",
      "Profissional Invisível","Performático Exausto","Bem-Quisto Estagnado","Acelerado MECA"]
    .includes(name)
  );
  if (newArchetypesHit.length > 0) {
    console.log(`\n  🆕  Novos arquétipos ativados por dados reais:`);
    for (const name of newArchetypesHit) {
      console.log(`      ${name}  (${newDist[name]} respostas)`);
    }
  } else {
    console.log("\n  ℹ️  Nenhum dos 6 novos arquétipos foi ativado pelos dados existentes.");
    console.log("     Isso é esperado — dados gerados pela engine anterior (8 arquétipos).");
  }
  console.log("═══════════════════════════════════════════════════════════════\n");

  process.exit(errors > 0 || invalidKeys.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
