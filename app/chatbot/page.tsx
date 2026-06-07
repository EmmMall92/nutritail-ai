"use client";

import { useEffect, useState } from "react";
import { classifyIntakeNotes } from "@/lib/nutrition/intakeClassifier";
import {
  formatFoodV2ChatbotRecommendationSummary,
  goalFromPetContext,
  type FoodV2ChatbotRecommendationResponse,
} from "@/lib/food-v2/chatbotRecommendationSummary";
import type { Pet } from "@/types/pet";
import type { PetAnalysis } from "@/types/pet-analysis";

type Species = "dog" | "cat";
type ActivityLevel = "low" | "normal" | "high";

const MAX_PET_WEIGHT_KG = 150;
const MAX_PET_AGE_YEARS = 40;

type IntakeStep =
  | "species"
  | "name"
  | "weight"
  | "age"
  | "activity"
  | "neutered"
  | "health"
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
};

type Customer = {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  bonusCardCode?: string | null;
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
  if (
    value.includes("σκυ") ||
    value.includes("σκύ") ||
    value.includes("skyl") ||
    value.includes("skil") ||
    value.includes("dog")
  ) {
    return "dog";
  }
  if (
    value.includes("γατ") ||
    value.includes("γάτ") ||
    value.includes("gat") ||
    value.includes("cat")
  ) {
    return "cat";
  }
  return null;
}

function parseActivity(text: string): ActivityLevel | null {
  const value = text.toLowerCase();

  if (
    value.includes("χαμη") ||
    value.includes("xamhl") ||
    value.includes("xamil") ||
    value.includes("low")
  ) {
    return "low";
  }
  if (
    value.includes("υψη") ||
    value.includes("ψηλ") ||
    value.includes("πολυ") ||
    value.includes("πολύ") ||
    value.includes("ypsil") ||
    value.includes("ipsil") ||
    value.includes("poly") ||
    value.includes("high")
  ) {
    return "high";
  }
  if (
    value.includes("κανον") ||
    value.includes("μετρι") ||
    value.includes("μέτρι") ||
    value.includes("kanon") ||
    value.includes("metri") ||
    value.includes("normal") ||
    value.includes("medium")
  ) {
    return "normal";
  }

  return null;
}

function parseYesNo(text: string): boolean | null {
  const value = text.toLowerCase();

  if (value.includes("ναι") || value.includes("nai") || value.includes("yes")) return true;
  if (
    value.includes("οχι") ||
    value.includes("όχι") ||
    value.includes("oxi") ||
    value.includes("ochi") ||
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

  const seen = new Set<string>();
  const items: string[] = [];

  text
    .split(/[,|\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return;

      seen.add(key);
      items.push(item);
    });

  return items;
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
    ? advice.map((item) => `• ${item.title}: ${item.description}`).join("\n")
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

async function getFoodV2RecommendationMessage(pet: PetIntake) {
  if (!pet.species) return "";

  const goal = goalFromPetContext({
    species: pet.species,
    age: pet.age,
    neutered: pet.neutered,
    healthIssues: pet.healthIssues,
    allergies: pet.allergies,
  });

  const response = await fetch("/api/account/foods/v2-recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pet: {
        species: pet.species,
        breed: "unknown",
        age: pet.age,
        weight: pet.weight,
        activityLevel: pet.activityLevel,
        neutered: pet.neutered,
        allergies: pet.allergies,
        healthIssues: pet.healthIssues,
      },
      goal,
      format: "dry",
      limit_per_bucket: 3,
    }),
  });

  const result = (await response.json()) as FoodV2ChatbotRecommendationResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(result.error || "Could not load Food V2 recommendations.");
  }

  return formatFoodV2ChatbotRecommendationSummary(result);
}

