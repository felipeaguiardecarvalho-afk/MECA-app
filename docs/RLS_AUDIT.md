# Auditoria RLS — `responses`, `access_grants`, `access_codes`

Data: Abr 2026. Escopo: as três tabelas listadas no pedido.

## Estado encontrado

Consolidado das migrações `0001_meca_full_schema.sql` → `0006_meca_email_login_phase.sql`:

| Tabela          | RLS       | FORCE RLS | Policies existentes                                                                 | `user_id`? |
| --------------- | --------- | --------- | ----------------------------------------------------------------------------------- | ---------- |
| `responses`     | habilitado | não       | `select_own`, `insert_own`                                                          | sim        |
| `access_grants` | habilitado | não       | `select_own`, `insert_own`, `update_self_lock_only`                                 | sim        |
| `access_codes`  | habilitado | não       | `block_all` (`using (false) with check (false)`)                                    | **não**    |

Observações:

- **O admin até agora dependia exclusivamente da `SUPABASE_SERVICE_ROLE_KEY`** (bypass de RLS). Não havia override de admin em policy — a API admin funcionava porque usa o cliente service-role.
- **`access_codes` não tem coluna `user_id`** — é uma tabela de lookup de códigos redimíveis, partilhada. A redenção passa pela RPC `public.validate_access_code` (`SECURITY DEFINER`). A regra `auth.uid() = user_id` do pedido não se aplica a esta tabela.
- **Ficheiros `supabase_rls_policies.sql` / `supabase_rls_policies_FINAL.sql` na raiz do repositório** são rascunhos antigos. Referenciam uma tabela `public.users` que **não existe** neste schema (o app usa `auth.users` do Supabase) e tabelas `admin_audit_logs` / coluna `responses.can_retake` que também não existem. **Não aplicar**.

## Bug no predicate admin proposto

O snippet pedido:

```sql
USING (auth.jwt() ->> 'email' = current_setting('request.jwt.claim.email'))
```

é **tautológico**. Ambos os lados resolvem para o mesmo claim `email` do JWT da requisição corrente (Supabase define `request.jwt.claim.email` a partir do mesmo token). A condição é sempre verdadeira para qualquer utilizador autenticado — **concederia admin a todos**.

Correção aplicada: helper `public.is_admin()` que compara o email do JWT contra o email master canónico (fixo no código como `CANONICAL_MASTER_EMAIL` em `src/lib/auth/canonical-master.ts`):

```sql
create function public.is_admin() returns boolean
language sql stable security invoker
as $$
  select coalesce(
    lower(trim(auth.jwt() ->> 'email')) = 'felipe.aguiardecarvalho@gmail.com',
    false
  );
$$;
```

## Política final (aplicada em `0007_rls_hardening.sql`)

**Todas as policies usam `TO authenticated`**, o que garante que `anon` nunca combina nenhuma regra.

### `responses`
- `responses_select_own` — `using (auth.uid() = user_id)`
- `responses_insert_own` — `with check (auth.uid() = user_id)`
- `responses_select_admin` — `using (public.is_admin())`
- Sem UPDATE/DELETE (append-only). Operações administrativas usam service role.

### `access_grants`
- `access_grants_select_own` — `using (auth.uid() = user_id)`
- `access_grants_insert_own` — `with check (auth.uid() = user_id)`
- `access_grants_update_self_lock_only` — o próprio utilizador só pode *bloquear-se* (`can_take_diagnostic = false`); desbloqueio exige admin/service role.
- `access_grants_select_admin` — admin vê todos.
- `access_grants_update_admin` — admin pode alterar qualquer linha (ex.: liberar novo diagnóstico) sem depender do service role.

### `access_codes`
- `access_codes_select_admin` — admin pode auditar os códigos.
- Nenhuma outra policy → INSERT/UPDATE/DELETE default-denied por RLS.
- `authenticated` perde também o GRANT de tabela (`revoke all ... from authenticated`) — o único caminho legítimo de redenção é a RPC `validate_access_code` (`SECURITY DEFINER`).

### Hardening extra
- `ENABLE ROW LEVEL SECURITY` **+** `FORCE ROW LEVEL SECURITY` nas três tabelas. `FORCE` fecha a brecha de um possível owner/DDL role ler sem passar por policies.
- `REVOKE ALL ... FROM public, anon` nas três tabelas. Belt-and-braces: mesmo que alguém reactive RLS incorrectamente, o role `anon` não tem GRANT.
- `service_role` continua com bypass de RLS — necessário para os endpoints admin do app (PDF, unlock, overview).

## Como aplicar

```bash
# Com a Supabase CLI ligada ao projecto:
supabase db push

# Ou via SQL Editor → cole o conteúdo de
# supabase/migrations/0007_rls_hardening.sql e "Run".
```

A migração é idempotente: `drop policy if exists` + `create policy` + `create or replace function`. Segura para re-executar.

## Verificação pós-deploy

Execute as queries comentadas no fim da migração:

1. `pg_class.relrowsecurity` e `relforcerowsecurity` devem ser `true` nas três tabelas.
2. `pg_policies` deve listar as 8 policies esperadas (3 em `responses`, 4 em `access_grants`, 1 em `access_codes`).
3. `information_schema.table_privileges` **não deve** mostrar `anon` em nenhuma das três tabelas.
4. Smoke tests manuais como usuário comum e como admin (comentários `d)` e `e)` no fim do ficheiro SQL).

## Pontos abertos (fora do escopo deste pedido)

- **Ficheiros `supabase_rls_policies.sql` / `supabase_rls_policies_FINAL.sql` na raiz** — recomendável remover ou mover para `docs/archive/` para não induzir operador a aplicá-los (referenciam tabelas inexistentes).
- **Persistência do audit log** — hoje `src/lib/admin-audit-log.ts` só escreve `console.info`. O esqueleto em `docs/admin_logs_schema.sql` propõe `public.admin_logs`; se/quando aplicado, precisará de policies análogas (admin-only SELECT/INSERT, `FORCE RLS`, `REVOKE anon`).
