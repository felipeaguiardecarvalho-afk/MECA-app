# Deploy em produção — **metodomeca.com.br**

Domínio canónico: **https://metodomeca.com.br** (sem `www`). O pedido a `https://www.metodomeca.com.br` recebe **308** para o apex (middleware em `src/middleware.ts`).

---

## 1. DNS (no teu registrador do domínio)

Na Vercel: **Project → Settings → Domains** → adiciona `metodomeca.com.br` e `www.metodomeca.com.br`. A Vercel mostra os registos exactos.

Regra típica:

| Tipo | Nome | Valor (exemplo Vercel) |
|------|--------|-------------------------|
| **A** ou **ALIAS/ANAME** | `@` | IP ou target que a Vercel indicar |
| **CNAME** | `www` | `cname.vercel-dns.com` (ou o que a Vercel mostrar) |

Propagação: até 48 h (geralmente menos).

---

## 2. Vercel — novo project ou import Git

1. [vercel.com](https://vercel.com) → **Add New… → Project** → importa este repositório.
2. **Framework Preset:** Next.js (detecção automática).
3. **Build:** `npm run build` · **Output:** default (`.next`).
4. **Root Directory:** raiz do repo (se o app estiver na raiz).
5. **Node:** 20.x LTS (recomendado).

### Domínios

Depois do primeiro deploy: **Settings → Domains** → `metodomeca.com.br` (apex) + `www.metodomeca.com.br`. Marca o apex como **primary** se a Vercel perguntar.

### Variáveis de ambiente (Production)

Copiar de `.env.local` **nunca** para o painel com chaves reais; preencher no UI da Vercel:

| Variável | Obrigatório |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim |
| `NEXT_PUBLIC_SITE_URL` | **Sim** — valor exacto: `https://metodomeca.com.br` |
| `TRUST_PROXY` | **Sim** — valor: `true` (Vercel define `X-Forwarded-For` correctamente) |
| `UPSTASH_REDIS_REST_URL` | Muito recomendado (rate limit entre instâncias) |
| `UPSTASH_REDIS_REST_TOKEN` | Muito recomendado |
| `ANTHROPIC_API_KEY` | Se usares diagnóstico premium |
| `RESEND_API_KEY` + `RESEND_FROM` **ou** `GMAIL_USER` + `GMAIL_APP_PASSWORD` | Sim (magic link em produção) |

**Proibido** em Production (a app recusa arrancar): `DISABLE_AUTH`, `NEXT_PUBLIC_DISABLE_AUTH`, `DEV_ANONYMOUS_USER_ID`, `E2E_INSTANT_DIAGNOSTIC`, `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`, `NODE_TLS_REJECT_UNAUTHORIZED=0`, `ADMIN_MFA_ENFORCE=0` ou `false`.

### Região (opcional)

`vercel.json` na raiz fixa **`regions": ["gru1"]`** (São Paulo). Remove ou altera se quiseres outra região.

### Plano

- **PDF admin** (`GET /api/report/generate`): usa Puppeteer; em Pro+, `maxDuration = 60` na rota. No Hobby o limite de tempo é curto — se o PDF falhar, faz upgrade ou optimiza o render.

---

## 3. Supabase — URLs de autenticação

**Authentication → URL Configuration**

- **Site URL:** `https://metodomeca.com.br`
- **Redirect URLs** (adiciona todas, uma por linha):

```
https://metodomeca.com.br/auth/callback
https://www.metodomeca.com.br/auth/callback
https://*.vercel.app/auth/callback
```

O último cobre **Preview Deployments** (branches / PRs). Podes apertar para só o teu projecto, por exemplo `https://meca-app-xxx.vercel.app/auth/callback`, se preferires.

Confirma que o template de e-mail do magic link inclui o que o Supabase espera (ex. `{{ .Token }}` se usares OTP no e-mail).

---

## 4. Deploy automático (GitHub Actions) — um clique depois dos secrets

Ficheiro: `.github/workflows/deploy-production.yml` (só **`workflow_dispatch`** — não bloqueia pushes).

1. No GitHub do repo: **Settings → Secrets and variables → Actions → New repository secret**, adiciona:

| Secret | Onde obter |
|--------|------------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Na pasta do projecto, após `npx vercel link`: ficheiro `.vercel/project.json` → campo `orgId` |
| `VERCEL_PROJECT_ID` | Mesmo ficheiro → `projectId` |
| `NEXT_PUBLIC_SUPABASE_URL` | Igual ao valor em Production na Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Igual |
| `SUPABASE_SERVICE_ROLE_KEY` | Igual (o build em CI corre `assertProductionEnv` com `NODE_ENV=production`) |
| `NEXT_PUBLIC_SITE_URL` | `https://metodomeca.com.br` (recomendado) |

2. **Actions** → workflow **Deploy production (Vercel)** → **Run workflow**.

Isto faz `npm ci`, `npm run build` e `vercel deploy --prod`. As variáveis da app em runtime continuam definidas no **dashboard da Vercel** (Production); os secrets acima servem para o build na CI coincidir com produção.

---

## 5. Deploy pela CLI (na pasta do projecto)

```bash
npm install
npx vercel login
npx vercel link
npx vercel --prod
```

Ou faz **push** para a branch ligada na Vercel (deploy automático).

---

## 6. Smoke test pós-deploy

1. Abre `https://metodomeca.com.br` — HTTPS e página inicial.
2. Abre `https://www.metodomeca.com.br` — deve redireccionar para apex.
3. **Login** → pedir magic link → abrir link → sessão e dashboard.
4. **Onboarding** (primeiro utilizador) → **Diagnóstico** → submissão.
5. **Admin** (conta master + MFA) → overview / PDF se usares.

---

## 7. O que já está no código (não precisas repetir)

- `NEXT_PUBLIC_SITE_URL` + `getSiteOrigin()` alimentam `redirectTo` do magic link (anti host-injection).
- `assertProductionEnv()` no boot (`src/instrumentation.ts`).
- MFA admin nas rotas sensíveis; auditoria em `admin_audit_logs` onde aplicável.

Se algo falhar no deploy da Vercel, cola o log do build ou da função e ajustamos o próximo passo (ex. Puppeteer em serverless).
