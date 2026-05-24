import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

function normalizeArrayField(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function normalizeStatus(value: unknown) {
  const status = String(value ?? "needs_review");

  return ["needs_review", "partial", "verified", "unknown"].includes(status)
    ? status
    : "needs_review";
}

export async function GET() {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const { data, error } = await supabaseAdmin
      .from("foods")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      foods: data ?? [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to fetch foods.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const body = await request.json();
    const id = String(body.id ?? "").trim() || randomUUID();
    const protein = normalizeNumber(body.protein ?? body.protein_percent);
    const fat = normalizeNumber(body.fat ?? body.fat_percent);
    const fiber = normalizeNumber(body.fiber ?? body.fiber_percent);
    const sodium = normalizeNumber(body.sodium ?? body.sodium_percent);
    const magnesium = normalizeNumber(body.magnesium ?? body.magnesium_percent);
    const calcium = normalizeNumber(body.calcium ?? body.calcium_percent);
    const phosphorus = normalizeNumber(
      body.phosphorus ?? body.phosphorus_percent
    );

    const payload = {
      id,
      brand: String(body.brand ?? "").trim(),
      name: String(body.name ?? "").trim(),
      species: String(body.species ?? "dog").trim(),

      life_stage: body.life_stage ?? body.lifeStage ?? "adult",
      activity_support: body.activity_support ?? body.activitySupport ?? "all",
      health_support: normalizeArrayField(
        body.health_support ?? body.healthSupport
      ),
      size: body.size || null,

      tags: normalizeArrayField(body.tags),
      ingredients: normalizeArrayField(body.ingredients),

      protein,
      fat,
      fiber,
      sodium,
      magnesium,
      calcium,
      phosphorus,

      kcal_per_100g:
        body.kcal_per_100g === "" ? null : body.kcal_per_100g ?? null,
      protein_percent: body.protein_percent ?? protein,
      fat_percent: body.fat_percent ?? fat,
      fiber_percent: body.fiber_percent ?? fiber,
      sodium_percent: body.sodium_percent ?? sodium,
      magnesium_percent: body.magnesium_percent ?? magnesium,
      calcium_percent: body.calcium_percent ?? calcium,
      phosphorus_percent: body.phosphorus_percent ?? phosphorus,

      data_quality_status: normalizeStatus(body.data_quality_status),
      data_source_url: body.data_source_url || null,
      data_notes: body.data_notes || null,
    };

    const { data, error } = await supabaseAdmin
      .from("foods")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      food: data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to create food.",
      },
      {
        status: 500,
      }
    );
  }
}
