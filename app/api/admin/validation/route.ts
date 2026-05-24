import { NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

type ValidationIssue = {
  type: "food" | "pet";
  id: string;
  title: string;
  problems: string[];
};

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export async function GET() {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const [{ data: foods, error: foodsError }, { data: pets, error: petsError }] =
      await Promise.all([
        supabase.from("foods").select("*"),
        supabase.from("pets").select("*"),
      ]);

    if (foodsError) {
      return NextResponse.json({ error: foodsError.message }, { status: 500 });
    }

    if (petsError) {
      return NextResponse.json({ error: petsError.message }, { status: 500 });
    }

    const issues: ValidationIssue[] = [];

    const foodDuplicateMap = new Map<string, string[]>();
    for (const food of foods ?? []) {
      const key = `${normalizeText(food.brand)}|${normalizeText(food.name)}`;
      if (!foodDuplicateMap.has(key)) {
        foodDuplicateMap.set(key, []);
      }
      foodDuplicateMap.get(key)!.push(String(food.id));
    }

    const petDuplicateMap = new Map<string, string[]>();
    for (const pet of pets ?? []) {
      const key = `${normalizeText(pet.name)}|${normalizeText(
        pet.breed
      )}|${normalizeText(pet.species)}`;
      if (!petDuplicateMap.has(key)) {
        petDuplicateMap.set(key, []);
      }
      petDuplicateMap.get(key)!.push(String(pet.id));
    }

    for (const food of foods ?? []) {
      const problems: string[] = [];

      if (!food.brand?.trim()) problems.push("Missing brand");
if (!food.name?.trim()) problems.push("Missing name");
if (!food.species?.trim()) problems.push("Missing species");

if (typeof food.kcal_per_100g !== "number") {
  problems.push("Missing kcal per 100g");
}

if (typeof food.protein_percent !== "number") {
  problems.push("Missing protein %");
}

if (typeof food.fat_percent !== "number") {
  problems.push("Missing fat %");
}

if (typeof food.fiber_percent !== "number") {
  problems.push("Missing fiber %");
}

if (typeof food.sodium_percent !== "number") {
  problems.push("Missing sodium %");
}

if (typeof food.magnesium_percent !== "number") {
  problems.push("Missing magnesium %");
}

if (typeof food.calcium_percent !== "number") {
  problems.push("Missing calcium %");
}

if (typeof food.phosphorus_percent !== "number") {
  problems.push("Missing phosphorus %");
}
      if (!Array.isArray(food.ingredients) || food.ingredients.length === 0) {
        problems.push("Missing ingredients");
      }
      if (!Array.isArray(food.tags) || food.tags.length === 0) {
        problems.push("Missing tags");
      }

      const duplicateKey = `${normalizeText(food.brand)}|${normalizeText(food.name)}`;
      const duplicateIds = foodDuplicateMap.get(duplicateKey) ?? [];
      if (duplicateIds.length > 1) {
        problems.push(`Possible duplicate food (${duplicateIds.length} similar records)`);
      }

      if (problems.length > 0) {
        issues.push({
          type: "food",
          id: String(food.id),
          title: `${food.brand || "Unknown brand"} — ${food.name || "Unnamed food"}`,
          problems,
        });
      }
    }

    for (const pet of pets ?? []) {
      const problems: string[] = [];

      if (!pet.name?.trim()) problems.push("Missing name");
      if (!pet.species?.trim()) problems.push("Missing species");
      if (!pet.breed?.trim()) problems.push("Missing breed");
      if (typeof pet.age !== "number" || pet.age < 0) {
        problems.push("Invalid age");
      }
      if (typeof pet.weight !== "number" || pet.weight <= 0) {
        problems.push("Invalid weight");
      }
      if (!pet.activity_level?.trim()) {
        problems.push("Missing activity level");
      }

      const duplicateKey = `${normalizeText(pet.name)}|${normalizeText(
        pet.breed
      )}|${normalizeText(pet.species)}`;
      const duplicateIds = petDuplicateMap.get(duplicateKey) ?? [];
      if (duplicateIds.length > 1) {
        problems.push(`Possible duplicate pet (${duplicateIds.length} similar records)`);
      }

      if (problems.length > 0) {
        issues.push({
          type: "pet",
          id: String(pet.id),
          title: `${pet.name || "Unnamed pet"} — ${pet.breed || "Unknown breed"}`,
          problems,
        });
      }
    }

    return NextResponse.json({
      totalIssues: issues.length,
      issues,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to run validation checks.",
      },
      { status: 500 }
    );
  }
}