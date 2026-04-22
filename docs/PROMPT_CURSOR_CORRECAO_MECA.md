# PROMPT PARA CURSOR — CORREÇÃO COMPLETA DA APLICAÇÃO MECA

> Cole este prompt diretamente no Cursor AI. Ele contém todas as instruções necessárias para diagnosticar e corrigir a aplicação MECA que não está abrindo.

---

## CONTEXTO DO PROJETO

Você está trabalhando em uma aplicação SaaS chamada **MECA (Mapa Estratégico de Comportamento e Ação)** — um produto de diagnóstico comportamental organizacional.

**Stack:**

- Next.js 15.x (App Router)
- React 19
- TypeScript
- Tailwind CSS 3 + PostCSS
- Supabase (Auth magic link + Postgres com RLS)
- Recharts (gráficos)
- jsPDF (exportação)
- Zod (validação)
- Vitest + Playwright (testes)

**Problema atual:** A aplicação parou de abrir. Os sintomas reportados são: erros `Cannot find module './331.js'` ou `'./611.js'`, HTTP 500 em cadeia nas rotas `/` e `/dashboard`, ou `next start` falhando com `MODULE_NOT_FOUND`.

---

## INSTRUÇÕES GERAIS PARA O CURSOR

Antes de qualquer alteração de código, execute a sequência de diagnóstico abaixo **na ordem exata**. Não pule etapas. Não altere lógica de negócio sem confirmar que o problema não é de ambiente.

---

## ETAPA 1 — RECUPERAÇÃO DO AMBIENTE (EXECUTE PRIMEIRO, SEMPRE)

### 1.1 Parar todos os processos Node/Next ativos nesta pasta

```bash
# Windows PowerShell
Get-Process -Name "node" | Stop-Process -Force

# macOS / Linux
pkill -f "next"
```

### 1.2 Limpar cache corrompido

```bash
npm run clean
```

Se o script `clean` não existir no `package.json`, execute manualmente:

```bash
# Windows
rmdir /s /q .next
rmdir /s /q node_modules\.cache

# macOS / Linux
rm -rf .next
rm -rf node_modules/.cache
```

### 1.3 Subir o servidor de desenvolvimento

```bash
npm run dev
```

O servidor deve iniciar na **porta 3001** (não 3000). Verifique no terminal a URL exata exibida. Abra `http://localhost:3001` — **nunca localhost:3000 por padrão neste projeto**.

### 1.4 Se ainda houver erros após o clean + dev, execute rebuild completo

```bash
npm run rebuild
```

Se o script `rebuild` não existir:

```bash
npm run clean && npm run build
```

Após o build concluir sem erros, execute:

```bash
npm run start
```

### 1.5 Critério de parada para Etapa 1

- Se `npm run build` **concluir sem erros** → o código-fonte está íntegro. O problema era de cache. Siga para Etapa 2 para verificar o ambiente.
- Se `npm run build` **falhar com erros de compilação** → há regressão de código. Siga para Etapa 3.

---

## ETAPA 2 — VERIFICAÇÃO DE AMBIENTE E CONFIGURAÇÕES

### 2.1 Verificar arquivo `.env.local`

Confirme que o arquivo `.env.local` existe na raiz do projeto e contém **todas** as variáveis abaixo. Compare com `.env.example`.

**Variáveis obrigatórias (sem estas a app não sobe):**

```env
# Públicas — obrigatórias para o frontend funcionar
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Servidor — obrigatórias para admin e service role
SUPABASE_SERVICE_ROLE_KEY=eyJ...
MASTER_ADMIN_EMAIL=seu@email.com

# Opcional — usada em redirects de produção
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

**Ação:** Se qualquer variável estiver ausente ou vazia, preencha com os valores do painel do Supabase (Project Settings → API) antes de continuar.

**Consequências de cada variável ausente:**

- Sem `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` → app falha no boot, tela branca ou erro de hidratação.
- Sem `SUPABASE_SERVICE_ROLE_KEY` → todas as rotas admin retornam **503**; o arquivo `src/lib/supabase/admin.ts` lança erro explícito.
- Sem `MASTER_ADMIN_EMAIL` → `isAdmin()` em `src/lib/auth/isAdmin.ts` nunca retorna `true`; painel admin inacessível.

### 2.2 Verificar porta e Redirect URLs do Supabase

O `npm run dev` usa por padrão `next dev --turbo -p 3001`. Portanto:

1. Acesse o painel do Supabase → **Authentication → URL Configuration**.
2. Em **Redirect URLs**, confirme que existe a entrada:
  ```
   http://localhost:3001/auth/callback
  ```
3. Se existir apenas `http://localhost:3000/auth/callback`, **adicione** a entrada com porta 3001. Ambas podem coexistir.
4. Confirme também que `Site URL` está configurado (pode ser `http://localhost:3001` em dev).

