import { extractNutrientsFromText } from "@/lib/food-extraction/nutrientParser";
import {
  generateHealthTags,
  generateIngredientTags,
  generateMedicalTags,
} from "@/lib/food-extraction/tagGenerators";

export type FoodExtractionInput = {
  brand?: string;
  productName?: string;
  species?: "dog" | "cat";
  format?: "dry" | "wet" | "treat" | "supplement";
  sourceUrl?: string;
  text: string;
};

export function createFoodsMasterRow(input: FoodExtractionInput) {
  const nutrients = extractNutrientsFromText(input.text);
  const ingredientTags = generateIngredientTags(input.text);
  const healthTags = generateHealthTags(input.text);
  const medicalTags = generateMedicalTags(input.text);

  return {
    brand: input.brand ?? "",
    display_name: input.productName ?? "",
    species: input.species ?? "",
    format: input.format ?? "dry",
    ingredient_tags: ingredientTags.join("|"),
    health_tags: healthTags.join("|"),
    medical_tags: medicalTags.join("|"),
    protein_percent: nutrients.protein_percent ?? "",
    fat_percent: nutrients.fat_percent ?? "",
    fiber_percent: nutrients.fiber_percent ?? "",
    ash_percent: nutrients.ash_percent ?? "",
    moisture_percent: nutrients.moisture_percent ?? "",
    calcium_percent: nutrients.calcium_percent ?? "",
    phosphorus_percent: nutrients.phosphorus_percent ?? "",
    magnesium_percent: nutrients.magnesium_percent ?? "",
    sodium_percent: nutrients.sodium_percent ?? "",
    potassium_percent: nutrients.potassium_percent ?? "",
    omega3_percent: nutrients.omega3_percent ?? "",
    omega6_percent: nutrients.omega6_percent ?? "",
    epa_percent: nutrients.epa_percent ?? "",
    dha_percent: nutrients.dha_percent ?? "",
    kcal_per_kg: nutrients.kcal_per_kg ?? "",
    kcal_per_100g: nutrients.kcal_per_100g ?? "",
    data_source_url: input.sourceUrl ?? "",
    data_quality_status: "needs_review",
  };
}

export function foodsMasterCsvHeaders() {
  return Object.keys(createFoodsMasterRow({ text: "" }));
}
