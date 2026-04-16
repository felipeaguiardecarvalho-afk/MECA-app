# Relatório — Auditoria de segurança (MECA App)

**Projeto:** MECA — diagnóstico comportamental (Next.js + Supabase)  
**Âmbito:** superfície de ataque, segredos, dados e controlos de acesso conforme código e configuração típica.  
**Nota:** este documento **não substitui** um penetration test nem auditoria formal de infraestrutura; serve como checklist e base para revisão.

**Data de referência:** abril de 2026 — alinhado ao estado atual do repositório.

---

## 1. Autenticação e autorização

| Controlo | Local / mecanismo |
|----------|-------------------|
| **Página de login** | **`/login`** — `src/app/login/page.tsx`, **`LoginForm.tsx`**. Sem palavra-passe persistente: **OTP por e-mail** (`signInWithOtp`); o utilizador confirma via **magic link** que termina em **`/auth/callback`**. |
| **Destino pós-login** | Query **`?next=`** (ex. `/access-code`) propagada até ao callback para redirecionar após sessão válida. |
| Middleware | `src/middleware.ts` — atualiza sessão Supabase; com autenticação **ativa** (`isAuthDisabled()` falso), rotas sem sessão em rotas protegidas → **`/login?next=...`**. |
| **Grant + diagnóstico único** | Tabela **`access_grants`** com **`can_take_diagnostic`**; **`POST /api/score`** valida e bloqueia novo envio quando `false`; **unlock** só via **`POST /api/admin/unlock-diagnostic`** (admin). |
| Rotas protegidas | Com sessão: exige **`access_grants`** para `/assessment`, `/dashboard`, `/plano-de-acao`. **`/assessment`** adicionalmente exige **`can_take_diagnostic === true`** ou redireciona a `/dashboard`. |
| **Código de acesso** | **`/access-code`** — sem sessão → **`/login`**. Validação server-side: **`POST /api/access-code`** + RPC **`validate_access_code`**. |
| Modo desenvolvimento sem login | `src/lib/auth-mode.ts` — `NEXT_PUBLIC_DISABLE_AUTH` ou `DISABLE_AUTH` (`true` / `1`) desativa os **gates** do fluxo estrito; o middleware continua a chamar `updateSession` para cookies. |
| Magic link / callback | `src/app/auth/callback/route.ts` — troca de código por sessão; cookies na resposta de redirect (padrão Supabase + Next). |
| Admin | `MASTER_ADMIN_EMAIL` + **`SUPABASE_SERVICE_ROLE_KEY`** para APIs admin (`unlock`, overview, histórico global); nunca confiar no e-mail enviado pelo cliente para decisões. |
| Redirecionamentos | `/access` → `/access-code`; `/results` → `/dashboard`; `/reports` → `/dashboard` — reduzem URLs legadas. |

**Risco operacional:** em **produção**, o modo “auth desligada” **não deve** estar ativo: expõe fluxos e APIs pensados para utilizadores autenticados e com **grant** de acesso.

**Superfície explícita:** a existência da rota **`/login`** é documentada; o fluxo não depende apenas de componentes invisíveis — o utilizador **entra por uma página dedicada** antes de código de acesso e diagnóstico (quando o produto exige auth).

---

## 2. Segredos e chaves

| Variável / segredo | Uso esperado | Risco se mal gerido |
|--------------------|--------------|---------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto | Pública no cliente — aceitável. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente browser | Pública — **RLS e políticas** são a linha de defesa. |
| `SUPABASE_SERVICE_ROLE_KEY` | Apenas servidor (API routes, jobs) | **Crítico:** contorna RLS; nunca no bundle do cliente nem em repositório público. |
| `DEV_ANONYMOUS_USER_ID` | Dev sem login (UUID fixo para escrita) | Dados de teste podem **acumular-se** no mesmo `user_id`. |
| `MASTER_ADMIN_EMAIL` (se usado) | Identificação admin no servidor | Apenas server-side; nunca prefixo `NEXT_PUBLIC_`. |

