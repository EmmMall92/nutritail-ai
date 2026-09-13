-- Versioned legal-document acceptance evidence. The browser never accesses
-- this table directly; authenticated server routes write through service_role.

begin;

create table if not exists public.customer_legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check (
    document_type in ('terms', 'privacy_notice')
  ),
  document_version text not null,
  accepted_at timestamptz not null,
  source text not null default 'registration' check (
    source in ('registration', 'reacceptance', 'admin_import')
  ),
  created_at timestamptz not null default now(),
  unique (auth_user_id, document_type, document_version)
);

create index if not exists customer_legal_acceptances_user_created_idx
  on public.customer_legal_acceptances (auth_user_id, created_at desc);

alter table public.customer_legal_acceptances enable row level security;

revoke all on table public.customer_legal_acceptances
  from anon, authenticated, service_role;

grant select, insert, update, delete
  on table public.customer_legal_acceptances
  to service_role;

comment on table public.customer_legal_acceptances is
  'Versioned Terms acceptance and Privacy Notice acknowledgement for Nutritail accounts.';

create or replace function public.capture_registration_legal_acceptances()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_user_meta_data ->> 'terms_accepted' = 'true'
    and new.raw_user_meta_data ->> 'terms_version' = '2026-08-17'
  then
    insert into public.customer_legal_acceptances (
      auth_user_id,
      document_type,
      document_version,
      accepted_at,
      source
    ) values (
      new.id,
      'terms',
      '2026-08-17',
      new.created_at,
      'registration'
    )
    on conflict (auth_user_id, document_type, document_version) do nothing;
  end if;

  if new.raw_user_meta_data ->> 'privacy_notice_acknowledged' = 'true'
    and new.raw_user_meta_data ->> 'privacy_notice_version' = '2026-08-17'
  then
    insert into public.customer_legal_acceptances (
      auth_user_id,
      document_type,
      document_version,
      accepted_at,
      source
    ) values (
      new.id,
      'privacy_notice',
      '2026-08-17',
      new.created_at,
      'registration'
    )
    on conflict (auth_user_id, document_type, document_version) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.capture_registration_legal_acceptances()
  from public, anon, authenticated;

drop trigger if exists on_auth_user_created_capture_legal_acceptances
  on auth.users;

create trigger on_auth_user_created_capture_legal_acceptances
  after insert on auth.users
  for each row execute function public.capture_registration_legal_acceptances();

commit;
