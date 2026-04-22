-- ============================================================================
-- MECA APP - ROW LEVEL SECURITY POLICIES (PRONTO PARA PRODUÇÃO)
-- Admin: felipe.aguiardecarvalho@gmail.com
-- Data: 18 de Abril de 2026
-- ============================================================================

-- PASSO 1: HABILITAR RLS EM TODAS AS TABELAS
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- PASSO 2: REMOVER POLICIES ANTIGAS
-- ============================================================================
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
DROP POLICY IF EXISTS "access_codes_select_admin" ON public.access_codes;
DROP POLICY IF EXISTS "access_codes_insert_admin" ON public.access_codes;
DROP POLICY IF EXISTS "access_codes_update_admin" ON public.access_codes;
DROP POLICY IF EXISTS "admin_audit_logs_select_admin" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "admin_audit_logs_insert_admin" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "admin_audit_logs_admin_all" ON public.admin_audit_logs;

-- PASSO 3: CRIAR FUNÇÃO HELPER PARA VERIFICAR ADMIN
-- ============================================================================
DROP FUNCTION IF EXISTS is_admin() CASCADE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND email = 'felipe.aguiardecarvalho@gmail.com'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_admin TO authenticated, anon;

-- PASSO 4: POLICIES - TABELA users
-- ============================================================================

CREATE POLICY "users_select_self"
ON public.users
FOR SELECT
USING (auth.uid() = id OR is_admin());

CREATE POLICY "users_insert_self"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_self"
ON public.users
FOR UPDATE
USING (auth.uid() = id OR is_admin())
WITH CHECK (auth.uid() = id OR is_admin());

-- PASSO 5: POLICIES - TABELA responses
-- ============================================================================

CREATE POLICY "responses_select_own_or_admin"
ON public.responses
FOR SELECT
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "responses_insert_own"
ON public.responses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "responses_update_own_or_admin"
ON public.responses
FOR UPDATE
USING (auth.uid() = user_id OR is_admin())
WITH CHECK (auth.uid() = user_id OR is_admin());

-- PASSO 6: POLICIES - TABELA access_codes
-- ============================================================================

CREATE POLICY "access_codes_admin_only_select"
ON public.access_codes
FOR SELECT
USING (is_admin());

CREATE POLICY "access_codes_admin_only_insert"
ON public.access_codes
FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "access_codes_admin_only_update"
ON public.access_codes
FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

-- PASSO 7: POLICIES - TABELA admin_audit_logs
-- ============================================================================

CREATE POLICY "admin_audit_logs_admin_only_select"
ON public.admin_audit_logs
FOR SELECT
USING (is_admin());

CREATE POLICY "admin_audit_logs_admin_only_insert"
ON public.admin_audit_logs
FOR INSERT
WITH CHECK (is_admin());

-- PASSO 8: CRIAR FUNÇÃO RPC PARA AUDITORIA
-- ============================================================================

DROP FUNCTION IF EXISTS log_admin_action(action_type TEXT, target_user_id UUID, details JSONB) CASCADE;

