# APIs e Supabase

## Rotas API (amostra)

- `POST /api/score` — submissão e pontuação
- `GET /api/user/history` — histórico do utilizador
- `POST /api/access-code` — validação de código (conforme implementação)
- `GET /api/benchmark` — benchmarks (se ativo)

## Base de dados

- Migrações: `supabase/migrations/`
- Tabelas relevantes: `responses`, `access_codes`, `access_grants`, …

## Variáveis sensíveis

- `SUPABASE_SERVICE_ROLE_KEY` — **só servidor**
- `NEXT_PUBLIC_*` — públicas no cliente; RLS obrigatório em dados sensíveis

Ver relatório de auditoria em `docs/RELATORIO_AUDITORIA_SEGURANCA.md`.
