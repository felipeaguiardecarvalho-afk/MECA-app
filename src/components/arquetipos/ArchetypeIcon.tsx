"use client";

import {
  BatteryLow,
  Cog,
  EyeOff,
  HelpingHand,
  Rocket,
  Telescope,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ArchetypeKey } from "@/lib/archetypes";

const ICON_MAP: Record<ArchetypeKey, LucideIcon> = {
  executor_isolado: Cog,
  performatico_exausto: BatteryLow,
  estrategista_estagnado: Telescope,
  bem_quisto_estagnado: Users,
  protagonista_desalinhado: Rocket,
  acelerado_meca: TrendingUp,
  profissional_invisivel: EyeOff,
  util_sem_direcao: HelpingHand,
};

type Props = {
  archetypeKey: ArchetypeKey;
  className?: string;
  strokeWidth?: number;
};

export function ArchetypeIcon({ archetypeKey, className, strokeWidth = 1.75 }: Props) {
  const Icon = ICON_MAP[archetypeKey];
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}
