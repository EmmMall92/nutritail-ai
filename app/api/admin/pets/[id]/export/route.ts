import { NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { petAnalysisHistoryService } from "@/services/petAnalysisHistoryService";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: Context) {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const { id } = await context.params;

    const { data: pet, error } = await supabase
      .from("pets")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!pet) {
      return NextResponse.json({ error: "Pet not found." }, { status: 404 });
    }

    const history = await petAnalysisHistoryService.getPetHistory(id);

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      summary: {
        petId: pet.id,
        petName: pet.name,
        totalAnalyses: history.length,
        species: pet.species,
        breed: pet.breed,
      },
      pet,
      analysisHistory: history,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to export pet bundle.",
      },
      { status: 500 }
    );
  }
}