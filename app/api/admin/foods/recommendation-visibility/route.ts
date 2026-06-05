import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";

type Catalog = "foods" | "food_v2";

type SafetyAuditRow = {
  formula_key: string;
  recommendation_status: string;
  risk_level: string;
  gap_priority: string;
  gap_score: number | null;
  missing_blockers: string[];
  estimated_fields_to_replace: string[];
  health_context: string[];
  recommendation_reason: string;
  required_before_enable: string;
};

const safetyAuditPath = path.join(
  process.cwd(),
  "data",
  "review",
  "food_v2_recommendation_safety_audit.csv"
);

function tableForCatalog(catalog: Catalog) {
  return catalog === "food_v2" ? "food_products_v2" : "foods";
}

function nameColumnForCatalog(catalog: Catalog) {
  return catalog === "food_v2" ? "display_name" : "name";
}

function normalizeCatalog(value: unknown): Catalog {
  return value === "food_v2" ? "food_v2" : "foods";
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
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
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += char;
  }

  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);

  const headers = (rows[0] ?? []).map((header) =>
    header.replace(/^\uFEFF/u, "").trim()
  );
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
  );
}

function splitList(value: unknown) {
  return String(value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function readSafetyAuditRows() {
  try {
    const rows = parseCsv(await readFile(safetyAuditPath, "utf8"));
    return new Map(
      rows.map((row) => {
        const safetyRow: SafetyAuditRow = {
          formula_key: String(row.formula_key ?? ""),
          recommendation_status: String(row.recommendation_status ?? ""),
          risk_level: String(row.risk_level ?? ""),
          gap_priority: String(row.gap_priority ?? ""),
          gap_score: Number.isFinite(Number(row.gap_score))
            ? Number(row.gap_score)
            : null,
          missing_blockers: splitList(row.missing_blockers),
          estimated_fields_to_replace: splitList(row.estimated_fields_to_replace),
          health_context: splitList(row.health_context),
          recommendation_reason: String(row.recommendation_reason ?? ""),
          required_before_enable: String(row.required_before_enable ?? ""),
        };

        return [safetyRow.formula_key, safetyRow] as const;
      })
    );
  } catch {
    return new Map<string, SafetyAuditRow>();
  }
}

function normalizeFoodRows(
  rows: Array<Record<string, unknown>>,
  catalog: Catalog,
  safetyByFormulaKey = new Map<string, SafetyAuditRow>()
) {
  const nameColumn = nameColumnForCatalog(catalog);

  return rows.map((row) => ({
    id: String(row.id ?? ""),
    brand: String(row.brand ?? "Unknown"),
    name: String(row[nameColumn] ?? ""),
    species: String(row.species ?? ""),
    data_quality_status: String(row.data_quality_status ?? "needs_review"),
    source_priority:
      catalog === "food_v2" ? String(row.source_priority ?? "unknown") : null,
    is_recommendable: row.is_recommendable !== false,
    formula_key: catalog === "food_v2" ? String(row.formula_key ?? "") : null,
    safety:
      catalog === "food_v2"
        ? safetyByFormulaKey.get(String(row.formula_key ?? "")) ?? null
        : null,
  }));
}

export async function GET(request: Request) {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const url = new URL(request.url);
    const catalog = normalizeCatalog(url.searchParams.get("catalog"));
    const table = tableForCatalog(catalog);
    const nameColumn = nameColumnForCatalog(catalog);
    const selectColumns =
      catalog === "food_v2"
        ? `id, brand, ${nameColumn}, species, data_quality_status, source_priority, is_recommendable, formula_key`
        : `id, brand, ${nameColumn}, species, data_quality_status, is_recommendable`;

    let query = supabaseAdmin
      .from(table)
      .select(selectColumns)
      .order("brand", { ascending: true })
      .order(nameColumn, { ascending: true });

    if (catalog === "foods") {
      query = query.is("deleted_at", null);
    }

    const { data, error } = await query.limit(2000);

    if (error) throw error;

    const safetyByFormulaKey =
      catalog === "food_v2" ? await readSafetyAuditRows() : new Map();
    const foods = normalizeFoodRows(
      (data ?? []) as unknown as Array<Record<string, unknown>>,
      catalog,
      safetyByFormulaKey
    );
    const brandMap = new Map<
      string,
      {
        brand: string;
        total: number;
        enabled: number;
        needs_review: number;
        retailer: number;
        official: number;
      }
    >();

    for (const food of foods) {
      const current =
        brandMap.get(food.brand) ??
        {
          brand: food.brand,
          total: 0,
          enabled: 0,
          needs_review: 0,
          retailer: 0,
          official: 0,
        };

      current.total += 1;
      if (food.is_recommendable) current.enabled += 1;
      if (food.data_quality_status === "needs_review") current.needs_review += 1;
      if (food.source_priority === "retailer") current.retailer += 1;
      if (food.source_priority === "official") current.official += 1;
      brandMap.set(food.brand, current);
    }

    return NextResponse.json({
      catalog,
      totalRows: foods.length,
      enabledRows: foods.filter((food) => food.is_recommendable).length,
      hiddenRows: foods.filter((food) => !food.is_recommendable).length,
      brands: [...brandMap.values()].sort((a, b) =>
        a.brand.localeCompare(b.brand)
      ),
      foods,
      safety: {
        auditRows: safetyByFormulaKey.size,
        doNotEnableRows: foods.filter(
          (food) => food.safety?.recommendation_status === "do_not_enable"
        ).length,
        cautiousRows: foods.filter(
          (food) => food.safety?.recommendation_status === "cautious_enable_only"
        ).length,
        eligibleRows: foods.filter(
          (food) =>
            food.safety?.recommendation_status === "eligible_after_admin_choice"
        ).length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load recommendation visibility.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const body = await request.json();
    const catalog = normalizeCatalog(body.catalog);
    const table = tableForCatalog(catalog);
    const nameColumn = nameColumnForCatalog(catalog);
    const isRecommendable = body.is_recommendable !== false;
    const brand = String(body.brand ?? "").trim();
    const foodIds = Array.isArray(body.food_ids)
      ? body.food_ids.map((id: unknown) => String(id).trim()).filter(Boolean)
      : [];

    if (!brand && foodIds.length === 0) {
      return NextResponse.json(
        { error: "Provide a brand or food_ids to update." },
        { status: 400 }
      );
    }

    if (catalog === "food_v2" && isRecommendable) {
      const safetyByFormulaKey = await readSafetyAuditRows();
      let safetyQuery = supabaseAdmin
        .from(table)
        .select(`id, brand, ${nameColumn}, formula_key`);

      if (foodIds.length > 0) {
        safetyQuery = safetyQuery.in("id", foodIds);
      } else {
        safetyQuery = safetyQuery.eq("brand", brand);
      }

      const { data: requestedRows, error: safetyError } = await safetyQuery;
      if (safetyError) throw safetyError;

      const blockedRows = ((requestedRows ?? []) as Array<Record<string, unknown>>)
        .map((row) => ({
          name: String(row[nameColumn] ?? ""),
          safety: safetyByFormulaKey.get(String(row.formula_key ?? "")),
        }))
        .filter((row) => row.safety?.recommendation_status === "do_not_enable");

      if (blockedRows.length > 0) {
        return NextResponse.json(
          {
            error:
              "Safety audit blocks enabling one or more Food V2 rows. Resolve blocker nutrients or enable only non-blocked formulas.",
            blockedRows: blockedRows.slice(0, 10).map((row) => row.name),
            blockedCount: blockedRows.length,
          },
          { status: 400 }
        );
      }
    }

    let query = supabaseAdmin
      .from(table)
      .update({
        is_recommendable: isRecommendable,
        updated_at: new Date().toISOString(),
      });

    if (catalog === "foods") {
      query = query.is("deleted_at", null);
    }

    if (foodIds.length > 0) {
      query = query.in("id", foodIds);
    } else {
      query = query.eq("brand", brand);
    }

    const { data, error } = await query.select(
      `id, brand, ${nameColumn}, is_recommendable`
    );

    if (error) throw error;

    if (brand) {
      await supabaseAdmin
        .from("food_brand_recommendation_controls")
        .upsert(
          {
            brand,
            is_recommendable: isRecommendable,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "brand" }
        );
    }

    return NextResponse.json({
      success: true,
      catalog,
      updatedRows: data?.length ?? 0,
      foods: normalizeFoodRows(
        (data ?? []) as Array<Record<string, unknown>>,
        catalog
      ),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update recommendation visibility.",
      },
      { status: 500 }
    );
  }
}
