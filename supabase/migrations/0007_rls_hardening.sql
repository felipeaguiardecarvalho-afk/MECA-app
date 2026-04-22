-- ============================================================================
-- 0007_rls_hardening.sql — RLS audit + enforcement for responses, access_grants,
-- access_codes. Idempotent: safe to re-run.
--
-- Goals (from audit):
--   1. ENABLE + FORCE RLS on all three tables.
--   2. Users can only see / write their own rows (auth.uid() = user_id).
--   3. Master admin has SELECT (and where applicable UPDATE) override via a
--      helper function `public.is_admin()` that compares auth.jwt() ->> 'email'
--      to the canonical master email. NOTE: the original suggested predicate
--      `auth.jwt() ->> 'email' = current_setting('request.jwt.claim.email')`
--      is tautological — both sides resolve to the same JWT claim — so it would
--      grant admin to every authenticated user. This migration replaces it
--      with a proper equality check against the canonical master address.
--   4. No public access: explicit REVOKE from anon + public role grants,
--      policies scoped `TO authenticated`, defense-in-depth `FORCE ROW LEVEL
--      SECURITY` so even table owner / bypass-RLS roles (except service_role,
--      which is needed by the app) cannot read without a policy.
--
-- Schema sanity (migrations 0001–0006):
--   - responses(user_id uuid NOT NULL, …)            → owner + admin
--   - access_grants(user_id uuid NOT NULL, …)        → owner + admin
--   - access_codes(code text UNIQUE, …, no user_id)  → RPC + admin SELECT only
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Helper: is_admin()
-- ---------------------------------------------------------------------------
-- STABLE (not IMMUTABLE): value is fixed within a statement but changes per
-- request (different JWT). SECURITY INVOKER: we only touch session state.
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    lower(trim(auth.jwt() ->> 'email')) = 'felipe.aguiardecarvalho@gmail.com',
    false
  );
$$;

comment on function public.is_admin() is
  'True when the current request''s JWT email matches the canonical master admin. '
  'Used by RLS policies to grant admin override. Must stay in sync with '
  'src/lib/auth/canonical-master.ts::CANONICAL_MASTER_EMAIL.';

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Enable + FORCE RLS (idempotent)
-- ---------------------------------------------------------------------------
alter table public.responses     enable row level security;
alter table public.access_grants enable row level security;
alter table public.access_codes  enable row level security;

alter table public.responses     force row level security;
alter table public.access_grants force row level security;
alter table public.access_codes  force row level security;

-- ---------------------------------------------------------------------------
-- 3. Drop any previous policies with the names we are about to (re)create so
--    re-running the migration doesn't error on duplicates. Existing owner
--    policies from 0001/0004 are preserved by name below.
-- ---------------------------------------------------------------------------
drop policy if exists "responses_select_own"             on public.responses;
drop policy if exists "responses_insert_own"             on public.responses;
drop policy if exists "responses_select_admin"           on public.responses;

drop policy if exists "access_grants_select_own"         on public.access_grants;
drop policy if exists "access_grants_insert_own"         on public.access_grants;
drop policy if exists "access_grants_update_self_lock_only"
                                                         on public.access_grants;
drop policy if exists "access_grants_select_admin"       on public.access_grants;
drop policy if exists "access_grants_update_admin"       on public.access_grants;

drop policy if exists "access_codes_block_all"           on public.access_codes;
drop policy if exists "access_codes_select_admin"        on public.access_codes;

-- ---------------------------------------------------------------------------
-- 4. responses — owner SELECT/INSERT; admin SELECT; no UPDATE / DELETE.
-- ---------------------------------------------------------------------------
create policy "responses_select_own"
  on public.responses
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "responses_insert_own"
  on public.responses
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "responses_select_admin"
  on public.responses
  for select
  to authenticated
  using (public.is_admin());

-- UPDATE / DELETE intentionally omitted: responses are append-only.
-- Service role bypasses RLS for legitimate admin mutations.

-- ---------------------------------------------------------------------------
-- 5. access_grants — owner SELECT/INSERT; self-lock UPDATE; admin SELECT +
--    admin UPDATE (so the admin UI no longer depends solely on service role).
--    No DELETE policy — deletion cascades from auth.users or uses service role.
-- ---------------------------------------------------------------------------
create policy "access_grants_select_own"
  on public.access_grants
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "access_grants_insert_own"
  on public.access_grants
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can only *lock themselves* (set can_take_diagnostic = false) on their
-- own row. Unlock (setting it back to true) requires admin or service role.
create policy "access_grants_update_self_lock_only"
  on public.access_grants
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and can_take_diagnostic = false
  );

create policy "access_grants_select_admin"
  on public.access_grants
  for select
  to authenticated
  using (public.is_admin());

create policy "access_grants_update_admin"
  on public.access_grants
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. access_codes — no direct client access. All redemption flows through
--    public.validate_access_code() (SECURITY DEFINER). Admin gets SELECT only
--    for auditing.
-- ---------------------------------------------------------------------------
create policy "access_codes_select_admin"
  on public.access_codes
  for select
  to authenticated
  using (public.is_admin());

-- INSERT / UPDATE / DELETE: no policy → RLS default-denies for authenticated.
-- Service role bypasses RLS; the RPC runs as owner and is the only legit
-- mutation path from the app.

-- ---------------------------------------------------------------------------
-- 7. No public access — lock down role-level grants (defense in depth).
--    `anon` must never see any of these tables; even `authenticated` has only
--    what the policies let through.
-- ---------------------------------------------------------------------------
revoke all on table public.responses     from public, anon;
revoke all on table public.access_grants from public, anon;
revoke all on table public.access_codes  from public, anon, authenticated;

grant select, insert          on public.responses     to authenticated;
grant select, insert, update  on public.access_grants to authenticated;
-- access_codes: authenticated gets nothing at the role level — the RPC is
-- the only path. service_role still has full access (it bypasses RLS).

-- ---------------------------------------------------------------------------
-- 8. Verification queries (run manually in the SQL editor after applying).
-- ---------------------------------------------------------------------------
/*
-- a) Confirm RLS enabled + forced on all three tables:
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where relname in ('responses','access_grants','access_codes');

-- b) Inspect the active policies:
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('responses','access_grants','access_codes')
order by tablename, policyname;

-- c) Role grants (should NOT include anon for these three):
select grantee, privilege_type, table_name
from information_schema.table_privileges
where table_schema = 'public'
  and table_name in ('responses','access_grants','access_codes')
order by table_name, grantee, privilege_type;

-- d) Smoke test as a non-admin user (in SQL editor → "Run as authenticated"):
--    select count(*) from public.responses where user_id <> auth.uid();   -- expect 0
--    select count(*) from public.access_grants where user_id <> auth.uid();-- expect 0
--    select count(*) from public.access_codes;                            -- expect 0

-- e) Smoke test as the master admin (same editor, logged in as canonical email):
--    select count(*) from public.responses;      -- expect total rows
--    select count(*) from public.access_grants;  -- expect total rows
--    select count(*) from public.access_codes;   -- expect total rows
*/

-- ============================================================================
-- End of 0007_rls_hardening.sql
-- ============================================================================
