-- Grant authenticated users access without an access code (email login).
-- One diagnostic per user: can_take_diagnostic is false if they already have a response row.

create or replace function public.ensure_email_access_grant()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_has_responses boolean;
begin
  if v_user is null then
    return;
  end if;

  if exists (select 1 from public.access_grants ag where ag.user_id = v_user) then
    return;
  end if;

  v_has_responses := exists (select 1 from public.responses r where r.user_id = v_user);

  insert into public.access_grants (user_id, code, can_take_diagnostic)
  values (v_user, 'email-login', not v_has_responses);
exception
  when unique_violation then
    null;
end;
$$;

revoke all on function public.ensure_email_access_grant() from public;
grant execute on function public.ensure_email_access_grant() to authenticated;