**Por que isso quebra a app:** O magic link enviado por e-mail contém a redirect URL. Se ela apontar para a porta errada, o callback falha com erro de sessão, derrubando o fluxo de autenticação inteiro.

### 2.3 Verificar schema do banco de dados no Supabase

Acesse o **Supabase Studio → Table Editor** e confirme:

**Tabela `responses` deve ter as colunas:**

- `id` (uuid)
- `user_id` (uuid)
- `answers` (jsonb)
- `score_m`, `score_e`, `score_c`, `score_a` (numeric — colunas legadas, NOT NULL)
- `mentalidade`, `engajamento`, `cultura`, `performance` (numeric)
- `direction`, `capacity` (numeric)
- `archetype` (text)
- `completed_at` (timestamptz)
- `is_admin` (boolean, default false) ← **coluna da migração 0002; se ausente, todos os inserts falham**

**Tabela `access_grants` deve ter as colunas:**

- `id`, `user_id`, `code_id`, `created_at`
- `can_take_diagnostic` (boolean, default true) ← **coluna crítica para o fluxo de diagnóstico**

**RPCs obrigatórias (verificar em Database → Functions):**

- `validate_access_code`
- `ensure_email_access_grant`

**Ação:** Se a coluna `is_admin` não existir em `responses`, execute a migração manualmente no SQL Editor do Supabase:

```sql
ALTER TABLE public.responses
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
```

Se a coluna `can_take_diagnostic` não existir em `access_grants`:

```sql
ALTER TABLE public.access_grants
ADD COLUMN IF NOT EXISTS can_take_diagnostic boolean DEFAULT true;
```

---

## ETAPA 3 — CORREÇÕES DE CÓDIGO (SE O BUILD FALHAR)

Somente execute esta etapa se `npm run build` retornar erros de compilação após o clean.

### 3.1 Diretiva `"use client"` ausente em componentes com hooks ou Recharts

**Arquivos que obrigatoriamente precisam de `"use client"` no topo:**

```
src/components/Dashboard/RadarChart.tsx
src/components/Dashboard/ArchetypeMatrix.tsx
src/components/Dashboard/ComparisonView.tsx
src/components/Dashboard/DiagnosticSelector.tsx
src/components/Dashboard/UserSelector.tsx
src/components/charts/RadarChart.tsx
src/components/charts/TrendLineChart.tsx
src/app/login/LoginForm.tsx
src/app/access-code/AccessForm.tsx
src/app/assessment/AssessmentClient.tsx
src/app/dashboard/DashboardClient.tsx
src/app/plano-de-acao/PlanoDeAcaoClient.tsx
src/components/AuthNav.tsx
src/components/landing/HomeLanding.tsx (se usar hooks de estado ou efeito)
```

**Regra:** qualquer componente que use `useState`, `useEffect`, `useRouter`, `useSearchParams`, `supabase.auth.onAuthStateChange`, ou importe de `recharts` deve ter `"use client"` como **primeira linha do arquivo**, antes de qualquer import.

**Como verificar e corrigir:**

```bash
# Buscar componentes com hooks mas sem "use client"
grep -rn "useState\|useEffect\|useRouter\|useSearchParams\|recharts" src/components src/app --include="*.tsx" | grep -v "use client"
```

Para cada arquivo listado, adicione na primeira linha:

```typescript
"use client";
```

### 3.2 Script `clean` ausente no `package.json`

Verifique se o `package.json` contém os scripts abaixo. Se algum estiver ausente, adicione-o:

```json
{
  "scripts": {
    "dev": "next dev --turbo -p 3001",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "clean": "rimraf .next && rimraf node_modules/.cache",
    "rebuild": "npm run clean && npm run build",
    "test": "vitest",
    "test:e2e": "playwright test",
    "verify": "npm run lint && npm run test && npm run test:e2e"
  }
}
```

Se `rimraf` não estiver instalado:

```bash
npm install --save-dev rimraf
```

### 3.3 Conflito entre dois sistemas de dashboard

O projeto tem **duas implementações paralelas de dashboard**:

- `src/app/dashboard/DashboardClient.tsx` — implementação atual principal
- `src/components/Dashboard/index.tsx` — componente legado/alternativo

Isso causa risco de conflito de estado, props divergentes e chunks duplicados no bundle.

**Ação:** Confirme qual é o arquivo importado em `src/app/dashboard/page.tsx`. O arquivo `page.tsx` deve importar **apenas um** dos dois. O outro deve ser removido ou marcado claramente como depreciado com comentário `// @deprecated — não usar em novas features`.

Verifique:

```typescript
// src/app/dashboard/page.tsx
// Deve ter APENAS UM import de dashboard client:
import DashboardClient from "./DashboardClient";
// OU
import { MECADashboard } from "@/components/Dashboard";
// NUNCA os dois ao mesmo tempo na mesma árvore de renderização
```

