import {
  normalizeBrand,
  normalizeDataQualityStatus,
  normalizeIngredients,
  normalizeLifeStage as normalizeDatasetLifeStage,
  normalizeNutritionValue,
  normalizeTags,
} from "@/lib/import/foodNormalizer";
import { validateFoodRow } from "@/lib/import/foodValidation";
import type { Food } from "@/types/food";
import type { RawFoodRow } from "@/types/food-dataset";
import type {
  ImportPreviewResult,
  ImportRowScore,
  ImportWarning,
} from "@/types/import-preview";

type CsvFoodRow = Record<string, string>;

const HEADER_ALIASES: Record<string, string> = {
  id: "id",
  code: "id",
  sku: "id",

  brand: "brand",
  manufacturer: "brand",

  name: "name",
  product: "name",
  productname: "name",

  species: "species",
  animal: "species",

  lifeStage: "lifeStage",
  life_stage: "lifeStage",
  lifestage: "lifeStage",
  stage: "lifeStage",

  activitySupport: "activitySupport",
  activity_support: "activitySupport",
  activity: "activitySupport",

  healthSupport: "healthSupport",
  health_support: "healthSupport",
  health: "healthSupport",

  protein: "protein",
  proteinPercent: "proteinPercent",
  protein_percent: "proteinPercent",
  fat: "fat",
  fatPercent: "fatPercent",
  fat_percent: "fatPercent",
  fiber: "fiber",
  fiberPercent: "fiberPercent",
  fiber_percent: "fiberPercent",
  sodium: "sodium",
  sodiumPercent: "sodiumPercent",
  sodium_percent: "sodiumPercent",
  magnesium: "magnesium",
  magnesiumPercent: "magnesiumPercent",
  magnesium_percent: "magnesiumPercent",
  calcium: "calcium",
  calciumPercent: "calciumPercent",
  calcium_percent: "calciumPercent",
  phosphorus: "phosphorus",
  phosphorusPercent: "phosphorusPercent",
  phosphorus_percent: "phosphorusPercent",
  kcal: "kcalPer100g",
  calories: "kcalPer100g",
  kcalPer100g: "kcalPer100g",
  kcal_per_100g: "kcalPer100g",

  ingredients: "ingredients",
  tags: "tags",
  size: "size",
  dataQualityStatus: "dataQualityStatus",
  data_quality_status: "dataQualityStatus",
  dataSourceUrl: "dataSourceUrl",
  data_source_url: "dataSourceUrl",
  source: "dataSourceUrl",
  dataNotes: "dataNotes",
  data_notes: "dataNotes",
  notes: "dataNotes",
};

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      currentCell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(currentCell.trim());
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  cells.push(currentCell.trim());
  return cells;
}

function normalizeHeader(header: string): string {
  const cleaned = header.replace(/\s+/g, "").trim();
  return HEADER_ALIASES[cleaned] ?? header.trim();
}

export function parseCsvText(csvText: string): CsvFoodRow[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV must contain a header row and at least one data row.");
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: CsvFoodRow = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    return row;
  });
}

function parseStringArray(value: string): string[] {
  return normalizeTags(value);
}

function parseNumber(value: string | undefined, fieldName: string): number {
  const parsed = normalizeNutritionValue(value);

  if (parsed === null) {
    throw new Error(`Field "${fieldName}" must be a valid number.`);
  }

  return parsed;
}

function normalizeSpecies(value: string): "dog" | "cat" {
  const normalized = value.trim().toLowerCase();

  if (normalized === "dog" || normalized === "cat") {
    return normalized;
  }

  throw new Error(`Invalid species value: ${value}`);
}

function normalizeLifeStage(
  value: string
): "young" | "adult" | "senior" | "all" {
  const normalized = normalizeDatasetLifeStage(value);

  if (normalized) {
    return normalized;
  }

  throw new Error(`Invalid lifeStage value: ${value}`);
}

function normalizeActivitySupport(
  value: string
): "low" | "normal" | "high" | "all" {
  const normalized = value.trim().toLowerCase();

  if (["low", "normal", "high", "all"].includes(normalized)) {
    return normalized as "low" | "normal" | "high" | "all";
  }

  throw new Error(`Invalid activitySupport value: ${value}`);
}

function optionalNumber(value: string | undefined): number | null {
  return normalizeNutritionValue(value);
}

