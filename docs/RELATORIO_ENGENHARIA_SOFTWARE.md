# Relatório técnico — Engenharia de software (MECA App)

**Projeto:** MECA — diagnóstico comportamental (Next.js 15 + Supabase)  
**Âmbito:** código na raiz do repositório (App Router).  
**Data de referência:** 22 de abril de 2026 — alinhado ao estado atual do repositório.

---

## 1. Stack e contexto

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 15 (App Router), React 19 |
| Estilos | Tailwind CSS 3, `globals.css` com `@tailwind` + camadas `@layer` (design system `ds-*`) |
| Dados | Supabase (Postgres + Auth), API Routes |
| Testes | Vitest (`src/__tests__`) — **22** ficheiros / **216** testes (referência abr. 2026; inclui `env-hardening`, `auth-mode`, `rate-limit`, MFA/CSP, `logger`, `no-browser-storage`, etc.) |
| IA (servidor) | Anthropic SDK (`@anthropic-ai/sdk`) — `ANTHROPIC_API_KEY`; usado em `src/lib/claude.ts` para `POST /api/diagnostic/premium` |
| PDF / relatório | Puppeteer; `GET /api/report/generate` (HTML e PDF, **admin**, `requireAdminWithMfa`). |

---

## 2. Arquitetura — módulos e rotas relevantes

