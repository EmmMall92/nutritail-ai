import { NextResponse } from "next/server";
import { buildAuthorityContractPrompt } from "@/lib/ai/authorityContract";
import {
  getOpenAiClient,
  getOpenAiModel,
  isOpenAiConfigured,
} from "@/lib/ai/openaiServer";
import { searchFoodProductsV2 } from "@/lib/food-v2/retrieval";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

const MAX_IMAGE_DATA_URL_LENGTH = 9_000_000;

type ExtractedFoodPhoto = {
  brand: string | null;
  product_name: string | null;
  species: "dog" | "cat" | null;
  life_stage: string | null;
  format: string | null;
  ingredients: string[];
  protein_percent: number | null;
  fat_percent: number | null;
  fiber_percent: number | null;
  ash_percent: number | null;
  moisture_percent: number | null;
  calcium_percent: number | null;
  phosphorus_percent: number | null;
  omega3_percent: number | null;
  omega6_percent: number | null;
  kcal_per_kg: number | null;
  kcal_per_100g: number | null;
  confidence: "high" | "medium" | "low";
  missing_fields: string[];
  notes: string[];
};

function extractJsonObject(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  return trimmed.slice(start, end + 1);
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function stringOrNull(value: unknown) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, 180) : null;
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, 40);
}

function normalizeExtractedFood(value: unknown): ExtractedFoodPhoto {
  const raw = (value ?? {}) as Record<string, unknown>;
  const species = raw.species === "dog" || raw.species === "cat" ? raw.species : null;
  const confidence =
    raw.confidence === "high" || raw.confidence === "medium" || raw.confidence === "low"
      ? raw.confidence
      : "low";

  return {
    brand: stringOrNull(raw.brand),
    product_name: stringOrNull(raw.product_name),
    species,
    life_stage: stringOrNull(raw.life_stage),
    format: stringOrNull(raw.format),
    ingredients: stringArray(raw.ingredients),
    protein_percent: numberOrNull(raw.protein_percent),
    fat_percent: numberOrNull(raw.fat_percent),
    fiber_percent: numberOrNull(raw.fiber_percent),
    ash_percent: numberOrNull(raw.ash_percent),
    moisture_percent: numberOrNull(raw.moisture_percent),
    calcium_percent: numberOrNull(raw.calcium_percent),
    phosphorus_percent: numberOrNull(raw.phosphorus_percent),
    omega3_percent: numberOrNull(raw.omega3_percent),
    omega6_percent: numberOrNull(raw.omega6_percent),
    kcal_per_kg: numberOrNull(raw.kcal_per_kg),
    kcal_per_100g: numberOrNull(raw.kcal_per_100g),
    confidence,
    missing_fields: stringArray(raw.missing_fields).slice(0, 12),
    notes: stringArray(raw.notes).slice(0, 8),
  };
}

function buildExtractionPrompt(locale: "el" | "en") {
  const language = locale === "el" ? "Greek or English" : "English";

  return [
    buildAuthorityContractPrompt(),
    "",
    "Task: extract pet food label facts from the image.",
    "Return JSON only. Do not recommend a food, rank products, invent values, diagnose, or fill missing nutrients from memory.",
    `Use ${language} labels in notes only when needed, but keep JSON keys exactly as requested.`,
    "",
    "JSON shape:",
    "{",
    '  "brand": string|null,',
    '  "product_name": string|null,',
    '  "species": "dog"|"cat"|null,',
    '  "life_stage": string|null,',
    '  "format": "dry"|"wet"|"treat"|"supplement"|null,',
    '  "ingredients": string[],',
    '  "protein_percent": number|null,',
    '  "fat_percent": number|null,',
    '  "fiber_percent": number|null,',
    '  "ash_percent": number|null,',
    '  "moisture_percent": number|null,',
    '  "calcium_percent": number|null,',
    '  "phosphorus_percent": number|null,',
    '  "omega3_percent": number|null,',
    '  "omega6_percent": number|null,',
    '  "kcal_per_kg": number|null,',
    '  "kcal_per_100g": number|null,',
    '  "confidence": "high"|"medium"|"low",',
    '  "missing_fields": string[],',
    '  "notes": string[]',
    "}",
  ].join("\n");
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!isOpenAiConfigured()) {
      return NextResponse.json(
        { error: "Food photo analysis is not configured yet." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const imageDataUrl = String(body.imageDataUrl ?? "");
    const locale = body.locale === "en" ? "en" : "el";
    const contextSpecies =
      body.species === "dog" || body.species === "cat" ? body.species : null;

    if (!imageDataUrl.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Upload a food label image." },
        { status: 400 }
      );
    }

    if (imageDataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
      return NextResponse.json(
        { error: "Image is too large. Please upload a smaller label photo." },
        { status: 413 }
      );
    }

    const client = getOpenAiClient();
    if (!client) {
      return NextResponse.json(
        { error: "Food photo analysis is not configured yet." },
        { status: 503 }
      );
    }

    const response = await client.responses.create({
      model: getOpenAiModel(),
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildExtractionPrompt(locale),
            },
            {
              type: "input_image",
              image_url: imageDataUrl,
              detail: "high",
            },
          ],
        },
      ],
      temperature: 0,
      max_output_tokens: 900,
    });

    const jsonText = extractJsonObject(response.output_text ?? "");
    if (!jsonText) {
      return NextResponse.json(
        { error: "Could not read the label clearly. Try a sharper photo." },
        { status: 422 }
      );
    }

    const extracted = normalizeExtractedFood(JSON.parse(jsonText));
    const query = [extracted.brand, extracted.product_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    const candidates = query
      ? await searchFoodProductsV2({
          query,
          species: extracted.species ?? contextSpecies,
          format: extracted.format,
          limit: 5,
        })
      : [];
    const bestMatch = candidates[0] ?? null;
    const acceptedMatch =
      bestMatch &&
      (bestMatch.match_confidence === "high" ||
        (bestMatch.match_confidence === "moderate" && bestMatch.match_score >= 50))
        ? bestMatch
        : null;

    return NextResponse.json({
      extracted,
      query,
      match: acceptedMatch,
      candidates,
      safety_note:
        locale === "el"
          ? "Η φωτογραφία βοηθά στην αναγνώριση της τροφής, αλλά για νεφρικά, ουροποιητικά, παγκρεατίτιδα, διαβήτη ή σοβαρή αλλεργία χρειάζεται κτηνιατρική καθοδήγηση."
          : "The photo helps identify the food, but kidney, urinary, pancreatitis, diabetes, or severe allergy cases need veterinary guidance.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze the food photo.",
      },
      { status: 500 }
    );
  }
}
