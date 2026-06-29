import { NextResponse } from "next/server";
import { validatePetAnalysisPayload } from "@/lib/petRequestValidation";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { petAnalysisService } from "@/services/petAnalysisService";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const validation = validatePetAnalysisPayload(await request.json());

    if (!validation.ok) {
      return NextResponse.json(
        {
          error: validation.error,
        },
        { status: 400 }
      );
    }

    const analysis = await petAnalysisService.analyzePet(validation.pet);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze account chatbot pet.",
      },
      { status: 500 }
    );
  }
}
