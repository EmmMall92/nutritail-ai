import { readFileSync } from "node:fs";
import {
  mapDbPetAnalysisToPetAnalysisHistory,
  mapPetAnalysisHistoryToApiRecord,
} from "../../mappers/petAnalysisMapper";
import type { DbPetAnalysis } from "../../types/db/db-pet-analysis";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const dbAnalysis: DbPetAnalysis = {
  id: "analysis-id",
  pet_id: "pet-id",
  owner_id: "owner-id",
  rer: 612,
  mer: 979,
  recommended_food_ids: ["food-id"],
  notes: null,
  weight: 18,
  age: 4,
  activity_level: "normal",
  neutered: true,
  allergies: [],
  health_issues: [],
  food_score: 88,
  matched_food_id: "food-id",
  matched_food_name: "Test Brand - Salmon",
  feeding_grams_per_day: 268,
  weight_goal: "maintain",
  created_at: "2026-09-13T19:17:11.797Z",
};

const apiRecord = mapPetAnalysisHistoryToApiRecord(
  mapDbPetAnalysisToPetAnalysisHistory(dbAnalysis)
);

for (const [field, expected] of [
  ["matchedFoodName", "Test Brand - Salmon"],
  ["matched_food_name", "Test Brand - Salmon"],
  ["feedingGramsPerDay", 268],
  ["feeding_grams_per_day", 268],
  ["foodScore", 88],
  ["food_score", 88],
  ["weightGoal", "maintain"],
  ["weight_goal", "maintain"],
  ["createdAt", "2026-09-13T19:17:11.797Z"],
  ["created_at", "2026-09-13T19:17:11.797Z"],
] as const) {
  assert(
    apiRecord[field] === expected,
    `Expected ${field} to equal ${String(expected)}, got ${String(apiRecord[field])}.`
  );
}

for (const routePath of [
  "app/api/account/pets/route.ts",
  "app/api/account/pets/[id]/route.ts",
  "app/api/print/pet-report/[id]/route.ts",
]) {
  const source = readFileSync(routePath, "utf8");
  assert(
    source.includes("mapPetAnalysisHistoryToApiRecord"),
    `${routePath} must serialize analysis metadata for customer pages.`
  );
}

const chatbotSource = readFileSync("app/account/chatbot/page.tsx", "utf8");
for (const marker of [
  "foodScore: choice.score ?? null",
  "matchedFoodId: choice.foodProductId ?? null",
]) {
  assert(
    chatbotSource.includes(marker),
    `Chatbot food selection is missing saved metadata marker: ${marker}`
  );
}

console.log("Pet analysis API contract passed.");
