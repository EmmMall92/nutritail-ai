import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";

type ProductRow = {
  id: string;
  brand: string | null;
  species: string | null;
  format: string | null;
  data_quality_status: string | null;
  source_priority: string | null;
  source_notes: string | null;
  kcal_per_100g: number | null;
  kcal_per_kg: number | null;
  is_recommendable?: boolean | null;
  updated_at: string | null;
};

type NutrientRow = {
  food_product_id: string;
  protein_percent: number | null;
  fat_percent: number | null;
  fiber_percent: number | null;
  ash_percent: number | null;
  calcium_percent: number | null;
  phosphorus_percent: number | null;
  sodium_percent: number | null;
  magnesium_percent: number | null;
  omega3_percent: number | null;
  dha_percent: number | null;
  epa_percent: number | null;
  epa_dha_percent: number | null;
};

type AuditRow = {
  formula_key: string | null;
  importable: boolean | null;
  completeness_score: number | null;
  missing_fields: string[] | null;
  warnings: string[] | null;
  impossible_values: string[] | null;
  conflicts: string[] | null;
  created_at: string | null;
};

type BrandSummary = {
  brand: string;
  total_rows: number;
  recommendable_rows: number;
  estimated_kcal_rows: number;
  label_kcal_rows: number;
  missing_core_nutrient_rows: number;
  retailer_rows: number;
  official_rows: number;
};

const pageSize = 1000;

function hasValue(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function hasNote(notes: string | null | undefined, token: string) {
  return String(notes ?? "").includes(token);
}

function hasEnergy(product: ProductRow) {
  return product.kcal_per_100g !== null || product.kcal_per_kg !== null;
}

function isEstimatedEnergy(product: ProductRow) {
  return hasNote(product.source_notes, "kcal_estimated=true");
}

function hasCoreNutrients(nutrients: NutrientRow | undefined) {
  return Boolean(
    nutrients &&
      hasValue(nutrients.protein_percent) &&
      hasValue(nutrients.fat_percent) &&
      hasValue(nutrients.fiber_percent)
  );
}

function hasCalciumPhosphorus(nutrients: NutrientRow | undefined) {
  return Boolean(
    nutrients &&
      hasValue(nutrients.calcium_percent) &&
      hasValue(nutrients.phosphorus_percent)
  );
}

function hasEpaDha(nutrients: NutrientRow | undefined) {
  return Boolean(
    nutrients &&
      (hasValue(nutrients.epa_dha_percent) ||
        (hasValue(nutrients.epa_percent) && hasValue(nutrients.dha_percent)))
  );
}

async function fetchAll<T>(
  table: string,
  select: string,
  orderColumn = "created_at"
) {
  const rows: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await supabaseAdmin
      .from(table)
      .select(select)
      .order(orderColumn, { ascending: false })
      .range(from, to);

    if (error) throw error;

    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < pageSize) break;
  }

  return rows;
}

function summarizeBrands(
  products: ProductRow[],
  nutrientsByProductId: Map<string, NutrientRow>
) {
  const byBrand = new Map<string, BrandSummary>();

  for (const product of products) {
    const brand = product.brand || "Unknown";
    const current =
      byBrand.get(brand) ??
      ({
        brand,
        total_rows: 0,
        recommendable_rows: 0,
        estimated_kcal_rows: 0,
        label_kcal_rows: 0,
        missing_core_nutrient_rows: 0,
        retailer_rows: 0,
        official_rows: 0,
      } satisfies BrandSummary);

    current.total_rows += 1;
    if (product.is_recommendable) current.recommendable_rows += 1;
    if (hasEnergy(product) && isEstimatedEnergy(product)) {
      current.estimated_kcal_rows += 1;
    }
    if (hasEnergy(product) && !isEstimatedEnergy(product)) {
      current.label_kcal_rows += 1;
    }
    if (!hasCoreNutrients(nutrientsByProductId.get(product.id))) {
      current.missing_core_nutrient_rows += 1;
    }
    if (product.source_priority === "retailer") current.retailer_rows += 1;
    if (product.source_priority === "official") current.official_rows += 1;

    byBrand.set(brand, current);
  }

  return [...byBrand.values()].sort(
    (a, b) => b.total_rows - a.total_rows || a.brand.localeCompare(b.brand)
  );
}

