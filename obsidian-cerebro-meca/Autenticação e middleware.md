# Autenticação e middleware

## Página de login

- **`/login`** — `src/app/login/page.tsx`, **`LoginForm.tsx`**
- Entrada por **e-mail** sem senha persistente: **`supabase.auth.signInWithOtp`**
- O utilizador confirma com **magic link** → **`/auth/callback`**
- Query **`?next=`** define o destino após sessão (ex.: `/access-code`)

## Ficheiros

- `src/middleware.ts` — `updateSession` (Supabase SSR); sem sessão em rotas protegidas → **`/login?next=...`**
- `src/lib/auth-mode.ts` — `isAuthDisabled()` (`NEXT_PUBLIC_DISABLE_AUTH`, `DISABLE_AUTH`)

## Rotas protegidas (fluxo estrito)

Quando **auth não está desligada**: utilizador autenticado **e** registo em **`access_grants`**:

- `/assessment` (também **`can_take_diagnostic`**)
- `/dashboard`
- `/plano-de-acao`

## Modo dev sem login

- Se `isAuthDisabled()` → middleware **não aplica** redirecionamentos de gate (continua a atualizar sessão).

## Callback

- `src/app/auth/callback/route.ts` — magic link; cookies na resposta.

⚠️ Em **produção**, o modo auth desligada não deve estar ativo.

Ver também: [[Segurança — relatório auditoria]] (ficheiros em `docs/`).
