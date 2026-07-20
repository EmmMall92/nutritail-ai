import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { createClient } from "@/lib/supabase/server";
import { mapDbPetAnalysisToPetAnalysisHistory } from "@/mappers/petAnalysisMapper";
import type { DbPetAnalysis } from "@/types/db/db-pet-analysis";

type Context = {
  params: Promise<{ id: string }>;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

export async function GET(_: Request, context: Context) {
  try {
    const { id } = await context.params;

    if (!UUID_PATTERN.test(id)) {
      return privateJson({ error: "Invalid pet report link." }, 400);
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return privateJson({ error: "Authentication required." }, 401);
    }

    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (customerError) {
      return privateJson({ error: customerError.message }, 500);
    }

    if (!customer) {
      return privateJson({ error: "Customer not found." }, 404);
    }

    const { data: pet, error } = await supabaseAdmin
      .from("pets")
      .select("*")
      .eq("id", id)
      .eq("customer_id", customer.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      return privateJson({ error: error.message }, 500);
    }

    if (!pet) {
      return privateJson({ error: "Pet not found." }, 404);
    }

    const { data: analyses, error: analysesError } = await supabaseAdmin
      .from("pet_analyses")
      .select("*")
      .eq("pet_id", String(pet.id))
      .order("created_at", { ascending: false });

    if (analysesError) {
      return privateJson({ error: analysesError.message }, 500);
    }

    const history = ((analyses ?? []) as DbPetAnalysis[]).map(
      mapDbPetAnalysisToPetAnalysisHistory
    );
    const { data: progressLogs, error: progressError } = await supabaseAdmin
      .from("admin_activity_logs")
      .select("*")
      .eq("entity_type", "pet_progress")
      .eq("entity_id", String(pet.id))
      .order("created_at", { ascending: false })
      .limit(20);

    if (progressError) {
      return privateJson({ error: progressError.message }, 500);
    }

    return privateJson({
      pet: {
        ...pet,
        analyses: history,
        progressLogs: progressLogs ?? [],
      },
    });
  } catch (error) {
    return privateJson(
      {
        error:
          error instanceof Error ? error.message : "Failed to load pet report.",
      },
      500
    );
  }
}
