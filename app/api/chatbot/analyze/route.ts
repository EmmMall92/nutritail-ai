import { NextResponse } from "next/server";
import { petAnalysisService } from "@/services/petAnalysisService";
import type { Pet } from "@/types/pet";

export async function POST(request: Request) {
  try {
    const pet = (await request.json()) as Pet;

    const analysis = await petAnalysisService.analyzePet(pet);

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