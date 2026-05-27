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

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis API error:", error);

    return NextResponse.json(
      { error: "Failed to analyze pet profile." },
      { status: 500 }
    );
  }
}