| Área | Ficheiros / rotas |
|------|-------------------|
| **Login (magic link)** | **`src/app/login/page.tsx`**, **`src/app/login/LoginForm.tsx`** — `POST /api/auth/magic-link` → [`handleServiceMagicLinkPost`](../src/lib/auth/service-magic-link.ts): **`auth.admin.generateLink`** + envio do link por e-mail (Resend/Gmail); resposta **apenas** `{ sent: true }` — **nunca** `action_link` no JSON. `redirectTo` com origin canónico (`getSiteOrigin()`), não o host do pedido. Rate limit na rota. Destino pós-sessão via **`?next=`** e **`/auth/confirm?next=`** no link gerado. |
| **Callback de sessão** | `src/app/auth/callback/route.ts` — troca do código do link por sessão; cookies na resposta; respeita `next` para redirecionar. Middleware **não** corre `updateSession` neste path (PKCE). |
| **Confirmação cliente (hash)** | `src/app/auth/confirm/page.tsx` — fluxo implícito: tokens em `#`; `setSession` + redirect; componente com `useSearchParams()` dentro de **`<Suspense>`** (requisito Next 15 / build). |
| **Código de acesso (legado)** | `src/app/access-code/page.tsx` — redireciona (fluxo principal sem código de organização). `POST /api/access-code` → RPC **`validate_access_code`** (admin/legado). |
| **Onboarding (primeiro diagnóstico)** | **`/onboarding`**, **`POST /api/user/profile`** — persiste `profiles.full_name` (obrigatório), `profession`, `phone` (opcionais). Gate em **`/assessment`** se nome em falta. |
| **Estado de acesso (UI/API)** | **`GET /api/user/access-state`** — `can_take_diagnostic`, `has_completed_diagnostic`, `has_access_grant`, `is_admin`. |
| Questionário (60 itens) | `src/lib/diagnostic-engine.ts` (`MECA_QUESTIONS`, `computeDiagnostic`); página **`src/app/assessment/page.tsx`** — gate server-side: utilizador com diagnóstico já concluído e sem permissão → **`/dashboard`** |
| Submissão e pontuação | `POST /api/score` → `src/app/api/score/route.ts` (valida grant + `can_take_diagnostic`; após gravar `responses`, lock/insert em **`access_grants`** preferencialmente via **service role** — `user_email` + `code: "SELF"` quando não existia grant) |
| Histórico | `GET /api/user/history` → `src/app/api/user/history/route.ts` — utilizador: lista completa (até 500 linhas); **admin:** `requireAdminWithMfa`, dados paginados (`page` / `pageSize`, máx. 200) |
| **Admin diagnósticos** | **`GET /api/admin/diagnostic-overview`**, **`POST /api/admin/unlock-diagnostic`**, **`GET /api/admin/user-responses?user_id=`** — `requireAdminWithMfa` + service role; dashboard admin user-centric via `UserSelector` |
| **Diagnóstico premium (IA)** | **`POST /api/diagnostic/premium`** — `responseId` + linha em `responses` validada por `user_id` (403 entre utilizadores). **Rate limit:** 5/min e 20/dia por utilizador **e** teto global 1000/dia (`aiPremiumRateLimitOrNull` + contador global Redis). |
| **Relatório PDF/HTML** | **`GET /api/report/generate`** — `requireAdminWithMfa`; HTML com `sanitize-html`; Chart.js servido localmente (`public/vendor`); Puppeteer com rede bloqueada (só `data:` / `about:`); sem `--no-sandbox` em produção. **Layout premium (21 abr. 2026):** capa, hero do arquétipo, gráfico do quadrante MECA (CSS), **gráfico radar SVG dos 4 pilares**, sumário executivo em 3 blocos, plano de ação em checklist, teorias reposicionadas. Margens `0.5cm 0` (`@page` + `preferCSSPageSize: true`). Paginação block-based (ver §7.6). |
| **Benchmark** | **`GET /api/benchmark`** — referência (`BENCHMARK_SCORES`); insights agregados globais para admin quando `SUPABASE_SERVICE_ROLE_KEY` disponível — ramo admin com **`requireAdminWithMfa`**. |
| Persistência | `public.profiles` (incl. `profession`, `phone` — migração **0010**), `public.responses`, `public.access_grants`, `public.access_codes`; RLS; **`can_take_diagnostic`** em `access_grants` |
| Mapeamento DB → UI | `src/lib/meca-scores.ts` (`diagnosticRowToMECAScores`, etc.) — **sem** persistir dados de diagnóstico em `sessionStorage`/`localStorage` no `src/` (política + teste `no-browser-storage`) |
| Ordenação histórico | `src/lib/meca-history-utils.ts` (`pickLatestRow`) |
| Plano de ação (motor) | `src/lib/action-plan.ts` — `getActionPlan(scores)` pelo **pilar com menor pontuação** |
| Dashboard (radar, matriz, cartão + comparação) | `src/components/Dashboard/index.tsx` (`MECADashboard`) + `DiagnosticSelector.tsx` + `ComparisonView.tsx` → `src/app/dashboard/page.tsx` (+ painel admin opcional); gráficos `RadarChart`, `ArchetypeMatrix`, `ComparisonView` com **`"use client"`** onde aplicável (Recharts/hooks) |
| Plano de ação (página) | `src/app/plano-de-acao/page.tsx`, `PlanoDeAcaoClient.tsx` |
| Dashboard admin (legado/alternativo) | `src/app/dashboard/DashboardClient.tsx` |
| Navegação global | `src/components/AppNav.tsx` + **`AuthNav.tsx`** — estado de sessão via **`onAuthStateChange`**; “Diagnóstico” quando **`can_take_diagnostic === true`** (`GET /api/user/access-state`) |
| Landing | `src/app/page.tsx`, `components/landing/HomeLanding.tsx` + **`HomeLandingActions`** (CTA conforme estado de acesso); layout full-width com colunas internas `max-w-6xl` / `max-w-4xl` |
| **`/fundamentos`** | `src/app/fundamentos/page.tsx` — teorias MECA (mesmos componentes); página pública no middleware (sem exigência de grant). |
| **`/diagnostico`** | `src/app/diagnostico/page.tsx` — entrada pública; listada como pública no middleware. |
| **Teorias MECA (educação)** | `src/lib/meca-theories.ts` — `MECA_PILLARS`; UI: `MECAPillarsSection`, `MECATabs`, `TheoryCard`, `TheoryModal` — dashboard (vista individual) e **`/fundamentos`**. |
| **Premium (UI)** | `src/components/PremiumDiagnostic.tsx` — consome `POST /api/diagnostic/premium` quando aplicável no fluxo do dashboard. |
| Middleware / fluxo | `src/middleware.ts`, `src/lib/auth-mode.ts` |
| **Boot / env (produção)** | `src/instrumentation.ts` → **`assertProductionEnv()`** em [`src/lib/env.ts`](../src/lib/env.ts) (falha rápida: vars obrigatórias, flags de bypass, `DEV_ANONYMOUS_USER_ID`, `E2E_INSTANT_DIAGNOSTIC`, TLS global, etc.). |
| **Logging servidor** | `src/lib/logger.ts` — `maskEmail`, `redact` / `redactString`; preferir `logger.*` a `console.*` com dados de utilizador. |
| **Headers HTTP** | `next.config.ts` — CSP estrita em prod, Permissions-Policy, COOP/CORP, `object-src 'none'`, etc. (ver relatório de auditoria §10). |
| Layout raiz | `src/app/layout.tsx` — import de `./globals.css`, fonte Inter, `AppNav`, boundary de estilos; **`main`** e **`body`** em largura total (`w-full`), **sem** `container` global — centragem apenas em secções internas |
| Fiabilidade UI | `StyleGuard.tsx`, `TailwindFallbackBoundary.tsx`, `UiFallback.tsx`, `src/lib/tailwind-health.ts` |
| Config build | `tailwind.config.ts` (`content`: `app`, `components`, `lib`), `postcss.config.js` |
| Scripts | `package.json` — `clean` (`.next` + `node_modules/.cache` + `.turbo`), **`rebuild`** (`clean` + `npm run build`), **`dev`** (`next dev -p 3001`), **`dev:turbo`** (`next dev --turbo -p 3001`) |
| Helper admin | `src/lib/auth/isAdmin.ts` — `MASTER_ADMIN_EMAIL` |

