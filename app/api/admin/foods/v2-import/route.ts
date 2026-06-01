import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";
import { previewFoodV2ManualRows } from "@/lib/food-v2/importPreview";
import { validateFoodImportRow } from "@/lib/food-v2/validateFood";
import type {
  FoodImportRowV2,
  FoodNutrientsV2,
  FoodProductV2,
} from "@/types/food-v2";

type ImportResult = {
  formula_key: string;
  display_name: string;
  success: boolean;
  action: "inserted" | "updated" | "blocked" | "failed";
  error: string | null;
  merge_notes?: string[];
};

type ExistingFoodV2Row = {
  id: string;
  formula_key: string;
  kcal_per_100g: number | null;
  kcal_per_kg: number | null;
  source_priority: string | null;
  source_notes: string | null;
};

type ExistingFoodV2State = {
  product: ExistingFoodV2Row;
  nutrients: FoodNutrientsV2;
};

const PRODUCT_COLUMNS: Array<keyof FoodProductV2> = [
  "brand",
  "formula_name",
  "display_name",
  "species",
  "format",
  "life_stage",
  "dog_size",
  "breed_target",
  "medical_tags",
  "commercial_tags",
  "ingredient_text",
  "ingredients",
  "primary_animal_proteins",
  "carbohydrate_sources",
  "fat_sources",
  "fiber_sources",
  "additives_text",
  "feeding_guide_text",
  "kcal_per_100g",
  "kcal_per_kg",
  "data_quality_status",
  "data_source_url",
  "source_priority",
  "source_notes",
  "formula_key",
  "ean",
  "is_recommendable",
];

function toProductPayload(food: FoodProductV2) {
  return Object.fromEntries(
    PRODUCT_COLUMNS.map((key) => [
      key,
      key === "is_recommendable"
        ? food.is_recommendable !== false
        : food[key] ?? null,
    ])
  );
}

async function upsertProduct(food: FoodProductV2) {
  const payload = toProductPayload(food);
  const result = await supabaseAdmin
    .from("food_products_v2")
    .upsert(payload, { onConflict: "formula_key" })
    .select("id")
    .single();

  if (
    result.error?.message?.toLowerCase().includes("is_recommendable") &&
    "is_recommendable" in payload
  ) {
    const { is_recommendable: ignoredVisibility, ...legacyPayload } = payload;
    void ignoredVisibility;
    return supabaseAdmin
      .from("food_products_v2")
      .upsert(legacyPayload, { onConflict: "formula_key" })
      .select("id")
      .single();
  }

  return result;
}

function toNutrientsPayload(
  foodProductId: string,
  nutrients: FoodNutrientsV2
) {
  return {
    food_product_id: foodProductId,
    ...nutrients,
  };
}

function sourceTypeFor(row: FoodImportRowV2) {
  if (row.food.source_priority === "manual_photo") return "manual_photo";
  if (row.food.source_priority === "retailer") return "retailer";
  if (row.food.source_priority === "official") return "official_html";
  return "unknown";
}

async function writeAuditRows(rows: FoodImportRowV2[]) {
  if (rows.length === 0) return;

  const auditRows = rows.map((row) => ({
    formula_key: row.food.formula_key,
    importable: row.validation.is_importable,
    completeness_score: row.validation.completeness_score,
    missing_fields: row.validation.missing_fields,
    warnings: row.validation.warnings,
    impossible_values: row.validation.impossible_values,
    conflicts: row.validation.conflicts,
    raw_json: row.raw,
  }));

  const { error } = await supabaseAdmin
    .from("food_import_audit_v2")
    .insert(auditRows);

  if (error) throw error;
}

async function getExistingFormulaKeys(rows: FoodImportRowV2[]) {
  const formulaKeys = [
    ...new Set(rows.map((row) => row.food.formula_key).filter(Boolean)),
  ];

  if (formulaKeys.length === 0) return new Set<string>();

  const { data, error } = await supabaseAdmin
    .from("food_products_v2")
    .select("formula_key")
    .in("formula_key", formulaKeys);

  if (error) throw error;

  return new Set(
    ((data ?? []) as unknown as Array<{ formula_key: string }>).map(
      (row) => row.formula_key
    )
  );
}

function sourceRank(priority: string | null | undefined) {
  if (priority === "official") return 4;
  if (priority === "manual_photo") return 3;
  if (priority === "retailer") return 2;
  return 1;
}

function hasNote(notes: string | null | undefined, token: string) {
  return String(notes ?? "").includes(token);
}

