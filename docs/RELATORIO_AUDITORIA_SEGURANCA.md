# Relatório — Auditoria de segurança (MECA App)

**Data de referência:** 22 de abril de 2026  
**Escopo:** autenticação, autorização, segredos, superfície API, IA, PDF/Puppeteer e hardening

**Estado após correções em código (abril 2026):** os bloqueadores **críticos** identificados na re-auditoria inicial (MFA em histórico/benchmark, PDF/Puppeteer, SMTP TLS, rate limit do premium) **foram tratados**. **Revisão (20 abr 2026):** endurecimento adicional de ambiente (flags dev proibidas no boot), `isAuthDisabled()` em produção, logs com redação de PII, limite global de IA, `TRUST_PROXY` para IP em rate limit, corpo neutro em `login-intent`. **Atualização (21 abr. 2026):** redesign visual e refactor do motor de paginação do relatório PDF (`src/app/api/report/generate/route.ts`) — **sem alteração** de superfície de segurança: mantém-se `requireAdminWithMfa`, `sanitize-html`, rede bloqueada no Puppeteer (só `data:` / `about:`) e Chart servido localmente (`public/vendor`). **Atualização (22 abr. 2026):** fluxo principal **sem** código de organização obrigatório; bloqueio de novo diagnóstico via **`access_grants.can_take_diagnostic`** + **`POST /api/score`**; mutações de grant pós-submissão com **service role** onde RLS não permite INSERT ao cliente. **Permanecem riscos médios** (superfície LLM / prompt injection, operação de `TRUST_PROXY` e de proxies) — ver §6.

---

## 1. Controles de autenticação

- Entrada por `/login` com `POST /api/auth/magic-link`.
- Geração de link via `auth.admin.generateLink` no servidor.
- Entrega do link por e-mail (sem expor token na resposta HTTP).
- Conclusão de sessão via `/auth/confirm` (hash) ou `/auth/callback` (código).

**Proteções-chave**

- `action_link` nunca retorna no JSON da API.
- `redirectTo` usa origem canônica (`getSiteOrigin()`), evitando host header injection.
- Rate limit em endpoints de descoberta/login (`magic-link`, `master-magic-link`, `login-intent`, `access-code`, `score`).

---

## 2. Autorização e privilégio

- Middleware exige **sessão** nas rotas em `REQUIRES_SESSION` (ex.: `/assessment`, `/dashboard`, `/plano-de-acao`).
- **Diagnóstico:** autorização por **`access_grants`** (`can_take_diagnostic`) e por existência de **`responses`** — validado em **`POST /api/score`** e gate em **`/assessment`** (server). Reabertura só por **`POST /api/admin/unlock-diagnostic`** (master + MFA). O fluxo principal **não** exige código de organização no middleware.
- **Admin com MFA (AAL2):** `requireAdminWithMfa` em:
  - `GET /api/report/generate`
  - `GET /api/admin/diagnostic-overview`
  - `POST /api/admin/unlock-diagnostic`
  - `GET /api/admin/user-responses`
  - **`GET /api/user/history`** (ramo admin, dados paginados)
  - **`GET /api/benchmark`** (ramo admin, agregados globais)
- Service role onde necessário para consultas cross-tenant.

---

## 3. Segredos e variáveis críticas

### Obrigatórias em produção

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Proibidas em produção

