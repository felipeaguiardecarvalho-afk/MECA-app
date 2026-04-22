# Relatório — Situação atual da aplicação MECA

**Data de referência:** 22 de abril de 2026  
**Contexto:** visão operacional e funcional do estado atual

---

## 1. Resumo executivo

A aplicação está funcional com fluxo principal de diagnóstico (um por utilizador até desbloqueio admin), onboarding de primeiro acesso (nome obrigatório; profissão e telefone opcionais), dashboard com histórico/comparação, recursos admin e hardening de segurança aplicado. O login ocorre por magic link emitido no servidor e entregue por e-mail, com confirmação no cliente em `/auth/confirm` (hash) ou callback com código quando aplicável. **Não há etapa obrigatória de “código da organização”** no fluxo principal; a rota `/access-code` redireciona (legado).

---

## 2. Fluxo atual de utilizador

1. Utilizador acede a `/login`.
2. Solicita link em `POST /api/auth/magic-link`.
3. Recebe e-mail com link de autenticação.
4. Sessão é estabelecida e o utilizador segue para `next` (ex.: `/dashboard`).
5. **Primeiro diagnóstico:** ao aceder a `/assessment`, se `profiles.full_name` estiver vazio → `/onboarding?next=/assessment` (Nome *; Profissão e Telefone opcionais; `POST /api/user/profile` persiste em `public.profiles`, colunas `profession` / `phone` — migração `0010_profiles_onboarding_fields.sql`).
6. Diagnóstico é submetido por `POST /api/score`. Após sucesso, o servidor bloqueia novo diagnóstico (`access_grants`: `can_take_diagnostic = false` ou insert SELF via **service role** com `user_email`; o cliente anónimo não consegue inserir por RLS).
7. **`/assessment` (Server Component):** se já existe diagnóstico concluído e o admin não autorizou novo → redirecionamento para `/dashboard` (evita refazer as 60 perguntas para falhar só no fim).
8. **Reabertura:** apenas `POST /api/admin/unlock-diagnostic` (master + MFA) define `can_take_diagnostic = true` no grant existente.
9. Dashboard exibe histórico e comparação.

---

## 3. Módulos funcionais em produção

- **Diagnóstico:** formulário + motor de score; gate de perfil e de “já concluído”.
- **Dashboard:** visualização individual e comparação.
- **Admin:** overview, desbloqueio de diagnóstico e respostas por utilizador.
- **Premium:** geração textual via API (escopo por utilizador; rate limit 5/min e 20/dia por utilizador).
- **Relatórios PDF/HTML:** geração para admin — layout premium (capa, hero do arquétipo, sumário executivo em 3 blocos, radar SVG dos quatro pilares, quadrante, checklist do plano de ação). Paginação em modo **block-based** (ver `RELATORIO_ENGENHARIA_SOFTWARE.md` §7.6).

---

## 4. Condição de segurança vigente

- `assertProductionEnv()` bloqueia boot em produção com env inválido (inclui recusa de `NODE_TLS_REJECT_UNAUTHORIZED=0`, flags de bypass, `DEV_ANONYMOUS_USER_ID`, `E2E_INSTANT_DIAGNOSTIC`).
- `isAuthDisabled()` em produção integra-se com `assertProductionAuthConfig()` — nunca ativa bypass em `NODE_ENV=production`.
- Login não expõe `action_link` em resposta HTTP.
- Rate limit em rotas de autenticação, `access-code`, `score` e **`POST /api/diagnostic/premium`** (por utilizador, teto global diário de IA, Redis/Upstash; IP anónimo seguro sem `TRUST_PROXY`).
- Logs servidores com redação de PII (`src/lib/logger.ts`).
- Headers de segurança ativos via `next.config.ts`.
- Painel admin e rotas sensíveis com **`requireAdminWithMfa`**, incluindo histórico global e benchmark admin, relatório PDF e APIs `/api/admin/*`.
- Magic link Gmail: TLS 1.2+ com verificação de certificado; PDF gerado com Chart local, sanitização HTML e rede bloqueada no Puppeteer (detalhe em `docs/RELATORIO_AUDITORIA_SEGURANCA.md`).

