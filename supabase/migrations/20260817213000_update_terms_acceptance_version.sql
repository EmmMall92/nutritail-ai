-- Capture registration acceptance for the medical-boundary Terms revision.
-- Existing acceptance rows remain unchanged and account reacceptance is
-- recorded by the authenticated server route.

begin;

create or replace function public.capture_registration_legal_acceptances()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_user_meta_data ->> 'terms_accepted' = 'true'
    and new.raw_user_meta_data ->> 'terms_version' = '2026-08-17.2'
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
      '2026-08-17.2',
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

commit;