O motor calcula um **`DiagnosticResult`**: `mentalidade`, `engajamento`, `cultura`, `performance` (0–100), mais metadados e `deriveArchetype()` no motor.

---

## 3. Autenticação e fluxo de entrada (inclui página de login)

1. **Utilizador não autenticado** acede a rotas protegidas (`/assessment`, `/dashboard`, `/plano-de-acao`, …) → middleware redireciona para **`/login?next=...`** (ver relatório de auditoria).
2. **`/login`**: **`LoginForm`** envia e-mail para **`POST /api/auth/magic-link`**. O servidor usa **`auth.admin.generateLink`** e **envia o link por e-mail** (não devolve o token na resposta HTTP). O utilizador abre o link → **`/auth/confirm?next=…`** (tokens no hash) → `setSession` e redirecionamento para **`next`**. Detalhes e invariantes em [`service-magic-link.ts`](../src/lib/auth/service-magic-link.ts).
3. **`/auth/callback`**: estabelece cookies de sessão e redireciona para `next` (ex.: **`/dashboard`**).
4. **Primeiro diagnóstico:** sem **`profiles.full_name`** → **`/onboarding?next=/assessment`**. Com nome, **`/assessment`** renderiza o questionário. **Sem grant prévio** e sem respostas anteriores: permitido um primeiro **`POST /api/score`**. Com **`access_grants`** e **`can_take_diagnostic = false`**: novo diagnóstico **bloqueado** até **`POST /api/admin/unlock-diagnostic`**. **`/assessment`** (server) redireciona para **`/dashboard`** quando já há conclusão e não há permissão (evita refazer 60 perguntas).
5. Após **`POST /api/score`** com sucesso: **`can_take_diagnostic = false`** no grant existente, ou insert **SELF** (service role) com **`user_email`** quando não havia linha.
6. **`AuthNav`** e **`HomeLandingActions`** consultam **`/api/user/access-state`** para mostrar “Entrar”, “Diagnóstico”, “Dashboard” ou CTAs coerentes.

A página **`/login`** é parte integral do produto em modo com autenticação; não é opcional no fluxo documentado.

---

## 4. Integração de dados — dashboard e comparação

O **`MECADashboard`** obtém scores reais e histórico por prioridade:

1. **`GET /api/user/history`** — fonte principal de linhas para seleção/comparação e fallback inicial (`pickLatestRow`), mapeamento para `{ M, E, C, A }`; estado em React após submissão/redirecionamento (**sem** `sessionStorage`/`localStorage` para scores ou PII no `src/`).
2. **`?saved=`** com snapshot `meca_row_<id>` (`OFFLINE_RESULT_KEY_PREFIX`) quando aplicável (parâmetros de URL; sem armazenamento browser obrigatório).

Estados: loading, erro sem dados locais, empty (“Diagnóstico não encontrado”), vista individual com radar (`MECARadarChart`), matriz (`ArchetypeMatrix`) e **`ArchetypeCard`** com **`getArchetype()`** (matriz de perfis).

