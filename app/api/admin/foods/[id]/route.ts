import { NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { adminActivityLogService } from "@/services/adminActivityLogService";
import type { DbFood } from "@/types/db/db-food";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

type Context = {
  params: Promise<{ id: string }>;
};

function normalizeArrayField(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeStatus(value: unknown) {
  const status = String(value ?? "needs_review").trim().toLowerCase();

  if (["needs_review", "partial", "verified", "unknown"].includes(status)) {
    return status;
  }

  if (status === "needs review") return "needs_review";

  return "needs_review";
}

export async function GET(_: Request, context: Context) {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const { id } = await context.params;

    const { data, error } = await supabase
      .from("foods")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Food not found." }, { status: 404 });
    }

    return NextResponse.json(data as DbFood);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load food.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const { id } = await context.params;
    const body = await request.json();

    const proteinPercent = normalizeNumberOrNull(body.protein_percent);
    const fatPercent = normalizeNumberOrNull(body.fat_percent);
    const fiberPercent = normalizeNumberOrNull(body.fiber_percent);
    const sodiumPercent = normalizeNumberOrNull(body.sodium_percent);
    const magnesiumPercent = normalizeNumberOrNull(body.magnesium_percent);
    const calciumPercent = normalizeNumberOrNull(body.calcium_percent);
    const phosphorusPercent = normalizeNumberOrNull(body.phosphorus_percent);

    const payload = {
      brand: String(body.brand ?? "").trim(),
      name: String(body.name ?? "").trim(),
      species: String(body.species ?? "").trim(),
      life_stage: String(body.life_stage ?? "").trim(),
      ingredients: normalizeArrayField(body.ingredients),
      tags: normalizeArrayField(body.tags),
      updated_at: new Date().toISOString(),

      kcal_per_100g: normalizeNumberOrNull(body.kcal_per_100g),
      protein_percent: proteinPercent,
      fat_percent: fatPercent,
      fiber_percent: fiberPercent,
      sodium_percent: sodiumPercent,
      magnesium_percent: magnesiumPercent,
      calcium_percent: calciumPercent,
      phosphorus_percent: phosphorusPercent,

      protein: normalizeNumberOrNull(body.protein) ?? proteinPercent ?? 0,
      fat: normalizeNumberOrNull(body.fat) ?? fatPercent ?? 0,
      fiber: normalizeNumberOrNull(body.fiber) ?? fiberPercent ?? 0,
      sodium: normalizeNumberOrNull(body.sodium) ?? sodiumPercent ?? 0,
      magnesium:
        normalizeNumberOrNull(body.magnesium) ?? magnesiumPercent ?? 0,
      calcium: normalizeNumberOrNull(body.calcium) ?? calciumPercent ?? 0,
      phosphorus:
        normalizeNumberOrNull(body.phosphorus) ?? phosphorusPercent ?? 0,

      data_quality_status: normalizeStatus(body.data_quality_status),
      data_source_url: body.data_source_url
        ? String(body.data_source_url).trim()
        : null,
      data_notes: body.data_notes ? String(body.data_notes).trim() : null,
    };

    const { data, error } = await supabase
      .from("foods")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await adminActivityLogService.log({
      action: "update",
      entityType: "food",
      entityId: id,
      message: `Updated food ${data.brand} - ${data.name}`,
      metadata: {
        brand: data.brand,
        name: data.name,
        species: data.species,
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update food.",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(_: Request, context: Context) {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const { id } = await context.params;
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("foods")
      .update({
        deleted_at: now,
        updated_at: now,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await adminActivityLogService.log({
      action: "soft-delete",
      entityType: "food",
      entityId: id,
      message: `Soft-deleted food ${id}`,
      metadata: {
        deletedAt: now,
      },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete food.",
      },
      { status: 500 }
    );
  }
}
