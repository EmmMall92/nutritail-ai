import { normalizeFoodV2RawRow } from "@/lib/food-v2/importPreview";

const cases = [
  {
    label: "visible puppy title overrides stale adult life stage",
    raw: {
      brand: "Club 4 Paws",
      formula_name: "Puppies All Breeds Chicken",
      display_name: "Club 4 Paws Puppies All Breeds Chicken",
      species: "dog",
      format: "dry",
      life_stage: "adult",
      protein_percent: "30",
      fat_percent: "15",
      fiber_percent: "2.5",
      ingredient_text: "chicken, rice",
      data_source_url: "https://example.test/puppy",
      source_priority: "retailer",
    },
    expected: "puppy",
  },
  {
    label: "visible kitten title overrides stale adult life stage",
    raw: {
      brand: "LeChat",
      formula_name: "Kitten Chicken",
      display_name: "LeChat Kitten Chicken",
      species: "cat",
      format: "dry",
      life_stage: "adult",
      protein_percent: "34",
      fat_percent: "18",
      fiber_percent: "2",
      ingredient_text: "chicken, rice",
      data_source_url: "https://example.test/kitten",
      source_priority: "retailer",
    },
    expected: "kitten",
  },
  {
    label: "declared all life stages is preserved",
    raw: {
      brand: "Acana",
      formula_name: "All Life Stages Adult Dog",
      display_name: "Acana All Life Stages Adult Dog",
      species: "dog",
      format: "dry",
      life_stage: "all_life_stages",
      protein_percent: "31",
      fat_percent: "17",
      fiber_percent: "5",
      ingredient_text: "chicken, fish, lentils",
      data_source_url: "https://example.test/all-life",
      source_priority: "official",
    },
    expected: "all_life_stages",
  },
  {
    label: "declared puppy is not weakened by adult text",
    raw: {
      brand: "Royal Canin",
      formula_name: "Puppy Large Breed Adult Weight Guide",
      display_name: "Royal Canin Puppy Large Breed Adult Weight Guide",
      species: "dog",
      format: "dry",
      life_stage: "puppy",
      protein_percent: "32",
      fat_percent: "14",
      fiber_percent: "1.8",
      ingredient_text: "poultry protein, rice",
      data_source_url: "https://example.test/puppy-large",
      source_priority: "official",
    },
    expected: "puppy",
  },
] as const;

const failures = cases.flatMap((testCase) => {
  const normalized = normalizeFoodV2RawRow(testCase.raw);
  const actual = normalized.food.life_stage;

  if (actual !== testCase.expected) {
    return [`${testCase.label}: expected ${testCase.expected}, got ${actual}`];
  }

  return [];
});

if (failures.length > 0) {
  console.error("Food V2 import life-stage normalization QA failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Food V2 import life-stage normalization QA passed.");