### 4.1 Comparação de diagnósticos (2 colunas)

- Estado no cliente:
  - `allRows` com histórico carregado;
  - `selectedIds` com no máximo 2 diagnósticos.
- Regras de seleção:
  - 1 diagnóstico disponível: seleciona automaticamente o único.
  - 2+ diagnósticos: seleciona automaticamente o mais recente e o anterior.
  - Clique em data alterna seleção; quando já existem 2 selecionados, o próximo clique substitui o mais antigo da seleção atual.
- Ordenação da comparação:
  - `selectedDiagnostics` é ordenado por `created_at` ascendente para garantir **esquerda=mais antigo** e **direita=mais recente**.
- Renderização condicional:
  - `selectedIds.length === 1` mantém a vista individual sem regressão.
  - `selectedIds.length === 2` ativa `ComparisonView` com:
    - radar por coluna (reuso de `MECARadarChart`, sem duplicar lógica),
    - data em cada coluna,
    - badge “Mais recente” na coluna direita,
    - botão “Limpar comparação” no seletor,
    - tabela de evolução por pilar.

### 4.2 Dashboard admin centrado por utilizador (isolamento)

- Deteção de admin: `viewer.role === "admin"` a partir de `GET /api/user/history`.
- Lista de utilizadores: `GET /api/admin/diagnostic-overview` (campos `user_id`, `email`, `response_count`), normalizada para `users`.
- Seleção ativa: `selectedUserId`; diagnósticos ativos calculados por filtro estrito:
  - `activeRows = allRows.filter((row) => row.user_id === selectedUserId)`.
- Troca de utilizador:
  - limpa seleção (`selectedIds = []`);
  - reaplica auto-seleção (`latest + previous`) apenas dentro de `activeRows`.
- Regra crítica de segurança:
  - antes da comparação, validação `selectedDiagnostics.every((d) => d.user_id === selectedUserId)`;
  - em falha, comparação não renderiza (bloqueio explícito de mistura cross-user).
- UX admin:
  - destaque visual do utilizador selecionado;
  - cabeçalho com “Usuário: {email} ({N diagnósticos})”.

**Obsoleto:** relatórios antigos que referem `MOCK_SCORES` / `useMECAScores()` apenas para o dashboard atual.

---

## 5. Plano de ação (`/plano-de-acao`)

- **Lógica de negócio:** `getActionPlan(MECAScores)` em **`action-plan.ts`**: identifica o **gargalo** (menor valor entre os quatro pilares; empate por ordem Mentalidade → Engajamento → Cultura → Performance) e devolve **título, descrição e lista de ações** específicas por pilar — não é um texto genérico único para todos os perfis.
- **Dados:** mesma origem que o dashboard (`?saved=`, histórico via API).
- **Navegação:** `router.push('/plano-de-acao')` no dashboard; propagação de `?saved=` quando existir.
- **Proteção:** incluído em `REQUIRES_SESSION` no middleware (só sessão; sem gate de grant).
- **Empty state:** mensagem orientando a realizar o diagnóstico primeiro, com link para `/assessment`.

---

## 6. Sistema de estilos e resiliência da UI

- **`globals.css`:** diretivas `@tailwind base|components|utilities` obrigatórias; camadas `@layer components` com classes **`ds-*`** (botões, páginas, inputs) usadas em várias rotas.
- **`tailwind.config.ts`:** `content` inclui `src/app`, `src/components`, `src/lib` para geração correta de utilitários.
- **`TailwindFallbackBoundary`:** em runtime, verifica se classes Tailwind produzem estilos esperados (`tailwind-health.ts`); em falha, envolve a árvore com **`UiFallback`** (estilos inline mínimos).
- **`StyleGuard`:** verificação complementar (ex.: `hidden` → `display: none`) e avisos na consola se algo falhar.
- **Teste de guarda:** `src/__tests__/styling-system.test.ts` valida presença das diretivas Tailwind e import de `globals.css` no layout.

Isto **não substitui** testes visuais ou E2E; reduz regressões óbvias de pipeline CSS.

### 6.1 Layout global e alinhamento (atualização 2026)

