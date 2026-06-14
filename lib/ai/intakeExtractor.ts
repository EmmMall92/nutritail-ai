import { fallbackExtractIntake } from "@/lib/ai/intakeFallback";
import { getOpenAiClient, getOpenAiModel, isOpenAiConfigured } from "@/lib/ai/openaiServer";
import type {
  AiIntakeExtraction,
  ValidatedAiIntakeExtraction,
} from "@/lib/ai/intakeTypes";
import { validateAiIntakeExtraction } from "@/lib/ai/intakeValidation";

type ExtractIntakeOptions = {
  locale?: "el" | "en";
  timeoutMs?: number;
};

function extractJsonObject(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]) as AiIntakeExtraction;
  } catch {
    return null;
  }
}

export async function extractPetIntakeFacts(
  message: string,
  options: ExtractIntakeOptions = {}
): Promise<ValidatedAiIntakeExtraction & { source: "openai" | "fallback" }> {
  const fallback = fallbackExtractIntake(message);

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
            content:
              "Extract only pet nutrition intake facts from the user message. Return strict JSON only. Do not recommend foods, diagnose, or invent facts. Use null for unknown values. Allowed enums: species dog|cat, activityLevel low|normal|high, weightGoal maintain|loss|gain, language el|en, confidence high|medium|low.",
          },
          {
            role: "user",
            content: `Message:\n${message}\n\nReturn JSON with keys: species, petName, weightKg, ageYears, activityLevel, neutered, healthIssues, allergies, currentFoodName, preferredProteins, excludedIngredients, weightGoal, language, missingFields, redFlags, confidence, notes.`,
          },
        ],
        temperature: 0,
        max_output_tokens: 700,
      },
      { signal: controller.signal }
    );

    const parsed = extractJsonObject(response.output_text ?? "");
    if (!parsed) return { ...fallback, source: "fallback" };

    const validated = validateAiIntakeExtraction(parsed);
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
