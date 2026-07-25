import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  canonicalFoodBrand,
  sameCanonicalFoodBrand,
} from "../../lib/food-v2/brandIdentity";
import { normalizeBrand as normalizeFoodV2Brand } from "../../lib/food-v2/normalizeFood";
import { normalizeBrand as normalizeLegacyImportBrand } from "../../lib/import/foodNormalizer";

assert.equal(canonicalFoodBrand("Acana"), "ACANA");
assert.equal(canonicalFoodBrand("ACANA"), "ACANA");
assert.equal(canonicalFoodBrand("  Orijen  "), "ORIJEN");
assert.equal(canonicalFoodBrand("Royal Canine"), "Royal Canin");
assert.equal(canonicalFoodBrand("Monge VetSolution"), "Monge VetSolution");
assert.equal(
  canonicalFoodBrand("Monge BWild"),
  "Monge BWild",
  "Product families must not be collapsed without a dedicated product-line model."
);
assert.equal(sameCanonicalFoodBrand("Acana", "ACANA"), true);
assert.equal(sameCanonicalFoodBrand("Orijen", "ORIJEN"), true);
assert.equal(normalizeFoodV2Brand("Acana"), "ACANA");
assert.equal(normalizeFoodV2Brand("orijen"), "ORIJEN");
assert.equal(normalizeLegacyImportBrand("Acana"), "ACANA");
assert.equal(normalizeLegacyImportBrand("ORIJEN"), "ORIJEN");

async function main() {
  const migration = await readFile(
    path.join(
      process.cwd(),
      "supabase",
      "migrations",
      "canonical_food_v2_brand_casing.sql"
    ),
    "utf8"
  );

  assert.match(migration, /brand = 'ACANA'/);
  assert.match(migration, /brand = 'ORIJEN'/);
  assert.match(migration, /Monge BWild and Monge VetSolution remain distinct/);

  console.log(
    "Food V2 brand canonicalization QA passed: ACANA and ORIJEN casing is stable while product families remain distinct."
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
