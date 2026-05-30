import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";

type CsvValue = string | number | boolean | string[] | null | undefined;

function csvCell(value: CsvValue) {
  if (Array.isArray(value)) {
    return `"${value.join("; ").replace(/"/g, '""')}"`;
  }

  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(headers: string[], rows: Record<string, CsvValue>[]) {
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\n");
}

function csvResponse(csv: string, filename: string) {
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

async function exportProducts() {
  const headers = [
    "id",
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
    "ingredients",
    "primary_animal_proteins",
    "carbohydrate_sources",
    "fat_sources",
    "fiber_sources",
    "kcal_per_100g",
    "kcal_per_kg",
    "data_quality_status",
    "source_priority",
    "data_source_url",
    "source_notes",
    "formula_key",
    "ean",
    "created_at",
    "updated_at",
  ];

  const { data, error } = await supabaseAdmin
    .from("food_products_v2")
    .select(headers.join(","))
    .order("brand", { ascending: true })
    .order("display_name", { ascending: true });

  if (error) throw error;

  return csvResponse(
    toCsv(headers, (data ?? []) as unknown as Record<string, CsvValue>[]),
    "nutritail-food-v2-products.csv"
  );
}

async function exportAudit() {
  const headers = [
    "id",
    "formula_key",
    "importable",
    "completeness_score",
    "missing_fields",
    "warnings",
    "impossible_values",
    "conflicts",
    "created_at",
  ];

  const { data, error } = await supabaseAdmin
    .from("food_import_audit_v2")
    .select(headers.join(","))
    .order("created_at", { ascending: false });

  if (error) throw error;

  return csvResponse(
    toCsv(headers, (data ?? []) as unknown as Record<string, CsvValue>[]),
    "nutritail-food-v2-audit.csv"
  );
}

export async function GET(request: Request) {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const url = new URL(request.url);
    const type = url.searchParams.get("type") ?? "products";

    if (type === "audit") return exportAudit();
    if (type === "products") return exportProducts();

    return NextResponse.json(
      { error: "Unsupported Food V2 export type." },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to export Food V2 data.",
      },
      { status: 500 }
    );
  }
}
