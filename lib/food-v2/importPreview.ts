import {
  createCanonicalFoodIdentity,
  ensureBrandInDisplayName,
  groupByCanonicalFormula,
  normalizeBrandlessFormulaName,
  normalizeCanonicalFormulaName,
} from "@/lib/food-v2/canonicalFood";
import {
  createFormulaKey,
  detectCarbohydrateSources,
  detectFatSources,
  detectFiberSources,
  detectPrimaryAnimalProteins,
  normalizeBrand,
  normalizeCommercialTags,
  normalizeDogSize,
  normalizeFoodFormat,
  normalizeFormulaName,
  normalizeIngredientText,
  normalizeLifeStage,
  normalizeMedicalTags,
  normalizeEnergyToKcalPer100g,
  normalizePercent,
  normalizeSpecies,
  splitIngredients,
} from "@/lib/food-v2/normalizeFood";
import { validateFoodImportRow } from "@/lib/food-v2/validateFood";
import { estimateKcalPer100gModifiedAtwater } from "@/lib/nutrition-v2/energyRules";
import type {
  DataQualityStatus,
  FoodFormat,
  FoodImportRowV2,
  FoodNutrientsV2,
  FoodProductV2,
  LifeStage,
  SourcePriority,
} from "@/types/food-v2";

export type FoodV2PreviewSummary = {
  totalRows: number;
  importableRows: number;
  blockedRows: number;
  averageCompleteness: number;
  labelEnergyRows: number;
  estimatedEnergyRows: number;
  labelAshRows: number;
  retailerRows: number;
  officialRows: number;
  missingFieldCounts: Record<string, number>;
  warningCounts: Record<string, number>;
  impossibleValueCount: number;
  conflictCount: number;
  canonicalDuplicateGroups: number;
  canonicalDuplicateRows: number;
};

export type FoodV2PreviewResult = {
  rows: FoodImportRowV2[];
  summary: FoodV2PreviewSummary;
};

const NUTRIENT_KEYS: Array<keyof FoodNutrientsV2> = [
  "protein_percent",
  "fat_percent",
  "fiber_percent",
  "ash_percent",
  "moisture_percent",
  "calcium_percent",
  "phosphorus_percent",
  "sodium_percent",
  "magnesium_percent",
  "potassium_percent",
  "omega3_percent",
  "omega6_percent",
  "dha_percent",
  "epa_percent",
  "epa_dha_percent",
  "taurine_mgkg",
  "l_carnitine_mgkg",
  "glucosamine_mgkg",
  "chondroitin_mgkg",
  "vitamin_a_iukg",
  "vitamin_d3_iukg",
  "vitamin_e_mgkg",
  "iron_mgkg",
  "zinc_mgkg",
  "copper_mgkg",
  "manganese_mgkg",
  "iodine_mgkg",
  "selenium_mgkg",
];

function cleanString(value: unknown) {
  return String(value ?? "").trim();
}

function nullIfEmpty(value: unknown) {
  const cleaned = cleanString(value);
  return cleaned || null;
}

function normalizeBoolean(value: unknown, fallback = true) {
  const text = cleanString(value).toLowerCase();
  if (!text) return fallback;
  if (["true", "yes", "1", "y"].includes(text)) return true;
  if (["false", "no", "0", "n"].includes(text)) return false;
  return fallback;
}

function normalizeDataQualityStatus(value: unknown): DataQualityStatus {
  const text = cleanString(value).toLowerCase();
  if (text === "verified") return "verified";
  if (text === "unknown") return "unknown";
  return "needs_review";
}

function normalizeSourcePriority(value: unknown): SourcePriority {
  const text = cleanString(value).toLowerCase();
  if (text === "official") return "official";
  if (text === "retailer") return "retailer";
  if (text === "manual_photo") return "manual_photo";
  return "unknown";
}

function parseStringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => cleanString(item)).filter(Boolean);
  }

  const text = cleanString(value);
  if (!text) return [];

  if (text.startsWith("[") && text.endsWith("]")) {
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed)
        ? parsed.map((item) => cleanString(item)).filter(Boolean)
        : [];
    } catch {
      return [];
    }
  }

  return text
    .split(/[|,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeLifeStageFromRowEvidence(
  raw: Record<string, unknown>,
  commercialTags: string[],
  medicalTags: string[]
): LifeStage {
  const declaredStage = normalizeLifeStage(raw.life_stage);
  const evidenceStage = normalizeLifeStage(
    [
      raw.formula_name,
      raw.display_name,
      raw.formula_key,
      ...commercialTags,
      ...medicalTags,
    ].join(" ")
  );

  if (["puppy", "kitten", "senior", "all_life_stages"].includes(declaredStage)) {
    return declaredStage;
  }

  if (
    ["puppy", "kitten", "senior", "all_life_stages"].includes(evidenceStage) &&
    ["adult", "unknown"].includes(declaredStage)
  ) {
    return evidenceStage;
  }

  return declaredStage;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      if (row.some((item) => item.trim())) rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((item) => item.trim())) rows.push(row);

  const [headers = [], ...bodyRows] = rows;
  return bodyRows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), values[index] ?? ""]))
  );
}

function buildNutrients(data: Record<string, unknown>) {
  const nutrients: FoodNutrientsV2 = {};

  for (const key of NUTRIENT_KEYS) {
    const rawValue = data[key];
    const value = key.endsWith("_percent")
      ? normalizePercent(rawValue)
      : rawValue === null || rawValue === undefined || rawValue === ""
        ? null
        : Number(String(rawValue).replace(",", "."));

    if (value !== null && Number.isFinite(value)) {
      nutrients[key] = value;
    }
  }

  return nutrients;
}

function mergeSourceNotes(
  existingNotes: string | null | undefined,
  additionalNote: string | null
) {
  const notes = [existingNotes, additionalNote]
    .filter(Boolean)
    .flatMap((note) => String(note).split(";"))
    .map((note) => note.trim())
    .filter(Boolean);

  return [...new Set(notes)].join("; ") || null;
}

function sourceNotesInclude(
  raw: Record<string, unknown>,
  token: string
) {
  return cleanString(raw.source_notes).includes(token);
}

function resolveFoodEnergy(
  raw: Record<string, unknown>,
  nutrients: FoodNutrientsV2,
  format: FoodFormat
) {
  const providedKcalPer100g =
    normalizeEnergyToKcalPer100g(raw.kcal_per_100g, "kcal/100g") ??
    normalizeEnergyToKcalPer100g(raw.kcal_per_kg, "kcal/kg");
  const providedKcalPerKg = normalizePercent(raw.kcal_per_kg);

  if (providedKcalPer100g !== null) {
    const estimated = sourceNotesInclude(raw, "kcal_estimated=true");
    const hasLabelNote = sourceNotesInclude(raw, "label_energy_used=true");
    return {
      kcal_per_100g: providedKcalPer100g,
      kcal_per_kg: providedKcalPerKg,
      source_note: estimated || hasLabelNote ? null : "label_energy_used=true",
    };
  }

  const estimate = estimateKcalPer100gModifiedAtwater({
    ...nutrients,
    format,
  });

  return {
    kcal_per_100g: estimate.kcal_per_100g,
    kcal_per_kg: estimate.kcal_per_kg,
    source_note: estimate.source_note,
  };
}