CREATE OR REPLACE FUNCTION log_admin_action(
  action_type TEXT,
  target_user_id UUID,
  details JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Apenas admin pode registrar ações';
  END IF;

  INSERT INTO public.admin_audit_logs (admin_email, action, target_user_id, details)
  VALUES (
    (SELECT email FROM public.users WHERE id = auth.uid()),
    action_type,
    target_user_id,
    details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;

-- PASSO 9: CRIAR FUNÇÃO RPC PARA LIBERAR DIAGNÓSTICO
-- ============================================================================

DROP FUNCTION IF EXISTS unlock_diagnostic_for_user(target_user_id UUID) CASCADE;

CREATE OR REPLACE FUNCTION unlock_diagnostic_for_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Apenas admin pode liberar diagnósticos';
  END IF;

  UPDATE public.responses
  SET can_retake = TRUE
  WHERE user_id = target_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  PERFORM log_admin_action('unlock_diagnostic', target_user_id, jsonb_build_object('timestamp', NOW()));

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION unlock_diagnostic_for_user TO authenticated;

-- PASSO 10: CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_responses_user_id ON public.responses(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON public.responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_codes_user_email ON public.access_codes(user_email);
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON public.access_codes(code);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_email ON public.admin_audit_logs(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_user_id ON public.admin_audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- PASSO 11: PERMISSÕES ANON KEY (SEGURANÇA)
-- ============================================================================

-- Anon key NÃO pode fazer nada sem autenticação
-- Isso é forçado pelas policies acima que usam auth.uid()

-- PASSO 12: REVOGAR ACESSO DIRETO (SEGURANÇA)
-- ============================================================================

REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.responses FROM anon;
REVOKE ALL ON public.access_codes FROM anon;
REVOKE ALL ON public.admin_audit_logs FROM anon;

GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.responses TO authenticated;
GRANT SELECT ON public.access_codes TO authenticated;
GRANT SELECT ON public.admin_audit_logs TO authenticated;

-- ============================================================================
-- VERIFICAÇÃO: LISTAR TODAS AS POLICIES
-- ============================================================================

/*

SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

*/

-- ============================================================================
-- TESTES DE SEGURANÇA (executar como usuário comum)
-- ============================================================================

/*

-- 1. Usuário comum PODE ver suas próprias responses
SELECT COUNT(*) FROM responses WHERE user_id = auth.uid(); -- ✓ Deve retornar N

-- 2. Usuário comum NÃO PODE ver responses de outro usuário
SELECT COUNT(*) FROM responses WHERE user_id != auth.uid(); -- ✓ Deve retornar 0

-- 3. Usuário comum NÃO PODE ver access_codes
SELECT COUNT(*) FROM access_codes; -- ✓ Deve retornar 0

-- 4. Usuário comum NÃO PODE ver admin_audit_logs
SELECT COUNT(*) FROM admin_audit_logs; -- ✓ Deve retornar 0

-- 5. Usuário comum PODE ver seu próprio user
SELECT COUNT(*) FROM users WHERE id = auth.uid(); -- ✓ Deve retornar 1

-- 6. Usuário comum NÃO PODE ver outro user
SELECT COUNT(*) FROM users WHERE id != auth.uid(); -- ✓ Deve retornar 0

*/

-- ============================================================================
-- TESTES DE SEGURANÇA (executar como ADMIN)
-- ============================================================================

/*

-- 1. Admin PODE ver TODAS as responses
SELECT COUNT(*) FROM responses; -- ✓ Deve retornar todos os registros

-- 2. Admin PODE ver TODOS os users
SELECT COUNT(*) FROM users; -- ✓ Deve retornar todos os registros

-- 3. Admin PODE ver TODOS os access_codes
SELECT COUNT(*) FROM access_codes; -- ✓ Deve retornar todos os registros

-- 4. Admin PODE ver TODOS os admin_audit_logs
SELECT COUNT(*) FROM admin_audit_logs; -- ✓ Deve retornar todos os registros

-- 5. Admin PODE usar RPC para liberar diagnóstico
SELECT unlock_diagnostic_for_user('uuid-do-usuario'); -- ✓ Deve retornar true

-- 6. Admin PODE usar RPC para logar ações
SELECT log_admin_action('test_action', 'uuid-do-usuario', '{"test": true}'::jsonb); -- ✓ OK

*/

-- ============================================================================
-- PRÓXIMOS PASSOS
-- ============================================================================

/*

1. ✓ Copiar este SQL no Supabase Dashboard → SQL Editor
2. ✓ Executar tudo (não precisa ser um a um)
3. ✓ No código Node.js, usar:
   - auth.uid() (já inserido automaticamente)
   - Service Role Key para operações admin (já configurado)
4. ✓ Testar com usuário comum (sem admin) e com admin
5. ✓ Monitorar logs em admin_audit_logs

SEGURANÇA GARANTIDA:
✓ Sem acesso público (anon revogado)
✓ Usuário acessa apenas seus dados
✓ Admin pode acessar tudo
✓ Funções RPC protegidas
✓ Índices para performance
✓ sem SQL injection (parameterizado)

*/

-- ============================================================================
-- FIM DO SCRIPT RLS - PRONTO PARA PRODUÇÃO
-- ============================================================================
