"use client";

import { useState } from "react";
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
  const no = parseYesNo(text) === false;

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

function formatAnalysisResult(analysis: PetAnalysis) {
  const { nutrition, advice, recommendedFoods } = analysis;
  const topFoods = recommendedFoods.slice(0, 3);

  return `Έτοιμη η πρώτη διατροφική ανάλυση:

RER: ${nutrition.rer} kcal
MER/DER: ${nutrition.der} kcal

Βασικά σημεία:
${
  advice.length > 0
    ? advice
        .map((item) => `• ${item.title}: ${item.description}`)
        .join("\n")
    : "• Δεν υπάρχουν ειδικές παρατηρήσεις."
}

Προτεινόμενες τροφές:
${
  topFoods.length > 0
    ? topFoods
        .map(
          (item, index) =>
            `${index + 1}. ${item.food.brand} — ${item.food.name}`
        )
        .join("\n")
    : "Δεν βρέθηκαν κατάλληλες τροφές."
}

Σημείωση: Η πρόταση είναι βοηθητική και δεν αντικαθιστά κτηνιατρική συμβουλή.`;
}

function getFoodKcalPer100g(food: any): number | null {
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

  const [step, setStep] = useState<IntakeStep>("species");
  const [input, setInput] = useState("");

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
      "Γεια σου! Θα σε βοηθήσω να βρούμε τις βασικές διατροφικές ανάγκες του κατοικιδίου σου. Έχεις σκύλο ή γάτα;"
    ),
  ]);

  function addMessages(...nextMessages: ChatMessage[]) {
    setMessages((prev) => [...prev, ...nextMessages]);
  }

  async function runAnalysis(nextPet: PetIntake) {
    try {
      setIsAnalyzing(true);
      setStep("analysis");

      addMessages(
        createMessage(
          "bot",
          "Τέλεια. Υπολογίζω τώρα τις ανάγκες και ψάχνω κατάλληλες τροφές..."
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
              ? "Στόχος: διατήρηση βάρους. Οι θερμίδες βασίζονται στις ανάγκες συντήρησης."
              : nextPet.weightGoal === "loss"
                ? "Στόχος: απώλεια βάρους. Οι θερμίδες έχουν μειωθεί προσεκτικά για πιο ασφαλή έλεγχο βάρους."
                : "Στόχος: αύξηση βάρους. Οι θερμίδες έχουν αυξηθεί ελεγχόμενα."
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
            `Λιχουδιές:
Καλό είναι οι λιχουδιές να μην ξεπερνούν περίπου το 10% των ημερήσιων θερμίδων.

Σύνολο στόχου: ${treats.dailyCalories} kcal/ημέρα
Μέγιστο από λιχουδιές: περίπου ${treats.maxTreatCalories} kcal/ημέρα
Κύρια τροφή: περίπου ${treats.mainFoodCalories} kcal/ημέρα`
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
                  matchedFoodName: `${matchedFood.brand} — ${matchedFood.name}`,
                  feedingGramsPerDay: grams.gramsPerDay,
                  weightGoal: nextPet.weightGoal ?? "maintain",
                });
                addMessages(
                  createMessage(
                    "bot",
                    `Βρήκα πιθανή αντιστοίχιση με την τροφή:
${matchedFood.brand} — ${matchedFood.name}

Food score: ${foodScore}/100 — ${getFoodScoreLabel(foodScore)}
${buildFoodScoreExplanation(foodScore)}

Με βάση στόχο ${getWeightGoalLabel(nextPet.weightGoal)} και ${grams.dailyCalories} kcal/ημέρα:

Ποσότητα κύριας τροφής: περίπου ${grams.gramsPerDay}g/ημέρα
Αν ταΐζεις 2 γεύματα: περίπου ${grams.gramsPerMealTwoMeals}g ανά γεύμα
Αν ταΐζεις 3 γεύματα: περίπου ${grams.gramsPerMealThreeMeals}g ανά γεύμα

${
  treats
    ? `Αν δίνεις λιχουδιές, κράτησέ τες έως περίπου ${treats.maxTreatCalories} kcal/ημέρα.
Η ποσότητα τροφής παραπάνω έχει υπολογιστεί με χώρο για λιχουδιές.`
    : ""
}

${
  explanation.length > 0
    ? `Τι παρατηρώ για την τροφή:
${explanation.map((item) => `• ${item}`).join("\n")}`
    : ""
}`
                  )
                );
              }
            } else {
              setAnalysisMetadata({
                foodScore,
                matchedFoodId: matchedFood.id ?? null,
                matchedFoodName: `${matchedFood.brand} — ${matchedFood.name}`,
                feedingGramsPerDay: null,
                weightGoal: nextPet.weightGoal ?? "maintain",
              });
              addMessages(
                createMessage(
                  "bot",
                  `Βρήκα πιθανή τροφή:
${matchedFood.brand} — ${matchedFood.name}

Food score: ${foodScore}/100 — ${getFoodScoreLabel(foodScore)}
${buildFoodScoreExplanation(foodScore)}

Δεν βρήκα θερμίδες ανά 100g στη βάση, οπότε δεν μπορώ ακόμα να υπολογίσω ακριβή γραμμάρια για αυτή την τροφή.

${
  explanation.length > 0
    ? `Τι παρατηρώ για την τροφή:
${explanation.map((item) => `• ${item}`).join("\n")}`
    : ""
}`
                )
              );
            }
          } else {
            addMessages(
              createMessage(
                "bot",
                "Δεν βρήκα με σιγουριά την τωρινή τροφή στη βάση. Μπορώ όμως να συνεχίσω με τις γενικές θερμιδικές ανάγκες."
              )
            );
          }
        } catch (error) {
          console.error(error);
        }
      }

      if (nextPet.currentFoodName) {
        const transitionGuide = buildFoodTransitionGuide();

        addMessages(
          createMessage(
            "bot",
            `Αν αποφασίσεις να αλλάξεις τροφή, κάν' το σταδιακά:

${transitionGuide.map((item) => `• ${item}`).join("\n")}

Αν εμφανιστούν εμετοί, διάρροια ή έντονη δυσφορία, σταμάτα την αλλαγή και μίλα με κτηνίατρο.`
          )
        );
      }

      setShowSave(true);
      setStep("done");

      addMessages(
        createMessage(
          "bot",
          "Μπορείς να αποθηκεύσεις την ανάλυση στο προσωπικό σου προφίλ."
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
    if (step === "species") {
      const species = parseSpecies(text);

      if (!species) {
        addMessages(
          createMessage(
            "bot",
            "Δεν κατάλαβα αν είναι σκύλος ή γάτα. Γράψε π.χ. «σκύλος» ή «γάτα»."
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
            ? "Τέλεια, σκύλος. Πώς τον λένε;"
            : "Τέλεια, γάτα. Πώς τη λένε;"
        )
      );

      return;
    }

    if (step === "name") {
      setPet((prev) => ({ ...prev, name: text }));
      setStep("weight");

      addMessages(
        createMessage("bot", `Ωραία. Πόσα κιλά είναι περίπου ο/η ${text};`)
      );

      return;
    }

    if (step === "weight") {
      const weight = parseNumber(text);

      if (!weight || weight <= 0) {
        addMessages(
          createMessage("bot", "Γράψε μου το βάρος με αριθμό, π.χ. 4.5 κιλά.")
        );

        return;
      }

      setPet((prev) => ({ ...prev, weight }));
      setStep("age");

      addMessages(createMessage("bot", "Τέλεια. Τι ηλικία έχει;"));

      return;
    }

    if (step === "age") {
      const age = parseNumber(text);

      if (age === null || age < 0) {
        addMessages(
          createMessage("bot", "Γράψε μου την ηλικία με αριθμό, π.χ. 3 ετών.")
        );

        return;
      }

      setPet((prev) => ({ ...prev, age }));
      setStep("activity");

      addMessages(
        createMessage(
          "bot",
          "Πώς είναι η δραστηριότητά του; Χαμηλή, κανονική ή υψηλή;"
        )
      );

      return;
    }

    if (step === "activity") {
      const activityLevel = parseActivity(text);

      if (!activityLevel) {
        addMessages(
          createMessage(
            "bot",
            "Γράψε μία επιλογή: χαμηλή, κανονική ή υψηλή δραστηριότητα."
          )
        );

        return;
      }

      setPet((prev) => ({ ...prev, activityLevel }));
      setStep("neutered");

      addMessages(createMessage("bot", "Είναι στειρωμένο; Ναι ή όχι;"));

      return;
    }

    if (step === "neutered") {
      const neutered = parseYesNo(text);

      if (neutered === null) {
        addMessages(createMessage("bot", "Γράψε απλά «ναι» ή «όχι»."));
        return;
      }

      setPet((prev) => ({ ...prev, neutered }));
      setStep("health");

      addMessages(
        createMessage(
          "bot",
          "Υπάρχουν αλλεργίες, ευαισθησίες ή θέματα υγείας; Αν όχι, γράψε «όχι». Αν ναι, γράψε τα χωρισμένα με κόμμα."
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
          "Ποια τροφή δίνεις τώρα; Γράψε μάρκα και όνομα τροφής αν τα ξέρεις. Αν δεν δίνεις κάποια συγκεκριμένη, γράψε «δεν ξέρω»."
        )
      );

      return;
    }

    if (step === "currentFood") {
      const currentFoodName = text.trim();

      const nextPet: PetIntake = {
        ...pet,
        currentFoodName:
          currentFoodName.toLowerCase().includes("δεν ξέρω") ||
          currentFoodName.toLowerCase().includes("δεν ξερω")
            ? undefined
            : currentFoodName,
      };

      setPet(nextPet);
      setStep("weightGoal");

      addMessages(
        createMessage(
          "bot",
          "Ποιος είναι ο στόχος βάρους; Να κρατήσει βάρος, να χάσει βάρος ή να πάρει βάρος;"
        )
      );

      return;
    }

    if (step === "weightGoal") {
      const weightGoal = parseWeightGoal(text);

      if (!weightGoal) {
        addMessages(
          createMessage(
            "bot",
            "Γράψε μία επιλογή: να κρατήσει βάρος, να χάσει βάρος ή να πάρει βάρος."
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
            ? "Οκ, στόχος είναι η διατήρηση βάρους. Προχωράω στην ανάλυση."
            : weightGoal === "loss"
              ? "Οκ, στόχος είναι η απώλεια βάρους. Θα είμαι πιο προσεκτικός με τις θερμίδες."
              : "Οκ, στόχος είναι η αύξηση βάρους. Θα λάβω υπόψη αυξημένες ανάγκες."
        )
      );

      await runAnalysis(nextPet);
      return;
    }

    if (step === "analysis") {
      addMessages(
        createMessage("bot", "Περίμενε λίγο, ολοκληρώνω την ανάλυση.")
      );

      return;
    }

    addMessages(
      createMessage(
        "bot",
        "Η ανάλυση ολοκληρώθηκε. Μπορείς να την αποθηκεύσεις ή να πατήσεις Restart."
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
            "Δεν υπάρχει ανάλυση για αποθήκευση. Κάνε πρώτα ανάλυση."
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

      const petForSave = createPetFromIntake(pet);

      const response = await fetch("/api/account/chatbot/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authUserId: data.session.user.id,
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
`Αποθηκεύτηκε επιτυχώς στο προφίλ σου!\n\nΜπορείς να το δεις εδώ:\n${siteUrl}/account/pets/${result.pet.id}`        )
      );

      setShowSave(false);
    } catch (error) {
      console.error(error);

      addMessages(
        createMessage("bot", "Σφάλμα κατά την αποθήκευση. Δοκίμασε ξανά.")
      );
    } finally {
      setIsSaving(false);
    }
  }

  function restartChat() {
    setStep("species");
    setPet({ healthIssues: [], allergies: [] });
    setInput("");
    setLatestAnalysis(null);
    setIsAnalyzing(false);
    setShowSave(false);
    setIsSaving(false);
    setAnalysisMetadata(null);

    setMessages([
      createMessage("bot", "Ξεκινάμε ξανά. Έχεις σκύλο ή γάτα;"),
    ]);
  }

  return (
    <section className="mx-auto flex max-w-3xl flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5">
        <div>
          <h1 className="text-2xl font-bold text-black">
            Nutritail AI Chatbot
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            Προσωπικός βοηθός διατροφής για το κατοικίδιό σου.
          </p>
        </div>

        <div className="flex gap-2">
          <a
            href="/account"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-black transition hover:bg-gray-100"
          >
            Account
          </a>

          <button
            type="button"
            onClick={restartChat}
            className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
          >
            Restart
          </button>
        </div>
      </div>

      <div className="flex min-h-[500px] flex-1 flex-col gap-4 p-5">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm ${
              message.role === "bot"
                ? "self-start bg-gray-100 text-black"
                : "self-end bg-black text-white"
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>

      {showSave && (
        <div className="space-y-4 border-t border-gray-200 px-5 py-4">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="font-semibold text-black">Save to my account</p>

            <p className="mt-1 text-sm text-gray-700">
              Αποθήκευσε το κατοικίδιο και την ανάλυση στο προσωπικό σου προφίλ.
            </p>
          </div>

          <button
            type="button"
            onClick={saveToMyAccount}
            disabled={isSaving}
            className="w-full rounded-xl bg-green-600 py-3 text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "💾 Save to my account"}
          </button>
        </div>
      )}

      <div className="flex gap-3 border-t border-gray-200 p-5">
        <input
          value={input}
          disabled={isAnalyzing || isSaving}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
          placeholder={isAnalyzing ? "Γίνεται ανάλυση..." : "Γράψε μήνυμα..."}
          className="flex-1 rounded-xl border border-gray-300 p-3 text-black disabled:bg-gray-100"
        />

        <button
          type="button"
          onClick={sendMessage}
          disabled={isAnalyzing || isSaving}
          className="rounded-xl bg-black px-5 py-3 text-white disabled:opacity-50"
        >
          {isAnalyzing ? "..." : "Send"}
        </button>
      </div>
    </section>
  );
}
