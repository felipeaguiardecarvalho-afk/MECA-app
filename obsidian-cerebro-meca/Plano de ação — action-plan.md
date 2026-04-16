# Plano de ação — action-plan

## Ficheiro motor

- `src/lib/action-plan.ts` — **`getActionPlan(MECAScores)`**

## Lógica

- Calcula o **pilar com menor pontuação** entre mentalidade, engajamento, cultura, performance (valores derivados de M, E, C, A).
- **Empate:** ordem fixa Mentalidade → Engajamento → Cultura → Performance.
- Devolve **título, descrição e lista de ações** — **quatro conjuntos distintos** (um por pilar), não um texto genérico único.

## Página

- `src/app/plano-de-acao/PlanoDeAcaoClient.tsx` — mesma origem de dados que o dashboard.
- Navegação: `router.push('/plano-de-acao')` com `?saved=` propagado quando aplicável.
- Empty state: orienta a realizar o diagnóstico primeiro.

## Testes

- `src/__tests__/action-plan.test.ts` — valida pilares diferentes → planos diferentes.
