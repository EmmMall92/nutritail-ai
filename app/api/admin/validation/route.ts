import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";
import { supabase } from "@/lib/db/supabase";
import { getFoodCompleteness } from "@/lib/foodCompleteness";

type ValidationSeverity = "blocker" | "warning";

type ValidationIssue = {
  type: "food" | "pet";
  id: string;
  title: string;
  category: string;
  severity: ValidationSeverity;
  problems: string[];
};

type ValidationRecord = Record<string, unknown>;

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function hasText(value: unknown) {
  return String(value ?? "").trim().length > 0;
}

function hasNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

function isActiveRecord(record: ValidationRecord) {
  return record.deleted_at === null || record.deleted_at === undefined;
}

function getQualityStatus(food: ValidationRecord) {
  const status = normalizeText(food.data_quality_status);
  return status === "needs review" ? "needs_review" : status || "needs_review";
}

function isPlaceholderFood(food: ValidationRecord) {
  const text = normalizeText(`${food.brand ?? ""} ${food.name ?? ""}`);
  return (
    text.includes("example brand") ||
    text.includes("example cat brand") ||
    text.includes("sample") ||
    text.includes("placeholder")
  );
}

function getFoodTitle(food: ValidationRecord) {
  return `${food.brand || "Unknown brand"} - ${
    food.name || "Unnamed food"
  }`;
}

function addIssue(
  issues: ValidationIssue[],
  issue: Omit<ValidationIssue, "severity"> & { severity?: ValidationSeverity }
) {
  issues.push({
    ...issue,
    severity: issue.severity ?? "warning",
  });
}

export async function GET() {
  try {
    const forbidden = await requireAdminApiAccess();
    if (forbidden) return forbidden;

    const [{ data: foods, error: foodsError }, { data: pets, error: petsError }] =
      await Promise.all([
        supabase.from("foods").select("*").is("deleted_at", null),
        supabase.from("pets").select("*").is("deleted_at", null),
      ]);

    if (foodsError) {
      return NextResponse.json({ error: foodsError.message }, { status: 500 });
    }

    if (petsError) {
      return NextResponse.json({ error: petsError.message }, { status: 500 });
    }

    const issues: ValidationIssue[] = [];
    const activeFoods = (foods ?? []).filter(isActiveRecord);
    const activePets = (pets ?? []).filter(isActiveRecord);

    const foodDuplicateMap = new Map<string, string[]>();
    for (const food of activeFoods) {
      const key = `${normalizeText(food.brand)}|${normalizeText(food.name)}`;
      if (!foodDuplicateMap.has(key)) {
        foodDuplicateMap.set(key, []);
      }
      foodDuplicateMap.get(key)!.push(String(food.id));
    }

    const petDuplicateMap = new Map<string, string[]>();
    for (const pet of activePets) {
      const key = `${normalizeText(pet.name)}|${normalizeText(
        pet.breed
      )}|${normalizeText(pet.species)}`;
      if (!petDuplicateMap.has(key)) {
        petDuplicateMap.set(key, []);
      }
      petDuplicateMap.get(key)!.push(String(pet.id));
    }

    for (const food of activeFoods) {
      const blockers: string[] = [];
      const warnings: string[] = [];
      const status = getQualityStatus(food);
      const completeness = getFoodCompleteness(food);

      if (!hasText(food.brand)) blockers.push("Missing brand");
      if (!hasText(food.name)) blockers.push("Missing name");
      if (!hasText(food.species)) blockers.push("Missing species");

      if (status === "unknown") {
        blockers.push("Data quality is unknown");
      }

      if (status === "needs_review" || !hasText(food.data_quality_status)) {
        blockers.push("Data quality needs review");
      }

      if (isPlaceholderFood(food)) {
        blockers.push("Looks like placeholder or demo food");
      }

      if (!hasNumber(food.kcal_per_100g)) {
        blockers.push("Missing kcal per 100g");
      }

      if (!hasText(food.data_source_url)) {
        blockers.push("Missing source URL");
      }

      if (!Array.isArray(food.ingredients) || food.ingredients.length === 0) {
        warnings.push("Missing ingredients");
      }

      if (!Array.isArray(food.tags) || food.tags.length === 0) {
        warnings.push("Missing tags");
      }

      const missingNutrition = completeness.missing.filter(
        (field) => field !== "kcal_per_100g"
      );
      if (missingNutrition.length > 0) {
        warnings.push(`Missing nutrition fields: ${missingNutrition.join(", ")}`);
      }

      const duplicateKey = `${normalizeText(food.brand)}|${normalizeText(
        food.name
      )}`;
      const duplicateIds = foodDuplicateMap.get(duplicateKey) ?? [];
      if (duplicateIds.length > 1) {
        blockers.push(
          `Possible duplicate food (${duplicateIds.length} similar records)`
        );
      }

      if (blockers.length > 0) {
        addIssue(issues, {
          type: "food",
          id: String(food.id),
          title: getFoodTitle(food),
          category: "Production blocker",
          severity: "blocker",
          problems: blockers,
        });
      }

      if (warnings.length > 0) {
        addIssue(issues, {
          type: "food",
          id: String(food.id),
          title: getFoodTitle(food),
          category: "Data quality warning",
          severity: "warning",
          problems: warnings,
        });
      }
    }

    for (const pet of activePets) {
      const problems: string[] = [];

      if (!hasText(pet.name)) problems.push("Missing name");
      if (!hasText(pet.species)) problems.push("Missing species");
      if (!hasText(pet.breed)) problems.push("Missing breed");
      if (!hasNumber(pet.age) || Number(pet.age) < 0) {
        problems.push("Invalid age");
      }
      if (!hasNumber(pet.weight) || Number(pet.weight) <= 0) {
        problems.push("Invalid weight");
      }
      if (!hasText(pet.activity_level)) {
        problems.push("Missing activity level");
      }

      const duplicateKey = `${normalizeText(pet.name)}|${normalizeText(
        pet.breed
      )}|${normalizeText(pet.species)}`;
      const duplicateIds = petDuplicateMap.get(duplicateKey) ?? [];
      if (duplicateIds.length > 1) {
        problems.push(
          `Possible duplicate pet (${duplicateIds.length} similar records)`
        );
      }

      if (problems.length > 0) {
        addIssue(issues, {
          type: "pet",
          id: String(pet.id),
          title: `${pet.name || "Unnamed pet"} - ${
            pet.breed || "Unknown breed"
          }`,
          category: "Customer data warning",
          severity: "warning",
          problems,
        });
      }
    }

    const blockers = issues.filter((issue) => issue.severity === "blocker");
    const warnings = issues.filter((issue) => issue.severity === "warning");
    const affectedFoodIds = new Set(
      issues.filter((issue) => issue.type === "food").map((issue) => issue.id)
    );
    const affectedPetIds = new Set(
      issues.filter((issue) => issue.type === "pet").map((issue) => issue.id)
    );

    return NextResponse.json({
      totalIssues: issues.length,
      summary: {
        blockers: blockers.length,
        warnings: warnings.length,
        affectedFoods: affectedFoodIds.size,
        affectedPets: affectedPetIds.size,
        activeFoods: activeFoods.length,
        activePets: activePets.length,
      },
      issues: [
        ...blockers.sort((a, b) => a.title.localeCompare(b.title)),
        ...warnings.sort((a, b) => a.title.localeCompare(b.title)),
      ],
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
