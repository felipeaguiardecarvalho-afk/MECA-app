-- ============================================================================
-- 0009_admin_audit_logs.sql — Persistent admin audit trail.
--
-- Goals:
--   1. Durable, append-only record of every privileged admin action so we can
--      forensically reconstruct who did what, to whom, and when. Backs the
--      console-side `logger.info("[admin-audit]", …)` from src/lib/admin-audit-log.ts
--      with an authoritative, un-masked store (replaces the placeholder schema
--      previously sketched in docs/admin_logs_schema.sql).
--   2. RLS hardened: only the master admin (via `public.is_admin()` from 0007)
--      can SELECT; no role except `service_role` may INSERT/UPDATE/DELETE.
--      `FORCE ROW LEVEL SECURITY` ensures even the table owner is gated.
--   3. Append-only by convention: no UPDATE/DELETE policies are created, so
--      attempts (even by accidentally-elevated roles other than service_role)
--      are denied. service_role bypasses RLS in Supabase by virtue of its
--      BYPASSRLS attribute and is the only path the application uses.
--
-- Schema rationale:
--   - Both `admin_user_id` (uuid) and `admin_email` (text) are stored:
--     the UUID is a stable join key; the email at-time-of-action is preserved
--     even if the auth user is later deleted.
--   - `target_user_id` / `target_user_email` are NULLABLE because some actions
--     (e.g. listing the diagnostic overview) have no single target.
--   - `metadata jsonb` carries action-specific context (response_id, source IP,
--     user-agent fragment, etc.) without forcing schema changes per new action.
--   - Indexes cover the four expected access patterns: timeline scan, per-admin
--     review, per-target investigation, and per-action filtering.
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------------
create table if not exists public.admin_audit_logs (
  id                  uuid        primary key default gen_random_uuid(),
  action              text        not null
                                  check (char_length(action) between 1 and 64),
  admin_user_id       uuid        not null,
  admin_email         text        not null
                                  check (char_length(admin_email) between 3 and 320),
  target_user_id      uuid        null,
  target_user_email   text        null
                                  check (target_user_email is null
                                         or char_length(target_user_email) between 3 and 320),
  metadata            jsonb       not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

comment on table public.admin_audit_logs is
  'Append-only audit trail of master-admin actions (unlock_diagnostic, '
  'generate_report, view_user_data, diagnostic_overview, …). Written exclusively via '
  'service_role from src/lib/admin-audit-log.ts. Read access is restricted '
  'to the master admin via RLS (public.is_admin()).';

comment on column public.admin_audit_logs.action            is 'Short, stable identifier (snake_case). Examples: unlock_diagnostic, generate_report, diagnostic_overview.';
comment on column public.admin_audit_logs.admin_user_id     is 'Supabase auth user id of the admin performing the action.';
comment on column public.admin_audit_logs.admin_email       is 'Email of the admin at the time of the action (snapshot, not a foreign key).';
comment on column public.admin_audit_logs.target_user_id    is 'Affected user id, when the action targets a specific user. NULL for broad actions.';
comment on column public.admin_audit_logs.target_user_email is 'Affected user email at the time of the action. NULL when not applicable.';
comment on column public.admin_audit_logs.metadata          is 'Action-specific context (response_id, ip, user_agent, etc.). Never store secrets.';

-- ---------------------------------------------------------------------------
-- 2. Indexes
-- ---------------------------------------------------------------------------
create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);

create index if not exists admin_audit_logs_admin_user_id_created_at_idx
  on public.admin_audit_logs (admin_user_id, created_at desc);

create index if not exists admin_audit_logs_target_user_id_created_at_idx
  on public.admin_audit_logs (target_user_id, created_at desc)
  where target_user_id is not null;

create index if not exists admin_audit_logs_action_created_at_idx
  on public.admin_audit_logs (action, created_at desc);

-- ---------------------------------------------------------------------------
-- 3. RLS — enable + force
-- ---------------------------------------------------------------------------
alter table public.admin_audit_logs enable row level security;
alter table public.admin_audit_logs force  row level security;

-- ---------------------------------------------------------------------------
-- 4. Grants
-- ---------------------------------------------------------------------------
-- Default-deny for public/anon (defense-in-depth; RLS already blocks).
revoke all on public.admin_audit_logs from public;
revoke all on public.admin_audit_logs from anon;

-- Authenticated users may attempt SELECT; the policy below restricts it to admins.
grant select on public.admin_audit_logs to authenticated;

-- Application writes go through the service role (BYPASSRLS).
grant select, insert on public.admin_audit_logs to service_role;

-- ---------------------------------------------------------------------------
-- 5. Policies
-- ---------------------------------------------------------------------------
-- SELECT: master admin only. Drop-then-create for idempotency.
drop policy if exists admin_audit_logs_select_admin on public.admin_audit_logs;
create policy admin_audit_logs_select_admin
  on public.admin_audit_logs
  for select
  to authenticated
  using (public.is_admin());

-- No INSERT/UPDATE/DELETE policies for authenticated/anon. With FORCE RLS,
-- this means only roles with BYPASSRLS (i.e. service_role) can write, and
-- nobody can mutate or delete historical rows.

-- ---------------------------------------------------------------------------
-- 6. Sanity comment for future migrations
-- ---------------------------------------------------------------------------
-- If you add a new admin action, prefer extending `metadata` over adding new
-- columns. If a new column is genuinely needed, keep it NULLABLE so that
-- historical rows remain valid.
