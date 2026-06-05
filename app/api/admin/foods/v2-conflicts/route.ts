import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import {
  createCanonicalFoodIdentity,
} from "@/lib/food-v2/canonicalFood";
import type { FoodImportRowV2, FoodProductV2 } from "@/types/food-v2";

type ExistingFoodV2Row = {
  formula_key: string;
  display_name: string;
  brand?: string;
  formula_name?: string;
  species?: string;
  format?: string;
  life_stage?: string | null;
  dog_size?: string | null;
  data_quality_status: string;
  updated_at: string | null;
};

type IncomingFoodV2Row = {
  formula_key: string;
  display_name: string;
  brand: string;
  canonical_formula_key: string;
};

type DuplicateRisk = {
  duplicate_risk_level: "none" | "low" | "medium" | "high";
  duplicate_risk_reason: string;
  recommended_action: string;
};

function normalizeRiskText(value: string | null | undefined) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/[^a-z0-9]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isPackSizeOnlyDifference(rows: Array<{ display_name: string }>) {
  const normalized = rows.map((row) =>
    normalizeRiskText(row.display_name).replace(
      /\b\d+(?:[,.]\d+)?\s*(?:kg|g|gr|grams?)\b/gu,
      ""
    )
  );
  return new Set(normalized).size <= 1;
}

function assessDuplicateRisk({
  incoming,
  existing,
}: {
  incoming: IncomingFoodV2Row[];
  existing: ExistingFoodV2Row[];
}): DuplicateRisk {
  const totalRows = incoming.length + existing.length;
  if (totalRows <= 1) {
    return {
      duplicate_risk_level: "none",
      duplicate_risk_reason: "single_row",
      recommended_action: "No duplicate action needed.",
    };
  }

  if (incoming.length > 1 && existing.length > 0) {
    return {
      duplicate_risk_level: "high",
      duplicate_risk_reason: "multiple_incoming_rows_match_existing_canonical",
      recommended_action:
        "Stop before commit. Pick one survivor and avoid importing multiple rows for the same canonical formula.",
    };
  }

  if (incoming.length > 1) {
    return {
      duplicate_risk_level: "medium",
      duplicate_risk_reason: "multiple_incoming_rows_same_canonical",
      recommended_action:
        "Review incoming rows and select only one survivor for this canonical formula.",
    };
  }

  if (existing.length > 0) {
    return {
      duplicate_risk_level: "medium",
      duplicate_risk_reason: "incoming_matches_existing_canonical",
      recommended_action:
        "Review existing row before commit. This should update/merge evidence, not create a duplicate formula.",
    };
  }

  if (isPackSizeOnlyDifference(incoming)) {
    return {
      duplicate_risk_level: "low",
      duplicate_risk_reason: "pack_size_variant",
      recommended_action:
        "Keep one formula-level row; pack sizes should not create separate Food V2 formulas.",
    };
  }

  return {
    duplicate_risk_level: "low",
    duplicate_risk_reason: "same_canonical_formula",
    recommended_action: "Use one survivor row and keep alternatives as evidence.",
  };
}

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

function normalizeIncomingRows(value: unknown): IncomingFoodV2Row[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => item as Partial<FoodImportRowV2>)
    .map((row) => {
      const food = row.food;
      if (!food?.formula_key) return null;

      return {
        formula_key: food.formula_key,
        display_name: food.display_name,
        brand: food.brand,
        canonical_formula_key:
          row.canonical?.canonical_formula_key ??
          createCanonicalFoodIdentity(food).canonical_formula_key,
      };
    })
    .filter((row): row is IncomingFoodV2Row => Boolean(row));
}

export async function POST(request: Request) {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const body = await request.json();
    const formulaKeys = normalizeKeys(body.formula_keys);
    const incomingRows = normalizeIncomingRows(body.rows);

    if (formulaKeys.length === 0) {
      return NextResponse.json({
        existing: [],
        existingCount: 0,
        newCount: 0,
        likelyDuplicates: [],
      });
    }

    const { data, error } = await supabaseAdmin
      .from("food_products_v2")
      .select(
        "formula_key, display_name, brand, formula_name, species, format, life_stage, dog_size, data_quality_status, updated_at"
      )
      .in("formula_key", formulaKeys);

    if (error) throw error;

    const existing = (data ?? []) as unknown as ExistingFoodV2Row[];
    const existingKeys = new Set(existing.map((row) => row.formula_key));
    const incomingCanonicalKeys = [
      ...new Set(incomingRows.map((row) => row.canonical_formula_key)),
    ];
    const likelyDuplicates: Array<{
      canonical_formula_key: string;
      incoming: IncomingFoodV2Row[];
      existing: Array<
        ExistingFoodV2Row & {
          canonical_formula_key: string;
        }
      >;
    } & DuplicateRisk> = [];

    if (incomingRows.length > 0) {
      const brands = [
        ...new Set(
          incomingRows
            .map((row) => row.brand)
            .filter(Boolean)
        ),
      ];
      const existingQuery = supabaseAdmin
        .from("food_products_v2")
        .select(
          "formula_key, display_name, brand, formula_name, species, format, life_stage, dog_size, data_quality_status, updated_at"
        );
      const { data: allExistingData, error: allExistingError } =
        brands.length > 0
          ? await existingQuery.in("brand", brands)
          : await existingQuery.limit(1000);

      if (allExistingError) throw allExistingError;

      const existingByCanonical = new Map<
        string,
        Array<ExistingFoodV2Row & { canonical_formula_key: string }>
      >();

      for (const row of (allExistingData ?? []) as unknown as ExistingFoodV2Row[]) {
        const canonical_formula_key = createCanonicalFoodIdentity(
          row as unknown as FoodProductV2
        ).canonical_formula_key;
        if (!incomingCanonicalKeys.includes(canonical_formula_key)) continue;
        const group = existingByCanonical.get(canonical_formula_key) ?? [];
        group.push({ ...row, canonical_formula_key });
        existingByCanonical.set(canonical_formula_key, group);
      }

      const incomingByCanonical = new Map<string, IncomingFoodV2Row[]>();
      for (const row of incomingRows) {
        const group = incomingByCanonical.get(row.canonical_formula_key) ?? [];
        group.push(row);
        incomingByCanonical.set(row.canonical_formula_key, group);
      }

      const candidateKeys = new Set([
        ...incomingCanonicalKeys.filter(
          (key) =>
            (incomingByCanonical.get(key)?.length ?? 0) > 1 ||
            (existingByCanonical.get(key)?.length ?? 0) > 0
        ),
      ]);

      for (const key of candidateKeys) {
        const incoming = incomingByCanonical.get(key) ?? [];
        const existing = existingByCanonical.get(key) ?? [];
        likelyDuplicates.push({
          canonical_formula_key: key,
          incoming,
          existing,
          ...assessDuplicateRisk({ incoming, existing }),
        });
      }
    }

    return NextResponse.json({
      existing,
      existingCount: existing.length,
      newCount: formulaKeys.filter((key) => !existingKeys.has(key)).length,
      likelyDuplicates,
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
