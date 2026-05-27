import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";

const MIN_MATCH_SCORE = 20;
const GENERIC_QUERY_WORDS = new Set([
  "adult",
  "brand",
  "cat",
  "chicken",
  "dog",
  "dry",
  "food",
  "formula",
  "recipe",
  "wet",
]);

const QUERY_ALIASES: Array<[RegExp, string]> = [
  [/\brc\b/g, "royal canin"],
  [/\broyalcanin\b/g, "royal canin"],
  [/\bn\s*&\s*d\b/g, "n d"],
  [/\bnd\b/g, "n d"],
];

function normalizeSearchText(value: string) {
  let normalized = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[+]/g, " plus ")
    .replace(/['’]/g, "");

  for (const [pattern, replacement] of QUERY_ALIASES) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized.replace(/\s+/g, " ").trim();
}

function getSearchWords(query: string) {
  return normalizeSearchText(query)
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9-]/g, ""))
    .filter((word) => word.length >= 3 && !GENERIC_QUERY_WORDS.has(word));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const query = String(body.query ?? "").trim();
    const species = String(body.species ?? "").trim();

    if (!query) {
      return NextResponse.json({ match: null });
    }

    let foodsQuery = supabaseAdmin
      .from("foods")
      .select("*")
      .is("deleted_at", null)
      .in("data_quality_status", ["partial", "verified"])
      .order("brand", { ascending: true })
      .order("name", { ascending: true })
      .limit(50);

    if (species === "dog" || species === "cat") {
      foodsQuery = foodsQuery.eq("species", species);
    }

    const { data, error } = await foodsQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const normalizedQuery = normalizeSearchText(query);
    const searchWords = getSearchWords(normalizedQuery);

    const scoredFoods = (data ?? [])
      .map((food) => {
        const brand = normalizeSearchText(String(food.brand ?? ""));
        const name = normalizeSearchText(String(food.name ?? ""));
        const fullName = `${brand} ${name}`;

        let score = 0;

        if (fullName.includes(normalizedQuery)) score += 100;
        if (normalizedQuery.includes(brand) && brand) score += 30;
        if (normalizedQuery.includes(name) && name) score += 50;

        for (const word of searchWords) {
          if (fullName.includes(word)) score += 10;
        }

        return {
          food,
          score,
        };
      })
      .filter((item) => item.score >= MIN_MATCH_SCORE)
      .sort((a, b) => b.score - a.score);

    const bestMatch = scoredFoods[0]?.food ?? null;

    return NextResponse.json({
      match: bestMatch,
      candidates: scoredFoods.slice(0, 5).map((item) => item.food),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to match food.",
      },
      { status: 500 }
    );
  }
}
