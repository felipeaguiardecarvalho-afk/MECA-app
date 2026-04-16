# UAT (testes de aceitação)

## O que corre

- **`npm run verify`** — `eslint` + **Vitest** + **Playwright** (UAT).
- Os E2E arrancam um `next dev` dedicado com:
  - `NEXT_PUBLIC_DISABLE_AUTH=1` — fluxo sem login real (sessão anónima / offline conforme `/api/score`);
  - `E2E_INSTANT_DIAGNOSTIC=1` — o diagnóstico submete automaticamente respostas neutras (3) e navega para o dashboard.
- **Abertura de página (smoke):** para `/`, `/login`, `/access-code`, `/dashboard`, `/assessment`, `/diagnostico`, `/plano-de-acao` — confirma HTTP 2xx/3xx, nunca 5xx, e rejeita texto típico da página de erro do browser (“unable to handle this request”, etc.). Ver `e2e/helpers/page-load.ts`.
- **Axe** (`@axe-core/playwright`) falha o teste apenas em violações de acessibilidade com impacto **critical** nas páginas `/login` e dashboard após o fluxo.

O servidor de teste usa a porta **3004** para não conflituar com `next dev` em **3000**.

## Comandos

| Comando | Descrição |
|--------|-----------|
| `npm run test:e2e` | Só Playwright (arranca `next dev` em `127.0.0.1:3004` quando necessário) |
| `npm run dev:e2e` | Servidor local com as mesmas variáveis do UAT (não usar para produto real) |
| `npm run verify` | Gate completo antes de PR / após alterações relevantes |

## CI

O workflow **`.github/workflows/uat.yml`** executa `npm run verify` em cada push/PR para `main`/`master`.

## Login real (OTP / master)

O UAT padrão **não** cobre Supabase OTP em produção. Para testar login manualmente, use `npm run dev` sem `DISABLE_AUTH` e as variáveis em `.env.example`.
