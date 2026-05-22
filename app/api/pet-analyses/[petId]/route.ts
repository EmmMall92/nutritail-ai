import { NextResponse } from "next/server";
import { petAnalysisHistoryService } from "@/services/petAnalysisHistoryService";

type Context = {
  params: Promise<{ petId: string }>;
};

export async function GET(_: Request, context: Context) {
  try {
    const { petId } = await context.params;

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