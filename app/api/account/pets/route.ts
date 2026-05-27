import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { petAnalysisHistoryService } from "@/services/petAnalysisHistoryService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const authUserId = String(body.authUserId ?? "").trim();

    if (!authUserId) {
      return NextResponse.json(
        { error: "Missing auth user id." },
        { status: 400 }
      );
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
      return NextResponse.json({ pets: [] });
    }

    const { data: pets, error: petsError } = await supabaseAdmin
      .from("pets")
      .select("*")
      .eq("customer_id", customer.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (petsError) {
      return NextResponse.json({ error: petsError.message }, { status: 500 });
    }

    const petsWithHistory = await Promise.all(
      (pets ?? []).map(async (pet) => {
        const history = await petAnalysisHistoryService.getPetHistory(String(pet.id));

        return {
          ...pet,
          analysisHistory: history,
        };
      })
    );

    return NextResponse.json({
      customerId: customer.id,
      pets: petsWithHistory,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load account pets.",
      },
      { status: 500 }
    );
  }
}
