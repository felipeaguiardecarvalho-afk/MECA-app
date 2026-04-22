# Pacote de entrega — relatórios técnicos MECA App

**Data de atualização:** 22 de abril de 2026  
**Repositório:** MECA app (Next.js 15 + Supabase)

---

## 1. Documentos canônicos

| Documento | Escopo |
|-----------|--------|
| [**RELATORIO_SITUACAO_ATUAL.md**](./RELATORIO_SITUACAO_ATUAL.md) | Estado do produto, fluxo de login, dashboard/admin, operação local e testes. |
| [**RELATORIO_ENGENHARIA_SOFTWARE.md**](./RELATORIO_ENGENHARIA_SOFTWARE.md) | Arquitetura técnica, rotas/API reais, middleware, build/cache e manutenção. |
| [**RELATORIO_AUDITORIA_SEGURANCA.md**](./RELATORIO_AUDITORIA_SEGURANCA.md) | Ameaças, controles, hardening e checklist de produção. |

As versões `.txt` existem apenas como espelho de leitura rápida. A fonte de verdade é `docs/*.md`.

---

## 2. Condição atual consolidada

1. **Login por magic link server-side:** `POST /api/auth/magic-link` usa `auth.admin.generateLink` e envia link por e-mail; resposta HTTP é apenas `{ sent: true }`.
2. **Proteções do link:** `redirectTo` é baseado em `getSiteOrigin()` (origem canônica), evitando host injection.
3. **Confirmação de sessão:** `src/app/auth/confirm/page.tsx` lê tokens do hash e está encapsulada em `<Suspense>` (requisito Next 15).
4. **Fail-fast em produção:** `assertProductionEnv()` via `src/instrumentation.ts` bloqueia boot com variáveis ausentes/críticas, flags de bypass, `DEV_ANONYMOUS_USER_ID`, `E2E_INSTANT_DIAGNOSTIC`, TLS global inseguro, etc.
5. **Rate limit:** aplicado em `POST /api/auth/magic-link`, `POST /api/auth/master-magic-link`, `POST /api/auth/login-intent`, `POST /api/access-code`, `POST /api/score` e **`POST /api/diagnostic/premium`** (5/min e 20/dia por utilizador **+** teto global diário de IA; Redis/Upstash; IP anónimo com política **`TRUST_PROXY`**).
6. **Dev padrão:** `npm run dev` em `http://localhost:3001`; `dev:turbo` opcional.
7. **APIs vigentes:** `access-code` (legado), `score`, `user/history`, **`user/profile`** (POST onboarding), `user/access-state`, `benchmark`, `diagnostic/premium`, `report/generate`, admin overview/unlock/user-responses, auth `login-intent` / `magic-link` / `master-magic-link`. A rota legada `bootstrap-email-grant` foi removida (ver testes em `src/__tests__/no-auto-access-grant.test.ts`).
8. **Segurança / produção:** bloqueadores **críticos** da auditoria corrigidos; revisão abr. 2026 inclui bloqueio de modo dev em produção, variáveis proibidas no boot, `login-intent` com resposta neutra, redação de PII em logs e limites globais de IA. **Permanecem riscos** (LLM, operação de proxy, email) — ver `RELATORIO_AUDITORIA_SEGURANCA.md` §6–8.
9. **Relatório PDF — redesign + motor de paginação (21 abr. 2026):** capa, hero, sumário em 3 blocos, **radar SVG dos 4 pilares**, gráfico do quadrante, pilares com barras, identidade do arquétipo, plano de ação em **checklist**, teorias reposicionadas. **Paginação block-based** (`break-before: page` por secção, `break-inside: avoid` nos blocos atómicos, `break-after: avoid-page` nos títulos) corrige truncagem silenciosa. Sem alteração de superfície de segurança. Ver `RELATORIO_ENGENHARIA_SOFTWARE.md` §7.6.
10. **Onboarding e diagnóstico único (22 abr. 2026):** primeiro acesso ao questionário exige **nome** em `profiles` (`/onboarding`, `POST /api/user/profile`; colunas `profession` / `phone` opcionais — migração `0010`). **`/assessment`** redireciona para **`/dashboard`** se o utilizador já concluiu o diagnóstico e não tem `can_take_diagnostic` (reabertura só via **`POST /api/admin/unlock-diagnostic`**). Fluxo principal **sem** código de organização obrigatório. Após **`POST /api/score`**, lock do grant (e insert **SELF** com `user_email` quando aplicável) via **service role** para contornar RLS de `INSERT` em `access_grants` onde a policy não cobre o cliente anónimo.

---

## 3. Ordem de leitura recomendada

1. `RELATORIO_SITUACAO_ATUAL.md`
2. `RELATORIO_ENGENHARIA_SOFTWARE.md`
3. `RELATORIO_AUDITORIA_SEGURANCA.md`

---

## 4. Validação operacional mínima

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run dev` e smoke manual em `http://localhost:3001`

Se houver erro de chunk/manifest/500 local: `npm run clean` e novo `npm run dev` (ou `npm run rebuild`).
