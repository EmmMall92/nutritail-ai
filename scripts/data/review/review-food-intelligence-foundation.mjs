import { readFile } from "node:fs/promises";

const files = {
  schema: "supabase/migrations/food_v2_schema.sql",
  template: "data/templates/nutritail-food-v2-template.csv",
  master: "data/imports/foods_master.csv",
  sourceRegistry: "data/sources/food_source_registry.csv",
  reviewQueue: "data/review/food_v2_review_queue.csv",
  extractionSources: "data/config/food_extraction_sources.json",
  qualityRules: "data/config/food_quality_rules.json",
  marketScope: "data/config/food_market_scope.json",
  ingredientDictionary: "data/dictionaries/ingredient_normalization.json",
  nutrientDictionary: "data/dictionaries/nutrient_normalization.json",
};

const requiredTemplateHeaders = [
  "brand",
  "formula_name",
  "display_name",
  "species",
  "format",
  "life_stage",
  "ingredient_text",
  "kcal_per_100g",
  "kcal_per_kg",
  "protein_percent",
  "fat_percent",
  "fiber_percent",
  "calcium_percent",
  "phosphorus_percent",
  "data_quality_status",
  "data_source_url",
  "source_priority",
  "source_notes",
  "formula_key",
];

const requiredReviewHeaders = [
  "queue_id",
  "formula_key",
  "brand",
  "formula_name",
  "species",
  "market",
  "issue_type",
  "field",
  "priority",
  "recommended_action",
  "source_url",
  "status",
];

const requiredSourceRegistryHeaders = [
  "brand",
  "source_domain",
  "market",
  "source_tier",
  "extraction_type",
  "parser_notes",
];

const requiredTables = [
  "food_products_v2",
  "food_product_nutrients_v2",
  "food_product_sources_v2",
  "food_import_audit_v2",
];

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function firstCsvLine(text) {
  return text.split(/\r?\n/).find((line) => line.trim().length > 0) ?? "";
}

function assert(condition, message, issues) {
  if (!condition) issues.push(message);
}

async function readText(path, issues) {
  try {
    return await readFile(path, "utf8");
  } catch {
    issues.push(`Missing required file: ${path}`);
    return "";
  }
}

async function readJson(path, issues) {
  const text = await readText(path, issues);
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    issues.push(`Invalid JSON: ${path}`);
    return null;
  }
}

function assertHeaders(label, actual, required, issues) {
  for (const header of required) {
    assert(actual.includes(header), `${label} is missing header ${header}.`, issues);
  }
}

async function main() {
  const issues = [];

  const schema = await readText(files.schema, issues);
  for (const table of requiredTables) {
    assert(schema.includes(table), `Food V2 schema is missing ${table}.`, issues);
  }

  const templateHeaders = parseCsvLine(firstCsvLine(await readText(files.template, issues)));
  const masterHeaders = parseCsvLine(firstCsvLine(await readText(files.master, issues)));
  assertHeaders("Food V2 template", templateHeaders, requiredTemplateHeaders, issues);
  assert(
    templateHeaders.join("|") === masterHeaders.join("|"),
    "foods_master.csv headers must match the Food V2 template exactly.",
    issues
  );

  const sourceRegistryText = await readText(files.sourceRegistry, issues);
  const sourceHeaders = parseCsvLine(firstCsvLine(sourceRegistryText));
  assertHeaders("Food source registry", sourceHeaders, requiredSourceRegistryHeaders, issues);
  assert(
    sourceRegistryText.split(/\r?\n/).filter((line) => line.trim()).length > 5,
    "Food source registry should include more than the header row.",
    issues
  );

  const reviewHeaders = parseCsvLine(firstCsvLine(await readText(files.reviewQueue, issues)));
  assertHeaders("Food V2 review queue", reviewHeaders, requiredReviewHeaders, issues);

  const extractionSources = await readJson(files.extractionSources, issues);
  const qualityRules = await readJson(files.qualityRules, issues);
  const marketScope = await readJson(files.marketScope, issues);
  const ingredientDictionary = await readJson(files.ingredientDictionary, issues);
  const nutrientDictionary = await readJson(files.nutrientDictionary, issues);

  assert(
    extractionSources?.accepted_source_types?.official_html &&
      extractionSources?.accepted_source_types?.pack_photo,
    "Extraction sources must define official_html and pack_photo.",
    issues
  );
  assert(
    Array.isArray(extractionSources?.source_notes_required_tokens) &&
      extractionSources.source_notes_required_tokens.includes("market=") &&
      extractionSources.source_notes_required_tokens.includes("basis=as-fed"),
    "Extraction sources must require market= and basis=as-fed source notes.",
    issues
  );
  assert(
    qualityRules?.production_merge_policy?.stage_before_merge === true,
    "Quality rules must keep stage-before-merge enabled.",
    issues
  );
  assert(
    marketScope?.canonical_row_grain === "formula",
    "Market scope must keep formula-level row grain.",
    issues
  );
  assert(
    ingredientDictionary?.categories?.named_animal_protein &&
      ingredientDictionary?.categories?.fiber_or_prebiotic &&
      ingredientDictionary?.aliases?.corn === "maize",
    "Ingredient dictionary must include core categories and corn->maize alias.",
    issues
  );

  for (const field of ["protein_percent", "fat_percent", "fiber_percent", "calcium_percent", "phosphorus_percent", "sodium_percent", "magnesium_percent"]) {
    assert(
      nutrientDictionary?.fields?.[field]?.aliases?.length > 0,
      `Nutrient dictionary is missing aliases for ${field}.`,
      issues
    );
  }

  if (issues.length > 0) {
    console.error("Food intelligence foundation review failed:");
    issues.forEach((issue) => console.error(`- ${issue}`));
    process.exitCode = 1;
    return;
  }

  console.log("Food intelligence foundation review passed.");
  console.log(`Template headers: ${templateHeaders.length}`);
  console.log(`Source registry rows: ${sourceRegistryText.split(/\r?\n/).filter((line) => line.trim()).length - 1}`);
  console.log(`Ingredient categories: ${Object.keys(ingredientDictionary.categories).length}`);
  console.log(`Nutrient fields: ${Object.keys(nutrientDictionary.fields).length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
