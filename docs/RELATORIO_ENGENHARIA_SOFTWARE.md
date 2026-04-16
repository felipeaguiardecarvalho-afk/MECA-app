# Relatório técnico — Engenharia de software (MECA App)

**Projeto:** MECA — diagnóstico comportamental (Next.js 15 + Supabase)  
**Âmbito:** código na raiz do repositório (App Router).  
**Data de referência:** abril de 2026 — alinhado ao estado atual do repositório.

---

## 1. Stack e contexto

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 15 (App Router), React 19 |
| Estilos | Tailwind CSS 3, `globals.css` com `@tailwind` + camadas `@layer` (design system `ds-*`) |
| Dados | Supabase (Postgres + Auth), API Routes |
| Testes | Vitest (`src/__tests__`) |

---

## 2. Arquitetura — módulos e rotas relevantes

| Área | Ficheiros / rotas |
|------|-------------------|
| **Login (OTP / magic link)** | **`src/app/login/page.tsx`**, **`src/app/login/LoginForm.tsx`** — `supabase.auth.signInWithOtp({ email })`; redirect pós-login via query **`?next=`** (ex.: `/access-code`, `/assessment`). |
| **Callback de sessão** | `src/app/auth/callback/route.ts` — troca do código do link por sessão; cookies na resposta; respeita `next` para redirecionar. |
| **Código de acesso** | `src/app/access-code/` (`AccessForm.tsx`) — `POST /api/access-code` → RPC Supabase **`validate_access_code`** → insere **`access_grants`**. |
| **Estado de acesso (UI/API)** | **`GET /api/user/access-state`** — `can_take_diagnostic`, `has_completed_diagnostic`, `has_access_grant`, `is_admin`. |
| Questionário (60 itens) | `src/lib/diagnostic-engine.ts` (`MECA_QUESTIONS`, `computeDiagnostic`) |
| Submissão e pontuação | `POST /api/score` → `src/app/api/score/route.ts` (valida grant + `can_take_diagnostic`; após gravar, bloqueia novo diagnóstico) |
| Histórico | `GET /api/user/history` → `src/app/api/user/history/route.ts` |
| **Admin diagnósticos** | **`GET /api/admin/diagnostic-overview`**, **`POST /api/admin/unlock-diagnostic`** (`MASTER_ADMIN_EMAIL` + service role) |
| Persistência | `public.responses`, `public.access_grants`, `public.access_codes`; RLS; migração **`can_take_diagnostic`** em `access_grants` |
| Mapeamento DB → UI | `src/lib/meca-dashboard-scores.ts` (`diagnosticRowToMECAScores`, bootstrap `sessionStorage`) |
| Ordenação histórico | `src/lib/meca-history-utils.ts` (`pickLatestRow`) |
| Plano de ação (motor) | `src/lib/action-plan.ts` — `getActionPlan(scores)` pelo **pilar com menor pontuação** |
| Dashboard (radar, matriz, cartão) | `src/components/Dashboard/index.tsx` (`MECADashboard`) → `src/app/dashboard/page.tsx` (+ painel admin opcional) |
| Plano de ação (página) | `src/app/plano-de-acao/page.tsx`, `PlanoDeAcaoClient.tsx` |
| Dashboard admin (legado/alternativo) | `src/app/dashboard/DashboardClient.tsx` |
| Navegação global | `src/components/AppNav.tsx` — ligações condicionais (ex. “Diagnóstico” só com `can_take_diagnostic`) |
| Landing | `src/app/page.tsx`, `components/landing/HomeLanding.tsx` + **`HomeLandingActions`** (CTA conforme estado de acesso) |
| Middleware / fluxo | `src/middleware.ts`, `src/lib/auth-mode.ts` |
| Layout raiz | `src/app/layout.tsx` — import de `./globals.css`, fonte Inter, `AppNav`, boundary de estilos |
| Fiabilidade UI | `StyleGuard.tsx`, `TailwindFallbackBoundary.tsx`, `UiFallback.tsx`, `src/lib/tailwind-health.ts` |
| Config build | `tailwind.config.ts` (`content`: `app`, `components`, `lib`), `postcss.config.js` |
| Scripts | `package.json` — `clean` remove `.next` e `node_modules/.cache` |
| Helper admin | `src/lib/auth/isAdmin.ts` — `MASTER_ADMIN_EMAIL` |

O motor calcula um **`DiagnosticResult`**: `mentalidade`, `engajamento`, `cultura`, `performance` (0–100), mais metadados e `deriveArchetype()` no motor.

---

## 3. Autenticação e fluxo de entrada (inclui página de login)

1. **Utilizador não autenticado** acede a rotas protegidas → middleware redireciona para **`/login?next=...`** (ver relatório de auditoria).
2. **`/login`**: formulário em **`LoginForm`** pede e-mail e chama **`supabase.auth.signInWithOtp`**. O utilizador recebe **magic link** por e-mail; **`emailRedirectTo`** inclui **`/auth/callback`** e o parâmetro **`next`** para o destino pós-sessão.
3. **`/auth/callback`**: estabelece cookies de sessão e redireciona para `next` (por exemplo **`/access-code`**).
4. Sem **`access_grants`**: utilizador deve validar código em **`/access-code`** (API + RPC). Com grant e **`can_take_diagnostic`**, pode **`/assessment`**; após **`POST /api/score`**, o servidor define **`can_take_diagnostic = false`** (um diagnóstico por utilizador até **unlock** admin).
5. **`AuthNav`** e **`HomeLandingActions`** consultam **`/api/user/access-state`** para mostrar “Entrar”, “Diagnóstico”, “Dashboard” ou CTAs coerentes.

