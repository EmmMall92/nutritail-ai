import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";

type Catalog = "foods" | "food_v2";

function tableForCatalog(catalog: Catalog) {
  return catalog === "food_v2" ? "food_products_v2" : "foods";
}

function nameColumnForCatalog(catalog: Catalog) {
  return catalog === "food_v2" ? "display_name" : "name";
}

function normalizeCatalog(value: unknown): Catalog {
  return value === "food_v2" ? "food_v2" : "foods";
}

function normalizeFoodRows(
  rows: Array<Record<string, unknown>>,
  catalog: Catalog
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
        ? `id, brand, ${nameColumn}, species, data_quality_status, source_priority, is_recommendable`
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

    const foods = normalizeFoodRows(
      (data ?? []) as unknown as Array<Record<string, unknown>>,
      catalog
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