- **Raiz:** `body` com `min-h-screen w-full`; `main` com `w-full` **sem** `max-w-*` no layout — evita “coluna estreita” em todo o site; fundos e faixas podem ocupar a largura do viewport.
- **`.container-meca`** (`globals.css`): `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8` — padrão reutilizável; **navbar** (`AppNav`) usa o mesmo critério de largura que o conteúdo principal.
- **Landing:** secções `w-full` com blocos internos centrados (`max-w-4xl` / `max-w-3xl` para texto longo).
- **Dashboard:** coluna de conteúdo `max-w-6xl` alinhada à navbar; grelha radar + matriz responsiva (`grid-cols-1` → `lg:grid-cols-2`).

### 6.2 Secção educativa — pilares e teorias MECA

- **Fonte de dados:** `src/lib/meca-theories.ts` — tipos `Theory`, `Pillar`; constante **`MECA_PILLARS`** (pilares M/E/C/A com listas de teorias: título, `short`, `full`).
- **Componentes:** `MECAPillarsSection` (orquestra tabs + grelha + estado do modal), `MECATabs` (tabs com cores dos pilares), `TheoryCard`, `TheoryModal` (modal acessível, fechar com ESC).
- **Integração:** no dashboard, vista **individual** (não na vista de comparação a dois), posicionada entre o bloco radar/matriz e o `ArchetypeCard`.

---

## 7. Build, cache e operações

### 7.1 Scripts e porto de desenvolvimento

- **`npm run dev`:** **`next dev -p 3001`** (`package.json`). **`npm run dev:turbo`** → **`next dev --turbo -p 3001`** quando se quiser Turbopack. Abrir **`http://localhost:3001`**. Evitar assumir **:3000** se outro processo estiver a responder aí (HTTP **500** ou página errada). No Supabase (dev), incluir **`http://localhost:3001/auth/callback`** nas Redirect URLs (ver `.env.example`).
- **`npm run clean`:** apaga **`.next`** e **`node_modules/.cache`**. Usar quando surgirem erros de chunk, manifest ou HTTP 500 inexplicáveis após alterações locais.
- **`npm run rebuild`:** executa **`npm run clean && npm run build`** — gera um **`.next` de produção coerente**; recomendado antes de `npm run start` ou quando persistirem erros `MODULE_NOT_FOUND` após `clean` + novo `dev`.

### 7.2 Falhas observadas quando a aplicação “já não funciona” (ambiente local)

Estes sintomas **não indicam por si** regressão da lógica de negócio (APIs, Supabase, React) — foram reproduzíveis com **artefactos de build corrompidos ou misturados**:

| Sintoma (terminal ou browser) | Causa provável | Nota |
|--------------------------------|----------------|------|
| `Error: Cannot find module './331.js'` ou `'./611.js'` (stack com `webpack-runtime.js`, `pages/_document.js`) | Pasta **`.next` incompleta/corrompida** ou **dois processos** a escrever/ler a mesma árvore (ex. `next dev` + `next start` sem parar um deles) | Após **`npm run clean` + `npm run build`**, o build **completa com sucesso** — confirma que o **código-fonte** está íntegro. |
| `Could not find the module ... segment-explorer-node.js#SegmentViewNode` no React Client Manifest | Limitação / bug do **bundler ou DevTools** em modo desenvolvimento (Next 15) | Tratar como ruído de tooling até haver falha reprodutível **após** `rebuild`. |
| `GET / 500`, `GET /dashboard 500` em sequência, sem mudanças de código | Runtime a carregar **chunks em falta** ou manifest desalinhado (mesma família que a primeira linha) | Antes de rever rotas ou BD, executar **`npm run clean`** e um único **`npm run dev`**, ou **`npm run rebuild`**. |
| Bons resultados intercalados com 500 (intermitente) | **Fast Refresh** / recompilações sobre cache partido | Mesma mitigação: parar servidores, `clean`, arranque único. |
| Erro ao abrir **`localhost:3000`** mas o Next anuncia **3001** | Pedido ao **processo ou porta errados** | Usar sempre a porta indicada pelo `npm run dev` (por defeito **3001**). |

**Procedimento de recuperação:** (1) parar todas as instâncias Node/Next que usem esta pasta; (2) `npm run clean`; (3) `npm run dev` **ou** `npm run rebuild` seguido de `npm run start`; (4) garantir **uma só** instância e a URL correta.

