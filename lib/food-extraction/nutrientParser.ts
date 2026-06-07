import { NUTRIENT_ALIASES } from "@/lib/food-extraction/dictionaries";

export type ExtractedNutrients = Partial<Record<keyof typeof NUTRIENT_ALIASES, number>>;

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/,/g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

function round(value: number, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function percentFromUnit(value: number, unitText: string) {
  const unit = normalizeText(unitText);
  if (unit.includes("mg/kg")) return round(value / 10000);
  if (unit.includes("g/kg")) return round(value / 10);
  return round(value);
}

function kcalFromUnit(value: number, unitText: string) {
  const unit = normalizeText(unitText);
  if (unit.includes("kcal/kg")) return { kcal_per_kg: value, kcal_per_100g: round(value / 10, 1) };
  if (unit.includes("kcal/100g")) return { kcal_per_100g: round(value, 1) };
  return {};
}

function aliasesPattern(aliases: string[]) {
  return aliases
    .map((alias) => normalizeText(alias).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
}

export function extractNutrientsFromText(text: string): ExtractedNutrients {
  const normalized = normalizeText(text);
  const nutrients: ExtractedNutrients = {};

  for (const [field, aliases] of Object.entries(NUTRIENT_ALIASES)) {
    const pattern = new RegExp(
      `(?:${aliasesPattern(aliases)})[^0-9]{0,40}(\\d+(?:\\.\\d+)?)\\s*(%|g/kg|mg/kg|kcal/kg|kcal/100g)?`,
      "i"
    );
    const match = normalized.match(pattern);

    if (!match) continue;

    const value = Number(match[1]);
    if (!Number.isFinite(value)) continue;

    const unit = match[2] ?? (field.startsWith("kcal") ? "kcal/kg" : "%");

    if (field === "kcal_per_kg" || field === "kcal_per_100g") {
      Object.assign(nutrients, kcalFromUnit(value, unit));
    } else {
      nutrients[field as keyof typeof NUTRIENT_ALIASES] = percentFromUnit(value, unit);
    }
  }

  return nutrients;
}