### 3.4 Dois sistemas de arquétipo sem alinhamento

Existem dois sistemas separados calculando arquétipos:

- `getArchetype()` em `src/lib/archetypeEngine.ts` — usado no dashboard (cartão / matriz)
- `deriveArchetype()` em `src/lib/diagnostic-engine.ts` — usado na API `/api/score`

Eles podem retornar valores diferentes para o mesmo diagnóstico, causando inconsistência visual.

**Ação de curto prazo:** Adicione um comentário explícito em ambos os arquivos explicando qual é canônico. Se `getArchetype()` for o correto para exibição, certifique-se que o `ArchetypeCard` e o `ComparisonView` usam **apenas** ele. Não misture as duas funções no mesmo componente.

**Ação de médio prazo:** Consolidar em uma única função exportada por `src/lib/archetypeEngine.ts` e remover `deriveArchetype()` do motor de diagnóstico, ou fazer `deriveArchetype()` chamar `getArchetype()` internamente.

### 3.5 Validação do `tailwind.config.ts`

O Tailwind precisa encontrar todos os arquivos que usam classes utilitárias. Verifique se o campo `content` inclui os caminhos corretos:

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

Se algum diretório estiver faltando em `content`, classes Tailwind naqueles arquivos serão removidas no build de produção, causando tela sem estilo.

### 3.6 Validação do `globals.css`

O arquivo `src/app/globals.css` **deve** começar com as três diretivas do Tailwind, nesta ordem:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Se alguma diretiva estiver ausente ou na ordem errada, o CSS de produção virá quebrado.

Confirme também que `globals.css` está importado em `src/app/layout.tsx`:

```typescript
// src/app/layout.tsx — primeira linha de imports
import "./globals.css";
```

### 3.7 Validação do `layout.tsx` raiz

O layout raiz não deve ter `max-w-*` no `body` ou no `main` global — isso criaria coluna estreita em todo o site:

```typescript
// src/app/layout.tsx — estrutura correta
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen w-full bg-white">
        <AppNav />
        <main className="w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
```

A centralização deve ocorrer **por seção**, usando `.container-meca` ou `max-w-6xl mx-auto` dentro de cada página, não no layout global.

### 3.8 Verificação do middleware

O arquivo `src/middleware.ts` deve:

1. Listar as rotas públicas corretamente (não proteger páginas que precisam ser acessadas sem sessão):

```typescript
const PUBLIC_ROUTES = ["/", "/login", "/diagnostico", "/auth/callback"];
```

1. Não redirecionar `/auth/callback` — essa rota precisa processar o código do Supabase livre de interceptação.
2. Retornar resposta JSON (não redirect HTML) para rotas `/api/*` sem autenticação:

```typescript
if (pathname.startsWith("/api/")) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### 3.9 Verificação do `src/lib/supabase/admin.ts`

Este arquivo deve retornar **503** graciosamente quando `SUPABASE_SERVICE_ROLE_KEY` estiver ausente, sem lançar exceção não tratada:

```typescript
// src/lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";

export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente. Operações admin indisponíveis.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

E nas rotas admin que chamam `getAdminClient()`, o erro deve ser capturado:

```typescript
// Exemplo em qualquer route handler admin
try {
  const admin = getAdminClient();
  // ... operação
} catch (error) {
  return NextResponse.json(
    { error: "Serviço admin indisponível. Verifique SUPABASE_SERVICE_ROLE_KEY." },
    { status: 503 }
  );
}
```

---

## ETAPA 4 — VERIFICAÇÕES DE SEGURANÇA E FLAGS

### 4.1 Flags de bypass de autenticação

Verifique o `.env.local` para garantir que estas flags **não estejam ativas acidentalmente em produção**:

```env
# Estas flags NÃO devem existir em produção:
NEXT_PUBLIC_DISABLE_AUTH=1        # desliga todo o sistema de auth
DISABLE_AUTH=1                    # idem
ENABLE_MAGIC_LINK_SERVICE_FOR_ALL=1  # bypassa verificação de e-mail para todos
MAGIC_LINK_BYPASS_ALL_EMAILS=1   # idem
DEV_ANONYMOUS_USER_ID=            # permite gravação anônima no banco
```

Em **desenvolvimento local**, `NEXT_PUBLIC_DISABLE_AUTH=1` pode ser útil para testar sem e-mail, mas **nunca deve ir para produção**.

### 4.2 Validar que `isAdmin` está correto

O arquivo `src/lib/auth/isAdmin.ts` compara o e-mail da sessão com `MASTER_ADMIN_EMAIL`. Confirme:

