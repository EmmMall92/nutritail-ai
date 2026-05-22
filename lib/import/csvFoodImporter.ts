import type { Food } from "@/types/food";
import type {
  ImportPreviewResult,
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
  lifestage: "lifeStage",
  stage: "lifeStage",

  activitySupport: "activitySupport",
  activity: "activitySupport",

  healthSupport: "healthSupport",
  health: "healthSupport",

  protein: "protein",
  fat: "fat",
  fiber: "fiber",
  sodium: "sodium",
  magnesium: "magnesium",
  calcium: "calcium",
  phosphorus: "phosphorus",

  ingredients: "ingredients",
  tags: "tags",
};

function parseCsvLine(line: string): string[] {
  return line.split(",").map((cell) => cell.trim());
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
  if (!value.trim()) return [];

  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumber(value: string, fieldName: string): number {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
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
  const normalized = value.trim().toLowerCase();

  if (["young", "adult", "senior", "all"].includes(normalized)) {
    return normalized as "young" | "adult" | "senior" | "all";
  }

  if (normalized === "puppy" || normalized === "kitten") return "young";

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
    brand: row.brand.trim(),
    name: row.name.trim(),
    species: normalizeSpecies(row.species),
    lifeStage: normalizeLifeStage(row.lifeStage),
    activitySupport: normalizeActivitySupport(row.activitySupport),
    healthSupport: parseStringArray(row.healthSupport),
    protein: parseNumber(row.protein, "protein"),
    fat: parseNumber(row.fat, "fat"),
    fiber: parseNumber(row.fiber, "fiber"),
    sodium: parseNumber(row.sodium, "sodium"),
    magnesium: parseNumber(row.magnesium, "magnesium"),
    calcium: parseNumber(row.calcium, "calcium"),
    phosphorus: parseNumber(row.phosphorus, "phosphorus"),
    ingredients: parseStringArray(row.ingredients),
    tags: parseStringArray(row.tags),
  };
}

export function previewCsvFoods(csvText: string): ImportPreviewResult {
  const rows = parseCsvText(csvText);
  const foods: Food[] = [];
  const warnings: ImportWarning[] = [];
  const seenIds = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;

    try {
      const food = mapCsvRowToFood(row);

      if (seenIds.has(food.id)) {
        warnings.push({
          rowIndex: rowNumber,
          field: "id",
          message: `Duplicate id in file: ${food.id}`,
        });
      } else {
        seenIds.add(food.id);
      }

      if (food.healthSupport.length === 0) {
        warnings.push({
          rowIndex: rowNumber,
          field: "healthSupport",
          message: "No healthSupport values provided.",
        });
      }

      if (food.tags.length === 0) {
        warnings.push({
          rowIndex: rowNumber,
          field: "tags",
          message: "No tags provided.",
        });
      }

      foods.push(food);
    } catch (error) {
      warnings.push({
        rowIndex: rowNumber,
        field: "row",
        message:
          error instanceof Error ? error.message : "Unknown parsing error.",
      });
    }
  });

  return {
    foods,
    warnings,
  };
}

export function convertCsvToFoods(csvText: string): Food[] {
  const preview = previewCsvFoods(csvText);

  const duplicateWarnings = preview.warnings.filter(
    (warning) => warning.message.includes("Duplicate id")
  );

  if (duplicateWarnings.length > 0) {
    throw new Error(duplicateWarnings[0].message);
  }

  const rowErrors = preview.warnings.filter((warning) => warning.field === "row");
  if (rowErrors.length > 0) {
    throw new Error(rowErrors[0].message);
  }

  return preview.foods;
}