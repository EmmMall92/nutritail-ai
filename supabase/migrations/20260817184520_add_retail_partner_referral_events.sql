-- Privacy-minimized outbound referral measurement. Events intentionally do not
-- contain an Auth user, customer, pet, area, IP address, user agent, or chat data.

begin;

create table if not exists public.retail_partner_referral_events (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null
    references public.retail_partners(id) on delete cascade,
  availability_id uuid
    references public.retail_partner_product_availability(id) on delete set null,
  destination text not null check (
    destination in ('product', 'website', 'phone')
  ),
  source text not null default 'chatbot_purchase_options' check (
    source in ('chatbot_purchase_options')
  ),
  occurred_at timestamptz not null default now()
);

create index if not exists retail_partner_referral_partner_occurred_idx
  on public.retail_partner_referral_events (partner_id, occurred_at desc);

create index if not exists retail_partner_referral_availability_occurred_idx
  on public.retail_partner_referral_events (availability_id, occurred_at desc)
  where availability_id is not null;

alter table public.retail_partner_referral_events enable row level security;

revoke all on table public.retail_partner_referral_events
  from anon, authenticated, service_role;

grant select, insert, delete
  on table public.retail_partner_referral_events
  to service_role;

comment on table public.retail_partner_referral_events is
  'Anonymous, directional partner referral events. Never use as billing proof or store customer identifiers.';

create or replace view public.retail_partner_referral_metrics_30d
with (security_invoker = true)
as
select
  partner_id,
  count(*)::bigint as total_referrals,
  count(*) filter (where destination = 'product')::bigint as product_referrals,
  count(*) filter (where destination = 'website')::bigint as website_referrals,
  count(*) filter (where destination = 'phone')::bigint as phone_referrals,
  max(occurred_at) as last_referral_at
from public.retail_partner_referral_events
where occurred_at >= now() - interval '30 days'
group by partner_id;

revoke all on table public.retail_partner_referral_metrics_30d
  from anon, authenticated, service_role;

grant select on table public.retail_partner_referral_metrics_30d
  to service_role;

comment on view public.retail_partner_referral_metrics_30d is
  'Rolling 30-day anonymous referral totals for the partner admin workspace.';

create extension if not exists pg_cron with schema pg_catalog;

do $$
begin
  if not exists (
    select 1
    from cron.job
    where jobname = 'nutritail-partner-referral-retention-daily'
  ) then
    perform cron.schedule(
      'nutritail-partner-referral-retention-daily',
      '29 3 * * *',
      $retention$
        delete from public.retail_partner_referral_events
        where occurred_at < now() - interval '365 days';
      $retention$
    );
  end if;
end;
$$;

commit;
