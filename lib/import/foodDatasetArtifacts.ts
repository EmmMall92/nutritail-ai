import type {
  FoodMissingPhotoQueueRow,
  FoodPhotoManifestRow,
  FoodSkuMapRow,
  NormalizedFoodRow,
} from "@/types/food-dataset";

export const FOOD_IMPORT_COLUMNS = [
  "brand",
  "name",
  "species",
  "life_stage",
  "size",
  "tags",
  "ingredients",
  "kcal_per_100g",
  "protein_percent",
  "fat_percent",
  "fiber_percent",
  "sodium_percent",
  "magnesium_percent",
  "calcium_percent",
  "phosphorus_percent",
  "data_quality_status",
  "data_source_url",
  "data_notes",
] as const;

export const FOOD_SKU_MAP_COLUMNS = [
  "formula_key",
  "brand",
  "name",
  "species",
  "market",
  "pack_size",
  "barcode",
  "source_url",
  "evidence_photo_path",
  "notes",
] as const;

export const FOOD_MISSING_PHOTO_QUEUE_COLUMNS = [
  "formula_key",
  "brand",
  "name",
  "species",
  "market",
  "missing_fields",
  "data_source_url",
  "priority",
  "notes",
] as const;

export const FOOD_PHOTO_MANIFEST_COLUMNS = [
  "formula_key",
  "brand_guess",
  "name_guess",
  "species_guess",
  "market",
  "pack_size",
  "barcode",
  "front_photo",
  "ingredients_photo",
  "analysis_photo",
  "calorie_photo",
  "notes",
] as const;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";

  const raw = Array.isArray(value) ? JSON.stringify(value) : String(value);
  const escaped = raw.replace(/"/g, '""');

  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

function rowsToCsv<T extends Record<string, unknown>>(
  columns: readonly string[],
  rows: T[]
): string {
  const header = columns.join(",");
  const body = rows.map((row) =>
    columns.map((column) => csvCell(row[column])).join(",")
  );

  return [header, ...body].join("\n");
}

export function buildFormulaKey(input: {
  brand: string;
  name: string;
  species: string;
  market: string;
}): string {
  return slugify(`${input.brand}-${input.name}-${input.species}-${input.market}`);
}

export function extractMarketFromNotes(dataNotes: string | null): string {
  const market = dataNotes?.match(/(?:^|;\s*)market=([^;]+)/)?.[1]?.trim();
  return market || "EUUK";
}

export function foodsToImportCsv(rows: NormalizedFoodRow[]): string {
  return rowsToCsv(
    FOOD_IMPORT_COLUMNS,
    rows.map((row) => ({
      brand: row.brand,
      name: row.name,
      species: row.species,
      life_stage: row.life_stage,
      size: row.size,
      tags: row.tags,
      ingredients: row.ingredients,
      kcal_per_100g: row.kcal_per_100g,
      protein_percent: row.protein_percent,
      fat_percent: row.fat_percent,
      fiber_percent: row.fiber_percent,
      sodium_percent: row.sodium_percent,
      magnesium_percent: row.magnesium_percent,
      calcium_percent: row.calcium_percent,
      phosphorus_percent: row.phosphorus_percent,
      data_quality_status: row.data_quality_status,
      data_source_url: row.data_source_url,
      data_notes: row.data_notes,
    }))
  );
}

export function skuMapToCsv(rows: FoodSkuMapRow[]): string {
  return rowsToCsv(FOOD_SKU_MAP_COLUMNS, rows as unknown as Record<string, unknown>[]);
}

export function missingPhotoQueueToCsv(
  rows: FoodMissingPhotoQueueRow[]
): string {
  return rowsToCsv(
    FOOD_MISSING_PHOTO_QUEUE_COLUMNS,
    rows as unknown as Record<string, unknown>[]
  );
}

export function photoManifestToCsv(rows: FoodPhotoManifestRow[]): string {
  return rowsToCsv(
    FOOD_PHOTO_MANIFEST_COLUMNS,
    rows as unknown as Record<string, unknown>[]
  );
}

export function createMissingPhotoQueueRows(
  rows: NormalizedFoodRow[]
): FoodMissingPhotoQueueRow[] {
  return rows.flatMap((row) => {
    if (!row.brand || !row.name || !row.species) return [];

    const missingFields = [
      ["kcal_per_100g", row.kcal_per_100g],
      ["sodium_percent", row.sodium_percent],
      ["magnesium_percent", row.magnesium_percent],
      ["data_source_url", row.data_source_url],
    ]
      .filter(([, value]) => value === null || value === undefined || value === "")
      .map(([field]) => String(field));

    if (missingFields.length === 0) return [];

    const market = extractMarketFromNotes(row.data_notes);

    return [
      {
        formula_key: buildFormulaKey({
          brand: row.brand,
          name: row.name,
          species: row.species,
          market,
        }),
        brand: row.brand,
        name: row.name,
        species: row.species,
        market,
        missing_fields: missingFields,
        data_source_url: row.data_source_url,
        priority: missingFields.includes("kcal_per_100g") ? "high" : "medium",
        notes: row.data_notes,
      },
    ];
  });
}
