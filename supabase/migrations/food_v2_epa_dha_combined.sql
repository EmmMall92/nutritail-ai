-- Add support for labels that publish EPA+DHA as one combined value.
-- Keep separate epa_percent and dha_percent for sources that publish distinct values.

alter table if exists food_product_nutrients_v2
  add column if not exists epa_dha_percent numeric;
