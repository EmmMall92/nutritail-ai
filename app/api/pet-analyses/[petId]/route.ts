import { NextResponse } from "next/server";
import { requireAccountApiUser } from "@/lib/auth/accountApiGuard";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { petAnalysisHistoryService } from "@/services/petAnalysisHistoryService";

type Context = {
  params: Promise<{ petId: string }>;
};

export async function GET(_: Request, context: Context) {
  try {
    const access = await requireAccountApiUser();
    if (access.response) return access.response;

    const { petId } = await context.params;

    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("auth_user_id", access.user.id)
      .maybeSingle();

    if (customerError) {
      return NextResponse.json({ error: customerError.message }, { status: 500 });
    }
    if (!customer) {
      return NextResponse.json({ error: "Pet not found." }, { status: 404 });
    }

    const { data: pet, error: petError } = await supabaseAdmin
      .from("pets")
      .select("id")
      .eq("id", petId)
      .eq("customer_id", customer.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (petError) {
      return NextResponse.json({ error: petError.message }, { status: 500 });
    }
    if (!pet) {
      return NextResponse.json({ error: "Pet not found." }, { status: 404 });
    }

    const history = await petAnalysisHistoryService.getPetHistory(petId);

    return NextResponse.json(history);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to load history" },
      { status: 500 }
    );
  }
}
