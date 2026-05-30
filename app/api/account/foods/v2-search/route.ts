import { NextResponse } from "next/server";
import { searchFoodProductsV2 } from "@/lib/food-v2/retrieval";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = String(body.query ?? "").trim();

    if (!query) {
      return NextResponse.json({ candidates: [] });
    }

    const candidates = await searchFoodProductsV2({
      query,
      species: typeof body.species === "string" ? body.species : null,
      format: typeof body.format === "string" ? body.format : null,
      lifeStage: typeof body.life_stage === "string" ? body.life_stage : null,
      limit: Number.isFinite(Number(body.limit)) ? Number(body.limit) : 8,
    });

    return NextResponse.json({
      candidates,
      best_match: candidates[0] ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to search Food V2 products.",
      },
      { status: 500 }
    );
  }
}
