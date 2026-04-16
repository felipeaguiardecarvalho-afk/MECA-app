-- Optional flag for future admin attribution / reporting (set on insert from app)
alter table public.responses
  add column if not exists is_admin boolean not null default false;

comment on column public.responses.is_admin is 'True if submitter was master admin at insert time (app-set; not a privilege grant).';
