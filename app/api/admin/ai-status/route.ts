import { NextResponse } from "next/server";

import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";
import { getOpenAiModel, isOpenAiConfigured } from "@/lib/ai/openaiServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const forbidden = await requireAdminApiAccess();
  if (forbidden) return forbidden;

  const openaiConfigured = isOpenAiConfigured();

  return NextResponse.json({
    openai_configured: openaiConfigured,
    model: openaiConfigured ? getOpenAiModel() : null,
    runtime_policy: {
      source_of_truth: "Food V2 + NutriTail deterministic rules",
      openai_allowed_for: [
        "pet fact extraction from natural language",
        "human-friendly response writing",
      ],
      openai_not_allowed_for: [
        "food ranking",
        "inventing foods",
        "inventing nutrient values",
        "overriding NutriTail decisions",
        "medical diagnosis or treatment claims",
      ],
    },
    surfaces: {
      intake_extractor: openaiConfigured ? "openai_or_fallback" : "fallback_only",
      recommendation_composer: openaiConfigured ? "openai_or_fallback" : "fallback_only",
      food_ranking: "deterministic_nutritail_only",
    },
    safe_to_show_in_admin: true,
  });
}
