import { NextResponse } from "next/server";
import { supabase } from "@/lib/db/supabase";
import { requireAdminApiAccess } from "@/lib/auth/adminApiGuard";

type DuplicateGroup = {
  type: "food" | "pet";
  key: string;
  count: number;
  records: Array<{
    id: string;
    title: string;
    subtitle: string;
    href: string;
  }>;
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

    const groups: DuplicateGroup[] = [];

    const foodMap = new Map<string, DuplicateGroup["records"]>();
    for (const food of foods ?? []) {
      const key = `${normalizeText(food.brand)}|${normalizeText(food.name)}`;
      if (!foodMap.has(key)) {
        foodMap.set(key, []);
      }

      foodMap.get(key)!.push({
        id: String(food.id),
        title: `${food.brand || "Unknown brand"} — ${food.name || "Unnamed food"}`,
        subtitle: `${food.species || "unknown species"} • ${food.life_stage || "unknown stage"}`,
        href: `/admin/foods/${food.id}`,
      });
    }

    for (const [key, records] of foodMap.entries()) {
      if (records.length > 1) {
        groups.push({
          type: "food",
          key,
          count: records.length,
          records,
        });
      }
    }

    const petMap = new Map<string, DuplicateGroup["records"]>();
    for (const pet of pets ?? []) {
      const key = `${normalizeText(pet.name)}|${normalizeText(
        pet.breed
      )}|${normalizeText(pet.species)}`;

      if (!petMap.has(key)) {
        petMap.set(key, []);
      }

      petMap.get(key)!.push({
        id: String(pet.id),
        title: `${pet.name || "Unnamed pet"} — ${pet.breed || "Unknown breed"}`,
        subtitle: `${pet.species || "unknown species"} • age ${pet.age ?? "-"} • weight ${pet.weight ?? "-"} kg`,
        href: `/admin/pets/${pet.id}`,
      });
    }

    for (const [key, records] of petMap.entries()) {
      if (records.length > 1) {
        groups.push({
          type: "pet",
          key,
          count: records.length,
          records,
        });
      }
    }

    groups.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      totalGroups: groups.length,
      groups,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load duplicate groups.",
      },
      { status: 500 }
    );
  }
}