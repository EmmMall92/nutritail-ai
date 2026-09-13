-- Keep server-owned tables out of the Data API surface and optimize the only
-- direct authenticated profile policy. No application rows are modified.

begin;

revoke all on table public.customers from anon, authenticated, service_role;
revoke all on table public.food_brand_recommendation_controls from anon, authenticated, service_role;
revoke all on table public.food_import_audit_v2 from anon, authenticated, service_role;
revoke all on table public.food_product_nutrients_v2 from anon, authenticated, service_role;
revoke all on table public.food_product_sources_v2 from anon, authenticated, service_role;
revoke all on table public.food_products_v2 from anon, authenticated, service_role;
revoke all on table public.retail_partner_product_availability from anon, authenticated, service_role;
revoke all on table public.retail_partners from anon, authenticated, service_role;

grant select, insert, update, delete on table public.customers to service_role;
grant select, insert, update, delete on table public.food_brand_recommendation_controls to service_role;
grant select, insert, update, delete on table public.food_import_audit_v2 to service_role;
grant select, insert, update, delete on table public.food_product_nutrients_v2 to service_role;
grant select, insert, update, delete on table public.food_product_sources_v2 to service_role;
grant select, insert, update, delete on table public.food_products_v2 to service_role;
grant select, insert, update, delete on table public.retail_partner_product_availability to service_role;
grant select, insert, update, delete on table public.retail_partners to service_role;

revoke all on table public.profiles from anon, authenticated, service_role;
grant select on table public.profiles to authenticated;
grant select, insert, update, delete on table public.profiles to service_role;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

commit;
