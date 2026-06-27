import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";

type Context = {
  params: Promise<{ id: string }>;
};

const MAX_NOTE_LENGTH = 800;

function cleanText(value: unknown) {
  return String(value ?? "").trim().slice(0, MAX_NOTE_LENGTH);
}

function numberOrNull(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const authUserId = cleanText(body.authUserId);

    if (!authUserId) {
      return NextResponse.json(
        { error: "Missing auth user id." },
        { status: 400 }
      );
    }

    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (customerError) {
      return NextResponse.json({ error: customerError.message }, { status: 500 });
    }

    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    const { data: pet, error: petError } = await supabaseAdmin
      .from("pets")
      .select("id,name,weight")
      .eq("id", id)
      .eq("customer_id", customer.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (petError) {
      return NextResponse.json({ error: petError.message }, { status: 500 });
    }

    if (!pet) {
      return NextResponse.json({ error: "Pet not found." }, { status: 404 });
    }

    const currentWeightKg = numberOrNull(body.currentWeightKg);
    const feedingGramsPerDay = numberOrNull(body.feedingGramsPerDay);
    const treatsPerDay = cleanText(body.treatsPerDay);
    const treatsNote = cleanText(body.treatsNote);
    const appetiteNote = cleanText(body.appetiteNote);
    const stoolNote = cleanText(body.stoolNote);
    const energyNote = cleanText(body.energyNote);
    const bodyChangeNote = cleanText(body.bodyChangeNote);
    const note = cleanText(body.note);
    const mode = cleanText(body.mode || "progress");

    const row = {
      id: crypto.randomUUID(),
      action: "pet_progress_log",
      entity_type: "pet_progress",
      entity_id: String(pet.id),
      message: `Progress note for ${pet.name}.`,
      metadata: {
        source: "account_chatbot",
        authUserId,
        mode,
        petId: pet.id,
        petName: pet.name,
        previousWeightKg: pet.weight ?? null,
        currentWeightKg,
        feedingGramsPerDay,
        treatsPerDay: treatsPerDay || null,
        treatsNote: treatsNote || null,
        appetiteNote: appetiteNote || null,
        stoolNote: stoolNote || null,
        energyNote: energyNote || null,
        bodyChangeNote: bodyChangeNote || null,
        note,
      },
      created_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from("admin_activity_logs")
      .insert(row);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, progressLog: row });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save progress log.",
      },
      { status: 500 }
    );
  }
}
