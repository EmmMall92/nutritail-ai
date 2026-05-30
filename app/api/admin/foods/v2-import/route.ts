import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";
import { previewFoodV2ManualRows } from "@/lib/food-v2/importPreview";
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
];

function toProductPayload(food: FoodProductV2) {
  return Object.fromEntries(
    PRODUCT_COLUMNS.map((key) => [key, food[key] ?? null])
  );
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

    await writeAuditRows(preview.rows);

    for (const row of preview.rows) {
      if (!row.validation.is_importable) {
        results.push({
          formula_key: row.food.formula_key,
          display_name: row.food.display_name,
          success: false,
          action: "blocked",
          error: "Row is not importable.",
        });
        continue;
      }

      const { data: product, error: productError } = await supabaseAdmin
        .from("food_products_v2")
        .upsert(toProductPayload(row.food), { onConflict: "formula_key" })
        .select("id")
        .single();

      if (productError || !product?.id) {
        results.push({
          formula_key: row.food.formula_key,
          display_name: row.food.display_name,
          success: false,
          action: "failed",
          error: productError?.message ?? "Could not save product row.",
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
