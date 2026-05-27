import { NextResponse } from "next/server";
import { petAnalysisService } from "@/services/petAnalysisService";

export async function POST(request: Request) {
  try {
    const pet = await request.json();

    const analysis = await petAnalysisService.analyzePet(pet);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis API error:", error);

    return NextResponse.json(
      { error: "Failed to analyze pet profile." },
      { status: 500 }
    );
  }
}
