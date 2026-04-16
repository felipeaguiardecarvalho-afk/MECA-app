-- Phase for login UI: first access / incomplete diagnostic vs returning with completed diagnostic.
-- Called only from Next.js with SUPABASE_SERVICE_ROLE_KEY (not exposed to anon).

create or replace function public.meca_email_login_phase(p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  resp boolean;
  norm text := lower(trim(p_email));
begin
  if norm is null or norm = '' then
    return 'first_access';
  end if;

  select id into uid
  from auth.users
  where lower(trim(email)) = norm
  limit 1;

  if uid is null then
    return 'first_access';
  end if;

  select exists(
    select 1 from public.responses r where r.user_id = uid
  ) into resp;

  if resp then
    return 'returning_done';
  end if;

  return 'returning_incomplete';
end;
$$;

revoke all on function public.meca_email_login_phase(text) from public;
grant execute on function public.meca_email_login_phase(text) to service_role;
