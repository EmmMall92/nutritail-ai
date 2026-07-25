-- Canonical Food V2 brand casing.
-- Product lines such as Monge BWild and Monge VetSolution remain distinct
-- until Food V2 has a dedicated product-line field.

update food_products_v2
set
  brand = 'ACANA',
  updated_at = now()
where lower(trim(brand)) = 'acana'
  and brand <> 'ACANA';

update food_products_v2
set
  brand = 'ORIJEN',
  updated_at = now()
where lower(trim(brand)) = 'orijen'
  and brand <> 'ORIJEN';

insert into food_brand_recommendation_controls (
  brand,
  is_recommendable,
  notes,
  updated_at
)
select
  'ACANA',
  coalesce(bool_or(is_recommendable), true),
  'Canonical brand control migrated from case variants.',
  now()
from food_brand_recommendation_controls
where lower(trim(brand)) = 'acana'
on conflict (brand) do update
set
  is_recommendable = excluded.is_recommendable,
  notes = excluded.notes,
  updated_at = excluded.updated_at;

delete from food_brand_recommendation_controls
where lower(trim(brand)) = 'acana'
  and brand <> 'ACANA';

insert into food_brand_recommendation_controls (
  brand,
  is_recommendable,
  notes,
  updated_at
)
select
  'ORIJEN',
  coalesce(bool_or(is_recommendable), true),
  'Canonical brand control migrated from case variants.',
  now()
from food_brand_recommendation_controls
where lower(trim(brand)) = 'orijen'
on conflict (brand) do update
set
  is_recommendable = excluded.is_recommendable,
  notes = excluded.notes,
  updated_at = excluded.updated_at;

delete from food_brand_recommendation_controls
where lower(trim(brand)) = 'orijen'
  and brand <> 'ORIJEN';