**Boas práticas:** segredos só em variáveis de ambiente do hospedeiro; rotação de chaves; `.env.local` fora do Git.

---

## 3. Dados pessoais e armazenamento

- **`public.responses`:** `answers` (jsonb) e métricas; em condições normais, **RLS** restringe ao **`user_id`** do JWT (cliente anon).
- **Service role:** qualquer exposição no cliente é falha **grave**; revisar imports em API routes.
- **sessionStorage (browser):** chaves como `meca_dashboard_bootstrap` e `meca_row_*` guardam **resultados e scores** — não são segredos criptográficos, mas **revelam perfil comportamental**. Vetor principal: **XSS** na mesma origem (roubo de `sessionStorage`). Mitigações: CSP, sanitização de inputs, dependências atualizadas, evitar HTML não confiável.

---

## 4. Cliente: verificações de estilo (não são controlo de segurança)

Componentes como **`StyleGuard`** e **`TailwindFallbackBoundary`** verificam se o **CSS** foi aplicado e registam avisos na consola. Isto **não** substitui autenticação, RLS ou revisão de API — é **fiabilidade de UI** e observabilidade para desenvolvimento.

---

## 5. Rede e transporte

- **Produção:** HTTPS para cookies de sessão e tráfego sensível (incluindo links de magic login).
- **Desenvolvimento:** `http://localhost` é esperado; não replicar permissões permissivas em produção.

---

## 6. Supabase (configuração de projeto)

- **URL Configuration:** Site URL e **Redirect URLs** apenas para origens confiáveis; incluir **`/auth/callback`** e o domínio onde a app corre (necessário para **OTP / magic link** a regressar à app).
- **RLS:** políticas em `access_codes`, `access_grants`, `responses` devem ser revistas após alterações de schema ou novas rotas API.

---

## 7. Integridade de build e disponibilidade (risco operacional)

Cache local **`.next`** ou **`node_modules/.cache`** corrompido pode causar **HTTP 500** ou erros de módulo em runtime (**não** é uma falha de autorização, mas afeta **disponibilidade** e experiência do utilizador). Mitigação operacional: `npm run clean` com servidor parado; evitar apagar `.next` com `next dev` a correr.

---

## 8. Checklist rápido — ambiente de produção

- [ ] `NEXT_PUBLIC_DISABLE_AUTH` / `DISABLE_AUTH` **desligados** ou inexistentes.  
- [ ] `SUPABASE_SERVICE_ROLE_KEY` apenas em runtime servidor.  
- [ ] Sem `.env.local` ou ficheiros com segredos no repositório.  
- [ ] Callbacks e **Redirect URLs** do Supabase Auth alinhados com o domínio real (login OTP).  
- [ ] Logs **sem** tokens completos nem questionários brutos desnecessários.  
- [ ] Processo de revisão de dependências (`npm audit` / atualizações) em cadência definida.  
- [ ] Rotas sensíveis (`/dashboard`, `/plano-de-acao`, `/assessment`) com sessão + **grant** quando aplicável; **`/login`** acessível para entrada.  
- [ ] `MASTER_ADMIN_EMAIL` e service role apenas onde a API admin é necessária.

---

## 9. Resumo para decisão

O maior risco **lógico** no modelo actual é o **modo que desativa gates de acesso** via variável de ambiente pública — inaceitável em produção para este produto. O maior risco de **segredo** é a **`SUPABASE_SERVICE_ROLE_KEY`** fora do servidor. A entrada por **`/login`** com **OTP** delega a verificação de posse de e-mail ao **Supabase Auth**; a política de **um diagnóstico** repousa em **`access_grants.can_take_diagnostic`** e APIs servidor. Os dados em **`sessionStorage`** aumentam o impacto de **XSS** e devem ser considerados na política de conteúdo e sanitização.