function optionalString(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function csvRowToRawFoodRow(row: CsvFoodRow): RawFoodRow {
  return {
    id: row.id,
    brand: row.brand,
    name: row.name,
    species: row.species,
    lifeStage: row.lifeStage,
    size: row.size,
    tags: row.tags,
    ingredients: row.ingredients,
    kcalPer100g: row.kcalPer100g,
    proteinPercent: row.proteinPercent ?? row.protein,
    fatPercent: row.fatPercent ?? row.fat,
    fiberPercent: row.fiberPercent ?? row.fiber,
    sodiumPercent: row.sodiumPercent ?? row.sodium,
    magnesiumPercent: row.magnesiumPercent ?? row.magnesium,
    calciumPercent: row.calciumPercent ?? row.calcium,
    phosphorusPercent: row.phosphorusPercent ?? row.phosphorus,
    dataQualityStatus: row.dataQualityStatus,
    dataSourceUrl: row.dataSourceUrl,
    dataNotes: row.dataNotes,
  };
}

export function mapCsvRowToFood(row: CsvFoodRow): Food {
  if (!row.id?.trim()) {
    throw new Error("Missing required field: id");
  }

  if (!row.brand?.trim()) {
    throw new Error("Missing required field: brand");
  }

  if (!row.name?.trim()) {
    throw new Error("Missing required field: name");
  }

  return {
    id: row.id.trim(),
    brand: normalizeBrand(row.brand) ?? row.brand.trim(),
    name: row.name.trim(),
    species: normalizeSpecies(row.species),
    lifeStage: normalizeLifeStage(row.lifeStage),
    activitySupport: row.activitySupport?.trim()
      ? normalizeActivitySupport(row.activitySupport)
      : "all",
    healthSupport: parseStringArray(row.healthSupport),
    protein: parseNumber(row.proteinPercent ?? row.protein, "protein"),
    fat: parseNumber(row.fatPercent ?? row.fat, "fat"),
    fiber: parseNumber(row.fiberPercent ?? row.fiber, "fiber"),
    sodium: parseNumber(row.sodiumPercent ?? row.sodium, "sodium"),
    magnesium: parseNumber(row.magnesiumPercent ?? row.magnesium, "magnesium"),
    calcium: parseNumber(row.calciumPercent ?? row.calcium, "calcium"),
    phosphorus: parseNumber(
      row.phosphorusPercent ?? row.phosphorus,
      "phosphorus"
    ),
    ingredients: normalizeIngredients(row.ingredients),
    tags: parseStringArray(row.tags),
    kcalPer100g: optionalNumber(row.kcalPer100g),
    proteinPercent: optionalNumber(row.proteinPercent ?? row.protein),
    fatPercent: optionalNumber(row.fatPercent ?? row.fat),
    fiberPercent: optionalNumber(row.fiberPercent ?? row.fiber),
    sodiumPercent: optionalNumber(row.sodiumPercent ?? row.sodium),
    magnesiumPercent: optionalNumber(row.magnesiumPercent ?? row.magnesium),
    calciumPercent: optionalNumber(row.calciumPercent ?? row.calcium),
    phosphorusPercent: optionalNumber(row.phosphorusPercent ?? row.phosphorus),
    dataQualityStatus: normalizeDataQualityStatus(row.dataQualityStatus),
    dataSourceUrl: optionalString(row.dataSourceUrl),
    dataNotes: optionalString(row.dataNotes),
  };
}

export function previewCsvFoods(csvText: string): ImportPreviewResult {
  const rows = parseCsvText(csvText);
  const foods: Food[] = [];
  const warnings: ImportWarning[] = [];
  const rowScores: ImportRowScore[] = [];
  const seenIds = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const validation = validateFoodRow(csvRowToRawFoodRow(row));

    rowScores.push({
      rowIndex: rowNumber,
      id: validation.normalized.id,
      name: validation.normalized.name,
      completenessScore: validation.completenessScore,
      isValid: true,
    });

    validation.errors.forEach((error) => {
      const field = String(error.field);
      const isEnrichmentGap =
        error.message === "Missing critical field." &&
        ["kcal_per_100g", "data_source_url"].includes(field);
      const isNonDogRow = error.message === "Only dog food rows are supported.";

      warnings.push({
        rowIndex: rowNumber,
        field,
        message: error.message,
        severity: isEnrichmentGap || isNonDogRow ? "warning" : "error",
      });
    });

    validation.warnings.forEach((warning) => {
      warnings.push({
        rowIndex: rowNumber,
        field: String(warning.field),
        message: warning.message,
        severity: "warning",
      });
    });

    try {
      const food = mapCsvRowToFood(row);

      if (seenIds.has(food.id)) {
        warnings.push({
          rowIndex: rowNumber,
          field: "id",
          message: `Duplicate id in file: ${food.id}`,
          severity: "error",
        });
      } else {
        seenIds.add(food.id);
      }

      if (food.healthSupport.length === 0) {
        warnings.push({
          rowIndex: rowNumber,
          field: "healthSupport",
          message: "No healthSupport values provided.",
          severity: "warning",
        });
      }

      if (food.tags.length === 0) {
        warnings.push({
          rowIndex: rowNumber,
          field: "tags",
          message: "No tags provided.",
          severity: "warning",
        });
      }

      foods.push(food);
    } catch (error) {
      warnings.push({
        rowIndex: rowNumber,
        field: "row",
        message:
          error instanceof Error ? error.message : "Unknown parsing error.",
        severity: "error",
      });
    }
  });

  const invalidRows = new Set(
    warnings
      .filter((warning) => warning.severity === "error")
      .map((warning) => warning.rowIndex)
  );

  return {
    foods,
    warnings,
    rowScores: rowScores.map((score) => ({
      ...score,
      isValid: score.isValid && !invalidRows.has(score.rowIndex),
    })),
    validCount: rows.length - invalidRows.size,
    invalidCount: invalidRows.size,
  };
}

export function convertCsvToFoods(csvText: string): Food[] {
  const preview = previewCsvFoods(csvText);
  const blockingWarnings = preview.warnings.filter(
    (warning) => warning.severity === "error"
  );

  if (blockingWarnings.length > 0) {
    throw new Error(blockingWarnings[0].message);
  }

  return preview.foods;
}
