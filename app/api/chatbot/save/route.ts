import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { buildPetAnalysisHistoryRecord } from "@/services/petAnalysisHistoryBuilder";
import { petAnalysisHistoryService } from "@/services/petAnalysisHistoryService";
import type { DbCustomer } from "@/types/db/db-customer";
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

    const pet = body.pet as Pet;
    const analysis = body.analysis as PetAnalysis | null;
    const customerName = String(body.customerName ?? "").trim();
    const customerId = body.customerId ? String(body.customerId) : "";

    if (!pet) {
      return NextResponse.json({ error: "Missing pet." }, { status: 400 });
    }

    const petValidationError = getPetValidationError(pet);
    if (petValidationError) {
      return NextResponse.json({ error: petValidationError }, { status: 400 });
    }

    if (!customerId && !customerName) {
      return NextResponse.json(
        { error: "Missing customer." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    let customer: DbCustomer | null = null;

    if (customerId) {
      const { data, error } = await supabaseAdmin
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!data) {
        return NextResponse.json(
          { error: "Customer not found." },
          { status: 404 }
        );
      }

      customer = data;
    } else {
      const { data: existingCustomer, error: existingCustomerError } =
        await supabaseAdmin
          .from("customers")
          .select("*")
          .ilike("full_name", customerName)
          .order("created_at", { ascending: false })
          .limit(1);

      if (existingCustomerError) {
        return NextResponse.json(
          { error: existingCustomerError.message },
          { status: 500 }
        );
      }

      if (existingCustomer && existingCustomer.length > 0) {
        customer = existingCustomer[0];
      } else {
        const { data: newCustomer, error: newCustomerError } =
          await supabaseAdmin
            .from("customers")
            .insert({
              full_name: customerName,
              created_at: now,
              updated_at: now,
            })
            .select("*")
            .single();

        if (newCustomerError) {
          return NextResponse.json(
            { error: newCustomerError.message },
            { status: 500 }
          );
        }

        customer = newCustomer;
      }
    }

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 }
      );
    }

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

    let historyRecord = null;

    if (analysis) {
      historyRecord = buildPetAnalysisHistoryRecord(
        {
          ...pet,
          id: newPet.id,
          ownerId: newPet.owner_id,
        },
        analysis
      );

      await petAnalysisHistoryService.saveAnalysis(historyRecord);
    }

    return NextResponse.json({
      success: true,
      customer,
      pet: newPet,
      analysisHistory: historyRecord,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save chatbot result.",
      },
      { status: 500 }
    );
  }
}