- `NEXT_PUBLIC_DISABLE_AUTH`
- `DISABLE_AUTH`
- `DEV_ANONYMOUS_USER_ID` (utilizador fixo sem sessão — só desenvolvimento)
- `E2E_INSTANT_DIAGNOSTIC` (atalho de testes no assessment — só desenvolvimento)
- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`
- `ENABLE_MAGIC_LINK_SERVICE_FOR_ALL`
- `MAGIC_LINK_BYPASS_ALL_EMAILS`

### Produção — TLS global

- `NODE_TLS_REJECT_UNAUTHORIZED=0` **recusa arranque** em produção (`assertProductionEnv`), para não desativar verificação TLS em todo o processo Node.

Essas regras são validadas por `assertProductionEnv()` no boot.

---

## 4. Hardening aplicado e vigente

- Boot fail-fast em `src/instrumentation.ts` + `src/lib/env.ts`.
- Headers de segurança em `next.config.ts` (CSP, XFO, XCTO, COOP/CORP e políticas correlatas).
- Rate limit nas rotas de autenticação e em `access-code` / `score`.
- **`getClientIp`:** só confia em `X-Forwarded-For` / `X-Real-IP` quando **`TRUST_PROXY=true`** (ou `1`); caso contrário usa `"unknown"` para limites anónimos por IP (mitiga spoofing de cabeçalhos).
- **Logging:** `src/lib/logger.ts` — `maskEmail`, `redact` / `redactString`; rotas sensíveis não escrevem emails completos em stdout; fallback dev de magic link **não** imprime URL com credencial.
- **`POST /api/diagnostic/premium`:** limite **5 / minuto** e **20 / dia** por utilizador **e** teto **global 1000 / dia** para todas as chamadas (`global:ai:requests`; 429 “Service temporarily unavailable” se excedido).
- **`GET /api/report/generate` (Puppeteer):** Chart.js em `public/vendor` (inline no HTML), `sanitize-html` no documento e fragmentos, interceção de pedidos (só `data:` / `about:`), `domcontentloaded` + pequena espera para o canvas, **sem** `--no-sandbox` quando `NODE_ENV === "production"`.
- **SMTP Gmail (`send-magic-link.ts`):** `secure: true`, `tls: { minVersion: "TLSv1.2", rejectUnauthorized: true }` (sem `rejectUnauthorized: false`).
- `/auth/confirm` com `<Suspense>` para build estável no Next 15.

---

## 5. Itens críticos — estado (histórico da auditoria)

| ID | Tema | Estado |
|----|------|--------|
| 5.1 | MFA em `GET /api/user/history` e `GET /api/benchmark` (admin) | **Corrigido** — `requireAdminWithMfa`; histórico admin com paginação (`page` / `pageSize`). |
| 5.2 | PDF / Puppeteer (CDN, sandbox, rede) | **Corrigido** — ver §4. |
| 5.3 | SMTP `rejectUnauthorized: false` | **Corrigido** — ver §4 e §3 (TLS). |
| 5.4 | Custo IA em `POST /api/diagnostic/premium` | **Corrigido** — limites por utilizador (§4). |

---

## 6. Riscos residuais (revisão atual)

### 6.1 MÉDIO — IP atrás de proxy (`getClientIp` + `TRUST_PROXY`)

- Com **`TRUST_PROXY` desligado**, cabeçalhos `X-Forwarded-For` / `X-Real-IP` são **ignorados** para rate limit por IP (chave anónima estável).
- Com **`TRUST_PROXY` ligado**, o operador deve garantir que só proxies de confiança injetam esses cabeçalhos; caso contrário, spoofing continua possível para limites por IP.

### 6.2 MÉDIO — Enumeração e injeção

- **`POST /api/auth/login-intent`:** corpo HTTP **sempre** `{ "success": true }` (exceto 429); resultados reais só em logs com email mascarado — remove oráculo na resposta; **permanece** risco lateral (timing, logs operacionais).
- **Claude (`src/lib/claude.ts`):** sanitização do input, validação de schema na resposta JSON, limites de taxa; **permanece** risco de prompt injection / uso indevido do modelo face ao modelo de ameaça.

### 6.3 BAIXO (controlado em código) — Modo desenvolvimento

- Em **`NODE_ENV=production`**, `assertProductionEnv()` recusa arranque se existirem flags de bypass ou `DEV_ANONYMOUS_USER_ID` / `E2E_INSTANT_DIAGNOSTIC`.
- `isAuthDisabled()` em produção chama `assertProductionAuthConfig()` e **nunca** devolve `true`; se as flags existirem, **lança erro** (defesa em profundidade com o middleware).

### 6.4 MÉDIO — Superfície geral

- Política de **sem `sessionStorage` / `localStorage`** para dados de utilizador no `src/` (teste `no-browser-storage.test.ts`); XSS no cliente continua a ser tema de CSP e higiene de UI.
- Configuração Resend/domínio `FROM` e deliverability.

---

## 7. Checklist de produção

- [x] MFA admin nas rotas sensíveis, incluindo histórico e benchmark.
- [x] PDF/Puppeteer endurecido (Chart local, rede bloqueada, TLS SMTP, sem sandbox relaxado em prod).
- [x] Rate limit no premium (Claude), por utilizador e **global diário**.
- [x] `TRUST_PROXY` definido conscientemente atrás de reverse proxy de confiança (ou aceitar limites anónimos por `"unknown"`).
- [x] Boot recusa `DISABLE_AUTH`, `NEXT_PUBLIC_DISABLE_AUTH`, `DEV_ANONYMOUS_USER_ID`, `E2E_INSTANT_DIAGNOSTIC` e demais flags proibidas (`assertProductionEnv`).
- [ ] Service role apenas no servidor.
- [ ] Chaves sensíveis fora de logs e do client bundle.
- [ ] Redirect URLs do Supabase alinhadas ao domínio real.
- [ ] `npm run build` e `npm run test` sem falhas antes de deploy.
- [ ] Runtime de produção com Chromium/Puppeteer compatível (sandbox ou contentor dedicado).

---

## 8. Conclusão

O código incorpora as correções aos quatro pontos críticos da auditoria anterior (MFA admin completo nos endpoints relevantes, relatório PDF mais seguro, SMTP com TLS válido, limitação de uso da API de diagnóstico premium) e, na revisão de abril de 2026, **bloqueio explícito de modo dev em produção**, **variáveis proibidas no boot**, **redação de PII em logs**, **limite global de IA** e **política de IP para rate limit** com `TRUST_PROXY`. **Ainda há trabalho recomendado** em §6.2–6.4 (LLM, operação de proxy, deliverability) conforme o modelo de ameaça do produto.
