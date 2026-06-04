-- Nutritail food v2 future schema.
-- Do not auto-run this migration until the admin v2 importer and review flow are ready.

create table if not exists food_products_v2 (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  formula_name text not null,
  display_name text not null,
  species text not null,
  format text not null default 'dry',
  life_stage text not null default 'unknown',
  dog_size text,
  breed_target text,
  medical_tags text[] default '{}',
  commercial_tags text[] default '{}',
  ingredient_text text,
  ingredients text[] default '{}',
  primary_animal_proteins text[] default '{}',
  carbohydrate_sources text[] default '{}',
  fat_sources text[] default '{}',
  fiber_sources text[] default '{}',
  additives_text text,
  feeding_guide_text text,
  kcal_per_100g numeric,
  kcal_per_kg numeric,
  data_quality_status text not null default 'needs_review',
  data_source_url text,
  source_priority text not null default 'unknown',
  source_notes text,
  formula_key text not null unique,
  ean text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists food_product_nutrients_v2 (
  id uuid primary key default gen_random_uuid(),
  food_product_id uuid references food_products_v2(id) on delete cascade,
  protein_percent numeric,
  fat_percent numeric,
  fiber_percent numeric,
  ash_percent numeric,
  moisture_percent numeric,
  calcium_percent numeric,
  phosphorus_percent numeric,
  sodium_percent numeric,
  magnesium_percent numeric,
  potassium_percent numeric,
  omega3_percent numeric,
  omega6_percent numeric,
  dha_percent numeric,
  epa_percent numeric,
  epa_dha_percent numeric,
  taurine_mgkg numeric,
  l_carnitine_mgkg numeric,
  glucosamine_mgkg numeric,
  chondroitin_mgkg numeric,
  vitamin_a_iukg numeric,
  vitamin_d3_iukg numeric,
  vitamin_e_mgkg numeric,
  iron_mgkg numeric,
  zinc_mgkg numeric,
  copper_mgkg numeric,
  manganese_mgkg numeric,
  iodine_mgkg numeric,
  selenium_mgkg numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists food_product_sources_v2 (
  id uuid primary key default gen_random_uuid(),
  food_product_id uuid references food_products_v2(id) on delete cascade,
  source_url text,
  source_type text,
  source_priority text,
  raw_text text,
  raw_json jsonb,
  extracted_at timestamptz default now()
);

create table if not exists food_import_audit_v2 (
  id uuid primary key default gen_random_uuid(),
  formula_key text,
  importable boolean,
  completeness_score integer,
  missing_fields text[] default '{}',
  warnings text[] default '{}',
  impossible_values text[] default '{}',
  conflicts text[] default '{}',
  raw_json jsonb,
  created_at timestamptz default now()
);

create index if not exists food_products_v2_brand_idx on food_products_v2 (brand);
create index if not exists food_products_v2_species_idx on food_products_v2 (species);
create index if not exists food_products_v2_format_idx on food_products_v2 (format);
create index if not exists food_products_v2_life_stage_idx on food_products_v2 (life_stage);
create index if not exists food_products_v2_dog_size_idx on food_products_v2 (dog_size);
create index if not exists food_products_v2_medical_tags_gin_idx on food_products_v2 using gin (medical_tags);
create index if not exists food_products_v2_commercial_tags_gin_idx on food_products_v2 using gin (commercial_tags);
create unique index if not exists food_products_v2_formula_key_uidx on food_products_v2 (formula_key);
