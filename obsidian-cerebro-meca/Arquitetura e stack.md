# Arquitetura e stack

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | **Next.js 15** (App Router), **React 19** |
| Estilos | **Tailwind CSS 3**, `src/app/globals.css` (`@tailwind` + camadas `@layer` / classes `ds-*`) |
| Backend dados | **Supabase** (Postgres + Auth) |
| Testes | **Vitest** (`src/__tests__`) |

## Estrutura principal

- `src/app/` — rotas (`page.tsx`, `layout.tsx`), APIs em `src/app/api/`
- `src/components/` — UI (ex.: `Dashboard/`, `AppNav.tsx`)
- `src/lib/` — motores (`diagnostic-engine`, `action-plan`, `meca-dashboard-scores`, `tailwind-health`, …)
- `src/middleware.ts` — sessão Supabase + gates de rota

## Rotas de produto (memória)

- `/` — landing
- `/assessment` — questionário
- `/dashboard` — resultados (radar, matriz, cartão)
- `/plano-de-acao` — plano por pilar mais baixo
- `/access-code`, `/login`, `/auth/callback`

## Aliases

- `/access` → `/access-code`
- `/results` → `/dashboard` (query `highlight`)
- `/reports` → `/dashboard`

Ver também: [[Fluxo de dados — dashboard e diagnóstico]].
