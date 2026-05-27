import type { Pet, PetActivityLevel, PetSpecies } from "@/types/pet";

const VALID_SPECIES: PetSpecies[] = ["dog", "cat"];
const VALID_ACTIVITY_LEVELS: PetActivityLevel[] = ["low", "normal", "high"];

export type PetValidationResult =
  | {
      ok: true;
      pet: Pet;
    }
  | {
      ok: false;
      error: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item).trim())
    .filter(Boolean);
}

export function validatePetAnalysisPayload(value: unknown): PetValidationResult {
  if (!isRecord(value)) {
    return { ok: false, error: "Pet payload must be an object." };
  }

  const species = String(value.species ?? "").trim() as PetSpecies;
  const activityLevel = String(value.activityLevel ?? "").trim() as PetActivityLevel;
  const weight = Number(value.weight);
  const age = Number(value.age);

  if (!VALID_SPECIES.includes(species)) {
    return { ok: false, error: "Pet species must be dog or cat." };
  }

  if (!VALID_ACTIVITY_LEVELS.includes(activityLevel)) {
    return {
      ok: false,
      error: "Pet activity level must be low, normal, or high.",
    };
  }

  if (!Number.isFinite(weight) || weight <= 0 || weight > 150) {
    return {
      ok: false,
      error: "Pet weight must be a positive number under 150kg.",
    };
  }

  if (!Number.isFinite(age) || age < 0 || age > 40) {
    return {
      ok: false,
      error: "Pet age must be a number between 0 and 40.",
    };
  }

  return {
    ok: true,
    pet: {
      id: String(value.id ?? crypto.randomUUID()),
      ownerId: String(value.ownerId ?? "11111111-1111-1111-1111-111111111111"),
      name: String(value.name ?? "Pet").trim() || "Pet",
      species,
      breed: String(value.breed ?? "unknown").trim() || "unknown",
      age,
      weight,
      activityLevel,
      neutered: Boolean(value.neutered),
      allergies: normalizeStringArray(value.allergies),
      healthIssues: normalizeStringArray(value.healthIssues),
    },
  };
}
