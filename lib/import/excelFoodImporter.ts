import * as XLSX from "xlsx";
import { parseImportFoods } from "@/lib/import/foodImportParser";
import type { Food } from "@/types/food";

function parseStringArrayCell(value: unknown): string[] {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  return value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumberCell(value: unknown, fieldName: string): number {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    throw new Error(`Field "${fieldName}" must be a valid number.`);
  }

  return parsed;
}

function normalizeHeaderKey(key: string): string {
  const cleaned = key.replace(/\s+/g, "").trim().toLowerCase();

  const aliases: Record<string, string> = {
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
    lifestage: "lifeStage",
    stage: "lifeStage",
    activity: "activitySupport",
    activitysupport: "activitySupport",
    health: "healthSupport",
    healthsupport: "healthSupport",
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

  return aliases[cleaned] ?? key;
}

export function convertExcelBufferToFoods(arrayBuffer: ArrayBuffer): Food[] {
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("Excel file does not contain any worksheet.");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
  });

  const normalizedRows = rows.map((row) => {
    const mapped: Record<string, unknown> = {};

    Object.entries(row).forEach(([key, value]) => {
      mapped[normalizeHeaderKey(key)] = value;
    });

    return {
      id: String(mapped.id ?? "").trim(),
      brand: String(mapped.brand ?? "").trim(),
      name: String(mapped.name ?? "").trim(),
      species: String(mapped.species ?? "").trim(),
      lifeStage: String(mapped.lifeStage ?? "").trim(),
      activitySupport: String(mapped.activitySupport ?? "").trim(),
      healthSupport: parseStringArrayCell(mapped.healthSupport),
      protein: parseNumberCell(mapped.protein, "protein"),
      fat: parseNumberCell(mapped.fat, "fat"),
      fiber: parseNumberCell(mapped.fiber, "fiber"),
      sodium: parseNumberCell(mapped.sodium, "sodium"),
      magnesium: parseNumberCell(mapped.magnesium, "magnesium"),
      calcium: parseNumberCell(mapped.calcium, "calcium"),
      phosphorus: parseNumberCell(mapped.phosphorus, "phosphorus"),
      ingredients: parseStringArrayCell(mapped.ingredients),
      tags: parseStringArrayCell(mapped.tags),
    };
  });

  return parseImportFoods(normalizedRows);
}