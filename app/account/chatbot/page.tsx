"use client";

import { generateIngredientInsights } from "@/lib/nutrition/ingredientInsights";
import { generateNutritionInsights } from "@/lib/nutrition/nutritionInsights";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calculateFeedingGrams } from "@/lib/feedingCalculator";
import { buildFoodExplanation } from "@/lib/foodExplanation";
import {
  adjustCaloriesForWeightGoal,
  getWeightGoalLabel,
} from "@/lib/weightGoalCalories";
import { calculateTreatsAllowance } from "@/lib/treatsCalculator";
import { buildFoodTransitionGuide } from "@/lib/foodTransitionGuide";
import { calculateFoodScore } from "@/lib/foodScore";
import {
  buildFoodScoreExplanation,
  getFoodScoreLabel,
} from "@/lib/foodScoreExplanation";

import type { Pet } from "@/types/pet";
import type { PetAnalysis } from "@/types/pet-analysis";

type Species = "dog" | "cat";
type ActivityLevel = "low" | "normal" | "high";
type WeightGoal = "maintain" | "loss" | "gain";

type IntakeStep =
  | "petChoice"
  | "species"
  | "name"
  | "weight"
  | "age"
  | "activity"
  | "neutered"
  | "health"
  | "currentFood"
  | "weightGoal"
  | "analysis"
  | "done";

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
};

type PetIntake = {
  species?: Species;
  name?: string;
  weight?: number;
  age?: number;
  activityLevel?: ActivityLevel;
  neutered?: boolean;
  healthIssues: string[];
  allergies: string[];
  currentFoodName?: string;
  weightGoal?: WeightGoal;
};

type AccountPet = {
  id: string;
  name: string;
  species: Species;
  breed?: string | null;
  age: number;
  weight: number;
  activity_level: ActivityLevel;
  neutered?: boolean | null;
  allergies?: string[] | null;
  health_issues?: string[] | null;
};

type AnalysisMetadata = {
  foodScore?: number | null;
  matchedFoodId?: string | null;
  matchedFoodName?: string | null;
  feedingGramsPerDay?: number | null;
  weightGoal?: WeightGoal | null;
};

function createMessage(role: "bot" | "user", text: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    text,
  };
}

function parseSpecies(text: string): Species | null {
  const value = text.toLowerCase();

  if (value.includes("σκυ") || value.includes("dog")) return "dog";
  if (value.includes("γατ") || value.includes("cat")) return "cat";

  return null;
}

function parseActivity(text: string): ActivityLevel | null {
  const value = text.toLowerCase();

  if (value.includes("χαμη") || value.includes("low")) return "low";

  if (
    value.includes("υψη") ||
    value.includes("πολυ") ||
    value.includes("high")
  ) {
    return "high";
  }

  if (
    value.includes("κανον") ||
    value.includes("μετρι") ||
    value.includes("normal") ||
    value.includes("medium")
  ) {
    return "normal";
  }

  return null;
}

function parseYesNo(text: string): boolean | null {
  const value = text.toLowerCase();

  if (value.includes("ναι") || value.includes("yes")) return true;

  if (
    value.includes("οχι") ||
    value.includes("όχι") ||
    value.includes("no")
  ) {
    return false;
  }

  return null;
}

