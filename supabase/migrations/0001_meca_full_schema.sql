-- MECA full schema: access_codes, access_grants, responses, RLS, validate_access_code RPC
-- Apply with: supabase db push (linked project) or supabase migration up (local)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------------

create table public.access_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  is_active boolean not null default true,
  expires_at timestamptz,
  usage_limit integer,
  used_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint access_codes_used_count_non_negative check (used_count >= 0)
);

create table public.access_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  constraint access_grants_one_per_user unique (user_id)
);

create table public.responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  answers jsonb not null,
  mentalidade double precision not null,
  engajamento double precision not null,
  cultura double precision not null,
  performance double precision not null,
  direction double precision not null,
  capacity double precision not null,
  archetype text not null
);

create index responses_user_id_idx on public.responses (user_id);
create index responses_created_at_idx on public.responses (created_at);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.access_codes enable row level security;
alter table public.access_grants enable row level security;
alter table public.responses enable row level security;

-- access_codes: no direct access from clients (RPC / service role only)
create policy "access_codes_block_all"
  on public.access_codes
  for all
  using (false)
  with check (false);

-- responses: own rows only; insert own; no update/delete policies
create policy "responses_select_own"
  on public.responses
  for select
  using (auth.uid() = user_id);

create policy "responses_insert_own"
  on public.responses
  for insert
  with check (auth.uid() = user_id);

-- access_grants: read own; insert own (RPC still performs insert via SECURITY DEFINER)
create policy "access_grants_select_own"
  on public.access_grants
  for select
  using (auth.uid() = user_id);

create policy "access_grants_insert_own"
  on public.access_grants
  for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- RPC: validate_access_code
-- ---------------------------------------------------------------------------

create or replace function public.validate_access_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  r public.access_codes%rowtype;
  v_trim text := trim(p_code);
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'unauthenticated');
  end if;

  if exists (select 1 from public.access_grants ag where ag.user_id = v_user) then
    return jsonb_build_object('ok', true, 'already_granted', true);
  end if;

  select * into r
  from public.access_codes
  where code = v_trim
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;

  if not r.is_active then
    return jsonb_build_object('ok', false, 'error', 'inactive');
  end if;

  if r.expires_at is not null and r.expires_at < now() then
    return jsonb_build_object('ok', false, 'error', 'expired');
  end if;

  if r.usage_limit is not null and r.used_count >= r.usage_limit then
    return jsonb_build_object('ok', false, 'error', 'limit_exceeded');
  end if;

  update public.access_codes
  set used_count = used_count + 1
  where id = r.id;

  insert into public.access_grants (user_id, code)
  values (v_user, v_trim);

  return jsonb_build_object('ok', true);
exception
  when unique_violation then
    return jsonb_build_object('ok', true, 'already_granted', true);
end;
$$;

revoke all on function public.validate_access_code(text) from public;
grant execute on function public.validate_access_code(text) to authenticated;
