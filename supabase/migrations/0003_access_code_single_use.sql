-- Each access code: single redemption total (used_count must be 0 before use).
-- After success, used_count becomes 1 and the code cannot be reused by anyone.

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

  insert into public.access_grants (user_id, code)
  values (v_user, v_trim);

  return jsonb_build_object('ok', true);
exception
  when unique_violation then
    return jsonb_build_object('ok', true, 'already_granted', true);
end;
$$;
