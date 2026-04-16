-- One diagnostic per user by default; admin unlocks via API (service role).
alter table public.access_grants
  add column if not exists can_take_diagnostic boolean not null default true;

comment on column public.access_grants.can_take_diagnostic is
  'When false, user may only view dashboard until admin sets true again.';

-- Existing users who already submitted at least one response cannot take another until unlock.
update public.access_grants ag
set can_take_diagnostic = false
where exists (
  select 1 from public.responses r where r.user_id = ag.user_id
);

-- RPC: keep single-use code behaviour from 0003; set can_take_diagnostic = true on new grant.
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

  if r.used_count >= 1 then
    return jsonb_build_object('ok', false, 'error', 'code_already_used');
  end if;

  update public.access_codes
  set used_count = used_count + 1
  where id = r.id;

  insert into public.access_grants (user_id, code, can_take_diagnostic)
  values (v_user, v_trim, true);

  return jsonb_build_object('ok', true);
exception
  when unique_violation then
    return jsonb_build_object('ok', true, 'already_granted', true);
end;
$$;

-- Authenticated users may only lock (set can_take_diagnostic = false) on their own row.
-- Unlock to true is done via service role (admin API) only.
create policy "access_grants_update_self_lock_only"
  on public.access_grants
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and can_take_diagnostic = false
  );
