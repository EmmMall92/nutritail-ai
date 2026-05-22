import { NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { adminActivityLogService } from "@/services/adminActivityLogService";
import type { DbFood } from "@/types/db/db-food";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: Context) {
  try {
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
    const { id } = await context.params;
    const body = await request.json();

    const payload = {
      brand: String(body.brand ?? "").trim(),
      name: String(body.name ?? "").trim(),
      species: String(body.species ?? "").trim(),
      life_stage: String(body.life_stage ?? "").trim(),
      activity_support: Array.isArray(body.activity_support)
        ? body.activity_support
        : [],
      health_support: Array.isArray(body.health_support)
        ? body.health_support
        : [],
      protein: Number(body.protein),
      fat: Number(body.fat),
      fiber: Number(body.fiber),
      sodium: Number(body.sodium),
      magnesium: Number(body.magnesium),
      calcium: Number(body.calcium),
      phosphorus: Number(body.phosphorus),
      ingredients: Array.isArray(body.ingredients) ? body.ingredients : [],
      tags: Array.isArray(body.tags) ? body.tags : [],
      updated_at: new Date().toISOString(),
    kcal_per_100g:
  body.kcal_per_100g === null || body.kcal_per_100g === ""
    ? null
    : Number(body.kcal_per_100g),

protein_percent:
  body.protein_percent === null || body.protein_percent === ""
    ? null
    : Number(body.protein_percent),

fat_percent:
  body.fat_percent === null || body.fat_percent === ""
    ? null
    : Number(body.fat_percent),

fiber_percent:
  body.fiber_percent === null || body.fiber_percent === ""
    ? null
    : Number(body.fiber_percent),

sodium_percent:
  body.sodium_percent === null || body.sodium_percent === ""
    ? null
    : Number(body.sodium_percent),

magnesium_percent:
  body.magnesium_percent === null || body.magnesium_percent === ""
    ? null
    : Number(body.magnesium_percent),

calcium_percent:
  body.calcium_percent === null || body.calcium_percent === ""
    ? null
    : Number(body.calcium_percent),

phosphorus_percent:
  body.phosphorus_percent === null || body.phosphorus_percent === ""
    ? null
    : Number(body.phosphorus_percent),
    data_quality_status: [
  "needs_review",
  "partial",
  "verified",
  "unknown",
].includes(String(body.data_quality_status))
  ? String(body.data_quality_status)
  : "needs_review",

data_source_url: body.data_source_url
  ? String(body.data_source_url).trim()
  : null,

data_notes: body.data_notes
  ? String(body.data_notes).trim()
  : null,
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
      message: `Updated food ${data.brand} — ${data.name}`,
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