**Revisão (20 abr 2026):** bloqueadores críticos da auditoria **endereçados**; endurecimento de ambiente, IP/`TRUST_PROXY`, anti-enumeration em `login-intent` e logging descritos no `.md` de auditoria. **Permanecem riscos** operacionais e de LLM — ver `docs/RELATORIO_AUDITORIA_SEGURANCA.md` §6–8.

---

## 5. Ambiente de desenvolvimento

- Porta padrão: `3001`
- Comandos principais:
  - `npm run dev`
  - `npm run dev:turbo`
  - `npm run clean`
  - `npm run rebuild`

Problemas de 500/chunks locais devem ser tratados primeiro como corrupção de cache/build (não misturar `next build` com `next dev` na mesma pasta `.next`).

---

## 6. Testes e qualidade

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run test:e2e`

Última referência registrada de suíte unitária: **216** testes / **22** ficheiros (abril 2026).

---

## 7. Referências

- `docs/RELATORIO_ENGENHARIA_SOFTWARE.md`
- `docs/RELATORIO_AUDITORIA_SEGURANCA.md`
- `docs/RELATORIO_ENTREGA_CONSOLIDADO_ENGENHARIA.md`

---

## 8. PDF premium e motor de paginação (21 abr. 2026)

O relatório PDF (`GET /api/report/generate`, admin com MFA) foi redesenhado em três fases ao longo de 21 abr. 2026:

1. **Redesign completo** — capa dedicada, hero do arquétipo com gráfico do quadrante MECA, sumário executivo em três blocos (Momento, Risco, Alavanca) mais rodapé do pilar de maior alavancagem, barras horizontais por pilar, banner de identidade do arquétipo, plano de ação em estilo **checklist**, secção de teorias reposicionada para o final.
2. **Refinamento visual** — margens de 0,5 cm (`@page { margin: 0.5cm 0 }` + `preferCSSPageSize: true`), gráfico radar SVG dos quatro pilares (Mentalidade · Engajamento · Cultura · Performance), destaque dos pilares mais fraco/forte.
3. **Motor de paginação block-based** (fix crítico) — removido `overflow: hidden` + `min-height` fixo de `.page` que silenciosamente truncava conteúdo em secções longas (arquétipo, teorias). Agora cada secção usa `break-before: page` e os blocos atómicos (`.exec-block`, `.pillar-card`, `.arch-identity`, `.arch-block`, `.action-step`, `.theory-card`, `.closing-card`, etc.) usam `break-inside: avoid`. Títulos com `break-after: avoid-page` evitam órfãos. Os rodapés absolutos por secção (que partiam layout em secções com duas páginas) foram removidos. Regras específicas mantêm “Leitura detalhada” colada ao primeiro `.pillar-card` e o opener do plano de ação colado ao primeiro `.action-step`. Global: `orphans: 3; widows: 3`.

**Ficheiro:** `src/app/api/report/generate/route.ts` (`buildHtml`, `buildRadarChart`, `buildQuadrantGraph`, `buildExecutiveSummary`, `buildTheorySections`).  
**Validação:** `npx tsc --noEmit` e `npx eslint src/app/api/report/generate/route.ts` sem erros.

---

## 9. Atualização produto e dados (22 abr. 2026)

- **Onboarding:** `/onboarding` + `POST /api/user/profile` — nome obrigatório; `profiles.profession`, `profiles.phone` opcionais.
- **Diagnóstico único:** `/assessment` redireciona para `/dashboard` quando o utilizador já concluiu e não tem `can_take_diagnostic` (salvo admin unlock).
- **Grant SELF:** após `POST /api/score`, insert/update em `access_grants` preferencialmente via **service role** (RLS não concede INSERT a `authenticated` em todas as instalações).
- **Código organização:** fluxo UX removido; API `POST /api/access-code` pode subsistir para legado/admin.

---

## 10. Backup físico (código + docs)

**Snapshot mais recente (esta atualização de relatórios):**

- Pasta: `backups/MECA-backup-20260421-215216/`
- Arquivo: `backups/MECA-backup-fonte-20260421-215216.zip` (~375 KB)

Conteúdo: `src/`, `docs/`, `supabase/`, ficheiros de configuração na raiz do projeto; sem `node_modules` nem `.next`. Ver `MANIFEST.txt` dentro da pasta do backup.

Snapshots anteriores permanecem em `backups/` (ex.: `MECA-backup-20260421-111018/` e respetivo `.zip`).
