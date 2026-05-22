-- NutriTail initial schema draft

create table if not exists users (
  id uuid primary key,
  name text not null,
  email text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pets (
  id uuid primary key,
  owner_id uuid not null references users(id) on delete cascade,
  name text not null,
  species text not null,
  breed text not null,
  age numeric not null,
  weight numeric not null,
  activity_level text not null,
  neutered boolean not null default false,
  allergies jsonb not null default '[]'::jsonb,
  health_issues jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pet_analyses (
  id uuid primary key,
  pet_id uuid not null references pets(id) on delete cascade,
  rer numeric not null,
  der numeric not null,
  protein text not null,
  fat text not null,
  fiber text not null,
  sodium text not null,
  magnesium text not null,
  calcium text not null,
  phosphorus text not null,
  advice jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists foods (
  id uuid primary key,
  brand text not null,
  name text not null,
  species text not null,
  life_stage text not null,
  activity_support text not null,
  health_support jsonb not null default '[]'::jsonb,
  protein numeric not null,
  fat numeric not null,
  fiber numeric not null,
  sodium numeric not null,
  magnesium numeric not null,
  calcium numeric not null,
  phosphorus numeric not null,
  ingredients jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pet_recommendations (
  id uuid primary key,
  pet_id uuid not null references pets(id) on delete cascade,
  analysis_id uuid not null references pet_analyses(id) on delete cascade,
  food_id uuid not null references foods(id) on delete cascade,
  recommendation_score numeric not null,
  nutrition_score numeric not null,
  recommendation_reasons jsonb not null default '[]'::jsonb,
  nutrition_reasons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);