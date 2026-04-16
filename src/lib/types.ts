export type MetricKey =
  | "mentalidade"
  | "engajamento"
  | "cultura"
  | "performance"
  | "direction"
  | "capacity";

export type DiagnosticResult = {
  mentalidade: number;
  engajamento: number;
  cultura: number;
  performance: number;
  direction: number;
  capacity: number;
  archetype: string;
};

export type Evolution = {
  mentalidade_delta: number;
  engajamento_delta: number;
  cultura_delta: number;
  performance_delta: number;
  direction_delta: number;
  capacity_delta: number;
};