function countAuditIssues(auditRows: AuditRow[]) {
  return auditRows.reduce(
    (acc, row) => {
      if (row.importable) acc.importable += 1;
      else acc.blocked += 1;
      acc.missing_fields += row.missing_fields?.length ?? 0;
      acc.warnings += row.warnings?.length ?? 0;
      acc.impossible_values += row.impossible_values?.length ?? 0;
      acc.conflicts += row.conflicts?.length ?? 0;
      return acc;
    },
    {
      importable: 0,
      blocked: 0,
      missing_fields: 0,
      warnings: 0,
      impossible_values: 0,
      conflicts: 0,
    }
  );
}

export async function GET() {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const [products, nutrients, auditRows] = await Promise.all([
      fetchAll<ProductRow>(
        "food_products_v2",
        [
          "id",
          "brand",
          "species",
          "format",
          "data_quality_status",
          "source_priority",
          "source_notes",
          "kcal_per_100g",
          "kcal_per_kg",
          "is_recommendable",
          "updated_at",
        ].join(","),
        "updated_at"
      ),
      fetchAll<NutrientRow>(
        "food_product_nutrients_v2",
        [
          "food_product_id",
          "protein_percent",
          "fat_percent",
          "fiber_percent",
          "ash_percent",
          "calcium_percent",
          "phosphorus_percent",
          "sodium_percent",
          "magnesium_percent",
          "omega3_percent",
          "dha_percent",
          "epa_percent",
          "epa_dha_percent",
        ].join(","),
        "created_at"
      ),
      fetchAll<AuditRow>(
        "food_import_audit_v2",
        [
          "formula_key",
          "importable",
          "completeness_score",
          "missing_fields",
          "warnings",
          "impossible_values",
          "conflicts",
          "created_at",
        ].join(","),
        "created_at"
      ),
    ]);

    const nutrientsByProductId = new Map(
      nutrients.map((row) => [row.food_product_id, row])
    );
    const productsWithEnergy = products.filter(hasEnergy);
    const productsWithEstimatedEnergy = products.filter(
      (product) => hasEnergy(product) && isEstimatedEnergy(product)
    );
    const productsWithLabelEnergy = products.filter(
      (product) => hasEnergy(product) && !isEstimatedEnergy(product)
    );
    const productsWithCoreNutrients = products.filter((product) =>
      hasCoreNutrients(nutrientsByProductId.get(product.id))
    );
    const productsWithCalciumPhosphorus = products.filter((product) =>
      hasCalciumPhosphorus(nutrientsByProductId.get(product.id))
    );
    const productsWithEpaDha = products.filter((product) =>
      hasEpaDha(nutrientsByProductId.get(product.id))
    );
    const auditIssueCounts = countAuditIssues(auditRows.slice(0, 500));

    return NextResponse.json(
      {
        generated_at: new Date().toISOString(),
        totals: {
          products: products.length,
          nutrients: nutrients.length,
          audit_rows: auditRows.length,
          recommendable_products: products.filter(
            (product) => product.is_recommendable
          ).length,
          needs_review_products: products.filter(
            (product) => product.data_quality_status === "needs_review"
          ).length,
          retailer_products: products.filter(
            (product) => product.source_priority === "retailer"
          ).length,
          official_products: products.filter(
            (product) => product.source_priority === "official"
          ).length,
          products_with_energy: productsWithEnergy.length,
          products_with_label_energy: productsWithLabelEnergy.length,
          products_with_estimated_energy: productsWithEstimatedEnergy.length,
          products_with_core_nutrients: productsWithCoreNutrients.length,
          products_with_calcium_phosphorus: productsWithCalciumPhosphorus.length,
          products_with_epa_dha: productsWithEpaDha.length,
        },
        recent_audit: {
          rows_checked: Math.min(auditRows.length, 500),
          ...auditIssueCounts,
          latest_created_at: auditRows[0]?.created_at ?? null,
        },
        brand_summaries: summarizeBrands(products, nutrientsByProductId).slice(
          0,
          50
        ),
        qa_flags: {
          missing_nutrient_rows: products.length - nutrients.length,
          missing_energy_rows: products.length - productsWithEnergy.length,
          estimated_energy_rows: productsWithEstimatedEnergy.length,
          non_recommendable_rows: products.filter(
            (product) => product.is_recommendable === false
          ).length,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to build Food V2 post-import QA report.",
      },
      { status: 500 }
    );
  }
}
