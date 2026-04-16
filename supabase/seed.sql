-- MECA seed data (runs with: supabase db reset, or supabase db seed when configured)
-- Codes are single-use (see migration 0003): first redemption consumes the code.

insert into public.access_codes (code, is_active, expires_at, usage_limit, used_count)
values
  ('MECA-SEED-ALPHA', true, null, 1, 0),
  ('MECA-SEED-BETA', true, null, 1, 0),
  ('MECA-SEED-GAMMA', true, null, 1, 0),
  ('MECA-SEED-EXPIRED', true, (now() - interval '1 day'), 1, 0),
  ('MECA-SEED-LIMIT', true, null, 1, 1);
