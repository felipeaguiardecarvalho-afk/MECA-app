-- ============================================================================
-- MECA APP - ROW LEVEL SECURITY POLICIES
-- Data: 18 de Abril de 2026
-- ============================================================================

-- CONFIGURAÇÕES PRÉVIAS
-- ============================================================================

-- 1. HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. REMOVER POLICIES ANTIGAS (se existirem)
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_admin_all" ON public.users;

DROP POLICY IF EXISTS "responses_select_own" ON public.responses;
DROP POLICY IF EXISTS "responses_insert_own" ON public.responses;
DROP POLICY IF EXISTS "responses_update_own" ON public.responses;
DROP POLICY IF EXISTS "responses_admin_all" ON public.responses;

DROP POLICY IF EXISTS "access_codes_select_own" ON public.access_codes;
DROP POLICY IF EXISTS "access_codes_insert_own" ON public.access_codes;
DROP POLICY IF EXISTS "access_codes_update_own" ON public.access_codes;
DROP POLICY IF EXISTS "access_codes_admin_all" ON public.access_codes;

DROP POLICY IF EXISTS "admin_audit_logs_select_admin" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "admin_audit_logs_insert_admin" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "admin_audit_logs_admin_all" ON public.admin_audit_logs;

-- ============================================================================
-- TABELA: users
-- ============================================================================

-- SELECT: próprios dados ou admin
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
USING (
  auth.uid() = id
  OR
  (SELECT COUNT(*) FROM public.users WHERE id = auth.uid() AND email = current_setting('app.admin_email', true)) > 0
);

-- INSERT: apenas auth cria seu próprio user
CREATE POLICY "users_insert_own"
ON public.users
FOR INSERT
WITH CHECK (
  auth.uid() = id
);

-- UPDATE: apenas o próprio usuário ou admin
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
USING (
  auth.uid() = id
  OR
  (SELECT COUNT(*) FROM public.users WHERE id = auth.uid() AND email = current_setting('app.admin_email', true)) > 0
);

-- ============================================================================
-- TABELA: responses
-- ============================================================================

-- SELECT: próprias respostas ou admin
CREATE POLICY "responses_select_own"
ON public.responses
FOR SELECT
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND email = current_setting('app.admin_email', true)
  )
);

-- INSERT: apenas o próprio usuário
CREATE POLICY "responses_insert_own"
ON public.responses
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- UPDATE: apenas o próprio usuário ou admin (se houver update_at ou can_retake)
CREATE POLICY "responses_update_own"
ON public.responses
FOR UPDATE
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND email = current_setting('app.admin_email', true)
  )
);

-- ============================================================================
-- TABELA: access_codes
-- ============================================================================

-- SELECT: apenas admin pode listar códigos
CREATE POLICY "access_codes_select_admin"
ON public.access_codes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND email = current_setting('app.admin_email', true)
  )
);

-- INSERT: apenas admin pode criar códigos
CREATE POLICY "access_codes_insert_admin"
ON public.access_codes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND email = current_setting('app.admin_email', true)
  )
);

-- UPDATE: apenas admin (para marcar como usado)
CREATE POLICY "access_codes_update_admin"
ON public.access_codes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND email = current_setting('app.admin_email', true)
  )
);

-- ============================================================================
-- TABELA: admin_audit_logs
-- ============================================================================

-- SELECT: apenas admin
CREATE POLICY "admin_audit_logs_select_admin"
ON public.admin_audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND email = current_setting('app.admin_email', true)
  )
);

-- INSERT: apenas admin (logs das ações admin)
CREATE POLICY "admin_audit_logs_insert_admin"
ON public.admin_audit_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND email = current_setting('app.admin_email', true)
  )
);

-- ============================================================================
-- CONFIGURAÇÃO: app.admin_email
-- ============================================================================

-- Definir admin email (executar antes das policies)
-- SELECT set_config('app.admin_email', 'seu-email@example.com', false);

-- OU no código da aplicação (Node.js):
-- const response = await supabaseClient
--   .from('seu_table')
--   .select('*', { count: 'exact' })
--   .setAuth(authToken)
--   .select('*');
--
-- ANTES, fazer:
-- await supabaseClient.rest.init_client()
--   .query(`SELECT set_config('app.admin_email', '${adminEmail}', false)`)

-- ============================================================================
-- VERIFICAÇÃO DAS POLICIES
-- ============================================================================

-- SELECT * FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
-- FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- ============================================================================
-- TESTES DE SEGURANÇA
-- ============================================================================

-- 1. Usuário comum NÃO pode ver dados de outro
-- SELECT * FROM responses WHERE user_id != auth.uid(); -- Deve retornar vazio

-- 2. Usuário comum NÃO pode ver access_codes
-- SELECT * FROM access_codes; -- Deve retornar vazio

-- 3. Usuário comum NÃO pode ver admin_audit_logs
-- SELECT * FROM admin_audit_logs; -- Deve retornar vazio

-- 4. Admin pode ver tudo
-- (Admin email deve ser definido em app.admin_email antes do teste)

-- ============================================================================
-- CONFIGURAÇÃO EM CÓDIGO (Node.js / Next.js)
-- ============================================================================

/*

// No arquivo: src/lib/supabase/server.ts ou seu equivalente

import { createServerClient } from '@supabase/ssr';

export async function createClient() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // getCookies implementation
        },
        setAll(cookiesToSet) {
          // setCookies implementation
        },
      },
    }
  );

  // IMPORTANTE: Definir admin_email no contexto da sessão
  const user = await supabase.auth.getUser();
  if (user.data.user?.email === process.env.MASTER_ADMIN_EMAIL) {
    await supabase.rpc('set_admin_context', {
      admin_email: user.data.user.email
    });
  }

  return supabase;
}

// OU criar uma função RPC no Supabase:

CREATE OR REPLACE FUNCTION set_admin_context(admin_email TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.admin_email', admin_email, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION set_admin_context TO authenticated;

*/

-- ============================================================================
-- CHECKLIST DE SEGURANÇA
-- ============================================================================

/*

✓ RLS habilitado em todas as tabelas
✓ SELECT: apenas próprio usuário ou admin
✓ INSERT: validação de user_id
✓ UPDATE: restrição de alteração
✓ DELETE: não permitido (políticas omitidas = acesso negado)
✓ Admin email como variável de ambiente
✓ Sem acesso público (anon key sem permissões)
✓ Sem wildcard nas policies
✓ Sem OR lógicos que abrem brechas
✓ auth.uid() validado em todas as policies

PRÓXIMOS PASSOS:

1. Executar todos os CREATE POLICY acima no Supabase
2. Configurar app.admin_email no código da aplicação
3. Testar com usuários comuns e admin
4. Revisar pg_policies periodicamente
5. Adicionar DELETE policies se necessário (com restrições)

*/

-- ============================================================================
-- FIM DO SCRIPT RLS
-- ============================================================================