export default function ChatbotPage() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const [step, setStep] = useState<IntakeStep>("species");
  const [input, setInput] = useState("");
  const [pet, setPet] = useState<PetIntake>({
    healthIssues: [],
    allergies: [],
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [useExistingCustomer, setUseExistingCustomer] = useState(true);

  const [latestAnalysis, setLatestAnalysis] = useState<PetAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage(
      "bot",
      "Γεια σου! Είμαι ο βοηθός διατροφής. Πες μου πρώτα: έχεις σκύλο ή γάτα;"
    ),
  ]);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const response = await fetch("/api/admin/customers", {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();

        if (response.ok) {
          setCustomers(result as Customer[]);
        }
      } catch (error) {
        console.error("Failed to load customers:", error);
      }
    }

    loadCustomers();
  }, []);

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

      try {
        const foodV2Message = await getFoodV2RecommendationMessage(nextPet);

        if (foodV2Message) {
          addMessages(createMessage("bot", foodV2Message));
        }
      } catch (error) {
        console.error(error);
      }

      setShowSave(true);
      setStep("done");

      addMessages(
        createMessage(
          "bot",
          "Η ανάλυση ολοκληρώθηκε. Μπορείς τώρα να αποθηκεύσεις το κατοικίδιο σε νέο ή υπάρχοντα πελάτη."
        )
      );
    } catch (error) {
      console.error(error);
      addMessages(
        createMessage(
          "bot",
          "Δεν κατάφερα να ολοκληρώσω την ανάλυση. Έλεγξε αν οι τροφές και η βάση δεδομένων φορτώνουν σωστά."
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

      if (!weight || weight <= 0 || weight > MAX_PET_WEIGHT_KG) {
        addMessages(
          createMessage(
            "bot",
            `Γράψε μου ένα ρεαλιστικό βάρος σε kg, π.χ. 4.5. Μέγιστο υποστηριζόμενο βάρος: ${MAX_PET_WEIGHT_KG} kg.`
          )
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

      if (age === null || age < 0 || age > MAX_PET_AGE_YEARS) {
        addMessages(
          createMessage(
            "bot",
            `Γράψε μου μια ρεαλιστική ηλικία σε χρόνια, π.χ. 3. Μέγιστη υποστηριζόμενη ηλικία: ${MAX_PET_AGE_YEARS}.`
          )
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
      const intakeClassification = classifyIntakeNotes(parseListOrEmpty(text));

      const nextPet: PetIntake = {
        ...pet,
        healthIssues: intakeClassification.healthIssues,
        allergies: intakeClassification.allergies,
      };

      setPet(nextPet);

      addMessages(
        createMessage(
          "bot",
          `Έχω τα βασικά στοιχεία:
Είδος: ${nextPet.species === "dog" ? "Σκύλος" : "Γάτα"}
Όνομα: ${nextPet.name}
Βάρος: ${nextPet.weight} kg
Ηλικία: ${nextPet.age}
Δραστηριότητα: ${nextPet.activityLevel}
Στειρωμένο: ${nextPet.neutered ? "Ναι" : "Όχι"}
Θέματα υγείας: ${
            nextPet.healthIssues.length > 0
              ? nextPet.healthIssues.join(", ")
              : "Δεν δηλώθηκαν"
          }`
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
        "Η ανάλυση ολοκληρώθηκε. Μπορείς να αποθηκεύσεις από το panel αποθήκευσης."
      )
    );
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || isAnalyzing || isSaving) return;

    const userMessage = createMessage("user", text);
    addMessages(userMessage);
    setInput("");

    await handleStep(text);
  }

  async function savePetAndCustomer() {
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

      if (useExistingCustomer && !selectedCustomerId) {
        addMessages(
          createMessage("bot", "Διάλεξε πρώτα έναν υπάρχοντα πελάτη.")
        );
        return;
      }

      if (!useExistingCustomer && !customerName.trim()) {
        addMessages(
          createMessage(
            "bot",
            "Γράψε πρώτα το όνομα του νέου ιδιοκτήτη."
          )
        );
        return;
      }

      const petForSave = createPetFromIntake(pet);

      const response = await fetch("/api/chatbot/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pet: petForSave,
          customerName: useExistingCustomer ? "" : customerName,
          customerId: useExistingCustomer ? selectedCustomerId : "",
          analysis: latestAnalysis,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save chatbot result.");
      }

      addMessages(
        createMessage(
          "bot",
          `Αποθηκεύτηκε επιτυχώς!

Customer:
${siteUrl}/admin/customers/${result.customer.id}

Pet:
${siteUrl}/admin/pets/${result.pet.id}

Το ιστορικό ανάλυσης αποθηκεύτηκε επίσης.`
        )
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
    setCustomerName("");
    setSelectedCustomerId("");
    setUseExistingCustomer(true);
    setShowSave(false);
    setIsSaving(false);
    setMessages([
      createMessage("bot", "Ξεκινάμε ξανά. Έχεις σκύλο ή γάτα;"),
    ]);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <section className="mx-auto flex max-w-3xl flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5">
          <div>
            <h1 className="text-2xl font-bold text-black">
              Nutrition Chatbot
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Βοηθός διατροφής για σκύλους και γάτες.
            </p>
          </div>

          <button
            type="button"
            onClick={restartChat}
            className="rounded-lg border border-black px-4 py-2 text-sm text-black transition hover:bg-gray-100"
          >
            Restart
          </button>
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
              <p className="font-semibold text-black">Save result</p>
              <p className="mt-1 text-sm text-gray-700">
                Αποθήκευσε το κατοικίδιο, τον πελάτη και το ιστορικό ανάλυσης.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setUseExistingCustomer(true)}
                className={`rounded-lg border px-4 py-2 text-sm ${
                  useExistingCustomer
                    ? "border-black bg-black text-white"
                    : "border-gray-300 text-black"
                }`}
              >
                Existing Customer
              </button>

              <button
                type="button"
                onClick={() => setUseExistingCustomer(false)}
                className={`rounded-lg border px-4 py-2 text-sm ${
                  !useExistingCustomer
                    ? "border-black bg-black text-white"
                    : "border-gray-300 text-black"
                }`}
              >
                New Customer
              </button>
            </div>

            {useExistingCustomer ? (
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 text-black"
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.fullName}
                    {customer.bonusCardCode
                      ? ` • ${customer.bonusCardCode}`
                      : ""}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Νέος ιδιοκτήτης / πελάτης"
                className="w-full rounded-xl border border-gray-300 p-3 text-black"
              />
            )}

            <button
              type="button"
              onClick={savePetAndCustomer}
              disabled={isSaving}
              className="w-full rounded-xl bg-green-600 py-3 text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "💾 Save Pet, Customer & Analysis"}
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
    </main>
  );
}
