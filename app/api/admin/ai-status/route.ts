import { NextResponse } from "next/server";

import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";
import {
  getOpenAiClient,
  getOpenAiModel,
  isOpenAiConfigured,
} from "@/lib/ai/openaiServer";

export const dynamic = "force-dynamic";

type OpenAiRuntimePing = {
  checked: boolean;
  ok: boolean | null;
  model: string | null;
  error: string | null;
};

async function pingOpenAiRuntime(model: string): Promise<OpenAiRuntimePing> {
  const client = getOpenAiClient();

  if (!client) {
    return {
      checked: true,
      ok: false,
      model: null,
      error: "OPENAI_API_KEY is not configured.",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await client.responses.create(
      {
        model,
        input:
          "NutriTail admin runtime connectivity check. Reply with the single word OK.",
        temperature: 0,
        max_output_tokens: 8,
      },
      { signal: controller.signal }
    );
    const output = response.output_text?.trim().toLowerCase() ?? "";

    return {
      checked: true,
      ok: output.includes("ok"),
      model,
      error: output.includes("ok") ? null : "Unexpected OpenAI ping response.",
    };
  } catch (error) {
    return {
      checked: true,
      ok: false,
      model,
      error: error instanceof Error ? error.message : "OpenAI ping failed.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  const forbidden = await requireAdminApiAccess();
  if (forbidden) return forbidden;

  const openaiConfigured = isOpenAiConfigured();
  const model = openaiConfigured ? getOpenAiModel() : null;
  const shouldPing = new URL(request.url).searchParams.get("ping") === "1";
  const runtimePing =
    shouldPing && model
      ? await pingOpenAiRuntime(model)
      : {
          checked: false,
          ok: null,
          model,
          error: null,
        };

  return NextResponse.json({
    openai_configured: openaiConfigured,
    model,
    runtime_ping: runtimePing,
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
