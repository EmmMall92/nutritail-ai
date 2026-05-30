-- Recommendation visibility controls.
-- Run after the Food V2 schema exists. This does not remove any food rows; it
-- only controls whether a brand/formula is allowed in recommendation results.

alter table if exists foods
  add column if not exists is_recommendable boolean not null default true;

alter table if exists food_products_v2
  add column if not exists is_recommendable boolean not null default true;

create table if not exists food_brand_recommendation_controls (
  brand text primary key,
  is_recommendable boolean not null default true,
  notes text,
  updated_at timestamptz default now()
);

alter table food_brand_recommendation_controls enable row level security;

create index if not exists foods_is_recommendable_idx
  on foods (is_recommendable);

create index if not exists food_products_v2_is_recommendable_idx
  on food_products_v2 (is_recommendable);
