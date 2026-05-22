import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { petAnalysisHistoryService } from "@/services/petAnalysisHistoryService";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const authUserId = String(body.authUserId ?? "");

    if (!authUserId) {
      return NextResponse.json({ error: "Missing auth user id." }, { status: 400 });
    }

    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("*")
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

    return NextResponse.json({
      pet,
      analysisHistory: history,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load pet." },
      { status: 500 }
    );
  }
}