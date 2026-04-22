-- 0010_profiles_onboarding_fields.sql
-- Add optional onboarding fields (profession, phone) to public.profiles so the
-- first-access diagnostic form can persist Nome (full_name) + profissão + telefone.
-- Nome (full_name) já existe na tabela (nullable); a validação de obrigatoriedade
-- vive na aplicação (Zod + UI) para não quebrar linhas criadas antes desta migração.

alter table public.profiles
  add column if not exists profession text,
  add column if not exists phone text;

comment on column public.profiles.profession is
  'Profissão declarada pelo utilizador no onboarding (opcional).';
comment on column public.profiles.phone is
  'Telefone declarado pelo utilizador no onboarding (opcional, formato livre).';
