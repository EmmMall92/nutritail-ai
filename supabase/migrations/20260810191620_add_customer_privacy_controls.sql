-- Store only optional privacy choices and their audit trail. Both tables are
-- server-only and are removed automatically when the Auth user is deleted.

begin;

create table if not exists public.customer_privacy_preferences (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  policy_version text not null,
  product_analytics_enabled boolean not null default false,
  partner_offers_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_consent_events (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (
    category in ('product_analytics', 'partner_offers')
  ),
  granted boolean not null,
  policy_version text not null,
  source text not null default 'account_privacy_center' check (
    source in ('account_privacy_center', 'account_creation', 'admin_import')
  ),
  created_at timestamptz not null default now()
);

create index if not exists customer_consent_events_user_created_idx
  on public.customer_consent_events (auth_user_id, created_at desc);

alter table public.customer_privacy_preferences enable row level security;
alter table public.customer_consent_events enable row level security;

revoke all on table public.customer_privacy_preferences
  from anon, authenticated, service_role;
revoke all on table public.customer_consent_events
  from anon, authenticated, service_role;

grant select, insert, update, delete
  on table public.customer_privacy_preferences
  to service_role;
grant select, insert, update, delete
  on table public.customer_consent_events
  to service_role;

comment on table public.customer_privacy_preferences is
  'Current optional privacy choices for a Nutritail account.';
comment on table public.customer_consent_events is
  'Append-only consent and withdrawal history; deleted with the Auth account.';

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'nutritail-privacy-retention-daily',
  '17 3 * * *',
  $retention$
    delete from public.admin_activity_logs
    where (
      entity_type = 'runtime_monitoring'
      and created_at < now() - interval '90 days'
    ) or (
      entity_type = 'chatbot_feedback'
      and created_at < now() - interval '365 days'
    );
  $retention$
);

commit;