### 7.3 `next start` (produção local)

- **`next start`** lê o mesmo diretório **`.next`**. Se estiver corrompido, o servidor pode falhar com os **mesmos** `MODULE_NOT_FOUND` — a correção é **`npm run rebuild`**, não alteração de código da aplicação.

### 7.4 Aliases de rota

- `/access` → **`/dashboard`**; `/results` → `/dashboard` (com `highlight`); `/reports` → `/dashboard`.

### 7.5 Hardening de segurança (atualizado 21 abr. 2026)

- **`assertProductionEnv()`** (`src/lib/env.ts`) + **`src/instrumentation.ts`**: em produção, o processo Node **não arranca** se faltarem variáveis obrigatórias, se existirem flags perigosas ou se **`NODE_TLS_REJECT_UNAUTHORIZED=0`**. Em desenvolvimento, avisos na consola.
- **Magic link:** `redirectTo` só com **`getSiteOrigin()`**; **`action_link` nunca** na resposta JSON; canal de entrega = e-mail (consola só em dev sem SMTP); SMTP com TLS 1.2+ e verificação de certificado.
- **API:** rate limit em rotas de auth, `access-code`, `score` e **`POST /api/diagnostic/premium`** (por utilizador).
- **Admin MFA:** `requireAdminWithMfa` em PDF, `/api/admin/*`, **`GET /api/user/history`** (ramo admin) e **`GET /api/benchmark`** (ramo admin).
- **HTTP:** CSP e headers reforçados em `next.config.ts` (ver **RELATORIO_AUDITORIA_SEGURANCA.md**).
- **Testes:** `env-hardening.test.ts`, `rate-limit.test.ts`, `admin-mfa-guard.test.ts`, `csp*.test.ts`, entre outros.

### 7.6 Motor de paginação do relatório PDF (21 abr. 2026)

Refactor estrutural em **`src/app/api/report/generate/route.ts`** para eliminar truncagem silenciosa de conteúdo em secções longas (arquétipo, teorias) e garantir paginação determinística no Puppeteer.

**Problema corrigido:** a regra anterior `.page { overflow: hidden; min-height: calc(297mm - 1cm); page-break-after: always }` transformava cada secção numa "gaiola" de altura fixa; qualquer excesso era **cortado** em vez de fluir para a próxima página. Os `.page-foot` absolutos por secção também partiam o layout quando uma secção legitimamente ocupava duas páginas.

**Novo modelo (block-based):**

- **`.page`** não tem `overflow: hidden` nem `min-height`; usa apenas `break-before: page` (e `page-break-before: always` como fallback).
- **`.cover`** mantém `height: calc(297mm - 1cm)` + `overflow: hidden` (apenas para os glows decorativos) + `break-inside: avoid` + `break-after: page`.
- **Blocos atómicos** com `break-inside: avoid`:
  - `.exec-block`, `.exec-footnote`, `.pillar-card`, `.pillars-overview`, `.quad-wrap`, `.hero-intro`, `.hero-coords`, `.arch-opener`, `.arch-identity`, `.arch-block`, `.action-hero-opener`, `.action-step`, `.theories-opener`, `.theory-card`, `.closing-card`.
- **Prevenção de órfãos** com `break-after: avoid-page`:
  - `.eyebrow`, `.section-title`, `.section-kicker`, `.page-head`.
  - Regras específicas: "Leitura detalhada" (pillars) colada ao primeiro `.pillar-card`; `.action-hero-opener` colado ao primeiro `.action-step`.
- **Rodapés absolutos removidos** (três ocorrências) — a identidade visual da secção permanece via `.page-head` no topo.
- **Tipografia:** `orphans: 3; widows: 3` global; `p` também.
- **Wrappers HTML adicionados** para agrupar semanticamente: `.hero-intro`, `.arch-opener`, `.pillars-detailed`, `.action-hero-opener`, `.theories-opener`, utilitário `.keep-together`.

**Configuração Puppeteer:** `page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true, margin: { top: '0.5cm', right: '0', bottom: '0.5cm', left: '0' } })`.

**Validação (21 abr. 2026):**
- `npx tsc --noEmit` — limpo
- `npx eslint src/app/api/report/generate/route.ts` — limpo

