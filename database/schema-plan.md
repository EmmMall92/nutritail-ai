# NutriTail Database Schema Plan

## users

- id (uuid, primary key)
- name (text)
- email (text, unique)
- created_at (timestamp)
- updated_at (timestamp)

## pets

- id (uuid, primary key)
- owner_id (uuid, foreign key -> users.id)
- name (text)
- species (text)
- breed (text)
- age (numeric)
- weight (numeric)
- activity_level (text)
- neutered (boolean)
- allergies (jsonb)
- health_issues (jsonb)
- created_at (timestamp)
- updated_at (timestamp)

## pet_analyses

- id (uuid, primary key)
- pet_id (uuid, foreign key -> pets.id)
- rer (numeric)
- der (numeric)
- protein (text)
- fat (text)
- fiber (text)
- sodium (text)
- magnesium (text)
- calcium (text)
- phosphorus (text)
- advice (jsonb)
- created_at (timestamp)

## foods

- id (uuid, primary key)
- brand (text)
- name (text)
- species (text)
- life_stage (text)
- activity_support (text)
- health_support (jsonb)
- protein (numeric)
- fat (numeric)
- fiber (numeric)
- sodium (numeric)
- magnesium (numeric)
- calcium (numeric)
- phosphorus (numeric)
- ingredients (jsonb)
- tags (jsonb)
- created_at (timestamp)
- updated_at (timestamp)

## pet_recommendations

- id (uuid, primary key)
- pet_id (uuid, foreign key -> pets.id)
- analysis_id (uuid, foreign key -> pet_analyses.id)
- food_id (uuid, foreign key -> foods.id)
- recommendation_score (numeric)
- nutrition_score (numeric)
- recommendation_reasons (jsonb)
- nutrition_reasons (jsonb)
- created_at (timestamp)