export function normalizeFoodV2RawRow(
  raw: Record<string, unknown>
): FoodImportRowV2 {
  const brand = normalizeBrand(raw.brand);
  const formulaName = normalizeBrandlessFormulaName({
    brand,
    formula_name: normalizeCanonicalFormulaName(normalizeFormulaName(raw.formula_name)),
  });
  const species = normalizeSpecies(raw.species);
  const format = normalizeFoodFormat(raw.format);
  const ingredientText = normalizeIngredientText(raw.ingredient_text);
  const ingredients =
    parseStringList(raw.ingredients).length > 0
      ? parseStringList(raw.ingredients)
      : splitIngredients(ingredientText);
  const medicalTags = [
    ...parseStringList(raw.medical_tags),
    ...normalizeMedicalTags(
      `${raw.formula_name ?? ""} ${raw.display_name ?? ""} ${raw.medical_tags ?? ""} ${raw.commercial_tags ?? ""}`
    ),
  ];
  const commercialTags = [
    ...parseStringList(raw.commercial_tags),
    ...normalizeCommercialTags(
      `${raw.formula_name ?? ""} ${raw.display_name ?? ""} ${raw.commercial_tags ?? ""} ${raw.ingredient_text ?? ""} ${raw.ingredients ?? ""}`
    ),
  ];
  const nutrients = buildNutrients(raw);
  const energy = resolveFoodEnergy(raw, nutrients, format);

  const lifeStage = normalizeLifeStageFromRowEvidence(raw, commercialTags, medicalTags);
  const dogSize = normalizeDogSize(raw.dog_size);
  const identity = createCanonicalFoodIdentity({
    brand,
    formula_name: formulaName,
    species,
    format,
    life_stage: lifeStage,
    dog_size: dogSize,
  });
  const formula_key =
    normalizeBoolean(raw.preserve_formula_key, false) &&
    cleanString(raw.formula_key)
      ? cleanString(raw.formula_key)
      : identity.canonical_formula_key ||
        createFormulaKey({
          brand,
          formula_name: formulaName,
          species,
          format,
        });

  const food: FoodProductV2 = {
    brand,
    formula_name: formulaName,
    display_name:
      ensureBrandInDisplayName({
        brand,
        display_name: cleanString(raw.display_name),
        formula_name: formulaName,
        life_stage: lifeStage,
        dog_size: dogSize,
      }) || identity.standard_display_name,
    species,
    format,
    life_stage: lifeStage,
    dog_size: dogSize,
    breed_target: nullIfEmpty(raw.breed_target),
    medical_tags: [...new Set(medicalTags)],
    commercial_tags: [...new Set(commercialTags)],
    ingredient_text: ingredientText,
    ingredients,
    primary_animal_proteins:
      parseStringList(raw.primary_animal_proteins).length > 0
        ? parseStringList(raw.primary_animal_proteins)
        : detectPrimaryAnimalProteins(ingredients),
    carbohydrate_sources:
      parseStringList(raw.carbohydrate_sources).length > 0
        ? parseStringList(raw.carbohydrate_sources)
        : detectCarbohydrateSources(ingredients),
    fat_sources:
      parseStringList(raw.fat_sources).length > 0
        ? parseStringList(raw.fat_sources)
        : detectFatSources(ingredients),
    fiber_sources:
      parseStringList(raw.fiber_sources).length > 0
        ? parseStringList(raw.fiber_sources)
        : detectFiberSources(ingredients),
    additives_text: nullIfEmpty(raw.additives_text),
    feeding_guide_text: nullIfEmpty(raw.feeding_guide_text),
    kcal_per_100g: energy.kcal_per_100g,
    kcal_per_kg: energy.kcal_per_kg,
    data_quality_status: normalizeDataQualityStatus(raw.data_quality_status),
    data_source_url: nullIfEmpty(raw.data_source_url),
    source_priority: normalizeSourcePriority(raw.source_priority),
    source_notes: mergeSourceNotes(nullIfEmpty(raw.source_notes), energy.source_note),
    formula_key,
    ean: nullIfEmpty(raw.ean),
    is_recommendable: normalizeBoolean(raw.is_recommendable),
  };
  const validation = validateFoodImportRow({ food, nutrients, raw });

  return {
    food,
    nutrients,
    raw,
    validation,
    canonical: identity,
  };
}

export function previewFoodV2Csv(text: string) {
  return summarizeFoodV2Preview(parseCsv(text).map(normalizeFoodV2RawRow));
}

