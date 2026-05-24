import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

export async function GET() {
  const forbidden = await requireAdminApiAccess();
  if (forbidden) return forbidden;

  const headers = [
    "id",
    "brand",
    "name",
    "species",
    "kcal_per_100g",
    "protein_percent",
    "fat_percent",
    "fiber_percent",
    "sodium_percent",
    "magnesium_percent",
    "calcium_percent",
    "phosphorus_percent",
    "data_quality_status",
    "data_source_url",
    "data_notes",
  ];

  const exampleRow = [
    "dog-001",
    "Example Brand",
    "Example Adult Chicken",
    "dog",
    "380",
    "26",
    "14",
    "3",
    "0.35",
    "0.08",
    "1.2",
    "0.9",
    "verified",
    "https://example.com/product",
    "Values copied from official product page.",
  ];

  const csv = [
    headers.join(","),
    exampleRow.map((value) => `"${value}"`).join(","),
  ].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="food-enrichment-template.csv"',
    },
  });
}
