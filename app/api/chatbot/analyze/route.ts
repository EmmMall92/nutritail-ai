import { NextResponse } from "next/server";
import { validatePetAnalysisPayload } from "@/lib/petRequestValidation";
import { petAnalysisService } from "@/services/petAnalysisService";

export async function POST(request: Request) {
  try {
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
            : "Failed to analyze chatbot pet.",
      },
      { status: 500 }
    );
  }
}
