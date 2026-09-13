-- Harden legacy public tables without changing or deleting application data.
-- Server routes use the service role; only the safe legacy food catalog remains
-- readable through publishable/anon clients.

begin;

alter table public.users enable row level security;
alter table public.pets enable row level security;
alter table public.foods enable row level security;
alter table public.pet_analyses enable row level security;
alter table public.admin_activity_logs enable row level security;
alter table public.admin_duplicate_reviews enable row level security;

revoke all on table public.users from anon, authenticated, service_role;
revoke all on table public.pets from anon, authenticated, service_role;
revoke all on table public.foods from anon, authenticated, service_role;
revoke all on table public.pet_analyses from anon, authenticated, service_role;
revoke all on table public.admin_activity_logs from anon, authenticated, service_role;
revoke all on table public.admin_duplicate_reviews from anon, authenticated, service_role;

grant select, insert, update, delete on table public.users to service_role;
grant select, insert, update, delete on table public.pets to service_role;
grant select, insert, update, delete on table public.foods to service_role;
grant select, insert, update, delete on table public.pet_analyses to service_role;
grant select, insert, update, delete on table public.admin_activity_logs to service_role;
grant select, insert, update, delete on table public.admin_duplicate_reviews to service_role;

grant select on table public.foods to anon, authenticated;

drop policy if exists "Public can read recommendable legacy foods" on public.foods;
create policy "Public can read recommendable legacy foods"
on public.foods
for select
to anon, authenticated
using (
  deleted_at is null
  and is_recommendable is true
  and data_quality_status in ('partial', 'verified')
);

commit;