**Backups físicos (código + `docs/` + `supabase/`):** ver **`RELATORIO_SITUACAO_ATUAL.md` §10** — snapshot recente: `backups/MECA-backup-20260421-215216/` + `backups/MECA-backup-fonte-20260421-215216.zip`; snapshot PDF refactor: `backups/MECA-backup-20260421-111018/` + respetivo `.zip`.

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

- `diagnostic-engine.test.ts`, `evolution.test.ts`, `archetype-engine.test.ts` — motor e regras associadas.
- `benchmark.test.ts` — referências e insights de benchmark.
- `regression-diagnostic-integrity.test.ts` — integridade de dados do diagnóstico.
- `action-plan.test.ts` — confirma que scores diferentes escolhem pilares diferentes e que os títulos/planos divergem.
- `styling-system.test.ts` — integridade mínima do pipeline CSS.
- `access-control.test.ts` — verificações ligadas a **`isAdmin`**.
- `regression-comparison-logic.test.ts` — seleção e ordenação na comparação do dashboard.
- `env-hardening.test.ts` — validação de `assertProductionEnv()` (DEV vs PROD, flags proibidas, TLS global, `DEV_ANONYMOUS_USER_ID`, `E2E_INSTANT_DIAGNOSTIC`).
- `auth-mode.test.ts` — `isAuthDisabled()` em produção vs desenvolvimento.
- `rate-limit.test.ts` — limites da rota premium (IA) e teto global.
- `logger.test.ts`, `no-browser-storage.test.ts` — redação de PII e ausência de storage browser sensível.

---

## 10. Recomendações de evolução

1. E2E (Playwright/Cypress) para fluxo **login → onboarding (se aplicável) → assessment → dashboard → plano de ação** e cenário **admin unlock → segundo diagnóstico**.
2. Decisão de produto: alinhar ou documentar **`getArchetype`** vs **`deriveArchetype`** na copy.
3. Consolidar experiência “resultado” se `DashboardClient` e `MECADashboard` forem mantidos em paralelo a longo prazo.
4. Adicionar check operacional no arranque para alertar quando houver mais de uma instância Next.js ativa na mesma porta em ambiente local.

---

## 11. Resumo executivo

A aplicação usa **Next.js App Router**, **Tailwind** com design system em **`globals.css`**, **layout full-width** com conteúdo centrado em colunas (`container-meca` / `max-w-*` por secção), e **dados reais** no dashboard via **`GET /api/user/history`** e estado em React (**sem** persistência sensível em `sessionStorage`/`localStorage` no `src/`). A **página `/login`** obtém magic link por **`POST /api/auth/magic-link`** (servidor: **`generateLink`** + e-mail; sem token na resposta HTTP) e o utilizador completa em **`/auth/confirm`** (hash) ou, quando aplicável, **`/auth/callback`**. **Onboarding** (`/onboarding`, **`POST /api/user/profile`**) para nome antes do primeiro **`/assessment`**. **`access_grants`** com **`can_take_diagnostic`** — **um diagnóstico por ciclo** até **desbloqueio admin**; gate em **`/assessment`** e em **`POST /api/score`**. **APIs:** diagnóstico premium (Claude, rate limit por utilizador e global), relatório PDF/HTML (admin com MFA; PDF endurecido), benchmark (MFA no ramo admin), respostas admin por `user_id`, histórico admin paginado. **Plano de ação:** `getActionPlan`. Dashboard e **`/fundamentos`:** teorias **`meca-theories`**. Dev: **`npm run dev`** na **porta 3001**; **`dev:turbo`** opcional. **Hardening:** `assertProductionEnv` no boot, `isAuthDisabled` seguro em produção, headers em `next.config.ts`, **`TRUST_PROXY`** para IP, logging com redação. **Vitest:** **216** testes em **22** ficheiros. **`npm run clean`** / **`rebuild`** para falhas de **`.next`** (secção 7.2). Middleware exige **sessão** nas rotas listadas em `REQUIRES_SESSION` e envia anónimos para **`/login`** (sem gate de código de organização). **Segurança:** bloqueadores críticos da auditoria **endereçados**; rever **RELATORIO_AUDITORIA_SEGURANCA.md** §6–8 para go-live.