function mergeNotes(...notes: Array<string | null | undefined>) {
  return [
    ...new Set(
      notes
        .flatMap((note) => String(note ?? "").split(";"))
        .map((note) => note.trim())
        .filter(Boolean)
    ),
  ].join("; ");
}

function hasEnergy(food: FoodImportRowV2["food"]) {
  return food.kcal_per_100g !== null || food.kcal_per_kg !== null;
}

function isEstimatedEnergy(food: FoodImportRowV2["food"]) {
  return hasNote(food.source_notes, "kcal_estimated=true");
}

function isLabelEnergy(food: FoodImportRowV2["food"]) {
  return hasEnergy(food) && !isEstimatedEnergy(food);
}

function isExistingLabelEnergy(existing: ExistingFoodV2Row) {
  const hasExistingEnergy =
    existing.kcal_per_100g !== null || existing.kcal_per_kg !== null;
  return hasExistingEnergy && !hasNote(existing.source_notes, "kcal_estimated=true");
}

async function getExistingFoodStates(rows: FoodImportRowV2[]) {
  const formulaKeys = [
    ...new Set(rows.map((row) => row.food.formula_key).filter(Boolean)),
  ];

  if (formulaKeys.length === 0) return new Map<string, ExistingFoodV2State>();

  const { data: products, error: productsError } = await supabaseAdmin
    .from("food_products_v2")
    .select(
      "id, formula_key, kcal_per_100g, kcal_per_kg, source_priority, source_notes"
    )
    .in("formula_key", formulaKeys);

  if (productsError) throw productsError;

  const typedProducts = (products ?? []) as unknown as ExistingFoodV2Row[];
  const productIds = typedProducts.map((product) => product.id);

  const nutrientsByProductId = new Map<string, FoodNutrientsV2>();
  if (productIds.length > 0) {
    const { data: nutrients, error: nutrientsError } = await supabaseAdmin
      .from("food_product_nutrients_v2")
      .select("*")
      .in("food_product_id", productIds);

    if (nutrientsError) throw nutrientsError;

    for (const nutrientRow of (nutrients ?? []) as Array<
      FoodNutrientsV2 & { food_product_id: string }
    >) {
      nutrientsByProductId.set(nutrientRow.food_product_id, nutrientRow);
    }
  }

  return new Map(
    typedProducts.map((product) => [
      product.formula_key,
      {
        product,
        nutrients: nutrientsByProductId.get(product.id) ?? {},
      },
    ])
  );
}

function applyExistingMergePolicy(
  row: FoodImportRowV2,
  existing: ExistingFoodV2State | undefined
) {
  const mergeNotesForResult: string[] = [];
  if (!existing) return mergeNotesForResult;

  const existingRank = sourceRank(existing.product.source_priority);
  const incomingRank = sourceRank(row.food.source_priority);

  if (isEstimatedEnergy(row.food) && isExistingLabelEnergy(existing.product)) {
    row.food.kcal_per_100g = existing.product.kcal_per_100g;
    row.food.kcal_per_kg = existing.product.kcal_per_kg;
    row.food.source_notes = mergeNotes(
      row.food.source_notes,
      "preserved_existing_label_energy_over_incoming_estimate=true"
    );
    mergeNotesForResult.push("preserved existing label kcal over incoming estimate");
  }

  if (
    isLabelEnergy(row.food) &&
    hasNote(existing.product.source_notes, "kcal_estimated=true")
  ) {
    row.food.source_notes = mergeNotes(
      row.food.source_notes,
      "replaced_existing_estimated_energy_with_label_energy=true"
    );
    mergeNotesForResult.push("replaced existing estimated kcal with label kcal");
  }

  if (
    incomingRank < existingRank &&
    !isLabelEnergy(row.food) &&
    isExistingLabelEnergy(existing.product)
  ) {
    row.food.kcal_per_100g = existing.product.kcal_per_100g;
    row.food.kcal_per_kg = existing.product.kcal_per_kg;
    row.food.source_notes = mergeNotes(
      row.food.source_notes,
      "preserved_higher_priority_existing_energy=true"
    );
    mergeNotesForResult.push("preserved higher-priority existing kcal");
  }

  const existingAsh = existing.nutrients.ash_percent;
  const incomingAsh = row.nutrients.ash_percent;
  const existingHasLabelAsh =
    existingAsh !== null &&
    existingAsh !== undefined &&
    hasNote(existing.product.source_notes, "label_ash_used=true");
  const incomingHasLabelAsh =
    incomingAsh !== null &&
    incomingAsh !== undefined &&
    hasNote(row.food.source_notes, "label_ash_used=true");

  if (
    (incomingAsh === null || incomingAsh === undefined || !incomingHasLabelAsh) &&
    existingHasLabelAsh
  ) {
    row.nutrients.ash_percent = existingAsh;
    row.food.source_notes = mergeNotes(
      row.food.source_notes,
      "preserved_existing_label_ash=true"
    );
    mergeNotesForResult.push("preserved existing label ash");
  }

  if (incomingHasLabelAsh && existingAsh !== null && existingAsh !== undefined) {
    row.food.source_notes = mergeNotes(
      row.food.source_notes,
      "incoming_label_ash_allowed_to_update_existing_value=true"
    );
  }

  return mergeNotesForResult;
}

