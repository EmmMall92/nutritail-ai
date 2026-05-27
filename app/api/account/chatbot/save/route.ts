import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { buildPetAnalysisHistoryRecord } from "@/services/petAnalysisHistoryBuilder";
import { petAnalysisHistoryService } from "@/services/petAnalysisHistoryService";
import type { Pet } from "@/types/pet";
import type { PetAnalysis } from "@/types/pet-analysis";

const MAX_PET_AGE_YEARS = 40;
const MAX_PET_WEIGHT_KG = 150;

function getPetValidationError(pet: Pet): string | null {
  const age = Number(pet.age);
  const weight = Number(pet.weight);

  if (!Number.isFinite(age) || age < 0 || age > MAX_PET_AGE_YEARS) {
    return `Pet age must be between 0 and ${MAX_PET_AGE_YEARS}.`;
  }

  if (!Number.isFinite(weight) || weight <= 0 || weight > MAX_PET_WEIGHT_KG) {
    return `Pet weight must be between 0 and ${MAX_PET_WEIGHT_KG} kg.`;
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const authUserId = String(body.authUserId ?? "");
    const existingPetId = body.existingPetId
      ? String(body.existingPetId)
      : null;
    const pet = body.pet as Pet;
    const analysis = body.analysis as PetAnalysis | null;
    const metadata = body.metadata ?? null;

    if (!authUserId) {
      return NextResponse.json(
        { error: "Missing auth user id." },
        { status: 400 }
      );
    }

    if (!pet) {
      return NextResponse.json({ error: "Missing pet." }, { status: 400 });
    }

    const petValidationError = getPetValidationError(pet);
    if (petValidationError) {
      return NextResponse.json({ error: petValidationError }, { status: 400 });
    }

    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (customerError) {
      return NextResponse.json({ error: customerError.message }, { status: 500 });
    }

    if (!customer) {
      return NextResponse.json(
        { error: "Customer profile not found." },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    let savedPet = null;

    if (existingPetId) {
      const { data: existingPet, error: existingPetError } = await supabaseAdmin
        .from("pets")
        .select("*")
        .eq("id", existingPetId)
        .eq("customer_id", customer.id)
        .maybeSingle();

      if (existingPetError) {
        return NextResponse.json(
          { error: existingPetError.message },
          { status: 500 }
        );
      }

      if (!existingPet) {
        return NextResponse.json(
          { error: "Saved pet not found." },
          { status: 404 }
        );
      }

      savedPet = existingPet;
    } else {
      const { data: newPet, error: petError } = await supabaseAdmin
        .from("pets")
        .insert({
          id: pet.id || crypto.randomUUID(),
          owner_id: "11111111-1111-1111-1111-111111111111",
          name: pet.name,
          species: pet.species,
          breed: pet.breed || "unknown",
          age: pet.age,
          weight: pet.weight,
          activity_level: pet.activityLevel,
          neutered: pet.neutered,
          allergies: pet.allergies ?? [],
          health_issues: pet.healthIssues ?? [],
          customer_id: customer.id,
          created_at: now,
          updated_at: now,
        })
        .select("*")
        .single();

      if (petError) {
        return NextResponse.json({ error: petError.message }, { status: 500 });
      }

      savedPet = newPet;
    }

    let historyRecord = null;

    if (analysis) {
      historyRecord = buildPetAnalysisHistoryRecord(
        {
          ...pet,
          id: savedPet.id,
          ownerId: savedPet.owner_id,
        },
        analysis
      );

const savedHistory = await petAnalysisHistoryService.saveAnalysis(historyRecord);

if (metadata && savedHistory?.id) {
  await supabaseAdmin
    .from("pet_analyses")
    .update({
      food_score: metadata.foodScore ?? null,
      matched_food_id: metadata.matchedFoodId ?? null,
      matched_food_name: metadata.matchedFoodName ?? null,
      feeding_grams_per_day: metadata.feedingGramsPerDay ?? null,
      weight_goal: metadata.weightGoal ?? null,
    })
    .eq("id", savedHistory.id);
}    }

    return NextResponse.json({
      success: true,
      customer,
      pet: savedPet,
      analysisHistory: historyRecord,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save account chatbot result.",
      },
      { status: 500 }
    );
  }
}
