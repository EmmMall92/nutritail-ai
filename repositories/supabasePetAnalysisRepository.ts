import { supabase } from "@/lib/db/supabase";
import {
  mapDbPetAnalysisToPetAnalysisHistory,
  mapPetAnalysisHistoryToDbPetAnalysis,
} from "@/mappers/petAnalysisMapper";
import type { PetAnalysisHistory } from "@/types/pet-analysis-history";
import type { DbPetAnalysis } from "@/types/db/db-pet-analysis";

function toReadableError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    const parts = [
      typeof maybeError.message === "string" ? maybeError.message : "",
      typeof maybeError.details === "string" ? maybeError.details : "",
      typeof maybeError.hint === "string" ? maybeError.hint : "",
      typeof maybeError.code === "string" ? `code: ${maybeError.code}` : "",
    ].filter(Boolean);

    if (parts.length > 0) {
      return new Error(parts.join(" | "));
    }
  }

  return new Error(fallbackMessage);
}

export const supabasePetAnalysisRepository = {
  async create(analysis: PetAnalysisHistory) {
    const db = mapPetAnalysisHistoryToDbPetAnalysis(analysis);

    const { data, error } = await supabase
      .from("pet_analyses")
      .insert(db)
      .select("*")
      .single();

    if (error) {
      console.error("Supabase pet analysis create error:", {
        message: (error as { message?: string }).message,
        details: (error as { details?: string }).details,
        hint: (error as { hint?: string }).hint,
        code: (error as { code?: string }).code,
        raw: error,
      });

      throw toReadableError(error, "Failed to save analysis");
    }

    return mapDbPetAnalysisToPetAnalysisHistory(data as DbPetAnalysis);
  },

  async getByPet(petId: string) {
    const { data, error } = await supabase
      .from("pet_analyses")
      .select("*")
      .eq("pet_id", petId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase pet analysis getByPet error:", {
        message: (error as { message?: string }).message,
        details: (error as { details?: string }).details,
        hint: (error as { hint?: string }).hint,
        code: (error as { code?: string }).code,
        raw: error,
      });

      throw toReadableError(error, "Failed to load analyses");
    }

    return (data as DbPetAnalysis[]).map(
      mapDbPetAnalysisToPetAnalysisHistory
    );
  },
};