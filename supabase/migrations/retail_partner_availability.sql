-- Retail partner availability for the post-recommendation purchase step.
-- Listings are a commercial layer and must not affect nutrition ranking.

create table if not exists retail_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  channel text not null default 'online'
    check (channel in ('local_store', 'online', 'both')),
  city text,
  area text,
  postal_code text,
  address text,
  website_url text,
  phone text,
  contact_email text,
  subscription_status text not null default 'inactive'
    check (subscription_status in ('active', 'inactive', 'trial', 'expired')),
  subscription_started_at date,
  subscription_expires_at date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists retail_partner_product_availability (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references retail_partners(id) on delete cascade,
  food_product_id uuid not null references food_products_v2(id) on delete cascade,
  channel text not null default 'online'
    check (channel in ('local_store', 'online', 'both')),
  availability_status text not null default 'unknown'
    check (availability_status in ('in_stock', 'order_available', 'unknown')),
  product_url text,
  estimated_price_euro numeric,
  is_active boolean not null default true,
  is_sponsored boolean not null default false,
  display_priority integer not null default 100,
  last_verified_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (partner_id, food_product_id, channel)
);

alter table retail_partners enable row level security;
alter table retail_partner_product_availability enable row level security;

revoke all on table retail_partners from anon, authenticated;
revoke all on table retail_partner_product_availability from anon, authenticated;

grant select, insert, update, delete on table retail_partners to service_role;
grant select, insert, update, delete
  on table retail_partner_product_availability
  to service_role;

create index if not exists retail_partners_subscription_status_idx
  on retail_partners (subscription_status);

create index if not exists retail_partners_location_idx
  on retail_partners (city, area, postal_code);

create index if not exists retail_partner_product_availability_food_idx
  on retail_partner_product_availability (food_product_id);

create index if not exists retail_partner_product_availability_partner_idx
  on retail_partner_product_availability (partner_id);

create index if not exists retail_partner_product_availability_active_idx
  on retail_partner_product_availability (is_active, is_sponsored, display_priority);