function parseNumber(text: string): number | null {
  const normalized = text.replace(",", ".");
  const match = normalized.match(/\d+(\.\d+)?/);

  if (!match) return null;

  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

function parseListOrEmpty(text: string) {
  const no = parseYesNoInput(text) === false;

  if (no) return [];

  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseWeightGoal(text: string): WeightGoal | null {
  const value = text.toLowerCase();

  if (
    value.includes("κρατ") ||
    value.includes("συντηρ") ||
    value.includes("maintain")
  ) {
    return "maintain";
  }

  if (
    value.includes("χασει") ||
    value.includes("χάσει") ||
    value.includes("αδυνατ") ||
    value.includes("loss") ||
    value.includes("lose")
  ) {
    return "loss";
  }

  if (
    value.includes("παρει") ||
    value.includes("πάρει") ||
    value.includes("gain")
  ) {
    return "gain";
  }

  return null;
}

function parseSpeciesInput(text: string): Species | null {
  const value = text.toLowerCase();

  if (
    value.includes("dog") ||
    value.includes("σκυλ") ||
    value.includes("σκύλ") ||
    value.includes("skyl") ||
    value.includes("skil")
  ) {
    return "dog";
  }

  if (
    value.includes("cat") ||
    value.includes("γατ") ||
    value.includes("γάτ") ||
    value.includes("gat")
  ) {
    return "cat";
  }

  return parseSpecies(text);
}

function parseActivityInput(text: string): ActivityLevel | null {
  const value = text.toLowerCase();

  if (
    value.includes("low") ||
    value.includes("χαμηλ") ||
    value.includes("xamhl") ||
    value.includes("xamil")
  ) {
    return "low";
  }

  if (
    value.includes("high") ||
    value.includes("υψηλ") ||
    value.includes("ψηλ") ||
    value.includes("πολυ") ||
    value.includes("πολύ") ||
    value.includes("ypsil") ||
    value.includes("ipsil") ||
    value.includes("poly")
  ) {
    return "high";
  }

  if (
    value.includes("normal") ||
    value.includes("medium") ||
    value.includes("κανον") ||
    value.includes("μετρι") ||
    value.includes("μέτρι") ||
    value.includes("kanon") ||
    value.includes("metri")
  ) {
    return "normal";
  }

  return parseActivity(text);
}

function parseYesNoInput(text: string): boolean | null {
  const value = text.toLowerCase();

  if (
    value === "y" ||
    value.includes("yes") ||
    value.includes("ναι") ||
    value.includes("nai")
  ) {
    return true;
  }

  if (
    value === "n" ||
    value.includes("no") ||
    value.includes("όχι") ||
    value.includes("οχι") ||
    value.includes("oxi") ||
    value.includes("ochi")
  ) {
    return false;
  }

  return parseYesNo(text);
}

function parseWeightGoalInput(text: string): WeightGoal | null {
  const value = text.toLowerCase();

  if (
    value.includes("maintain") ||
    value.includes("maintenance") ||
    value.includes("κρατ") ||
    value.includes("συντηρ") ||
    value.includes("diatir") ||
    value.includes("syntir")
  ) {
    return "maintain";
  }

  if (
    value.includes("loss") ||
    value.includes("lose") ||
    value.includes("χασ") ||
    value.includes("αδυνατ") ||
    value.includes("xas") ||
    value.includes("adynat")
  ) {
    return "loss";
  }

  if (
    value.includes("gain") ||
    value.includes("παρ") ||
    value.includes("βαλ") ||
    value.includes("parei") ||
    value.includes("pari") ||
    value.includes("valei")
  ) {
    return "gain";
  }

  return parseWeightGoal(text);
}

function isUnknownFoodAnswer(text: string) {
  const value = text.toLowerCase();

  return [
    "i don't know",
    "dont know",
    "don't know",
    "not sure",
    "δεν ξερω",
    "δεν ξέρω",
    "den ksero",
    "den xero",
  ].some((phrase) => value.includes(phrase));
}

function getFoodQualityNote(food: Record<string, unknown>) {
  const status = String(food.data_quality_status ?? "").toLowerCase();

  if (status === "verified") {
    return "Data quality: verified official source. I can be more confident about this formula's published nutrition fields.";
  }

  if (status === "partial") {
    return "Data quality: partial official source. Some minerals or calories may be missing, so I will avoid overclaiming.";
  }

  if (status === "needs_review" || status === "unknown") {
    return "Data quality: needs review. Treat this match as tentative until the nutrition panel is confirmed.";
  }

  return "Data quality: not fully classified yet. I will keep the recommendation cautious.";
}

function createPetFromIntake(intake: PetIntake): Pet {
  return {
    id: crypto.randomUUID(),
    ownerId: "11111111-1111-1111-1111-111111111111",
    name: intake.name ?? "Pet",
    species: intake.species ?? "dog",
    breed: "unknown",
    age: intake.age ?? 1,
    weight: intake.weight ?? 1,
    activityLevel: intake.activityLevel ?? "normal",
    neutered: intake.neutered ?? false,
    allergies: intake.allergies ?? [],
    healthIssues: intake.healthIssues ?? [],
  };
}

function createIntakeFromSavedPet(savedPet: AccountPet): PetIntake {
  return {
    species: savedPet.species,
    name: savedPet.name,
    weight: savedPet.weight,
    age: savedPet.age,
    activityLevel: savedPet.activity_level,
    neutered: savedPet.neutered ?? false,
    healthIssues: savedPet.health_issues ?? [],
    allergies: savedPet.allergies ?? [],
  };
}

function formatAnalysisResult(analysis: PetAnalysis) {
  const { nutrition, advice, recommendedFoods } = analysis;
  const topFoods = recommendedFoods.slice(0, 3);

  return `Your first nutrition analysis is ready:

RER: ${nutrition.rer} kcal
MER/DER: ${nutrition.der} kcal

Key notes:
${
  advice.length > 0
    ? advice
        .map((item) => `- ${item.title}: ${item.description}`)
        .join("\n")
    : "- No special notes for this analysis."
}

Recommended foods:
${
  topFoods.length > 0
    ? topFoods
        .map(
          (item, index) =>
            `${index + 1}. ${item.food.brand} - ${item.food.name}`
        )
        .join("\n")
    : "No matching foods were found yet."
}

Note: This guidance is educational and does not replace veterinary advice.`;
}


function getFoodKcalPer100g(food: Record<string, unknown>): number | null {
  const possibleValues = [
    food.kcal_per_100g,
    food.kcalPer100g,
    food.calories_per_100g,
    food.caloriesPer100g,
    food.energy_kcal,
    food.energyKcal,
    food.calories,
  ];

  for (const value of possibleValues) {
    const numberValue = Number(value);

    if (Number.isFinite(numberValue) && numberValue > 0) {
      return numberValue;
    }
  }

  return null;
}

export default function AccountChatbotPage() {
  const router = useRouter();
  const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const [step, setStep] = useState<IntakeStep>("petChoice");
  const [input, setInput] = useState("");
  const [savedPets, setSavedPets] = useState<AccountPet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [isLoadingPets, setIsLoadingPets] = useState(true);

  const [pet, setPet] = useState<PetIntake>({
    healthIssues: [],
    allergies: [],
  });

  const [latestAnalysis, setLatestAnalysis] =
    useState<PetAnalysis | null>(null);
  
  const [analysisMetadata, setAnalysisMetadata] =
  useState<AnalysisMetadata | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage(
      "bot",
      "Hi! Choose one of your saved pets for a new nutrition analysis, or start with a new pet."
    ),
  ]);

  function addMessages(...nextMessages: ChatMessage[]) {
    setMessages((prev) => [...prev, ...nextMessages]);
  }

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, showSave, step]);

  useEffect(() => {
    async function loadSavedPets() {
      try {
        setIsLoadingPets(true);

        const supabase = createClient();
        const { data } = await supabase.auth.getSession();

        if (!data.session?.user) {
          router.replace("/login");
          return;
        }

        const response = await fetch("/api/account/pets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            authUserId: data.session.user.id,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load saved pets.");
        }

        const pets = (result.pets ?? []) as AccountPet[];
        setSavedPets(pets);

        if (pets.length === 0) {
          setStep("species");
          addMessages(
            createMessage(
              "bot",
              "No saved pets yet. Let's start a new analysis. Do you have a dog or a cat?"
            )
          );
        }
      } catch (error) {
        console.error(error);
        setStep("species");
        addMessages(
          createMessage(
            "bot",
            "I could not load your saved pets, so let's start a new analysis. Do you have a dog or a cat?"
          )
        );
      } finally {
        setIsLoadingPets(false);
      }
    }

    loadSavedPets();
  }, [router]);

  function selectSavedPet(savedPet: AccountPet) {
    const nextPet = createIntakeFromSavedPet(savedPet);

    setSelectedPetId(savedPet.id);
    setPet(nextPet);
    setStep("currentFood");

    addMessages(
      createMessage("user", `Use ${savedPet.name}`),
      createMessage(
        "bot",
        `Great. I will use ${savedPet.name}'s saved profile. What food is ${savedPet.name} eating now? If you are not sure, type "I don't know".`
      )
    );
  }

  function startNewPetAnalysis() {
    setSelectedPetId(null);
    setPet({ healthIssues: [], allergies: [] });
    setStep("species");

    addMessages(
      createMessage("user", "Start with a new pet"),
      createMessage("bot", "Great. Do you have a dog or a cat?")
    );
  }

  async function runAnalysis(nextPet: PetIntake) {
    try {
      setIsAnalyzing(true);
      setStep("analysis");

      addMessages(
        createMessage(
          "bot",
          "Great. I am calculating nutrition needs and checking suitable foods..."
        )
      );

      const petForAnalysis = createPetFromIntake(nextPet);

      const response = await fetch("/api/chatbot/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(petForAnalysis),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to analyze pet.");
      }

      const analysis = result.analysis as PetAnalysis;
      setLatestAnalysis(analysis);

      addMessages(createMessage("bot", formatAnalysisResult(analysis)));

      if (nextPet.weightGoal) {
        addMessages(
          createMessage(
            "bot",
            nextPet.weightGoal === "maintain"
              ? "Goal: weight maintenance. Calories are based on maintenance needs."
              : nextPet.weightGoal === "loss"
                ? "Goal: weight loss. Calories have been reduced carefully for safer weight control."
                : "Goal: weight gain. Calories have been increased in a controlled way."
          )
        );
      }

      const adjustedCalories = adjustCaloriesForWeightGoal({
        calories: analysis.nutrition.der,
        goal: nextPet.weightGoal,
      });

      const treats = calculateTreatsAllowance(adjustedCalories);

      if (treats) {
        addMessages(
          createMessage(
            "bot",
            `Treat allowance:
Treats should stay around 10% of daily calories.

Daily calorie target: ${treats.dailyCalories} kcal/day
Maximum from treats: about ${treats.maxTreatCalories} kcal/day
Main food calories: about ${treats.mainFoodCalories} kcal/day`
          )
        );
      }

      if (nextPet.currentFoodName) {
        try {
          const matchResponse = await fetch("/api/account/foods/match", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: nextPet.currentFoodName,
              species: nextPet.species,
            }),
          });

          const matchResult = await matchResponse.json();

          if (matchResponse.ok && matchResult.match) {
            const matchedFood = matchResult.match;

            const protein =
              matchedFood.protein_percent ??
              matchedFood.protein ??
              matchedFood.protein_percentage ??
              matchedFood.crude_protein;

            const fat =
              matchedFood.fat_percent ??
              matchedFood.fat ??
              matchedFood.fat_percentage ??
              matchedFood.crude_fat;

            const fiber =
              matchedFood.fiber_percent ??
              matchedFood.fiber ??
              matchedFood.fiber_percentage ??
              matchedFood.crude_fiber;

            const sodium = matchedFood.sodium_percent ?? matchedFood.sodium;
            const magnesium =
              matchedFood.magnesium_percent ?? matchedFood.magnesium;
            const calcium = matchedFood.calcium_percent ?? matchedFood.calcium;
            const phosphorus =
              matchedFood.phosphorus_percent ?? matchedFood.phosphorus;
            
            const foodScore = calculateFoodScore({
              species: nextPet.species ?? "dog",
              age: nextPet.age ?? 1,
              neutered: nextPet.neutered ?? false,
              activityLevel: nextPet.activityLevel ?? "normal",
              weightGoal: nextPet.weightGoal,
              protein,
              fat,
              fiber,
              sodium,
              magnesium,
              lifeStage: matchedFood.life_stage,
            });
            const nutritionInsights = generateNutritionInsights({
  species: nextPet.species,
  neutered: nextPet.neutered,
  activityLevel: nextPet.activityLevel,
  weightGoal: nextPet.weightGoal,
  healthIssues: nextPet.healthIssues,

  protein,
  fat,
  fiber,
  calcium,
  phosphorus,
  magnesium,
  sodium,
  kcalPer100g: getFoodKcalPer100g(matchedFood),
  dataQualityStatus: matchedFood.data_quality_status,
  ingredients: Array.isArray(matchedFood.ingredients)
    ? matchedFood.ingredients.join(", ")
    : matchedFood.ingredients ?? matchedFood.ingredient_list ?? null,
});

const ingredientInsights = generateIngredientInsights(
  Array.isArray(matchedFood.ingredients)
    ? matchedFood.ingredients.join(", ")
    : matchedFood.ingredients ??
      matchedFood.ingredient_list ??
      null
);
            const explanation = buildFoodExplanation({
              species: nextPet.species ?? "dog",
              age: nextPet.age ?? 1,
              neutered: nextPet.neutered ?? false,
              activityLevel: nextPet.activityLevel ?? "normal",
              protein,
              fat,
              fiber,
              sodium,
              magnesium,
              calcium,
              phosphorus,
            });

            const kcalPer100g = getFoodKcalPer100g(matchedFood);

            if (kcalPer100g) {
              const grams = calculateFeedingGrams({
                dailyCalories: treats?.mainFoodCalories ?? adjustedCalories,
                kcalPer100g,
              });

              if (grams) {
                setAnalysisMetadata({
                  foodScore,
                  matchedFoodId: matchedFood.id ?? null,
                  matchedFoodName: `${matchedFood.brand} - ${matchedFood.name}`,
                  feedingGramsPerDay: grams.gramsPerDay,
                  weightGoal: nextPet.weightGoal ?? "maintain",
                });
                addMessages(
                  createMessage(
                    "bot",
                    `I found a likely match for the current food:
${matchedFood.brand} - ${matchedFood.name}

${getFoodQualityNote(matchedFood)}

Food score: ${foodScore}/100 - ${getFoodScoreLabel(foodScore)}
${buildFoodScoreExplanation(foodScore)}
Nutrition confidence: ${nutritionInsights.confidence.toUpperCase()}
${nutritionInsights.summary}

${
  nutritionInsights.positives.length > 0
    ? `Positive nutrition points:
${nutritionInsights.positives.map((item) => `- ${item}`).join("\n")}`
    : ""
}

${
  nutritionInsights.cautions.length > 0
    ? `Things to monitor:
${nutritionInsights.cautions.map((item) => `- ${item}`).join("\n")}`
    : ""
}
${
  ingredientInsights.positives.length > 0
    ? `Ingredient positives:
${ingredientInsights.positives.map((item) => `- ${item}`).join("\n")}`
    : ""
}

${
  ingredientInsights.cautions.length > 0
    ? `Ingredient cautions:
${ingredientInsights.cautions.map((item) => `- ${item}`).join("\n")}`
    : ""
}
Based on ${getWeightGoalLabel(nextPet.weightGoal)} and ${grams.dailyCalories} kcal/day:

Main food amount: about ${grams.gramsPerDay}g/day
If feeding 2 meals: about ${grams.gramsPerMealTwoMeals}g per meal
If feeding 3 meals: about ${grams.gramsPerMealThreeMeals}g per meal

${
  treats
    ? `If you give treats, keep them within about ${treats.maxTreatCalories} kcal/day.
The food amount above leaves room for treats.`
    : ""
}

${
  explanation.length > 0
    ? `Food notes:
${explanation.map((item) => `- ${item}`).join("\n")}`
    : ""
}`
                  )
                );
              }
            } else {
              setAnalysisMetadata({
                foodScore,
                matchedFoodId: matchedFood.id ?? null,
                matchedFoodName: `${matchedFood.brand} - ${matchedFood.name}`,
                feedingGramsPerDay: null,
                weightGoal: nextPet.weightGoal ?? "maintain",
              });
              addMessages(
                createMessage(
                  "bot",
                  `I found a likely food match:
${matchedFood.brand} - ${matchedFood.name}

${getFoodQualityNote(matchedFood)}

Food score: ${foodScore}/100 - ${getFoodScoreLabel(foodScore)}
${buildFoodScoreExplanation(foodScore)}

I did not find kcal per 100g in the database, so I cannot calculate exact grams for this food yet.

${
  explanation.length > 0
    ? `Food notes:
${explanation.map((item) => `- ${item}`).join("\n")}`
    : ""
}`
                )
              );
            }
          } else {
            addMessages(
              createMessage(
                "bot",
                "I could not confidently match the current food in the database. I can still continue with the general calorie guidance."
              )
            );
          }
        } catch (error) {
          console.error(error);
        }
      }

      if (nextPet.currentFoodName) {
        const transitionGuide = buildFoodTransitionGuide({
          healthIssues: nextPet.healthIssues,
          allergies: nextPet.allergies,
        });

        addMessages(
          createMessage(
            "bot",
            `If you decide to change food, do it gradually:

${transitionGuide.map((item) => `- ${item}`).join("\n")}

If vomiting, diarrhea, or strong discomfort appears, stop the transition and speak with a veterinarian.`
          )
        );
      }

      setShowSave(true);
      setStep("done");

      addMessages(
        createMessage(
          "bot",
          "You can save this analysis to your personal profile."
        )
      );
    } catch (error) {
      console.error(error);

      addMessages(
        createMessage(
          "bot",
          "Δεν κατάφερα να ολοκληρώσω την ανάλυση. Δοκίμασε ξανά λίγο αργότερα."
        )
      );

      setStep("done");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleStep(text: string) {
    if (step === "petChoice") {
      addMessages(
        createMessage(
          "bot",
          "Use the pet buttons above, or choose Start with a new pet."
        )
      );
      return;
    }

    if (step === "species") {
      const species = parseSpeciesInput(text);

      if (!species) {
        addMessages(
          createMessage(
            "bot",
            "I could not tell whether this is a dog or cat. Please type dog or cat."
          )
        );

        return;
      }

      setPet((prev) => ({ ...prev, species }));
      setStep("name");

      addMessages(
        createMessage(
          "bot",
          species === "dog"
            ? "Great, a dog. What is their name?"
            : "Great, a cat. What is their name?"
        )
      );

      return;
    }

    if (step === "name") {
      setPet((prev) => ({ ...prev, name: text }));
      setStep("weight");

      addMessages(
        createMessage("bot", `Nice. About how many kg is ${text}?`)
      );

      return;
    }

    if (step === "weight") {
      const weight = parseNumber(text);

      if (!weight || weight <= 0) {
        addMessages(
          createMessage("bot", "Please enter weight as a number, for example 4.5 kg.")
        );

        return;
      }

      setPet((prev) => ({ ...prev, weight }));
      setStep("age");

      addMessages(createMessage("bot", "Great. How old is your pet?"));

      return;
    }

    if (step === "age") {
      const age = parseNumber(text);

      if (age === null || age < 0) {
        addMessages(
          createMessage("bot", "Please enter age as a number, for example 3.")
        );

        return;
      }

      setPet((prev) => ({ ...prev, age }));
      setStep("activity");

      addMessages(
        createMessage(
          "bot",
          "What is your pet's activity level: low, normal, or high?"
        )
      );

      return;
    }

    if (step === "activity") {
      const activityLevel = parseActivityInput(text);

      if (!activityLevel) {
        addMessages(
          createMessage(
            "bot",
            "Choose one option: low, normal, or high activity."
          )
        );

        return;
      }

      setPet((prev) => ({ ...prev, activityLevel }));
      setStep("neutered");

      addMessages(createMessage("bot", "Is your pet neutered? Yes or no?"));

      return;
    }

    if (step === "neutered") {
      const neutered = parseYesNoInput(text);

      if (neutered === null) {
        addMessages(createMessage("bot", "Please answer yes or no."));
        return;
      }

      setPet((prev) => ({ ...prev, neutered }));
      setStep("health");

      addMessages(
        createMessage(
          "bot",
          "Any allergies, sensitivities, or health issues? If not, type no. If yes, separate them with commas."
        )
      );

      return;
    }

    if (step === "health") {
      const healthIssues = parseListOrEmpty(text);

      const nextPet: PetIntake = {
        ...pet,
        healthIssues,
        allergies: [],
      };

      setPet(nextPet);
      setStep("currentFood");

      addMessages(
        createMessage(
          "bot",
          "What food are you feeding now? Write the brand and product name if you know it. If you are not sure, type I don't know."
        )
      );

      return;
    }

    if (step === "currentFood") {
      const currentFoodName = text.trim();

      const nextPet: PetIntake = {
        ...pet,
        currentFoodName:
          isUnknownFoodAnswer(currentFoodName)
            ? undefined
            : currentFoodName,
      };

      setPet(nextPet);
      setStep("weightGoal");

      addMessages(
        createMessage(
          "bot",
          "What is the weight goal: maintain weight, lose weight, or gain weight?"
        )
      );

      return;
    }

    if (step === "weightGoal") {
      const weightGoal = parseWeightGoalInput(text);

      if (!weightGoal) {
        addMessages(
          createMessage(
            "bot",
            "Choose one option: maintain weight, lose weight, or gain weight."
          )
        );

        return;
      }

      const nextPet: PetIntake = {
        ...pet,
        weightGoal,
      };

      setPet(nextPet);

      addMessages(
        createMessage(
          "bot",
          weightGoal === "maintain"
            ? "Got it. The goal is weight maintenance. I will continue with the analysis."
            : weightGoal === "loss"
              ? "Got it. The goal is weight loss. I will be more careful with calories."
              : "Got it. The goal is weight gain. I will account for higher energy needs."
        )
      );

      await runAnalysis(nextPet);
      return;
    }

    if (step === "analysis") {
      addMessages(
        createMessage("bot", "Hold on a moment, I am finishing the analysis.")
      );

      return;
    }

    addMessages(
      createMessage(
        "bot",
        "The analysis is complete. You can save it or press Restart."
      )
    );
  }

  async function sendMessage() {
    const text = input.trim();

    if (!text || isAnalyzing || isSaving) return;
    addMessages(createMessage("user", text));
    setInput("");

    await handleStep(text);
  }

  async function saveToMyAccount() {
    try {
      setIsSaving(true);

      if (!latestAnalysis) {
        addMessages(
          createMessage(
            "bot",
            "There is no analysis to save yet. Run an analysis first."
          )
        );

        return;
      }

      const supabase = createClient();
      const { data } = await supabase.auth.getSession();

      if (!data.session?.user) {
        router.replace("/login");
        return;
      }

      const petForSave = {
        ...createPetFromIntake(pet),
        id: selectedPetId ?? crypto.randomUUID(),
      };

      const response = await fetch("/api/account/chatbot/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authUserId: data.session.user.id,
          existingPetId: selectedPetId,
          pet: petForSave,
          analysis: latestAnalysis,
          metadata: analysisMetadata,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save result.");
      }

      addMessages(
        createMessage(
          "bot",
          `Saved successfully to your profile! You can view it here:
${siteUrl}/account/pets/${result.pet.id}`
        )
      );

      setShowSave(false);
    } catch (error) {
      console.error(error);

      addMessages(
        createMessage(
          "bot",
          "There was a problem saving the analysis. Please try again."
        )
      );
    } finally {
      setIsSaving(false);
    }
  }

  function restartChat() {
    setStep(savedPets.length > 0 ? "petChoice" : "species");
    setPet({ healthIssues: [], allergies: [] });
    setSelectedPetId(null);
    setInput("");
    setLatestAnalysis(null);
    setIsAnalyzing(false);
    setShowSave(false);
    setIsSaving(false);
    setAnalysisMetadata(null);

    setMessages([
      createMessage(
        "bot",
        savedPets.length > 0
          ? "Let's start again. Choose a saved pet or start with a new pet."
          : "Let's start again. Do you have a dog or a cat?"
      ),
    ]);
  }

  return (
    <section className="mx-auto flex h-[calc(100svh-11rem)] min-h-[560px] max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex shrink-0 flex-col gap-4 border-b border-gray-200 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-black">
            Nutritail AI Chatbot
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            Personalized nutrition guidance for your pet.
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <a
            href="/account"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-center text-sm text-black transition hover:bg-gray-100 sm:flex-none"
          >
            Account
          </a>

          <button
            type="button"
            onClick={restartChat}
            className="flex-1 rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100 sm:flex-none"
          >
            Restart
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4 sm:p-5">
        {step === "petChoice" && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="font-semibold text-black">Choose a pet</p>
            <p className="mt-1 text-sm text-gray-600">
              Run a fresh analysis using a saved profile, or start a new pet.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {isLoadingPets ? (
                <p className="text-sm text-gray-600">Loading saved pets...</p>
              ) : (
                savedPets.map((savedPet) => (
                  <button
                    key={savedPet.id}
                    type="button"
                    onClick={() => selectSavedPet(savedPet)}
                    className="min-h-[92px] rounded-xl border border-gray-300 bg-white p-4 text-left transition hover:border-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <span className="block font-semibold text-black">
                      {savedPet.name}
                    </span>
                    <span className="mt-1 block text-sm text-gray-600">
                      {savedPet.species} - {savedPet.weight} kg - age{" "}
                      {savedPet.age}
                    </span>
                  </button>
                ))
              )}

              {!isLoadingPets && (
                <button
                  type="button"
                  onClick={startNewPetAnalysis}
                  className="min-h-[92px] rounded-xl border border-black bg-white p-4 text-left transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <span className="block font-semibold text-black">
                    Start with a new pet
                  </span>
                  <span className="mt-1 block text-sm text-gray-600">
                    Answer the full intake flow from scratch.
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[92%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[85%] ${
              message.role === "bot"
                ? "self-start bg-gray-100 text-black"
                : "self-end bg-black text-white"
            }`}
          >
            {message.text}
          </div>
        ))}

        {showSave && (
          <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            {latestAnalysis && (
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="font-semibold text-black">Analysis summary</p>
                <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-500">Pet</p>
                    <p className="font-semibold text-black">
                      {pet.name ?? "Pet"} - {pet.species ?? "pet"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-500">Daily calories</p>
                    <p className="font-semibold text-black">
                      {latestAnalysis.nutrition.der} kcal/day
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-500">Weight goal</p>
                    <p className="font-semibold text-black">
                      {getWeightGoalLabel(pet.weightGoal)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-500">Food match</p>
                    <p className="font-semibold text-black">
                      {analysisMetadata?.matchedFoodName ?? "No matched food"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="font-semibold text-black">Save to my account</p>

              <p className="mt-1 text-sm text-gray-700">
                Save this pet and nutrition analysis to your personal profile.
              </p>
            </div>

            <button
              type="button"
              onClick={saveToMyAccount}
              disabled={isSaving}
              className="w-full rounded-xl bg-green-600 py-3 text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save to my account"}
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 flex shrink-0 gap-3 border-t border-gray-200 bg-white p-4 shadow-[0_-8px_20px_rgba(0,0,0,0.04)] sm:p-5">
        <input
          value={input}
          disabled={isAnalyzing || isSaving}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
          placeholder={isAnalyzing ? "Analyzing..." : "Write a message..."}
          className="min-w-0 flex-1 rounded-xl border border-gray-300 p-3 text-black disabled:bg-gray-100"
        />

        <button
          type="button"
          onClick={sendMessage}
          disabled={isAnalyzing || isSaving}
          className="rounded-xl bg-black px-4 py-3 text-white disabled:opacity-50 sm:px-5"
        >
          {isAnalyzing ? "..." : "Send"}
        </button>
      </div>
    </section>
  );
}
