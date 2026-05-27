import { NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { adminActivityLogService } from "@/services/adminActivityLogService";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

type Context = {
  params: Promise<{ id: string }>;
};

function parseFiniteNumber(value: unknown): number | null {
  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

export async function GET(_: Request, context: Context) {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const { id } = await context.params;

    const { data, error } = await supabase
      .from("pets")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Pet not found." }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load pet.",
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
    const age = parseFiniteNumber(body.age);
    const weight = parseFiniteNumber(body.weight);

    if (age === null || age < 0) {
      return NextResponse.json({ error: "Invalid age." }, { status: 400 });
    }

    if (weight === null || weight <= 0) {
      return NextResponse.json({ error: "Invalid weight." }, { status: 400 });
    }

    const payload = {
      name: String(body.name ?? "").trim(),
      species: body.species,
      breed: String(body.breed ?? "").trim(),
      age,
      weight,
      activity_level: body.activity_level,
      neutered: Boolean(body.neutered),
      allergies: Array.isArray(body.allergies) ? body.allergies : [],
      health_issues: Array.isArray(body.health_issues) ? body.health_issues : [],
      customer_id: body.customerId ? String(body.customerId) : null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("pets")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await adminActivityLogService.log({
      action: "update",
      entityType: "pet",
      entityId: id,
      message: `Updated pet profile ${data.name}`,
      metadata: {
        name: data.name,
        species: data.species,
        breed: data.breed,
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update pet.",
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
      .from("pets")
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
      entityType: "pet",
      entityId: id,
      message: `Soft-deleted pet profile ${id}`,
      metadata: {
        deletedAt: now,
      },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete pet.",
      },
      { status: 500 }
    );
  }
}
