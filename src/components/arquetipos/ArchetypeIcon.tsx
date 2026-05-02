"use client";

import {
  BatteryLow,
  BookOpen,
  Cog,
  EyeOff,
  Flame,
  HelpingHand,
  Layers,
  MoonStar,
  Rocket,
  Telescope,
  TrendingUp,
  Users,
  Wrench,
  Zap,
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
  especialista_reconhecido: BookOpen,
  competente_desengajado: Layers,
  potencial_represado: Zap,
  esforcado_perdido: Flame,
  arquiteto_em_construcao: Wrench,
  adormecido: MoonStar,
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