A página **`/login`** é parte integral do produto em modo com autenticação; não é opcional no fluxo documentado.

---

## 4. Integração de dados — dashboard

O **`MECADashboard`** obtém scores reais, por prioridade:

1. **Bootstrap** em `sessionStorage` (`meca_dashboard_bootstrap` / `DASHBOARD_BOOTSTRAP_KEY`) após `POST /api/score`.
2. **`?saved=`** com snapshot `meca_row_<id>` (`OFFLINE_RESULT_KEY_PREFIX`) quando aplicável.
3. **`GET /api/user/history`** — linha mais recente (`pickLatestRow`) ou linha que coincide com `?saved=`, mapeada para `{ M, E, C, A }`.

Estados: loading, erro sem dados locais, empty (“Diagnóstico não encontrado”), vista com radar (`MECARadarChart`), matriz (`ArchetypeMatrix`) e **`ArchetypeCard`** com **`getArchetype()`** (matriz de perfis).

**Obsoleto:** relatórios antigos que referem `MOCK_SCORES` / `useMECAScores()` apenas para o dashboard atual.

---

## 5. Plano de ação (`/plano-de-acao`)

- **Lógica de negócio:** `getActionPlan(MECAScores)` em **`action-plan.ts`**: identifica o **gargalo** (menor valor entre os quatro pilares; empate por ordem Mentalidade → Engajamento → Cultura → Performance) e devolve **título, descrição e lista de ações** específicas por pilar — não é um texto genérico único para todos os perfis.
- **Dados:** mesma origem que o dashboard (bootstrap, `?saved=`, histórico).
- **Navegação:** `router.push('/plano-de-acao')` no dashboard; propagação de `?saved=` quando existir.
- **Proteção:** incluído em `PROTECTED` no middleware (sessão + `access_grants` quando auth não está desligada).
- **Empty state:** mensagem orientando a realizar o diagnóstico primeiro, com link para `/assessment`.

---

## 6. Sistema de estilos e resiliência da UI

- **`globals.css`:** diretivas `@tailwind base|components|utilities` obrigatórias; camadas `@layer components` com classes **`ds-*`** (botões, páginas, inputs) usadas em várias rotas.
- **`tailwind.config.ts`:** `content` inclui `src/app`, `src/components`, `src/lib` para geração correta de utilitários.
- **`TailwindFallbackBoundary`:** em runtime, verifica se classes Tailwind produzem estilos esperados (`tailwind-health.ts`); em falha, envolve a árvore com **`UiFallback`** (estilos inline mínimos).
- **`StyleGuard`:** verificação complementar (ex.: `hidden` → `display: none`) e avisos na consola se algo falhar.
- **Teste de guarda:** `src/__tests__/styling-system.test.ts` valida presença das diretivas Tailwind e import de `globals.css` no layout.

Isto **não substitui** testes visuais ou E2E; reduz regressões óbvias de pipeline CSS.

---

## 7. Build, cache e operações

- **`npm run clean`:** apaga `.next` e `node_modules/.cache` (Webpack). Usar quando surgirem erros do tipo **chunk em falta** (`611.js`), **`a[d] is not a function`** no `webpack-runtime`, ou **HTTP 500** após cache corrompido.
- **Procedimento recomendado:** parar `next dev` / `next start`, executar `npm run clean`, voltar a arrancar.
- **Aliases de rota:** `/access` → `/access-code`; `/results` → `/dashboard` (com `highlight`); `/reports` → `/dashboard`.

---

## 8. Modelo motor ↔ UI

| `MECAScores` | Campo em `responses` / motor |
|--------------|------------------------------|
| `M` | `mentalidade` |
| `E` | `engajamento` |
| `C` | `cultura` |
| `A` | `performance` |

**Dois sistemas de “arquétipo”:**

- **`getArchetype()`** (`archetypeEngine.ts`) — usado no **dashboard** (cartão / matriz).
- **`deriveArchetype()`** (`diagnostic-engine.ts`) — usado noutros contextos (ex. API).

O **plano de ação** baseia-se no **pilar mais baixo**, não no nome do arquétipo da matriz.

---

## 9. Testes automatizados (amostra)

- `diagnostic-engine.test.ts`, `evolution.test.ts` — motor e regras associadas.
- `action-plan.test.ts` — confirma que scores diferentes escolhem pilares diferentes e que os títulos/planos divergem.
- `styling-system.test.ts` — integridade mínima do pipeline CSS.
- `access-control.test.ts` — verificações ligadas a **`isAdmin`**.

---

## 10. Recomendações de evolução

1. E2E (Playwright/Cypress) para fluxo **login → access-code → assessment → dashboard → plano de ação**.
2. Decisão de produto: alinhar ou documentar **`getArchetype`** vs **`deriveArchetype`** na copy.
3. Consolidar experiência “resultado” se `DashboardClient` e `MECADashboard` forem mantidos em paralelo a longo prazo.

---

## 11. Resumo executivo

A aplicação usa **Next.js App Router**, **Tailwind** com design system em **`globals.css`**, e **dados reais** no dashboard via histórico e `sessionStorage`. A **página `/login`** implementa **entrada por e-mail (OTP / magic link)** via Supabase, integrada com **`/auth/callback`**, **`/access-code`**, **`access_grants`** e regras de **um diagnóstico por utilizador** (`can_take_diagnostic`) com **desbloqueio admin**. O **plano de ação** é gerado por **`getActionPlan`**. Existem **guardas de estilo**, **testes** de apoio e **`npm run clean`** para recuperação quando o **cache de build** falha. O middleware protege **`/assessment`**, **`/dashboard`** e **`/plano-de-acao`** no fluxo estrito com autenticação ativa e redireciona não autenticados para **`/login`**.