```typescript
// src/lib/auth/isAdmin.ts
export function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  const masterEmail = process.env.MASTER_ADMIN_EMAIL;
  if (!masterEmail) return false;
  return email.toLowerCase() === masterEmail.toLowerCase();
}
```

Se a comparação for case-sensitive sem `.toLowerCase()`, o admin pode não ser reconhecido se o e-mail tiver capitalização diferente.

---

## ETAPA 5 — CHECKLIST FINAL DE VALIDAÇÃO

Após todas as correções, execute esta sequência completa:

```bash
# 1. Lint — zero erros permitidos para seguir
npm run lint

# 2. Testes unitários
npm run test

# 3. Build de produção — deve completar sem erros
npm run build

# 4. Subir servidor dev
npm run dev
```

**Validação manual no browser (abrir `http://localhost:3001`):**

```
[ ] Rota / carrega (landing page aparece sem erro)
[ ] Rota /login carrega (formulário de e-mail aparece)
[ ] Magic link enviado → callback → sessão criada → redirecionado para /access-code
[ ] Código de acesso aceito → redirecionado para /assessment
[ ] Questionário completo → POST /api/score → redirecionado para /dashboard
[ ] Dashboard carrega com radar, matriz e histórico
[ ] Comparação de dois diagnósticos funciona
[ ] Logout funciona (botão "Sair" na navbar)
[ ] Rota /login com sessão ativa redireciona para /dashboard (não mostra login de novo)
```

**Validação do painel admin (com e-mail do MASTER_ADMIN_EMAIL):**

```
[ ] Dashboard mostra UserSelector com lista de usuários
[ ] Seleção de usuário carrega diagnósticos daquele user_id
[ ] Comparação admin não renderiza diagnósticos de users diferentes
[ ] /api/admin/diagnostic-overview retorna 200 (não 503)
[ ] /api/admin/unlock-diagnostic funciona
```

---

## ETAPA 6 — SE NADA FUNCIONAR (ÚLTIMO RECURSO)

Se após todas as etapas acima a app ainda não abrir, o problema pode ser nas dependências do Node. Execute:

```bash
# Remover node_modules completamente e reinstalar
rm -rf node_modules
npm install

# Limpar e rebuildar
npm run rebuild
npm run dev
```

Se o `npm install` retornar conflitos de peer dependencies com Next.js 15 + React 19:

```bash
npm install --legacy-peer-deps
```

---

## RESUMO DOS ARQUIVOS QUE DEVEM SER VERIFICADOS


| Arquivo                                   | O que verificar                                               |
| ----------------------------------------- | ------------------------------------------------------------- |
| `package.json`                            | Scripts `dev`, `clean`, `rebuild` presentes                   |
| `.env.local`                              | 4 variáveis obrigatórias presentes                            |
| `src/app/layout.tsx`                      | Import de `globals.css`; `body` e `main` sem `max-w-*` global |
| `src/app/globals.css`                     | 3 diretivas `@tailwind` no topo                               |
| `tailwind.config.ts`                      | `content` inclui `app`, `components`, `lib`                   |
| `src/middleware.ts`                       | Rotas públicas corretas; APIs retornam JSON 401               |
| `src/lib/supabase/admin.ts`               | Tratamento gracioso de `SERVICE_ROLE_KEY` ausente             |
| `src/lib/auth/isAdmin.ts`                 | Comparação case-insensitive de e-mail                         |
| `src/app/dashboard/page.tsx`              | Importa apenas UMA implementação de dashboard                 |
| Todos os componentes com hooks/Recharts   | `"use client"` como primeira linha                            |
| Supabase Studio → tabela `responses`      | Coluna `is_admin` existe                                      |
| Supabase Studio → tabela `access_grants`  | Coluna `can_take_diagnostic` existe                           |
| Supabase → Authentication → Redirect URLs | `localhost:3001/auth/callback` listado                        |


---

## NOTAS IMPORTANTES PARA O CURSOR

1. **Não altere a lógica de negócio** (motor de diagnóstico, cálculo de scores, regras de arquétipo) sem confirmação explícita. Essas regras são parte do produto MECA.
2. **Não remova o sistema de bloqueio de diagnóstico** (`can_take_diagnostic = false` após submissão). Esse é um requisito de produto intencional — um diagnóstico por usuário até unlock admin.
3. **Não altere as migrações SQL existentes** (`0001_meca_full_schema.sql`, `0002_responses_is_admin.sql`). Apenas aplique-as se não estiverem aplicadas.
4. **Não commite `.env.local`**. Este arquivo contém segredos e está (ou deve estar) no `.gitignore`.
5. **A porta 3001 é intencional**. Não mude para 3000 sem atualizar também o Supabase Redirect URLs.
6. **Preserve os dois sistemas de arquétipo** por ora — apenas documente qual é canônico. A consolidação é uma tarefa separada de refatoração.