export function previewFoodV2ManualRows(rows: unknown[]) {
  const normalizedRows = rows.map((row) => {
    const raw = row as Record<string, unknown>;
    if (raw.food && typeof raw.food === "object") {
      const food = raw.food as FoodProductV2;
      const nutrients = (raw.nutrients ?? {}) as FoodNutrientsV2;
      const validation = validateFoodImportRow({
        food,
        nutrients,
        raw,
      });

      return {
        food,
        nutrients,
        raw,
        validation,
        canonical: createCanonicalFoodIdentity(food),
      };
    }

    return normalizeFoodV2RawRow(raw);
  });

  return summarizeFoodV2Preview(normalizedRows);
}

export function summarizeFoodV2Preview(rows: FoodImportRowV2[]): FoodV2PreviewResult {
  const missingFieldCounts: Record<string, number> = {};
  const warningCounts: Record<string, number> = {};
  let impossibleValueCount = 0;
  let conflictCount = 0;
  let labelEnergyRows = 0;
  let estimatedEnergyRows = 0;
  let labelAshRows = 0;
  let retailerRows = 0;
  let officialRows = 0;
  const canonicalDuplicateGroups = groupByCanonicalFormula(
    rows,
    (row) => row.food
  );

  for (const row of rows) {
    const sourceNotes = row.food.source_notes ?? "";
    if (sourceNotes.includes("label_energy_used=true")) labelEnergyRows += 1;
    if (sourceNotes.includes("kcal_estimated=true")) estimatedEnergyRows += 1;
    if (sourceNotes.includes("label_ash_used=true")) labelAshRows += 1;
    if (row.food.source_priority === "retailer") retailerRows += 1;
    if (row.food.source_priority === "official") officialRows += 1;

    for (const field of row.validation.missing_fields) {
      missingFieldCounts[field] = (missingFieldCounts[field] ?? 0) + 1;
    }
    for (const warning of row.validation.warnings) {
      warningCounts[warning] = (warningCounts[warning] ?? 0) + 1;
    }
    for (const conflict of row.validation.conflicts) {
      warningCounts[conflict] = (warningCounts[conflict] ?? 0) + 1;
    }
    impossibleValueCount += row.validation.impossible_values.length;
    conflictCount += row.validation.conflicts.length;
  }

  const canonicalDuplicateKeys = new Set(
    canonicalDuplicateGroups.flatMap((group) =>
      group.rows.map((row) => row.food.formula_key)
    )
  );

  for (const row of rows) {
    if (!row.canonical) {
      row.canonical = createCanonicalFoodIdentity(row.food);
    }
    if (
      canonicalDuplicateKeys.has(row.food.formula_key) &&
      !row.validation.conflicts.includes("possible_canonical_duplicate")
    ) {
      row.validation.conflicts.push("possible_canonical_duplicate");
      row.validation.warnings.push("possible_canonical_duplicate");
      conflictCount += 1;
      warningCounts.possible_canonical_duplicate =
        (warningCounts.possible_canonical_duplicate ?? 0) + 1;
    }
  }

  const averageCompleteness =
    rows.length > 0
      ? Math.round(
          rows.reduce(
            (total, row) => total + row.validation.completeness_score,
            0
          ) / rows.length
        )
      : 0;

  return {
    rows,
    summary: {
      totalRows: rows.length,
      importableRows: rows.filter((row) => row.validation.is_importable).length,
      blockedRows: rows.filter((row) => !row.validation.is_importable).length,
      averageCompleteness,
      labelEnergyRows,
      estimatedEnergyRows,
      labelAshRows,
      retailerRows,
      officialRows,
      missingFieldCounts,
      warningCounts,
      impossibleValueCount,
      conflictCount,
      canonicalDuplicateGroups: canonicalDuplicateGroups.length,
      canonicalDuplicateRows: canonicalDuplicateKeys.size,
    },
  };
}
