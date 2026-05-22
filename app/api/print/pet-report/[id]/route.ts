import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { petAnalysisHistoryService } from "@/services/petAnalysisHistoryService";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: Context) {
  try {
    const { id } = await context.params;

    const { data: pet, error } = await supabaseAdmin
      .from("pets")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!pet) {
      return NextResponse.json({ error: "Pet not found." }, { status: 404 });
    }

    const history = await petAnalysisHistoryService.getPetHistory(String(pet.id));

    return NextResponse.json({
      pet: {
        ...pet,
        analyses: history,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load pet report.",
      },
      { status: 500 }
    );
  }
}