export async function POST(request: Request) {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const body = await request.json();
    const rawRows = Array.isArray(body.rows) ? body.rows : [];

    if (rawRows.length === 0) {
      return NextResponse.json(
        { error: "No Food V2 rows provided." },
        { status: 400 }
      );
    }

    const preview = previewFoodV2ManualRows(rawRows);
    const results: ImportResult[] = [];
    const existingKeys = await getExistingFormulaKeys(preview.rows);
    const existingStates = await getExistingFoodStates(preview.rows);

    await writeAuditRows(preview.rows);

    for (const row of preview.rows) {
      const mergeNotesForResult = applyExistingMergePolicy(
        row,
        existingStates.get(row.food.formula_key)
      );
      row.validation = validateFoodImportRow(row);

      if (!row.validation.is_importable) {
        results.push({
          formula_key: row.food.formula_key,
          display_name: row.food.display_name,
          success: false,
          action: "blocked",
          error: "Row is not importable.",
          merge_notes: mergeNotesForResult,
        });
        continue;
      }

      const { data: product, error: productError } = await upsertProduct(
        row.food
      );

      if (productError || !product?.id) {
        results.push({
          formula_key: row.food.formula_key,
          display_name: row.food.display_name,
          success: false,
          action: "failed",
          error: productError?.message ?? "Could not save product row.",
          merge_notes: mergeNotesForResult,
        });
        continue;
      }

      const foodProductId = String(product.id);

      const { error: deleteNutrientsError } = await supabaseAdmin
        .from("food_product_nutrients_v2")
        .delete()
        .eq("food_product_id", foodProductId);

      if (deleteNutrientsError) {
        results.push({
          formula_key: row.food.formula_key,
          display_name: row.food.display_name,
          success: false,
          action: "failed",
          error: deleteNutrientsError.message,
          merge_notes: mergeNotesForResult,
        });
        continue;
      }

      const { error: nutrientsError } = await supabaseAdmin
        .from("food_product_nutrients_v2")
        .insert(toNutrientsPayload(foodProductId, row.nutrients));

      if (nutrientsError) {
        results.push({
          formula_key: row.food.formula_key,
          display_name: row.food.display_name,
          success: false,
          action: "failed",
          error: nutrientsError.message,
          merge_notes: mergeNotesForResult,
        });
        continue;
      }

      const { error: deleteSourcesError } = await supabaseAdmin
        .from("food_product_sources_v2")
        .delete()
        .eq("food_product_id", foodProductId);

      if (deleteSourcesError) {
        results.push({
          formula_key: row.food.formula_key,
          display_name: row.food.display_name,
          success: false,
          action: "failed",
          error: deleteSourcesError.message,
          merge_notes: mergeNotesForResult,
        });
        continue;
      }

      const { error: sourceError } = await supabaseAdmin
        .from("food_product_sources_v2")
        .insert({
          food_product_id: foodProductId,
          source_url: row.food.data_source_url,
          source_type: sourceTypeFor(row),
          source_priority: row.food.source_priority,
          raw_text: row.food.ingredient_text,
          raw_json: row.raw,
        });

      results.push({
        formula_key: row.food.formula_key,
        display_name: row.food.display_name,
        success: !sourceError,
        action: sourceError
          ? "failed"
          : existingKeys.has(row.food.formula_key)
            ? "updated"
            : "inserted",
        error: sourceError?.message ?? null,
        merge_notes: mergeNotesForResult,
      });
    }

    return NextResponse.json({
      success: results.every((result) => result.action !== "failed"),
      totalRows: preview.rows.length,
      importedRows: results.filter((result) => result.success).length,
      insertedRows: results.filter((result) => result.action === "inserted").length,
      updatedRows: results.filter((result) => result.action === "updated").length,
      skippedRows: results.filter((result) => result.action === "blocked").length,
      failedRows: results.filter((result) => result.action === "failed").length,
      auditRows: preview.rows.length,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to import Food V2 rows.",
      },
      { status: 500 }
    );
  }
}
