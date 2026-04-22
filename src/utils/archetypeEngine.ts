/**
 * Compat shim — o sistema de arquétipos vive em `@/lib/archetypes`.
 *
 * Este módulo existe apenas para preservar os import paths legados
 * (`@/utils/archetypeEngine`) durante a transição. Adicionar novas definições
 * APENAS em `src/lib/archetypes.ts`.
 */
export type {
  ArchetypeKey,
  ArchetypeDefinition,
  ArchetypeReport,
  ArchetypeResult,
  MECAScores,
  QuadrantPosition,
  ZoneDefinition,
  ZoneKey,
} from "@/lib/archetypes";

export {
  ARCHETYPES,
  ARCHETYPE_NAMES,
  ARCHETYPE_ORDER,
  archetypesInZone,
  AXIS_THRESHOLD,
  classifyArchetype,
  computeCapacityAxis,
  computeDirectionAxis,
  computePositionZone,
  getArchetype,
  PILAR_COLORS,
  PILAR_NAMES,
  ZONES,
} from "@/lib/archetypes";
