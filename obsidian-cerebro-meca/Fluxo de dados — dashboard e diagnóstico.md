# Fluxo de dados — dashboard e diagnóstico

## Motor

- `src/lib/diagnostic-engine.ts` — 60 perguntas, `computeDiagnostic` → `mentalidade`, `engajamento`, `cultura`, `performance` (0–100).

## Persistência

- `POST /api/score` — grava em `public.responses` (conforme RLS / service role em cenários admin ou dev).

## Dashboard (`MECADashboard`)

Ordem de prioridade dos scores:

1. **Bootstrap** `sessionStorage` — chave `meca_dashboard_bootstrap` (`DASHBOARD_BOOTSTRAP_KEY` em `meca-dashboard-scores.ts`) após submissão.
2. **`?saved=`** + snapshot `meca_row_<id>` (`OFFLINE_RESULT_KEY_PREFIX`).
3. **`GET /api/user/history`** — última linha (`pickLatestRow`) ou linha com id = `?saved=`.

Mapeamento DB → UI: `diagnosticRowToMECAScores` → `{ M, E, C, A }`.

## Cartão de perfil

- `getArchetype()` em `archetypeEngine.ts` — matriz de nomes (ex. Potencial Disperso).

Distinto de `deriveArchetype()` no motor — ver [[Plano de ação — action-plan]].
