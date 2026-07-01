import {
  applyIntakeMessageGuards,
  fallbackExtractIntake,
} from "@/lib/ai/intakeFallback";
import { getOpenAiClient, getOpenAiModel, isOpenAiConfigured } from "@/lib/ai/openaiServer";
import {
  buildIntakeExtractionSystemPrompt,
  buildIntakeExtractionUserPrompt,
  extractJsonObjectFromOpenAiText,
} from "@/lib/ai/intakePromptContract";
import type {
  AiIntakeExtraction,
  ExtractedSpecies,
  ValidatedAiIntakeExtraction,
} from "@/lib/ai/intakeTypes";
import { validateAiIntakeExtraction } from "@/lib/ai/intakeValidation";

type ExtractIntakeOptions = {
  locale?: "el" | "en";
  timeoutMs?: number;
  contextSpecies?: ExtractedSpecies | null;
};

function mergeUnique(...arrays: Array<string[] | undefined>) {
  return [...new Set(arrays.flatMap((items) => items ?? []).filter(Boolean))];
}

function mergeOpenAiWithFallback(
  message: string,
  openAi: AiIntakeExtraction,
  fallback: ValidatedAiIntakeExtraction,
  options: ExtractIntakeOptions
): AiIntakeExtraction {
  const fallbackData = fallback.data;

  return applyIntakeMessageGuards(message, {
    ...openAi,
    species: openAi.species ?? fallbackData.species ?? options.contextSpecies ?? null,
    petName: openAi.petName ?? fallbackData.petName ?? null,
    weightKg: openAi.weightKg ?? fallbackData.weightKg ?? null,
    ageYears: openAi.ageYears ?? fallbackData.ageYears ?? null,
    activityLevel: openAi.activityLevel ?? fallbackData.activityLevel ?? null,
    neutered: openAi.neutered ?? fallbackData.neutered ?? null,
    weightGoal: openAi.weightGoal ?? fallbackData.weightGoal ?? null,
    language: openAi.language ?? fallbackData.language ?? null,
    currentFoodName: openAi.currentFoodName ?? fallbackData.currentFoodName ?? null,
    healthIssues: mergeUnique(openAi.healthIssues, fallbackData.healthIssues),
    allergies: mergeUnique(openAi.allergies, fallbackData.allergies),
    preferredProteins: mergeUnique(
      openAi.preferredProteins,
      fallbackData.preferredProteins
    ),
    excludedIngredients: mergeUnique(
      openAi.excludedIngredients,
      fallbackData.excludedIngredients
    ),
    missingFields: mergeUnique(openAi.missingFields, fallbackData.missingFields),
    redFlags: mergeUnique(openAi.redFlags, fallbackData.redFlags),
    notes: mergeUnique(openAi.notes, fallbackData.notes, ["openai_with_rule_merge"]),
    confidence: openAi.confidence ?? fallbackData.confidence ?? "medium",
  });
}

export async function extractPetIntakeFacts(
  message: string,
  options: ExtractIntakeOptions = {}
): Promise<ValidatedAiIntakeExtraction & { source: "openai" | "fallback" }> {
  const rawFallback = fallbackExtractIntake(message);
  const fallback =
    options.contextSpecies && !rawFallback.data.species
      ? validateAiIntakeExtraction({
          ...rawFallback.data,
          species: options.contextSpecies,
          notes: mergeUnique(rawFallback.data.notes, ["context_species"]),
        })
      : rawFallback;

  if (!isOpenAiConfigured()) {
    return { ...fallback, source: "fallback" };
  }

  const client = getOpenAiClient();
  if (!client) return { ...fallback, source: "fallback" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 8000);

  try {
    const response = await client.responses.create(
      {
        model: getOpenAiModel(),
        input: [
          {
            role: "system",
            content: buildIntakeExtractionSystemPrompt(),
          },
          {
            role: "user",
            content: buildIntakeExtractionUserPrompt(message),
          },
        ],
        temperature: 0,
        max_output_tokens: 700,
      },
      { signal: controller.signal }
    );

    const parsed = extractJsonObjectFromOpenAiText(
      response.output_text ?? ""
    ) as AiIntakeExtraction | null;
    if (!parsed) return { ...fallback, source: "fallback" };

    const validated = validateAiIntakeExtraction(
      mergeOpenAiWithFallback(message, parsed, fallback, options)
    );
    return {
      ...validated,
      source: validated.canUse ? "openai" : "fallback",
    };
  } catch {
    return { ...fallback, source: "fallback" };
  } finally {
    clearTimeout(timeout);
  }
}
