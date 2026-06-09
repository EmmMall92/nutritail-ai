import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { petAnalysisHistoryService } from "@/services/petAnalysisHistoryService";

type Context = {
  params: Promise<{ id: string }>;
};

const MAX_PET_AGE_YEARS = 40;
const MAX_PET_WEIGHT_KG = 150;

function normalizeBoundedNumber(
  value: unknown,
  fieldName: string,
  min: number,
  max: number
): number {
  const numberValue = Number(value);

  if (
    !Number.isFinite(numberValue) ||
    numberValue < min ||
    numberValue > max
  ) {
    throw new Error(`${fieldName} must be between ${min} and ${max}.`);
  }

  return numberValue;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

async function getCustomerForAuthUser(authUserId: string) {
  const { data: customer, error: customerError } = await supabaseAdmin
    .from("customers")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (customerError) {
    throw new Error(customerError.message);
  }

  return customer;
}

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const authUserId = String(body.authUserId ?? "").trim();

    if (!authUserId) {
      return NextResponse.json({ error: "Missing auth user id." }, { status: 400 });
    }

    const customer = await getCustomerForAuthUser(authUserId);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    const { data: pet, error: petError } = await supabaseAdmin
      .from("pets")
      .select("*")
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

    const history = await petAnalysisHistoryService.getPetHistory(String(pet.id));
    const { data: progressLogs, error: progressError } = await supabaseAdmin
      .from("admin_activity_logs")
      .select("*")
      .eq("entity_type", "pet_progress")
      .eq("entity_id", String(pet.id))
      .order("created_at", { ascending: false })
      .limit(20);

    if (progressError) {
      return NextResponse.json({ error: progressError.message }, { status: 500 });
    }

    return NextResponse.json({
      pet,
      analysisHistory: history,
      progressLogs: progressLogs ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load pet." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const authUserId = String(body.authUserId ?? "").trim();

    if (!authUserId) {
      return NextResponse.json({ error: "Missing auth user id." }, { status: 400 });
    }

    const customer = await getCustomerForAuthUser(authUserId);

    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    const age = normalizeBoundedNumber(
      body.age,
      "Age",
      0,
      MAX_PET_AGE_YEARS
    );
    const weight = normalizeBoundedNumber(
      body.weight,
      "Weight",
      0.1,
      MAX_PET_WEIGHT_KG
    );

    const payload = {
      breed: String(body.breed ?? "").trim(),
      age,
      weight,
      activity_level: String(body.activity_level ?? "normal").trim() || "normal",
      neutered: Boolean(body.neutered),
      allergies: normalizeStringArray(body.allergies),
      health_issues: normalizeStringArray(body.health_issues),
      updated_at: new Date().toISOString(),
    };

    const { data: pet, error: petError } = await supabaseAdmin
      .from("pets")
      .update(payload)
      .eq("id", id)
      .eq("customer_id", customer.id)
      .is("deleted_at", null)
      .select("*")
      .maybeSingle();

    if (petError) {
      return NextResponse.json({ error: petError.message }, { status: 500 });
    }

    if (!pet) {
      return NextResponse.json({ error: "Pet not found." }, { status: 404 });
    }

    return NextResponse.json({ pet });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update pet." },
      { status: 400 }
    );
  }
}
