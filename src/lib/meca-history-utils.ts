/** Linha mínima de `responses` para ordenação e mapeamento de scores. */
export type ResponseRowScores = {
  id: string;
  created_at: string;
  mentalidade: number;
  engajamento: number;
  cultura: number;
  performance: number;
};

export function pickLatestRow<T extends { created_at: string }>(
  rows: T[],
): T | null {
  if (!rows.length) return null;
  return [...rows].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0];
}
