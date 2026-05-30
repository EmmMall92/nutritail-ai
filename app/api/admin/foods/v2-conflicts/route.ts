import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";

type ExistingFoodV2Row = {
  formula_key: string;
  display_name: string;
  data_quality_status: string;
  updated_at: string | null;
};

function normalizeKeys(value: unknown) {
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value
        .map((item) => String(item ?? "").trim())
        .filter((item) => item.length > 0)
    ),
  ];
}

export async function POST(request: Request) {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const body = await request.json();
    const formulaKeys = normalizeKeys(body.formula_keys);

    if (formulaKeys.length === 0) {
      return NextResponse.json({
        existing: [],
        existingCount: 0,
        newCount: 0,
      });
    }

    const { data, error } = await supabaseAdmin
      .from("food_products_v2")
      .select("formula_key, display_name, data_quality_status, updated_at")
      .in("formula_key", formulaKeys);

    if (error) throw error;

    const existing = (data ?? []) as unknown as ExistingFoodV2Row[];
    const existingKeys = new Set(existing.map((row) => row.formula_key));

    return NextResponse.json({
      existing,
      existingCount: existing.length,
      newCount: formulaKeys.filter((key) => !existingKeys.has(key)).length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to check Food V2 conflicts.",
      },
      { status: 500 }
    );
  }
}
