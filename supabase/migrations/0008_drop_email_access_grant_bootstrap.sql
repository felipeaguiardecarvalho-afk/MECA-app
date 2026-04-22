-- ============================================================================
-- 0008_drop_email_access_grant_bootstrap.sql
--
-- Security fix: the `public.ensure_email_access_grant()` RPC (added in 0005)
-- minted an `access_grants` row for any authenticated user the first time they
-- hit the app — no access code validation, no allow-list check, nothing.
-- Combined with the middleware calling it automatically on
-- /dashboard, /assessment, /fundamentos, /plano-de-acao and /access-code,
-- this effectively meant "any verified email address = full product access".
--
-- Policy going forward: the ONLY way to receive an `access_grants` row is via
-- `public.validate_access_code(p_code)` (single-use code, verified against
-- `access_codes` in the DB) or via the admin unlock path (service role).
--
-- This migration is idempotent: `drop function if exists` is a no-op if the
-- function was already removed.
--
-- Existing grants are intentionally preserved — only the auto-provisioning
-- function is removed. Admin can revoke individual grants via the existing
-- service-role admin tooling if needed.
-- ============================================================================

drop function if exists public.ensure_email_access_grant();

-- Clean up any stale grants that were minted exclusively by the auto-flow:
--   code = 'email-login' was the literal marker inserted by both the RPC
--   (migration 0005) and the server fallback endpoint. Remove those rows so
--   users who never redeemed a real code lose access until they do.
--
-- If you deliberately created legitimate grants with code = 'email-login'
-- outside the auto-flow, comment the DELETE below BEFORE applying.
delete from public.access_grants
where code = 'email-login';

-- ============================================================================
-- Verification (run manually in the SQL editor after applying):
-- ============================================================================
/*
-- a) The RPC must be gone:
select proname
from pg_proc
where proname = 'ensure_email_access_grant';
-- expect: 0 rows

-- b) No residual auto-grants:
select count(*)
from public.access_grants
where code = 'email-login';
-- expect: 0

-- c) Only `validate_access_code` remains as the legitimate grant-minting path:
select proname, prosecdef
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('validate_access_code', 'ensure_email_access_grant');
-- expect: a single row for validate_access_code with prosecdef = true
*/
