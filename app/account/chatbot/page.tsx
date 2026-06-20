"use client";

import { generateIngredientInsights } from "@/lib/nutrition/ingredientInsights";
import { generateNutritionInsights } from "@/lib/nutrition/nutritionInsights";
import { classifyIntakeNotes } from "@/lib/nutrition/intakeClassifier";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import { generateChatGuardrails } from "@/lib/nutrition/chatGuardrails";
import {
  formatFoodV2ChatbotRecommendationSummary,
  goalFromPetContext,
  type FoodV2ChatbotRecommendationItem,
  type FoodV2ChatbotRecommendationResponse,
} from "@/lib/food-v2/chatbotRecommendationSummary";
import { customerFoodName } from "@/lib/food-v2/customerFoodName";
import { calculateMainFoodPortionEstimate } from "@/lib/chatbot/portionEstimate";
import { formatPetDisplayName } from "@/lib/petName";
import {
  parseTastePreferences as parseSharedTastePreferences,
  removeExcludedFromPreferred as removeSharedExcludedFromPreferred,
} from "@/lib/chatbot/tastePreferences";

import type { AiIntakeExtraction } from "@/lib/ai/intakeTypes";
import type { Pet } from "@/types/pet";
import type { PetAnalysis } from "@/types/pet-analysis";

type Species = "dog" | "cat";
type ActivityLevel = "low" | "normal" | "high";
type WeightGoal = "maintain" | "loss" | "gain";
type ChatLanguage = "el" | "en";

const MAX_DOG_WEIGHT_KG = 90;
const MAX_CAT_WEIGHT_KG = 15;
const MAX_PET_AGE_YEARS = 40;

const legacyGreekMojibakePattern =
  /(?:\?{3,}|\u0392\u00ae|\ufffd|[\u039e\u039f][\u0080-\u00ff\u0370-\u03ff])/gu;
const isoGreekDecoder = new TextDecoder("iso-8859-7");
const isoGreekReverseMap = new Map<string, number>();

for (let byte = 0; byte <= 255; byte += 1) {
  isoGreekReverseMap.set(isoGreekDecoder.decode(Uint8Array.of(byte)), byte);
}

function repairCustomerGreekText(value: string) {
  const markers = value.match(legacyGreekMojibakePattern) ?? [];
  if (markers.length < 2) return value;

  const bytes: number[] = [];
  for (const char of value) {
    const byte = isoGreekReverseMap.get(char);
    if (byte !== undefined) {
      bytes.push(byte);
    } else if (char.charCodeAt(0) <= 255) {
      bytes.push(char.charCodeAt(0));
    } else {
      return value;
    }
  }

  const repaired = new TextDecoder("utf-8").decode(Uint8Array.from(bytes));
  const repairedMarkers = repaired.match(legacyGreekMojibakePattern) ?? [];
  return repairedMarkers.length < markers.length ? repaired : value;
}

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
  | "preferences"
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
  excludedIngredients?: string[];
  preferredProteins?: string[];
  currentFoodName?: string;
  weightGoal?: WeightGoal;
};

type RecommendedFoodChoice = {
  name: string;
  role?: "best" | "value";
  score?: number | null;
  reason?: string;
  caution?: string;
  bestUseCases?: string[];
  notIdealCases?: string[];
  kcalPer100g?: number | null;
  proteinPercent?: number | null;
  fatPercent?: number | null;
  fiberPercent?: number | null;
};

type AccountPetAnalysisHistoryItem = {
  id: string;
  createdAt?: string;
  matchedFoodName?: string | null;
  matched_food_name?: string | null;
  feedingGramsPerDay?: number | null;
  feeding_grams_per_day?: number | null;
  foodScore?: number | null;
  food_score?: number | null;
  weightGoal?: string | null;
  weight_goal?: string | null;
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
  analysisHistory?: AccountPetAnalysisHistoryItem[];
};

type AnalysisMetadata = {
  foodScore?: number | null;
  matchedFoodId?: string | null;
  matchedFoodName?: string | null;
  feedingGramsPerDay?: number | null;
  weightGoal?: WeightGoal | null;
};

type FoodMatchCandidate = Record<string, unknown> & {
  brand?: string | null;
  name?: string | null;
  match_score?: number | null;
  match_confidence?: string | null;
};

type FoodComparisonItem = {
  query: string;
  match: {
    brand?: string | null;
    name?: string | null;
    data_quality_status?: string | null;
  } | null;
  match_score?: number;
  data_confidence?: string;
  nutrition?: Record<string, number | null>;
  missing_nutrition_fields?: string[];
  cautions?: string[];
};

type FoodCompareResponse = {
  comparisons?: FoodComparisonItem[];
  summary?: {
    lowest_calorie?: string | null;
    highest_protein?: string | null;
    highest_fiber?: string | null;
    note?: string;
  } | null;
  error?: string;
};

type FollowUpAction =
  | "progress"
  | "no_result"
  | "change_food"
  | "timeline"
  | "new_analysis";

type FollowUpMode = "progress" | "no_result" | null;
type RecommendationMode = "default" | "alternative";
type IntakeExtractionApiResponse = {
  data?: AiIntakeExtraction;
  source?: "openai" | "fallback";
  warnings?: string[];
  errors?: string[];
  canUse?: boolean;
};

const starterCards = [
  {
    title: "Find the right food",
    titleEl: "Βρες κατάλληλη τροφή",
    helper: "Best first step for allergies, weight control, sterilised pets, or sensitive digestion.",
    helperEl:
      "Ιδανικό πρώτο βήμα για αλλεργίες, βάρος, στείρωση ή ευαίσθητη πέψη.",
    prompt: "I want a food recommendation for my pet.",
    promptEl: "Θέλω πρόταση τροφής για το κατοικίδιό μου.",
  },
  {
    title: "Compare formulas",
    titleEl: "Σύγκριση τροφών",
    helper: "Useful when you are choosing between two brands or two specific foods.",
    helperEl:
      "Χρήσιμο όταν διαλέγεις ανάμεσα σε δύο εταιρίες ή δύο συγκεκριμένες τροφές.",
    prompt: "Compare Royal Canin and Acana for my pet.",
    promptEl: "Σύγκρινε Royal Canin και Acana για το κατοικίδιό μου.",
  },
  {
    title: "Daily grams",
    titleEl: "Γραμμάρια την ημέρα",
    helper: "Estimate calories, portions, and treat allowance from the pet profile.",
    helperEl:
      "Υπολογισμός θερμίδων, μερίδας και ορίου για λιχουδιές.",
    prompt: "How many grams should I feed per day?",
    promptEl: "Πόσα γραμμάρια να δίνω την ημέρα;",
  },
  {
    title: "Health caution",
    titleEl: "Θέμα υγείας",
    helper: "For urinary, renal, pancreatitis, vomiting, diarrhea, or not eating, the bot stays careful.",
    helperEl:
      "Για ουρολογικό, νεφρικό, παγκρεατίτιδα, εμετό, διάρροια ή ανορεξία, το bot απαντά προσεκτικά.",
    prompt: "My pet has a health concern and I need safe food guidance.",
    promptEl:
      "Το κατοικίδιό μου έχει θέμα υγείας και θέλω ασφαλή διατροφική καθοδήγηση.",
  },
];

const followUpActions: {
  id: FollowUpAction;
  title: string;
  titleEl: string;
  helper: string;
  helperEl: string;
}[] = [
  {
    id: "progress",
    title: "Progress check",
    titleEl: "Έλεγχος προόδου",
    helper: "Talk through weight, appetite, stool, treats, and visible changes.",
    helperEl:
      "Μιλάμε για βάρος, όρεξη, κόπρανα, λιχουδιές και ορατές αλλαγές.",
  },
  {
    id: "no_result",
    title: "No visible result",
    titleEl: "Δεν είδα αποτέλεσμα",
    helper: "Review calories, treats, grams per day, activity, and food fit.",
    helperEl:
      "Ελέγχουμε θερμίδες, λιχουδιές, γραμμάρια/ημέρα, δραστηριότητα και fit τροφής.",
  },
  {
    id: "change_food",
    title: "Try another food",
    titleEl: "Άλλη τροφή",
    helper: "Get a new shortlist if taste, brand, or formula is not working.",
    helperEl:
      "Νέα λίστα αν η γεύση, η εταιρία ή η φόρμουλα δεν λειτούργησε.",
  },
  {
    id: "timeline",
    title: "Open timeline",
    titleEl: "Άνοιγμα ιστορικού",
    helper: "Review previous analyses and progress history.",
    helperEl: "Δες προηγούμενες αναλύσεις και πρόοδο.",
  },
  {
    id: "new_analysis",
    title: "Fresh analysis",
    titleEl: "Νέα ανάλυση",
    helper: "Run the full guided flow again for this pet.",
    helperEl: "Ξεκίνα ξανά την πλήρη ροή για αυτό το κατοικίδιο.",
  },
];

const KNOWN_FOOD_BRANDS = [
  "royal canin",
  "ambrosia",
  "josera",
  "schesir",
  "monge",
  "farmina",
  "acana",
  "orijen",
  "purina",
  "pro plan",
  "brit",
  "happy dog",
];

function formatRecommendationChoiceName(food: FoodV2ChatbotRecommendationItem) {
  return customerFoodName(food);
}

function formatRecommendationChoiceReason(
  food: FoodV2ChatbotRecommendationItem,
  role: RecommendedFoodChoice["role"],
  language: ChatLanguage
) {
  const text = [
    ...(food.ranking?.reasons ?? []),
    ...(food.food_intelligence?.best_use_cases ?? []),
    ...(food.food_intelligence?.strengths ?? []),
    food.brand,
    food.display_name,
  ]
    .join(" ")
    .toLowerCase();
  const kcal = food.nutrition?.kcal_per_100g;
  const fat = food.nutrition?.fat_percent;
  const protein = food.nutrition?.protein_percent;

  const calorieText =
    kcal != null && fat != null
      ? language === "el"
        ? `Οι θερμίδες και τα λιπαρά του (${formatChoiceNumber(kcal)} kcal/100g, ${formatChoiceNumber(fat)}% λιπαρά) βοηθούν να δουλέψουμε με μετρημένη μερίδα.`
        : `Its calories and fat (${formatChoiceNumber(kcal)} kcal/100g, ${formatChoiceNumber(fat)}% fat) make portion control easier.`
      : undefined;
  const proteinText =
    protein != null
      ? language === "el"
        ? `Δίνει καθαρό σημείο αναφοράς για την πρωτεΐνη (${formatChoiceNumber(protein)}%).`
        : `It gives us a clear protein reference (${formatChoiceNumber(protein)}%).`
      : undefined;

  if (language === "el") {
    if (text.includes("preferred protein") || text.includes("preferred flavor")) {
      return "Ταιριάζει με γεύση ή πρωτεΐνη που δήλωσες ότι προτιμά.";
    }
    if (
      text.includes("calorie_aware_feeding") ||
      text.includes("sterilised_weight_management") ||
      text.includes("weight") ||
      text.includes("sterilised") ||
      text.includes("sterilized") ||
      text.includes("neutered") ||
      text.includes("calories")
    ) {
      return calorieText ?? "Έχει πιο σωστή λογική για στειρωμένο ή επιρρεπές σε βάρος κατοικίδιο.";
    }
    if (
      text.includes("limited_protein_allergy_review") ||
      text.includes("excluded ingredients") ||
      text.includes("allergens were not detected")
    ) {
      return "Σέβεται τις αποφυγές που δήλωσες και είναι πιο κατάλληλη για προσεκτική επιλογή πρωτεΐνης.";
    }
    if (
      text.includes("large_breed_growth_mineral_review") ||
      text.includes("large-breed puppy") ||
      text.includes("growth")
    ) {
      return "Είναι πιο κοντά στις ανάγκες ανάπτυξης, με καλύτερη λογική για ασβέστιο/φώσφορο όταν μιλάμε για μεγαλόσωμο κουτάβι.";
    }
    if (text.includes("senior_mobility") || text.includes("senior")) {
      return "Είναι πιο κοντά σε ανάγκες senior κατοικιδίου, όπου κοιτάμε βάρος, όρεξη, μυϊκή κατάσταση και κινητικότητα.";
    }
    if (text.includes("digestive_tolerance_review") || text.includes("digest") || text.includes("sensitive")) {
      return "Έχει λογική για πιο ευαίσθητη πέψη.";
    }
    if (text.includes("skin_coat_omega_review")) {
      return "Έχει λογική για δέρμα/τρίχωμα, ειδικά όταν υπάρχουν διαθέσιμα στοιχεία για EPA/DHA ή ωμέγα λιπαρά.";
    }
    if (text.includes("summer_low_appetite_feeding_review")) {
      return "Ταιριάζει σε περίοδο ζέστης όπου το ζώο τρώει λιγότερο, με πιο πρακτική θερμιδική πυκνότητα.";
    }
    if (
      text.includes("high_activity_energy_support") ||
      text.includes("active_working") ||
      text.includes("active") ||
      text.includes("performance")
    ) {
      return proteinText ?? "Ταιριάζει καλύτερα σε πιο δραστήριο ζώο που χρειάζεται περισσότερη διατροφική υποστήριξη.";
    }
    if (text.includes("urinary")) {
      return "Έχει ουρολογικό προσανατολισμό και πρέπει να χρησιμοποιείται με κτηνιατρική καθοδήγηση.";
    }
    if (text.includes("renal")) {
      return "Έχει νεφρικό προσανατολισμό και η τελική επιλογή πρέπει να συμφωνεί με τον/την κτηνίατρο.";
    }

    return role === "value"
      ? "Πιο απλή επιλογή με καλά διαθέσιμα στοιχεία."
      : "Δυνατή επιλογή με βάση το προφίλ του κατοικιδίου.";
  }

  if (text.includes("preferred protein") || text.includes("preferred flavor")) {
    return "It matches a flavour or protein preference you gave.";
  }
  if (
    text.includes("calorie_aware_feeding") ||
    text.includes("sterilised_weight_management") ||
    text.includes("weight") ||
    text.includes("sterilised") ||
    text.includes("sterilized") ||
    text.includes("neutered") ||
    text.includes("calories")
  ) {
    return calorieText ?? "It has better logic for a sterilised or weight-prone pet.";
  }
  if (
    text.includes("limited_protein_allergy_review") ||
    text.includes("excluded ingredients") ||
    text.includes("allergens were not detected")
  ) {
    return "It respects the avoidances you gave and is better suited to careful protein selection.";
  }
  if (
    text.includes("large_breed_growth_mineral_review") ||
    text.includes("large-breed puppy") ||
    text.includes("growth")
  ) {
    return "It is closer to growth needs, with better calcium/phosphorus logic for large-breed puppies.";
  }
  if (text.includes("senior_mobility") || text.includes("senior")) {
    return "It is closer to senior needs, where weight, appetite, muscle condition, and mobility matter.";
  }
  if (text.includes("digestive_tolerance_review") || text.includes("digest") || text.includes("sensitive")) {
    return "It has better logic for sensitive digestion.";
  }
  if (text.includes("skin_coat_omega_review")) {
    return "It has skin/coat logic, especially when EPA/DHA or omega details are available.";
  }
  if (text.includes("summer_low_appetite_feeding_review")) {
    return "It fits hot-weather periods when the pet eats less, with more practical calorie density.";
  }
  if (
    text.includes("high_activity_energy_support") ||
    text.includes("active_working") ||
    text.includes("active") ||
    text.includes("performance")
  ) {
    return proteinText ?? "It fits a more active pet that needs stronger nutrition support.";
  }
  if (text.includes("urinary")) {
    return "It has urinary-support positioning and should be used with veterinary guidance.";
  }
  if (text.includes("renal")) {
    return "It has renal-support positioning and the final choice should match veterinary guidance.";
  }

  return role === "value"
    ? "A simpler option with useful available data."
    : "A strong fit based on this pet profile.";
}

function formatRecommendationChoiceCaution(
  food: FoodV2ChatbotRecommendationItem,
  language: ChatLanguage
) {
  const text = [
    ...(food.ranking?.cautions ?? []),
    ...(food.food_intelligence?.cautions ?? []),
    ...(food.food_intelligence?.not_ideal_cases ?? []),
  ]
    .join(" ")
    .toLowerCase();
  if (!text) return undefined;

  if (language === "el") {
    if (
      text.includes("energy_dense_without_clear_active_positioning") ||
      text.includes("visibly positioned")
    ) {
      return "Έχει αρκετή ενέργεια, αλλά δεν φαίνεται ξεκάθαρα ως active τροφή. Δες τη με προσοχή αν ο στόχος είναι συντήρηση ή έλεγχος βάρους.";
    }
    if (text.includes("fat") || text.includes("energy") || text.includes("calories")) {
      return "Έλεγξε τη μερίδα προσεκτικά, ειδικά αν υπάρχει τάση για βάρος.";
    }
    if (text.includes("large-breed") || text.includes("calcium") || text.includes("phosphorus")) {
      return "Για μεγαλόσωμο κουτάβι θέλουμε προσοχή σε ασβέστιο και φώσφορο.";
    }
    if (text.includes("senior")) {
      return "Σε senior ζώο παρακολουθούμε βάρος, όρεξη και μυϊκή κατάσταση.";
    }
    if (text.includes("hot-weather") || text.includes("seasonal low appetite")) {
      return "Σε ζέστη ή χαμηλή όρεξη παρακολουθούμε ενυδάτωση, βάρος και αν τρώει αρκετά.";
    }
    if (text.includes("renal") || text.includes("kidney")) {
      return "Σε νεφρικό θέμα η επιλογή τροφής πρέπει να γίνεται με κτηνίατρο.";
    }
    if (text.includes("urinary")) {
      return "Σε ουρολογικό ιστορικό χρειάζεται επιβεβαίωση από κτηνίατρο.";
    }

    return undefined;
  }

  if (
    text.includes("energy_dense_without_clear_active_positioning") ||
    text.includes("visibly positioned")
  ) {
    return "Energy-dense foods need clear active or weight-gain use. Use extra care if the goal is maintenance or weight control.";
  }
  if (text.includes("fat") || text.includes("energy") || text.includes("calories")) {
    return "Watch the daily portion carefully, especially if weight is a concern.";
  }
  if (text.includes("large-breed") || text.includes("calcium") || text.includes("phosphorus")) {
    return "Large-breed puppies need extra care around calcium and phosphorus.";
  }
  if (text.includes("senior")) {
    return "For senior pets, monitor weight, appetite, and muscle condition.";
  }
  if (text.includes("hot-weather") || text.includes("seasonal low appetite")) {
    return "In hot weather or low appetite, monitor hydration, weight, and whether the pet eats enough.";
  }
  if (text.includes("renal") || text.includes("kidney")) {
    return "Renal cases should be diet-guided with a veterinarian.";
  }
  if (text.includes("urinary")) {
    return "Urinary history should be confirmed with a veterinarian.";
  }

  return undefined;
}

function formatFoodIntelligenceLabel(value: string, language: ChatLanguage) {
  const key = value.trim().toLowerCase().replace(/\s+/g, "_");
  const labels: Record<string, { el: string; en: string }> = {
    adult: { el: "ενήλικο ζώο", en: "adult pets" },
    all_life_stages: { el: "πολλαπλά στάδια ζωής", en: "multiple life stages" },
    allergy: { el: "ιστορικό αλλεργίας", en: "allergy history" },
    chicken_allergy: { el: "αλλεργία στο κοτόπουλο", en: "chicken allergy" },
    gi_support: { el: "ευαίσθητη πέψη", en: "sensitive digestion" },
    hairball: { el: "τριχόμπαλες", en: "hairball support" },
    kitten: { el: "γατάκι", en: "kitten" },
    large_breed: { el: "μεγαλόσωμο ζώο", en: "large breeds" },
    large_breed_growth_mineral_review: {
      el: "μεγαλόσωμο κουτάβι με έλεγχο ασβεστίου/φωσφόρου",
      en: "large-breed puppy mineral check",
    },
    low_fat_pancreatitis_review: {
      el: "χαμηλότερα λιπαρά με κτηνιατρική καθοδήγηση",
      en: "lower-fat vet-guided review",
    },
    pancreatitis_without_low_fat_review: {
      el: "παγκρεατικό ιστορικό χωρίς ξεκάθαρα χαμηλά λιπαρά",
      en: "pancreatitis history without clear low-fat fit",
    },
    puppy: { el: "κουτάβι", en: "puppy" },
    renal: { el: "νεφρική υποστήριξη", en: "renal support" },
    renal_decision_without_phosphorus: {
      el: "νεφρικό περιστατικό χωρίς πλήρη φώσφορο",
      en: "renal cases without full phosphorus data",
    },
    senior: { el: "ηλικιωμένο ζώο", en: "senior pets" },
    skin_coat_omega_review: { el: "δέρμα και τρίχωμα", en: "skin and coat support" },
    skin_coat_without_omega_detail: {
      el: "δέρμα/τρίχωμα χωρίς πλήρη omega στοιχεία",
      en: "skin/coat cases without full omega detail",
    },
    small_breed_formula_review: {
      el: "μικρόσωμη φυλή / κατάλληλη κροκέτα",
      en: "small-breed formula fit",
    },
    large_breed_formula_review: {
      el: "μεγαλόσωμη φυλή / σωστό μέγεθος φόρμουλας",
      en: "large-breed formula fit",
    },
    summer_low_appetite_feeding_review: {
      el: "ζέστη / χαμηλή όρεξη",
      en: "hot weather and low appetite",
    },
    summer_low_appetite_without_energy_support: {
      el: "ζέστη / χαμηλή όρεξη χωρίς αρκετή ενεργειακή στήριξη",
      en: "hot-weather low appetite without enough energy support",
    },
    small_breed: { el: "μικρόσωμο ζώο", en: "small breeds" },
    sterilised: { el: "στειρωμένο ζώο", en: "sterilised pets" },
    sensitive_digestion: { el: "ευαίσθητη πέψη", en: "sensitive digestion" },
    urinary: { el: "ουρολογική υποστήριξη", en: "urinary support" },
    urinary_decision_without_magnesium: {
      el: "ουρολογικό ιστορικό χωρίς πλήρες μαγνήσιο",
      en: "urinary cases without full magnesium data",
    },
    weight_control: { el: "έλεγχο βάρους", en: "weight control" },
    weight_loss_without_portion_control: {
      el: "απώλεια βάρους χωρίς μετρημένη μερίδα",
      en: "weight loss without measured portions",
    },
  };

  const supplementalLabels: Record<string, { el: string; en: string }> = {
    active_working_without_energy_support: {
      el: "δραστήριο ζώο χωρίς αρκετή ενεργειακή υποστήριξη",
      en: "active pets without enough energy support",
    },
    energy_dense_without_clear_active_positioning: {
      el: "πολλές θερμίδες χωρίς ξεκάθαρη active χρήση",
      en: "energy-dense food without clear active use",
    },
    digestive_tolerance_review: {
      el: "ευαίσθητη πέψη",
      en: "digestive tolerance review",
    },
    high_activity_energy_support: {
      el: "υψηλή δραστηριότητα",
      en: "high-activity energy support",
    },
    senior_muscle_monitoring: {
      el: "senior μυϊκή κατάσταση",
      en: "senior muscle monitoring",
    },
    senior_without_clear_senior_or_mobility_support: {
      el: "senior χωρίς καθαρή senior/mobility στήριξη",
      en: "senior pets without clear senior or mobility support",
    },
    sterilised_weight_management: {
      el: "στειρωμένο ζώο με έλεγχο βάρους",
      en: "sterilised weight management",
    },
    sterilised_weight_control_energy_mismatch: {
      el: "στειρωμένο ζώο με υψηλή ενεργειακή πυκνότητα",
      en: "sterilised pets with too much energy density",
    },
    active_working: { el: "πολύ δραστήριο ζώο", en: "active or working pets" },
    calorie_aware_feeding: { el: "ελεγχόμενες θερμίδες", en: "calorie-aware feeding" },
    growth_development: { el: "ανάπτυξη κουταβιού/γατιού", en: "puppy/kitten development" },
    growth_without_mineral_review: {
      el: "ανάπτυξη χωρίς πλήρη έλεγχο μετάλλων",
      en: "growth without full mineral review",
    },
    low_activity_sterilised_without_portion_control: {
      el: "στειρωμένο/ήρεμο ζώο χωρίς μετρημένη μερίδα",
      en: "low-activity or sterilised pets without measured portions",
    },
    renal_phosphorus_review: {
      el: "νεφρικός έλεγχος φωσφόρου",
      en: "renal phosphorus review",
    },
    senior_mobility: { el: "senior κινητικότητα", en: "senior mobility" },
    urinary_mineral_review: {
      el: "ουρολογικός έλεγχος μετάλλων",
      en: "urinary mineral review",
    },
  };

  const customerLabels: Record<string, { el: string; en: string }> = {
    chewing_difficulty_without_small_kibble_support: {
      el: "δυσκολία μάσησης χωρίς μικρή κροκέτα",
      en: "chewing difficulty without small-kibble support",
    },
    easy_chewing_kibble_review: {
      el: "εύκολη μάσηση ή μικρή κροκέτα",
      en: "easy chewing or small kibble",
    },
    fussy_eater_palatability_trial: {
      el: "εκλεκτικό ζώο / δοκιμή νοστιμιάς",
      en: "fussy eater palatability trial",
    },
    fussy_eater_without_palatability_support: {
      el: "εκλεκτικό ζώο χωρίς καθαρά στοιχεία νοστιμιάς",
      en: "fussy eater without clear palatability support",
    },
    hairball_fiber_support: {
      el: "τριχόμπαλες με στήριξη ινών",
      en: "hairball fiber support",
    },
    hairball_without_fiber_support: {
      el: "τριχόμπαλες χωρίς καθαρή στήριξη ινών",
      en: "hairball without clear fiber support",
    },
    indoor_sterilised_weight_management: {
      el: "indoor/στειρωμένη γάτα με έλεγχο βάρους",
      en: "indoor or sterilised cat weight management",
    },
    large_breed_growth_mineral_review: {
      el: "κουτάβι μεγαλόσωμης φυλής με έλεγχο μετάλλων",
      en: "large-breed puppy mineral review",
    },
    large_breed_growth_without_mineral_review: {
      el: "κουτάβι μεγαλόσωμης φυλής χωρίς πλήρη μεταλλική εικόνα",
      en: "large-breed puppy without full mineral review",
    },
    limited_protein_allergy_review: {
      el: "αλλεργία / έλεγχος πρωτεΐνης",
      en: "allergy or limited-protein review",
    },
    low_fat_pancreatitis_review: {
      el: "χαμηλά λιπαρά με κτηνιατρικό έλεγχο",
      en: "low-fat veterinary review",
    },
    pancreatitis_without_low_fat_review: {
      el: "ιστορικό παγκρεατίτιδας χωρίς καθαρό low-fat fit",
      en: "pancreatitis without clear low-fat fit",
    },
    skin_coat_omega_review: {
      el: "δέρμα/τρίχωμα με omega στοιχεία",
      en: "skin and coat omega review",
    },
    skin_coat_without_omega_detail: {
      el: "δέρμα/τρίχωμα χωρίς καθαρά EPA/DHA",
      en: "skin and coat without clear EPA/DHA detail",
    },
    small_breed_formula_review: {
      el: "μικρόσωμη φυλή / κατάλληλη κροκέτα",
      en: "small-breed formula fit",
    },
    large_breed_formula_review: {
      el: "μεγαλόσωμη φυλή / σωστό μέγεθος φόρμουλας",
      en: "large-breed formula fit",
    },
    summer_low_appetite_feeding_review: {
      el: "ζέστη / χαμηλή όρεξη",
      en: "hot weather and low appetite",
    },
    summer_low_appetite_without_energy_support: {
      el: "ζέστη / χαμηλή όρεξη χωρίς αρκετή ενέργεια",
      en: "hot-weather low appetite without enough energy support",
    },
    strict_allergy_trial_with_many_proteins: {
      el: "αυστηρή δοκιμή αλλεργίας με πολλές πρωτεΐνες",
      en: "strict allergy trial with many proteins",
    },
  };

  return (
    customerLabels[key]?.[language] ??
    labels[key]?.[language] ??
    supplementalLabels[key]?.[language] ??
    value.replace(/_/g, " ")
  );
}

function formatFoodIntelligenceLabels(values: string[] | undefined, language: ChatLanguage) {
  const seen = new Set<string>();

  return (values ?? [])
    .map((value) => formatFoodIntelligenceLabel(value, language))
    .filter((value) => {
      const key = value.toLowerCase();
      if (!value || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

function toRecommendationChoice(
  food: FoodV2ChatbotRecommendationItem,
  role: RecommendedFoodChoice["role"],
  language: ChatLanguage
): RecommendedFoodChoice | null {
  const name = formatRecommendationChoiceName(food);
  if (!name) return null;

  return {
    name,
    role,
    score: food.ranking?.total_score ?? null,
    reason: formatRecommendationChoiceReason(food, role, language),
    caution: formatRecommendationChoiceCaution(food, language),
    bestUseCases: formatFoodIntelligenceLabels(
      food.food_intelligence?.best_use_cases,
      language
    ),
    notIdealCases: formatFoodIntelligenceLabels(
      food.food_intelligence?.not_ideal_cases,
      language
    ),
    kcalPer100g: food.nutrition?.kcal_per_100g ?? null,
    proteinPercent: food.nutrition?.protein_percent ?? null,
    fatPercent: food.nutrition?.fat_percent ?? null,
    fiberPercent: food.nutrition?.fiber_percent ?? null,
  };
}

function formatChoiceNumber(value: number | null | undefined, digits = 1) {
  if (value == null || !Number.isFinite(value)) return null;

  return Number(value).toFixed(digits).replace(/\.0$/, "");
}

function getRecommendationChoiceFacts(
  choice: RecommendedFoodChoice,
  language: ChatLanguage
) {
  const facts = [
    {
      value: formatChoiceNumber(choice.kcalPer100g),
      label: "kcal/100g",
      tone: "bg-white text-gray-900 ring-gray-200",
    },
    {
      value: formatChoiceNumber(choice.proteinPercent),
      label: language === "el" ? "πρωτεΐνη" : "protein",
      suffix: "%",
      tone: "bg-emerald-50 text-emerald-950 ring-emerald-100",
    },
    {
      value: formatChoiceNumber(choice.fatPercent),
      label: language === "el" ? "λιπαρά" : "fat",
      suffix: "%",
      tone: "bg-amber-50 text-amber-950 ring-amber-100",
    },
    {
      value: formatChoiceNumber(choice.fiberPercent),
      label: language === "el" ? "ίνες" : "fiber",
      suffix: "%",
      tone: "bg-sky-50 text-sky-950 ring-sky-100",
    },
  ];

  return facts.filter((fact) => fact.value);
}

function getRecommendationChoiceBadgeLabel(
  choice: RecommendedFoodChoice,
  index: number,
  language: ChatLanguage
) {
  if (index === 0) {
    return language === "el" ? "Καλύτερη επιλογή" : "Best match";
  }
  if (choice.role === "value") {
    return language === "el" ? "Πρακτική επιλογή" : "Practical option";
  }

  return language === "el" ? "Καλή εναλλακτική" : "Good alternative";
}

function getRecommendationChoiceActionHint(
  choice: RecommendedFoodChoice,
  language: ChatLanguage
) {
  const hasPortionData = choice.kcalPer100g != null && Number.isFinite(choice.kcalPer100g);

  if (hasPortionData) {
    return language === "el"
      ? "Διάλεξε αυτή την τροφή για να υπολογίσουμε γραμμάρια/ημέρα."
      : "Choose this food to calculate grams/day.";
  }

  return language === "el"
    ? "Διάλεξε αυτή την τροφή για να την κρατήσουμε στο πλάνο."
    : "Choose this food to keep it in the plan.";
}

function getRecommendationChoiceRoleSummary(
  choice: RecommendedFoodChoice,
  index: number,
  language: ChatLanguage
) {
  if (language === "el") {
    if (index === 0) {
      return "\u0397 \u03c0\u03b9\u03bf \u03b4\u03c5\u03bd\u03b1\u03c4\u03ae \u03c0\u03c1\u03ce\u03c4\u03b7 \u03b5\u03c0\u03b9\u03bb\u03bf\u03b3\u03ae \u03b3\u03b9\u03b1 \u03c4\u03bf \u03c0\u03c1\u03bf\u03c6\u03af\u03bb \u03c0\u03bf\u03c5 \u03ad\u03b4\u03c9\u03c3\u03b5\u03c2.";
    }

    if (choice.role === "value") {
      return "\u03a0\u03b9\u03bf \u03b1\u03c0\u03bb\u03ae/value \u03b5\u03bd\u03b1\u03bb\u03bb\u03b1\u03ba\u03c4\u03b9\u03ba\u03ae, \u03b1\u03bd \u03b8\u03ad\u03bb\u03b5\u03b9\u03c2 \u03ba\u03ac\u03c4\u03b9 \u03c0\u03c1\u03b1\u03ba\u03c4\u03b9\u03ba\u03cc \u03c0\u03bf\u03c5 \u03c0\u03b1\u03c1\u03b1\u03bc\u03ad\u03bd\u03b5\u03b9 \u03ba\u03b1\u03bb\u03cc fit.";
    }

    return "\u039a\u03b1\u03bb\u03ae \u03b5\u03bd\u03b1\u03bb\u03bb\u03b1\u03ba\u03c4\u03b9\u03ba\u03ae, \u03b1\u03bd \u03b8\u03ad\u03bb\u03b5\u03b9\u03c2 \u03bd\u03b1 \u03b4\u03b5\u03b9\u03c2 \u03ba\u03b9 \u03ac\u03bb\u03bb\u03b7 \u03c3\u03c9\u03c3\u03c4\u03ae \u03ba\u03b1\u03c4\u03b5\u03cd\u03b8\u03c5\u03bd\u03c3\u03b7.";
  }

  if (index === 0) {
    return "Best overall match for this pet's profile.";
  }

  if (choice.role === "value") {
    return "Practical alternative when you want a simpler option.";
  }

  return "Another suitable option if you want a different direction.";
}

function getRecommendationCardClassName(choice: RecommendedFoodChoice, index: number) {
  const emphasis =
    index === 0
      ? "border-emerald-500 bg-emerald-50 shadow-md"
      : choice.role === "value"
        ? "border-sky-200 bg-sky-50/60"
        : "border-emerald-200 bg-white";

  return [
    "group flex h-full flex-col rounded-2xl border p-4 text-left text-sm text-gray-900 transition",
    "hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-md",
    "focus:outline-none focus:ring-2 focus:ring-emerald-600",
    emphasis,
  ].join(" ");
}

function getRecommendationChoicePortionPreview(
  choice: RecommendedFoodChoice,
  analysis: PetAnalysis | null,
  weightGoal: WeightGoal | undefined
) {
  if (!analysis) return null;

  const adjustedCalories = adjustCaloriesForWeightGoal({
    calories: analysis.nutrition.der,
    goal: weightGoal,
  });
  const portionEstimate = calculateMainFoodPortionEstimate({
    finalDailyCalories: adjustedCalories,
    kcalPer100g: choice.kcalPer100g,
  });

  return portionEstimate?.gramsPerDay ?? null;
}

function createMessage(role: "bot" | "user", text: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    text,
  };
}

function getQuickReplies(step: IntakeStep, language: ChatLanguage) {
  const greek = language === "el";

  if (step === "species") return greek ? ["Σκύλος", "Γάτα"] : ["Dog", "Cat"];
  if (step === "activity") return greek ? ["Χαμηλό", "Κανονικό", "Υψηλό"] : ["Low", "Normal", "High"];
  if (step === "neutered") return greek ? ["Ναι", "Όχι"] : ["Yes", "No"];
  if (step === "health") {
    return greek
      ? ["Όχι", "Ευαίσθητο στομάχι", "Φαγούρα/δέρμα", "Ουρολογικό"]
      : ["No", "Sensitive stomach", "Itchy skin", "Urinary issue"];
  }
  if (step === "currentFood") return greek ? ["Δεν ξέρω"] : ["I don't know"];
  if (step === "preferences") {
    return greek
      ? ["Όχι", "Δεν τρώει κοτόπουλο", "Του αρέσει αρνί", "Του αρέσει σολομός"]
      : ["No", "No chicken", "Likes lamb", "Likes salmon"];
  }
  if (step === "weightGoal") {
    return greek
      ? ["Διατήρηση βάρους", "Απώλεια βάρους", "Αύξηση βάρους"]
      : ["Maintain weight", "Lose weight", "Gain weight"];
  }

  return [];
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

function getMaxWeightKg(species?: Species) {
  return species === "cat" ? MAX_CAT_WEIGHT_KG : MAX_DOG_WEIGHT_KG;
}

function detectFollowUpAction(text: string): FollowUpAction | null {
  const value = normalizeUserText(text);
  const hasWeightNumber = parseNumber(text) !== null;

  if (
    value.includes("timeline") ||
    value.includes("ιστορ") ||
    value.includes("προηγουμεν")
  ) {
    return "timeline";
  }

  if (
    value.includes("fresh") ||
    value.includes("new analysis") ||
    value.includes("full analysis") ||
    value.includes("καινουρια αναλυ") ||
    value.includes("νεα αναλυ")
  ) {
    return "new_analysis";
  }

  if (
    value.includes("no result") ||
    value.includes("not working") ||
    value.includes("nothing changed") ||
    value.includes("δεν ειδα") ||
    value.includes("δεν αλλαξε") ||
    value.includes("χωρις αποτελεσμα")
  ) {
    return "no_result";
  }

  if (
    value.includes("another food") ||
    value.includes("different food") ||
    value.includes("change food") ||
    value.includes("try another") ||
    value.includes("βαρεθηκε") ||
    value.includes("αλλη τροφη") ||
    value.includes("αλλη γευση") ||
    value.includes("αλλη εταιρια") ||
    value.includes("δεν την τρωει")
  ) {
    return "change_food";
  }

  if (
    hasWeightNumber ||
    value.includes("progress") ||
    value.includes("προοδο") ||
    value.includes("κιλ") ||
    value.includes("grams") ||
    value.includes("γραμμα") ||
    value.includes("treat") ||
    value.includes("λιχουδ")
  ) {
    return "progress";
  }

  return null;
}

function normalizeUserText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function getExcludedBrandsForAlternative(currentFoodName?: string) {
  const normalized = normalizeUserText(currentFoodName ?? "");

  return KNOWN_FOOD_BRANDS.filter((brand) =>
    normalized.includes(normalizeUserText(brand))
  );
}

function parseListOrEmpty(text: string) {
  const no = parseYesNoInput(text) === false;

  if (no) return [];

  const seen = new Set<string>();
  const items: string[] = [];

  text
    .split(/[,|\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const key = normalizeUserText(item);
      if (seen.has(key)) return;

      seen.add(key);
      items.push(item);
    });

  return items;
}

function uniqueTerms(values: string[]) {
  const seen = new Set<string>();
  const terms: string[] = [];

  values
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => {
      const key = normalizeUserText(value);
      if (seen.has(key)) return;
      seen.add(key);
      terms.push(value);
    });

  return terms;
}

function normalizeExtractedList(values: unknown) {
  if (!Array.isArray(values)) return [];
  return uniqueTerms(values.map((value) => String(value ?? "").trim()));
}

function removeExcludedFromPreferred(preferred: string[], excluded: string[]) {
  return removeSharedExcludedFromPreferred(preferred, excluded);
}

function shouldExtractIntakeFacts(step: IntakeStep, text: string) {
  if (step === "analysis" || step === "done") {
    return false;
  }

  return text.trim().length >= 4;
}

function mergeExtractedPetFacts(
  current: PetIntake,
  extracted?: AiIntakeExtraction | null
): PetIntake {
  if (!extracted) return current;

  const next: PetIntake = { ...current };

  if (!next.species && extracted.species) next.species = extracted.species;
  if (!next.name && extracted.petName) next.name = formatPetDisplayName(extracted.petName);
  if (!next.weight && typeof extracted.weightKg === "number") next.weight = extracted.weightKg;
  if (!next.age && typeof extracted.ageYears === "number") next.age = extracted.ageYears;
  if (!next.activityLevel && extracted.activityLevel) {
    next.activityLevel = extracted.activityLevel;
  }
  if (next.neutered === undefined && typeof extracted.neutered === "boolean") {
    next.neutered = extracted.neutered;
  }
  if (!next.currentFoodName && extracted.currentFoodName) {
    next.currentFoodName = extracted.currentFoodName;
  }
  if (!next.weightGoal && extracted.weightGoal) next.weightGoal = extracted.weightGoal;

  next.healthIssues = uniqueTerms([
    ...(next.healthIssues ?? []),
    ...normalizeExtractedList(extracted.healthIssues),
  ]);
  next.allergies = uniqueTerms([
    ...(next.allergies ?? []),
    ...normalizeExtractedList(extracted.allergies),
  ]);
  next.excludedIngredients = uniqueTerms([
    ...(next.excludedIngredients ?? []),
    ...normalizeExtractedList(extracted.excludedIngredients),
  ]);
  next.preferredProteins = removeExcludedFromPreferred(
    [
      ...(next.preferredProteins ?? []),
      ...normalizeExtractedList(extracted.preferredProteins),
    ],
    next.excludedIngredients ?? []
  );

  return sanitizePetIntake(next);
}

function parseTastePreferences(text: string): {
  excludedIngredients: string[];
  preferredProteins: string[];
} {
  return parseSharedTastePreferences(text);
}

function sanitizePetIntake(intake: PetIntake): PetIntake {
  const excludedIngredients = uniqueTerms(intake.excludedIngredients ?? []);
  const preferredProteins = removeExcludedFromPreferred(
    uniqueTerms(intake.preferredProteins ?? []),
    excludedIngredients
  );

  return {
    ...intake,
    name: intake.name ? formatPetDisplayName(intake.name) : intake.name,
    excludedIngredients,
    preferredProteins,
  };
}
function parseWeightGoal(text: string): WeightGoal | null {
  const value = normalizeUserText(text);
  const maintainTerms = [
    "maintain",
    "maintenance",
    "\u03b4\u03b9\u03b1\u03c4\u03b7\u03c1",
    "\u03c3\u03c5\u03bd\u03c4\u03b7\u03c1",
    "\u03ba\u03c1\u03b1\u03c4",
  ];
  const lossTerms = [
    "loss",
    "lose",
    "\u03b1\u03c0\u03c9\u03bb",
    "\u03c7\u03b1\u03c3",
    "\u03b1\u03b4\u03c5\u03bd\u03b1\u03c4",
  ];
  const gainTerms = [
    "gain",
    "\u03b1\u03c5\u03be\u03b7",
    "\u03c0\u03b1\u03c1",
    "\u03b2\u03b1\u03bb",
  ];

  if (includesAny(value, maintainTerms)) {
    return "maintain";
  }

  if (includesAny(value, lossTerms)) {
    return "loss";
  }

  if (includesAny(value, gainTerms)) {
    return "gain";
  }

  return null;
}

function parseSpeciesInput(text: string): Species | null {
  const value = normalizeUserText(text);

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
  const value = normalizeUserText(text);

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
  const value = normalizeUserText(text);

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
  const value = normalizeUserText(text);
  const maintainTerms = [
    "maintain",
    "maintenance",
    "diatir",
    "syntir",
    "\u03b4\u03b9\u03b1\u03c4\u03b7\u03c1",
    "\u03c3\u03c5\u03bd\u03c4\u03b7\u03c1",
    "\u03ba\u03c1\u03b1\u03c4",
  ];
  const lossTerms = [
    "loss",
    "lose",
    "xas",
    "adynat",
    "\u03b1\u03c0\u03c9\u03bb",
    "\u03c7\u03b1\u03c3",
    "\u03b1\u03b4\u03c5\u03bd\u03b1\u03c4",
  ];
  const gainTerms = [
    "gain",
    "parei",
    "pari",
    "valei",
    "\u03b1\u03c5\u03be\u03b7",
    "\u03c0\u03b1\u03c1",
    "\u03b2\u03b1\u03bb",
  ];

  if (includesAny(value, maintainTerms)) {
    return "maintain";
  }

  if (includesAny(value, lossTerms)) {
    return "loss";
  }

  if (includesAny(value, gainTerms)) {
    return "gain";
  }

  return parseWeightGoal(text);
}

function isUnknownFoodAnswer(text: string) {
  const value = normalizeUserText(text);

  return [
    "i don't know",
    "dont know",
    "don't know",
    "not sure",
    "none",
    "nothing",
    "no current food",
    "no food",
    "not feeding one",
    "δεν ξερω",
    "δεν ξέρω",
    "καμια",
    "καμία",
    "οχι",
    "όχι",
    "den ksero",
    "den xero",
    "kamia",
    "oxi",
    "ochi",
  ].some((phrase) => value.includes(phrase));
}

function getFoodQualityNote(food: Record<string, unknown>) {
  const status = String(food.data_quality_status ?? "").toLowerCase();

  if (status === "verified") {
    return "Τα στοιχεία αυτής της τροφής είναι αρκετά πλήρη, οπότε μπορούμε να μιλήσουμε πιο καθαρά για τη θρεπτική της εικόνα.";
  }

  if (status === "partial") {
    return "Μερικά διατροφικά στοιχεία λείπουν, οπότε θα κρατήσω την πρόταση προσεκτική.";
  }

  if (status === "needs_review" || status === "unknown") {
    return "Δεν έχω ακόμη όλα τα στοιχεία της ετικέτας, οπότε το χρησιμοποιώ σαν πιθανό ταίριασμα και όχι σαν απόλυτη απάντηση.";
  }

  return "Τα στοιχεία δεν είναι πλήρως συμπληρωμένα, οπότε θα κρατήσω την πρόταση προσεκτική.";
}

function isConfidentFoodMatch(matchResult: Record<string, unknown>) {
  const confidence = String(matchResult.match_confidence ?? "none");
  const score = Number(matchResult.match_score ?? 0);

  return confidence === "high" || confidence === "moderate" || score >= 50;
}

function getFoodCandidateLabel(candidate: FoodMatchCandidate) {
  const brand = String(candidate.brand ?? "").trim();
  const name = String(candidate.name ?? "").trim();
  const label = [brand, name].filter(Boolean).join(" - ");

  return label || "Unnamed food";
}

function formatFoodMatchCandidates(candidates: unknown) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return "No close database candidates were found.";
  }

  return candidates
    .slice(0, 3)
    .map(
      (candidate) =>
        `- ${getFoodCandidateLabel(candidate as FoodMatchCandidate)}`
    )
    .join("\n");
}

function formatCustomerBulletSection(title: string, items: string[]) {
  const visibleItems = items.filter((item) => item.trim());
  if (visibleItems.length === 0) return "";

  return `${title}\n${visibleItems.map((item) => `- ${item}`).join("\n")}`;
}

function formatCustomerCautionForLanguage(item: string, language: ChatLanguage) {
  const text = item
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  if (language === "el") {
    if (text.includes("fat") || text.includes("energy") || text.includes("calorie")) {
      return "\u0398\u03ad\u03bb\u03b5\u03b9 \u03bc\u03b5\u03c4\u03c1\u03b7\u03bc\u03ad\u03bd\u03b7 \u03bc\u03b5\u03c1\u03af\u03b4\u03b1, \u03b5\u03b9\u03b4\u03b9\u03ba\u03ac \u03b1\u03bd \u03c5\u03c0\u03ac\u03c1\u03c7\u03b5\u03b9 \u03c4\u03ac\u03c3\u03b7 \u03b3\u03b9\u03b1 \u03b2\u03ac\u03c1\u03bf\u03c2.";
    }
    if (text.includes("senior")) {
      return "\u03a3\u03b5 senior \u03b6\u03ce\u03bf \u03c0\u03b1\u03c1\u03b1\u03ba\u03bf\u03bb\u03bf\u03c5\u03b8\u03bf\u03cd\u03bc\u03b5 \u03b2\u03ac\u03c1\u03bf\u03c2, \u03cc\u03c1\u03b5\u03be\u03b7 \u03ba\u03b1\u03b9 \u03bc\u03c5\u03ca\u03ba\u03ae \u03ba\u03b1\u03c4\u03ac\u03c3\u03c4\u03b1\u03c3\u03b7.";
    }
    if (text.includes("renal") || text.includes("kidney")) {
      return "\u03a3\u03b5 \u03bd\u03b5\u03c6\u03c1\u03b9\u03ba\u03cc \u03b8\u03ad\u03bc\u03b1 \u03b7 \u03c4\u03b5\u03bb\u03b9\u03ba\u03ae \u03b5\u03c0\u03b9\u03bb\u03bf\u03b3\u03ae \u03c4\u03c1\u03bf\u03c6\u03ae\u03c2 \u03c0\u03c1\u03ad\u03c0\u03b5\u03b9 \u03bd\u03b1 \u03b3\u03af\u03bd\u03b5\u03c4\u03b1\u03b9 \u03bc\u03b5 \u03ba\u03c4\u03b7\u03bd\u03af\u03b1\u03c4\u03c1\u03bf.";
    }
    if (text.includes("urinary")) {
      return "\u03a3\u03b5 \u03bf\u03c5\u03c1\u03bf\u03bb\u03bf\u03b3\u03b9\u03ba\u03cc \u03b9\u03c3\u03c4\u03bf\u03c1\u03b9\u03ba\u03cc \u03c7\u03c1\u03b5\u03b9\u03ac\u03b6\u03b5\u03c4\u03b1\u03b9 \u03b5\u03c0\u03b9\u03b2\u03b5\u03b2\u03b1\u03af\u03c9\u03c3\u03b7 \u03b1\u03c0\u03cc \u03ba\u03c4\u03b7\u03bd\u03af\u03b1\u03c4\u03c1\u03bf.";
    }
    if (text.includes("calcium") || text.includes("phosphorus") || text.includes("large-breed")) {
      return "\u03a3\u03b5 \u03bc\u03b5\u03b3\u03b1\u03bb\u03cc\u03c3\u03c9\u03bc\u03bf \u03ba\u03bf\u03c5\u03c4\u03ac\u03b2\u03b9 \u03b8\u03ad\u03bb\u03bf\u03c5\u03bc\u03b5 \u03c0\u03c1\u03bf\u03c3\u03bf\u03c7\u03ae \u03c3\u03b5 \u03b1\u03c3\u03b2\u03ad\u03c3\u03c4\u03b9\u03bf \u03ba\u03b1\u03b9 \u03c6\u03ce\u03c3\u03c6\u03bf\u03c1\u03bf.";
    }

    return "";
  }

  if (text.includes("fat is not low enough")) {
    return "Portions should be measured carefully, especially for sterilised or weight-control cases.";
  }

  return item;
}

function formatCurrentFoodMatchMessage(params: {
  language: ChatLanguage;
  brand: unknown;
  name: unknown;
  foodScore: number;
  qualityNote: string;
  nutritionSummary: string;
  nutritionPositives: string[];
  nutritionCautions: string[];
  ingredientPositives: string[];
  ingredientCautions: string[];
  explanation: string[];
  grams?: {
    dailyCalories: number;
    gramsPerDay: number;
    gramsPerMealTwoMeals: number;
    gramsPerMealThreeMeals: number;
  } | null;
  treatCalories?: number | null;
  weightGoal?: WeightGoal;
}) {
  const foodName = [params.brand, params.name].map((value) => String(value ?? "").trim()).filter(Boolean).join(" - ");
  const fit = formatCustomerFoodFit(params.foodScore, params.language);
  const isGreek = params.language === "el";
  const customerCautions = [
    ...params.nutritionCautions,
    ...params.ingredientCautions,
    ...params.explanation,
  ]
    .map((item) => formatCustomerCautionForLanguage(item, params.language))
    .filter(Boolean);

  const sections = [
    isGreek
      ? `Βρήκα πιθανό match για την τωρινή τροφή:\n${foodName}`
      : `I found a likely match for the current food:\n${foodName}`,
    params.qualityNote,
    isGreek ? `Πώς τη βλέπω για το προφίλ: ${fit}.` : `How it fits this profile: ${fit}.`,
    params.nutritionSummary,
    formatCustomerBulletSection(
      isGreek ? "Θετικά σημεία" : "Positive points",
      [...params.nutritionPositives, ...params.ingredientPositives].slice(0, 4)
    ),
    formatCustomerBulletSection(
      isGreek ? "Τι να παρακολουθείς" : "What to monitor",
      customerCautions.slice(0, 4)
    ),
  ];

  if (params.grams) {
    sections.push(
      isGreek
        ? `Με στόχο ${getWeightGoalLabel(params.weightGoal, "el")} και ${params.grams.dailyCalories} kcal/ημέρα:\n\nΠρώτη εκτίμηση ποσότητας: περίπου ${params.grams.gramsPerDay}g/ημέρα.\n- Σε 2 γεύματα: περίπου ${params.grams.gramsPerMealTwoMeals}g ανά γεύμα\n- Σε 3 γεύματα: περίπου ${params.grams.gramsPerMealThreeMeals}g ανά γεύμα`
        : `Based on ${getWeightGoalLabel(params.weightGoal)} and ${params.grams.dailyCalories} kcal/day:\n\nFirst portion estimate: about ${params.grams.gramsPerDay}g/day.\n- 2 meals: about ${params.grams.gramsPerMealTwoMeals}g per meal\n- 3 meals: about ${params.grams.gramsPerMealThreeMeals}g per meal`
    );
  } else {
    sections.push(
      isGreek
        ? "Δεν έχω αρκετά καθαρή θερμιδική τιμή για αυτή την τροφή, οπότε δεν θα δώσω γραμμάρια με ψεύτικη ακρίβεια."
        : "I do not have a clear calorie value for this food yet, so I will not give grams with false precision."
    );
  }

  if (params.treatCalories) {
    sections.push(
      isGreek
        ? `Αν δίνεις λιχουδιές, κράτησέ τες περίπου μέχρι ${params.treatCalories} kcal/ημέρα.`
        : `If you give treats, keep them around ${params.treatCalories} kcal/day.`
    );
  }

  return sections.filter((section) => section.trim()).join("\n\n");
}

function formatCurrentFoodNoMatchMessage(params: {
  language: ChatLanguage;
  candidates: unknown;
  canShowCandidates: boolean;
}) {
  const isGreek = params.language === "el";
  const candidatesText = params.canShowCandidates
    ? `\n\n${
        isGreek ? "Πιθανές κοντινές τροφές στη βάση:" : "Closest database candidates:"
      }\n${formatFoodMatchCandidates(params.candidates)}\n\n${
        isGreek
          ? "Αν μία από αυτές είναι σωστή, επίλεξέ την ή στείλε το ακριβές όνομα από τη συσκευασία."
          : "If one of these is correct, choose it or send the exact bag name."
      }`
    : "";

  return isGreek
    ? `Δεν μπορώ να ταιριάξω με σιγουριά την τωρινή τροφή, οπότε δεν θα βασίσω την ανάλυση σε λάθος προϊόν.${candidatesText}\n\nΣυνεχίζω κανονικά με τις θερμίδες και τις γενικές οδηγίες.`
    : `I could not confidently match the current food, so I will not base the analysis on the wrong product.${candidatesText}\n\nI can still continue with the calorie target and general guidance.`;
}

function parseCompareQueries(text: string) {
  const normalized = normalizeUserText(text);
  const looksLikeCompare =
    normalized.includes("compare") ||
    normalized.includes("versus") ||
    normalized.includes(" vs ") ||
    normalized.includes("συγκριν") ||
    normalized.includes("συγκρινε");

  if (!looksLikeCompare) return [];

  return text
    .replace(/\bcompare\b/gi, "")
    .replace(/\bversus\b/gi, " vs ")
    .replace(/\bvs\.?\b/gi, " vs ")
    .replace(/\bfor my pet\b/gi, "")
    .replace(/\bfor this pet\b/gi, "")
    .replace(/\bfor the pet\b/gi, "")
    .replace(/\bfor my dog\b/gi, "")
    .replace(/\bfor my cat\b/gi, "")
    .replace(/σύγκρινε|συγκρινε|σύγκριση|συγκριση/gi, "")
    .replace(/\s+(?:με|και|ή|η)\s+/giu, " vs ")
    .replace(/\s+για\s+(?:τον|την|τη|το)\s+(?:σκύλο|σκυλο|γάτα|γατα|κατοικίδιο|κατοικιδιο)\s+μου\b/giu, "")
    .split(/\s+vs\s+|\s+and\s+|\s+or\s+|[,;\n]+/i)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3)
    .slice(0, 5);
}

function getStandaloneNutritionReply(text: string) {
  const value = normalizeUserText(text);

  const hasGrainMyth =
    value.includes("grain free") ||
    value.includes("grain-free") ||
    value.includes("by-product") ||
    value.includes("by product");

  if (hasGrainMyth) {
    return "Not always. Grain-free is not automatically better, and by-products are not automatically bad. The better question is whether the food is complete, appropriate for the pet's life stage and health context, and supported by clear nutrition data.";
  }

  const hasUrinaryEmergency =
    (value.includes("cat") || value.includes("gata") || value.includes("gatos")) &&
    (value.includes("pee") ||
      value.includes("urine") ||
      value.includes("urinary") ||
      value.includes("katour")) &&
    (value.includes("nothing") ||
      value.includes("blocked") ||
      value.includes("straining") ||
      value.includes("blood"));

  if (hasUrinaryEmergency) {
    return "This can be urgent, especially in male cats. If the cat is straining, painful, passing little/no urine, or there is blood, contact a veterinarian or emergency clinic now. Food comparison can wait until the immediate risk is checked.";
  }

  if (
    value.includes("best food") ||
    value.includes("best dry food") ||
    value.includes("kalyteri trofi")
  ) {
    return "I can help choose, but I need context first: species, age, weight, weight goal, neuter status, health issues, and the current food if you know it.";
  }

  return null;
}

function formatCustomerNutritionValue(
  value: number | null | undefined,
  suffix: string,
  language: ChatLanguage
) {
  if (value === null || value === undefined) {
    return language === "el" ? "δεν υπάρχει στοιχείο" : "not available";
  }

  return `${value}${suffix}`;
}

function compactCompareName(item: FoodComparisonItem, language: ChatLanguage) {
  if (!item.match) return item.query;

  return [item.match.brand, item.match.name]
    .filter(Boolean)
    .join(" - ")
    .trim() || (language === "el" ? "Άγνωστη τροφή" : "Unknown food");
}

function finalDailyCaloriesForAnalysis(
  analysis: PetAnalysis | null,
  goal?: WeightGoal
) {
  if (!analysis) return null;

  return adjustCaloriesForWeightGoal({
    calories: analysis.nutrition.der,
    goal,
  });
}

function formatCompareCustomerTakeaway(
  result: FoodCompareResponse,
  language: ChatLanguage
) {
  const summary = result.summary;
  if (!summary) return "";

  if (language === "el") {
    const lowCalorie =
      summary.lowest_calorie ??
      "\u03b4\u03b5\u03bd \u03c6\u03b1\u03af\u03bd\u03b5\u03c4\u03b1\u03b9 \u03ba\u03b1\u03b8\u03b1\u03c1\u03ac";
    const protein =
      summary.highest_protein ??
      "\u03b4\u03b5\u03bd \u03c6\u03b1\u03af\u03bd\u03b5\u03c4\u03b1\u03b9 \u03ba\u03b1\u03b8\u03b1\u03c1\u03ac";
    const fiber =
      summary.highest_fiber ??
      "\u03b4\u03b5\u03bd \u03c6\u03b1\u03af\u03bd\u03b5\u03c4\u03b1\u03b9 \u03ba\u03b1\u03b8\u03b1\u03c1\u03ac";

    return `

\u03a0\u03ce\u03c2 \u03bd\u03b1 \u03c4\u03bf \u03b4\u03b9\u03b1\u03b2\u03ac\u03c3\u03b5\u03b9\u03c2:
- \u0391\u03bd \u03bf \u03c3\u03c4\u03cc\u03c7\u03bf\u03c2 \u03b5\u03af\u03bd\u03b1\u03b9 \u03ad\u03bb\u03b5\u03b3\u03c7\u03bf\u03c2 \u03b2\u03ac\u03c1\u03bf\u03c5\u03c2, \u03b4\u03b5\u03c2 \u03c0\u03c1\u03ce\u03c4\u03b1: ${lowCalorie}.
- \u0391\u03bd \u03c8\u03ac\u03c7\u03bd\u03b5\u03b9\u03c2 \u03c0\u03b9\u03bf \u03b4\u03c5\u03bd\u03b1\u03c4\u03ae \u03bc\u03c5\u03ca\u03ba\u03ae/\u03b5\u03bd\u03b5\u03c1\u03b3\u03b5\u03b9\u03b1\u03ba\u03ae \u03c5\u03c0\u03bf\u03c3\u03c4\u03ae\u03c1\u03b9\u03be\u03b7, \u03b4\u03b5\u03c2 \u03c0\u03c1\u03ce\u03c4\u03b1: ${protein}.
- \u0391\u03bd \u03b8\u03ad\u03bb\u03b5\u03b9\u03c2 \u03ba\u03bf\u03c1\u03b5\u03c3\u03bc\u03cc \u03ae \u03ba\u03b1\u03bb\u03cd\u03c4\u03b5\u03c1\u03b1 \u03ba\u03cc\u03c0\u03c1\u03b1\u03bd\u03b1, \u03b4\u03b5\u03c2 \u03c4\u03b9\u03c2 \u03af\u03bd\u03b5\u03c2: ${fiber}.

\u0395\u03c0\u03cc\u03bc\u03b5\u03bd\u03bf \u03b2\u03ae\u03bc\u03b1: \u03c0\u03b5\u03c2 \u03bc\u03bf\u03c5 \u03c0\u03bf\u03b9\u03b1 \u03b1\u03c0\u03cc \u03b1\u03c5\u03c4\u03ad\u03c2 \u03c3\u03b5 \u03b5\u03bd\u03b4\u03b9\u03b1\u03c6\u03ad\u03c1\u03b5\u03b9 \u03ba\u03b1\u03b9 \u03bc\u03c0\u03bf\u03c1\u03ce \u03bd\u03b1 \u03c4\u03b7 \u03b4\u03ad\u03c3\u03c9 \u03bc\u03b5 \u03b3\u03c1\u03b1\u03bc\u03bc\u03ac\u03c1\u03b9\u03b1/\u03b7\u03bc\u03ad\u03c1\u03b1 \u03ae \u03bc\u03b5 \u03bd\u03ad\u03b1 \u03c0\u03c1\u03cc\u03c4\u03b1\u03c3\u03b7.`;
  }

  const lowCalorie = summary.lowest_calorie ?? "not clear yet";
  const protein = summary.highest_protein ?? "not clear yet";
  const fiber = summary.highest_fiber ?? "not clear yet";

  return `

How to choose:
- If the goal is weight control, look first at: ${lowCalorie}.
- If you want stronger muscle or energy support, look first at: ${protein}.
- If satiety or stool quality matters, check fiber first: ${fiber}.

Next step: tell me which one you prefer and I can connect it to grams/day or suggest a better-fit alternative.`;
}

function formatFoodComparison(
  result: FoodCompareResponse,
  language: ChatLanguage = "en"
) {
  const greek = language === "el";
  const comparisons = result.comparisons ?? [];

  if (comparisons.length === 0) {
    return greek
      ? "Δεν μπόρεσα να συγκρίνω αυτές τις τροφές ακόμα. Δοκίμασε εταιρεία + ακριβή φόρμουλα, χωρισμένα με vs. Παράδειγμα: Royal Canin Mini Adult vs Farmina N&D Pumpkin Lamb."
      : "I could not compare those foods yet. Try brand + formula names, separated with vs. Example: Royal Canin Mini Adult vs Farmina N&D Pumpkin Lamb.";
  }

  const missedMatches = comparisons.filter((item) => !item.match);
  const matchedItems = comparisons.filter((item) => item.match);
  const partialMatches = comparisons.filter(
    (item) => item.match && (item.missing_nutrition_fields ?? []).length > 0
  );

  const rows = comparisons.map((item, index) => {
    if (!item.match) {
      return greek
        ? `${index + 1}. ${item.query}: δεν βρήκα αρκετά σίγουρο match στη βάση.
Επόμενο βήμα: στείλε την ακριβή εταιρεία και φόρμουλα από τη συσκευασία ή δοκίμασε πιο σύντομο όνομα με brand + σειρά.`
        : `${index + 1}. ${item.query}: no confident database match.
Next step: send the exact brand and formula from the bag, or try a shorter query with brand + line name.`;
    }

    const nutrition = item.nutrition ?? {};
    const cautions = (item.cautions ?? [])
      .map((caution) => formatCustomerCautionForLanguage(caution, language))
      .filter(Boolean);
    const title = `${index + 1}. ${compactCompareName(item, language)}`;

    if (greek) {
      return `${title}
Θερμίδες: ${formatCustomerNutritionValue(nutrition.kcal_per_100g, " kcal/100g", language)}
Πρωτεΐνη: ${formatCustomerNutritionValue(nutrition.protein_percent, "%", language)}
Λιπαρά: ${formatCustomerNutritionValue(nutrition.fat_percent, "%", language)}
Ίνες: ${formatCustomerNutritionValue(nutrition.fiber_percent, "%", language)}
Ασβέστιο/Φώσφορος: ${formatCustomerNutritionValue(
        nutrition.calcium_percent,
        "%",
        language
      )} / ${formatCustomerNutritionValue(nutrition.phosphorus_percent, "%", language)}${
        cautions.length > 0
          ? `\nΠροσοχή:\n${cautions.map((item) => `- ${item}`).join("\n")}`
          : ""
      }`;
    }

    return `${title}
Calories: ${formatCustomerNutritionValue(nutrition.kcal_per_100g, " kcal/100g", language)}
Protein: ${formatCustomerNutritionValue(nutrition.protein_percent, "%", language)}
Fat: ${formatCustomerNutritionValue(nutrition.fat_percent, "%", language)}
Fiber: ${formatCustomerNutritionValue(nutrition.fiber_percent, "%", language)}
Calcium/Phosphorus: ${formatCustomerNutritionValue(
      nutrition.calcium_percent,
      "%",
      language
    )} / ${formatCustomerNutritionValue(nutrition.phosphorus_percent, "%", language)}${
      cautions.length > 0
        ? `\nCautions:\n${cautions.map((item) => `- ${item}`).join("\n")}`
        : ""
    }`;
  });

  const summary = result.summary
    ? greek
      ? `

Γρήγορη εικόνα:
- Πιο χαμηλές θερμίδες: ${result.summary.lowest_calorie ?? "δεν υπάρχουν αρκετά δεδομένα"}
- Περισσότερη πρωτεΐνη: ${result.summary.highest_protein ?? "δεν υπάρχουν αρκετά δεδομένα"}
- Περισσότερες ίνες: ${result.summary.highest_fiber ?? "δεν υπάρχουν αρκετά δεδομένα"}
- ${result.summary.note ?? "Χρησιμοποίησέ το σαν δομημένη βοήθεια σύγκρισης."}`
      : `

Quick read:
- Lowest calorie: ${result.summary.lowest_calorie ?? "not enough data"}
- Highest protein: ${result.summary.highest_protein ?? "not enough data"}
- Highest fiber: ${result.summary.highest_fiber ?? "not enough data"}
- ${result.summary.note ?? "Use this as a structured comparison aid."}`
    : "";

  const customerTakeaway = formatCompareCustomerTakeaway(result, language);
  const followUp =
    missedMatches.length > 0 || partialMatches.length > 0
      ? greek
        ? `

Τι σημαίνει αυτό:
- ${missedMatches.length} επιλογή/ές χρειάζονται πιο ακριβές όνομα προϊόντος για σίγουρη σύγκριση.
- ${partialMatches.length} επιλογή/ές έχουν κάποια κενά θρεπτικών στοιχείων, άρα η σύγκριση είναι κατευθυντική.
- Για υγεία, απώλεια βάρους, κουτάβια, νεφρικό ή ουρολογικό θέμα, επιβεβαίωσε τα στοιχεία της ετικέτας πριν επιλέξεις.`
        : `

What this means:
- ${missedMatches.length} item(s) need a more exact product name before I can compare them confidently.
- ${partialMatches.length} item(s) have some nutrition gaps, so use the comparison as directional rather than final.
- For health issues, weight loss, puppies, kidney, or urinary concerns, confirm the label data before choosing.`
      : greek
        ? `

Τι σημαίνει αυτό:
- Βρήκα ${matchedItems.length} προϊόντα αρκετά καθαρά για δομημένη σύγκριση.
- Πριν διαλέξεις, μετράνε πάντα ηλικία, βάρος, στόχος, στείρωση και θέματα υγείας.`
        : `

What this means:
- I found ${matchedItems.length} products clearly enough for a structured comparison.
- Still use pet context before choosing: age, weight goal, neuter status, and health issues matter.`;

  return `${greek ? "Σύγκριση τροφών" : "Food comparison"}:

${rows.join("\n\n")}${summary}${customerTakeaway}${followUp}`;
}

function formatCompactFoodV2RecommendationFallback({
  foodChoices,
  language,
  mode,
}: {
  foodChoices: RecommendedFoodChoice[];
  language: ChatLanguage;
  mode: RecommendationMode;
}) {
  const topChoice = foodChoices[0];

  if (!topChoice) return "";

  if (language === "el") {
    const intro =
      mode === "alternative"
        ? "Βρήκα μερικές εναλλακτικές επιλογές με βάση το ίδιο προφίλ κατοικιδίου."
        : "Βρήκα μερικές κατάλληλες επιλογές από τη βάση NutriTail.";
    const reason = topChoice.reason
      ? `\nΓιατί ξεχωρίζει: ${topChoice.reason}`
      : "";

    return `${intro}

Ξεκίνα από: ${topChoice.name}.${reason}

Πάτησε μία κάρτα από κάτω για να δεις περίπου ποσότητα/ημέρα και να κρατήσω την τροφή στην ανάλυση.`;
  }

  const intro =
    mode === "alternative"
      ? "I found a few alternative options for the same pet profile."
      : "I placed the best matches below as food cards.";
  const reason = topChoice.reason ? `\nWhy it stands out: ${topChoice.reason}` : "";

  return `${intro}

Start with: ${topChoice.name}.${reason}

Choose one card below and I will estimate portions/day and keep that food in the analysis.`;
}

async function getFoodV2RecommendationMessage(
  pet: PetIntake,
  options: {
    mode?: RecommendationMode;
    language?: ChatLanguage;
    onChoices?: (choices: RecommendedFoodChoice[]) => void;
  } = {}
) {
  if (!pet.species) return "";

  const goal = goalFromPetContext({
    species: pet.species,
    age: pet.age,
    neutered: pet.neutered,
    healthIssues: pet.healthIssues,
    allergies: pet.allergies,
    weightGoal: pet.weightGoal,
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
        excludedIngredients: pet.excludedIngredients ?? [],
        preferredProteins: pet.preferredProteins ?? [],
      },
      goal,
      format: "dry",
      limit_per_bucket: 3,
      excluded_brands:
        options.mode === "alternative"
          ? getExcludedBrandsForAlternative(pet.currentFoodName)
          : [],
    }),
  });

  const result = (await response.json()) as FoodV2ChatbotRecommendationResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(result.error || "Could not load Food V2 recommendations.");
  }

  const foodChoices = [
    ...(result.premium ?? []).map((food) =>
      toRecommendationChoice(food, "best", options.language ?? "el")
    ),
    ...(result.value ?? []).map((food) =>
      toRecommendationChoice(food, "value", options.language ?? "el")
    ),
  ]
    .filter((food): food is RecommendedFoodChoice => Boolean(food?.name))
    .slice(0, 5);

  options.onChoices?.(foodChoices);

  const deterministicText = formatFoodV2ChatbotRecommendationSummary(result, {
    mode: options.mode ?? "default",
    locale: options.language ?? "el",
    excludedBrands:
      options.mode === "alternative"
        ? getExcludedBrandsForAlternative(pet.currentFoodName)
        : [],
    maxItemsPerSection: 2,
    compactForCards: foodChoices.length > 0,
  });
  const compactFallbackText =
    foodChoices.length > 0
      ? formatCompactFoodV2RecommendationFallback({
          foodChoices,
          language: options.language ?? "el",
          mode: options.mode ?? "default",
        })
      : deterministicText;

  try {
    const composerResponse = await fetch("/api/account/chatbot/compose-recommendation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale: options.language ?? "el",
        deterministicText,
        cardsFollow: foodChoices.length > 0,
        petSummary: {
          species: pet.species,
          name: pet.name,
          weightKg: pet.weight,
          ageYears: pet.age,
          activityLevel: pet.activityLevel,
          neutered: pet.neutered,
          weightGoal: pet.weightGoal,
          healthIssues: pet.healthIssues ?? [],
          preferredProteins: pet.preferredProteins ?? [],
          excludedIngredients: pet.excludedIngredients ?? [],
        },
        recommendation: result,
      }),
    });

    if (!composerResponse.ok) return compactFallbackText;

    const composed = (await composerResponse.json()) as {
      text?: string;
      source?: "openai" | "fallback";
    };

    return composed.text?.trim() || compactFallbackText;
  } catch (error) {
    console.error("Failed to compose recommendation response:", error);
    return compactFallbackText;
  }
}

function formatPetIntakeSummary(pet: PetIntake, language: ChatLanguage = "en") {
  const greek = language === "el";
  const speciesLabel =
    pet.species === "dog"
      ? greek
        ? "σκύλος"
        : "dog"
      : pet.species === "cat"
        ? greek
          ? "γάτα"
          : "cat"
        : greek
          ? "άγνωστο είδος"
          : "unknown species";
  const activityLabel =
    greek && pet.activityLevel === "low"
      ? "χαμηλή"
      : greek && pet.activityLevel === "normal"
        ? "κανονική"
        : greek && pet.activityLevel === "high"
          ? "υψηλή"
          : pet.activityLevel ?? "unknown";
  const goalLabel = greek
    ? pet.weightGoal === "loss"
      ? "απώλεια βάρους"
      : pet.weightGoal === "gain"
        ? "αύξηση βάρους"
        : "διατήρηση βάρους"
    : getWeightGoalLabel(pet.weightGoal);

  const details = greek
    ? [
        `Κατοικίδιο: ${pet.name ? formatPetDisplayName(pet.name) : "κατοικίδιο"} (${speciesLabel})`,
        `Βάρος/ηλικία: ${pet.weight ?? "-"} kg, ${pet.age ?? "-"} ετών`,
        `Δραστηριότητα: ${activityLabel}`,
        `Στειρωμένο: ${
          pet.neutered === undefined ? "άγνωστο" : pet.neutered ? "ναι" : "όχι"
        }`,
        `Στόχος: ${goalLabel}`,
        `Τωρινή τροφή: ${pet.currentFoodName ?? "δεν δόθηκε"}`,
      ]
    : [
        `Pet: ${pet.name ? formatPetDisplayName(pet.name) : "pet"} (${speciesLabel})`,
        `Weight/age: ${pet.weight ?? "-"} kg, ${pet.age ?? "-"} years`,
        `Activity: ${activityLabel}`,
        `Neutered: ${
          pet.neutered === undefined ? "unknown" : pet.neutered ? "yes" : "no"
        }`,
        `Goal: ${goalLabel}`,
        `Current food: ${pet.currentFoodName ?? "not provided"}`,
      ];

  if (pet.healthIssues.length > 0) {
    details.push(
      greek
        ? `Θέματα υγείας: ${pet.healthIssues.join(", ")}`
        : `Health notes: ${pet.healthIssues.join(", ")}`
    );
  }

  if (pet.allergies.length > 0) {
    details.push(
      greek
        ? `Αλλεργίες/ευαισθησίες: ${pet.allergies.join(", ")}`
        : `Allergies/sensitivities: ${pet.allergies.join(", ")}`
    );
  }

  if ((pet.excludedIngredients ?? []).length > 0) {
    details.push(
      greek
        ? `Αποφεύγει: ${(pet.excludedIngredients ?? []).join(", ")}`
        : `Avoids: ${(pet.excludedIngredients ?? []).join(", ")}`
    );
  }

  if ((pet.preferredProteins ?? []).length > 0) {
    details.push(
      greek
        ? `Προτιμά: ${(pet.preferredProteins ?? []).join(", ")}`
        : `Likes/prefers: ${(pet.preferredProteins ?? []).join(", ")}`
    );
  }

  return details.join("\n");
}

function localizeGuardrailText(text: string, language: ChatLanguage) {
  if (language !== "el") return text;

  return text
    .replace(
      "Safety notes:",
      "Σημειώσεις ασφάλειας:"
    )
    .replace(
      "Practical notes:",
      "Σημειώσεις σιγουριάς:"
    )
    .replace(
      "Useful follow-up questions:",
      "Χρήσιμες ερωτήσεις:"
    )
    .replace(
      /For suspected food allergy, ingredient history matters; an elimination trial or hydrolysed diet plan is more reliable than guessing from one symptom\./g,
      "Για πιθανή τροφική αλλεργία, το ιστορικό συστατικών έχει σημασία. Ένα σωστό elimination trial ή υδρολυμένη τροφή με καθοδήγηση είναι πιο αξιόπιστα από το να μαντέψουμε από ένα σύμπτωμα."
    )
    .replace(
      /I can flag possible ingredient exposures, but I should not diagnose allergy from chat alone\./g,
      "Μπορώ να εντοπίσω πιθανές εκθέσεις σε συστατικά, αλλά δεν γίνεται διάγνωση αλλεργίας μόνο από το chat."
    )
    .replace(
      /For vomiting, diarrhea, or strong digestive discomfort, switch foods slowly and speak with a veterinarian if symptoms are severe, persistent, or paired with weight loss\./g,
      "Για εμετό, διάρροια ή έντονη πεπτική ενόχληση, η αλλαγή τροφής πρέπει να γίνεται αργά και χρειάζεται κτηνίατρος αν τα συμπτώματα είναι έντονα, επίμονα ή συνοδεύονται από απώλεια βάρους."
    )
    .replace(
      /How long have the digestive symptoms been happening, and did they start after a food change\?/g,
      "Πόσο καιρό υπάρχουν τα πεπτικά συμπτώματα και ξεκίνησαν μετά από αλλαγή τροφής;"
    )
    .replace(
      /For weight loss, calorie control and treat calories matter as much as the formula choice\./g,
      "Για απώλεια βάρους, οι θερμίδες και οι λιχουδιές μετράνε όσο και η επιλογή φόρμουλας."
    );
}

function buildGuardrailText(pet: PetIntake, language: ChatLanguage) {
  const guardrails = generateChatGuardrails({
    species: pet.species,
    age: pet.age,
    weightGoal: pet.weightGoal,
    healthIssues: pet.healthIssues,
    allergies: pet.allergies,
  });

  if (!guardrails.hasUrgentSignal) return "";

  const notes = guardrails.safetyNotes.slice(0, 2);
  if (notes.length === 0) return "";

  if (language === "el") {
    return [
      "Μικρή προσοχή πριν δούμε τις τροφές:",
      ...notes.map((note) => `- ${localizeGuardrailText(note, "el")}`),
    ].join("\n");
  }

  return [
    "One quick caution before the food shortlist:",
    ...notes.map((note) => `- ${note}`),
  ].join("\n");
}

function createPetFromIntake(intake: PetIntake): Pet {
  return {
    id: crypto.randomUUID(),
    ownerId: "11111111-1111-1111-1111-111111111111",
    name: formatPetDisplayName(intake.name),
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
  const latest = getLatestSavedPetAnalysis(savedPet);

  return {
    species: savedPet.species,
    name: savedPet.name,
    weight: savedPet.weight,
    age: savedPet.age,
    activityLevel: savedPet.activity_level,
    neutered: savedPet.neutered ?? false,
    healthIssues: savedPet.health_issues ?? [],
    allergies: savedPet.allergies ?? [],
    weightGoal: parseSavedWeightGoal(getHistoryWeightGoal(latest)),
  };
}

function getLatestSavedPetAnalysis(savedPet: AccountPet) {
  return savedPet.analysisHistory?.[0] ?? null;
}

function getHistoryWeightGoal(item?: AccountPetAnalysisHistoryItem | null) {
  return item?.weightGoal ?? item?.weight_goal ?? null;
}

function getHistoryFoodName(item?: AccountPetAnalysisHistoryItem | null) {
  return item?.matchedFoodName ?? item?.matched_food_name ?? null;
}

function getHistoryFeedingGrams(item?: AccountPetAnalysisHistoryItem | null) {
  return item?.feedingGramsPerDay ?? item?.feeding_grams_per_day ?? null;
}

function getHistoryFoodScore(item?: AccountPetAnalysisHistoryItem | null) {
  return item?.foodScore ?? item?.food_score ?? null;
}

function formatCustomerFoodFit(score?: number | null, language: ChatLanguage = "en") {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return language === "el" ? "χρήσιμη ένδειξη" : "useful context";
  }

  if (score >= 80) return language === "el" ? "πολύ δυνατή επιλογή" : "strong fit";
  if (score >= 60) return language === "el" ? "καλή επιλογή" : "good fit";
  return language === "el" ? "πιο προσεκτική επιλογή" : "cautious fit";
}

function parseSavedWeightGoal(value?: string | null): WeightGoal | undefined {
  if (!value) return undefined;

  const normalized = value.toLowerCase();

  if (normalized.includes("loss") || normalized.includes("lose")) return "loss";
  if (normalized.includes("gain")) return "gain";
  if (normalized.includes("maintain")) return "maintain";

  return undefined;
}

function savedWeightGoalLabel(value?: string | null, language: ChatLanguage = "en") {
  const goal = parseSavedWeightGoal(value);
  if (language !== "el") return getWeightGoalLabel(goal);

  if (goal === "loss") return "απώλεια βάρους";
  if (goal === "gain") return "αύξηση βάρους";
  return "διατήρηση βάρους";
}

function formatLatestAnalysisSummary(
  savedPet: AccountPet,
  language: ChatLanguage = "en"
) {
  const latest = getLatestSavedPetAnalysis(savedPet);

  if (!latest) {
    return language === "el"
      ? "Δεν βρέθηκε προηγούμενη ανάλυση."
      : "No previous analysis found.";
  }

  const parts = [
    getHistoryWeightGoal(latest)
      ? language === "el"
        ? `Στόχος: ${savedWeightGoalLabel(getHistoryWeightGoal(latest), language)}`
        : `Goal: ${savedWeightGoalLabel(getHistoryWeightGoal(latest), language)}`
      : null,
    getHistoryFoodName(latest)
      ? language === "el"
        ? `Τροφή: ${getHistoryFoodName(latest)}`
        : `Food: ${getHistoryFoodName(latest)}`
      : null,
    getHistoryFeedingGrams(latest)
      ? language === "el"
        ? `Ποσότητα: ${getHistoryFeedingGrams(latest)}g/ημέρα`
        : `Feeding: ${getHistoryFeedingGrams(latest)}g/day`
      : null,
    typeof getHistoryFoodScore(latest) === "number"
      ? language === "el"
        ? `Ταίριασμα τροφής: ${formatCustomerFoodFit(getHistoryFoodScore(latest), language)}`
        : `Food fit: ${formatCustomerFoodFit(getHistoryFoodScore(latest), language)}`
      : null,
  ].filter(Boolean);

  return parts.length
    ? parts.join("\n")
    : language === "el"
      ? "Υπάρχει προηγούμενη ανάλυση, αλλά έχει περιορισμένες αποθηκευμένες λεπτομέρειες."
      : "Previous analysis exists, but it has limited saved details.";
}

function formatSavedPetProfileSummary(
  savedPet: AccountPet,
  language: ChatLanguage = "en"
) {
  const details =
    language === "el"
      ? [
          `Προφίλ: ${savedPet.species === "dog" ? "σκύλος" : "γάτα"}, ${savedPet.weight ?? "-"} kg, ${savedPet.age ?? "-"} ετών`,
          `Δραστηριότητα: ${savedPet.activity_level ?? "άγνωστη"}`,
          `Στειρωμένο: ${savedPet.neutered ? "ναι" : "όχι"}`,
        ]
      : [
          `Profile: ${savedPet.species}, ${savedPet.weight ?? "-"} kg, ${savedPet.age ?? "-"} years`,
          `Activity: ${savedPet.activity_level ?? "unknown"}`,
          `Neutered: ${savedPet.neutered ? "yes" : "no"}`,
        ];

  if ((savedPet.health_issues ?? []).length > 0) {
    details.push(
      language === "el"
        ? `Σημειώσεις υγείας: ${(savedPet.health_issues ?? []).join(", ")}`
        : `Health notes: ${(savedPet.health_issues ?? []).join(", ")}`
    );
  }

  if ((savedPet.allergies ?? []).length > 0) {
    details.push(
      language === "el"
        ? `Αποφυγές: ${(savedPet.allergies ?? []).join(", ")}`
        : `Avoid: ${(savedPet.allergies ?? []).join(", ")}`
    );
  }

  return details.join("\n");
}

function formatSavedPetContinuityIntro(
  savedPet: AccountPet,
  language: ChatLanguage = "en"
) {
  if (language === "el") {
    return `Βρήκα προηγούμενο διατροφικό ιστορικό για ${savedPet.name}.

Αποθηκευμένο προφίλ:
${formatSavedPetProfileSummary(savedPet, language)}

Τελευταία ανάλυση:
${formatLatestAnalysisSummary(savedPet, language)}

Τι θέλεις να κάνουμε τώρα;
- Έλεγχος προόδου: γράψε τωρινό βάρος, γραμμάρια/ημέρα, λιχουδιές και τι αλλαγές βλέπεις.
- Δεν είδα αποτέλεσμα: ελέγχουμε θερμίδες, λιχουδιές, συνέπεια και αν ταιριάζει η τροφή.
- Άλλη τροφή: κρατάω το ίδιο κατοικίδιο και ψάχνω διαφορετικές επιλογές.
- Ιστορικό: βλέπεις προηγούμενες αναλύσεις και πρόοδο.`;
  }

  return `I found previous nutrition history for ${savedPet.name}.

Saved profile:
${formatSavedPetProfileSummary(savedPet, language)}

Latest saved analysis:
${formatLatestAnalysisSummary(savedPet, language)}

What would you like to do next?
- Progress check: tell me current weight, grams/day, treats, and visible changes.
- No visible result: we review calories, treats, consistency, and whether the food fits.
- Try another food: I keep this pet context and suggest different options.
- Open timeline: review previous reports and progress.`;
}

function buildFollowUpProgressReply({
  text,
  savedPet,
  mode,
  language = "en",
}: {
  text: string;
  savedPet: AccountPet;
  mode: Exclude<FollowUpMode, null>;
  language?: ChatLanguage;
}) {
  const currentWeight = parseNumber(text);
  const previousWeight = Number(savedPet.weight);
  const deltaKg =
    currentWeight && Number.isFinite(previousWeight)
      ? Number((currentWeight - previousWeight).toFixed(1))
      : null;
  const weightLine =
    currentWeight && Number.isFinite(previousWeight)
      ? language === "el"
        ? deltaKg !== null && deltaKg < 0
          ? `Το τωρινό βάρος φαίνεται χαμηλότερο από το αποθηκευμένο (${previousWeight} kg -> ${currentWeight} kg). Αυτό δείχνει πρόοδο, αρκεί να είναι σταδιακή και το ζώο να έχει καλή όρεξη/ενέργεια.`
          : deltaKg !== null && deltaKg > 0
            ? `Το τωρινό βάρος φαίνεται υψηλότερο από το αποθηκευμένο (${previousWeight} kg -> ${currentWeight} kg). Θέλει έλεγχο σε γραμμάρια, λιχουδιές και θερμιδική πυκνότητα τροφής.`
            : `Το βάρος φαίνεται ίδιο με το αποθηκευμένο (${previousWeight} kg). Αυτό δεν σημαίνει απαραίτητα αποτυχία, αλλά πρέπει να δούμε συνέπεια, λιχουδιές και χρόνο εφαρμογής.`
        : deltaKg !== null && deltaKg < 0
          ? `Current weight looks lower than the saved profile (${previousWeight} kg -> ${currentWeight} kg). That suggests progress, but keep checking body condition and energy.`
          : deltaKg !== null && deltaKg > 0
            ? `Current weight looks higher than the saved profile (${previousWeight} kg -> ${currentWeight} kg). We should review portions, treats, and food density.`
            : `Current weight looks unchanged from the saved profile (${previousWeight} kg). That does not always mean failure, but we should check consistency and timing.`
      : language === "el"
        ? "Δεν διάβασα καθαρά τωρινό βάρος. Γράψε βάρος σε kg, γραμμάρια/ημέρα, λιχουδιές και τι αλλαγές βλέπεις."
        : "I could not read a clear current weight yet. Send weight in kg, daily grams, treats, and any visible changes.";

  const latest = getLatestSavedPetAnalysis(savedPet);
  const grams = getHistoryFeedingGrams(latest);
  const foodName = getHistoryFoodName(latest);

  if (mode === "no_result") {
    if (language === "el") {
      return `${weightLine}

Αν δεν είδαμε αποτέλεσμα, θα το έλεγχα με αυτή τη σειρά:
1. Ζυγίζουμε την τροφή με ζυγαριά κουζίνας, όχι με ποτήρι.
2. Οι λιχουδιές μπαίνουν μέσα στο ημερήσιο όριο.
3. Όλοι στο σπίτι ταΐζουν το ίδιο πλάνο.
4. Ζύγισμα μία φορά την εβδομάδα, στην ίδια ζυγαριά.
5. Αν σε 2-3 εβδομάδες δεν αλλάζει τίποτα, ξανατρέχουμε ανάλυση με τωρινό βάρος και ακριβή τροφή.

Αποθηκευμένο πλαίσιο:
- Τροφή: ${foodName ?? "δεν έχει επιβεβαιωθεί"}
- Προηγούμενη ποσότητα: ${grams ? `${grams}g/ημέρα` : "δεν έχει επιβεβαιωθεί"}

Στείλε μου ακριβή γραμμάρια/ημέρα και λιχουδιές/ημέρα για να κρίνω αν θέλει μικρή μείωση, αλλαγή τροφής ή νέα ανάλυση.`;
    }

    return `${weightLine}

For no visible result, I would check this order:
1. Measure the food with a kitchen scale, not a cup.
2. Keep treats within the daily allowance.
3. Confirm everyone at home is feeding the same plan.
4. Weigh once weekly on the same scale.
5. If nothing changes after 2-3 weeks, re-run the analysis with the current weight and exact food.

Saved context:
- Food: ${foodName ?? "not confirmed"}
- Previous feeding amount: ${grams ? `${grams}g/day` : "not confirmed"}

Send the exact daily grams and treats per day and I can help decide whether to adjust the plan or suggest a different food.`;
  }

  if (language === "el") {
    return `${weightLine}

Για να κρίνουμε δίκαια την πρόοδο, στείλε μου:
1. Πόσα γραμμάρια/ημέρα τρώει τώρα
2. Πόσες λιχουδιές/σνακ παίρνει
3. Αν η όρεξη είναι φυσιολογική, υπερβολική ή μειωμένη
4. Πώς είναι κόπρανα και ενέργεια

Αποθηκευμένο πλαίσιο:
- Τροφή: ${foodName ?? "δεν έχει επιβεβαιωθεί"}
- Προηγούμενη ποσότητα: ${grams ? `${grams}g/ημέρα` : "δεν έχει επιβεβαιωθεί"}

Αν το θέμα είναι ότι βαρέθηκε γεύση ή εταιρία, πάτησε "Άλλη τροφή" και θα κρατήσω το ίδιο προφίλ.`;
  }

  return `${weightLine}

To judge progress fairly, send me:
1. Current daily grams
2. Treats/snacks per day
3. Whether appetite is normal, hungry, or picky
4. Stool quality and energy

Saved context:
- Food: ${foodName ?? "not confirmed"}
- Previous feeding amount: ${grams ? `${grams}g/day` : "not confirmed"}

If the food is no longer accepted or the taste/brand is the issue, choose "Try another food" and I will keep the same pet context.`;
}

function extractProgressDetails(text: string) {
  const normalized = text.toLowerCase().replace(",", ".");
  const weightMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:kg|κιλ|κιλα|κιλά)/);
  const gramsMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:g|gr|γρ|γραμμαρια|γραμμάρια)/);

  return {
    currentWeightKg: weightMatch ? Number(weightMatch[1]) : parseNumber(text),
    feedingGramsPerDay: gramsMatch ? Number(gramsMatch[1]) : null,
  };
}

function hasProgressMetric(text: string) {
  const details = extractReadableProgressDetails(text);
  return (
    (typeof details.currentWeightKg === "number" &&
      Number.isFinite(details.currentWeightKg)) ||
    (typeof details.feedingGramsPerDay === "number" &&
      Number.isFinite(details.feedingGramsPerDay))
  );
}

function extractReadableProgressDetails(text: string) {
  const normalized = text.toLowerCase().replace(",", ".");
  const legacyDetails = extractProgressDetails(text);
  const weightMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:kg|kgs|κιλ|κιλα|κιλά|κιλο|κιλό|κιλογραμμα|κιλογραμμο|κιλογραμμάριο|kilo)\b/i
  );
  const gramsMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:g|gr|gram|grams|γρ|γρ\.|γραμμαρια|γραμμάρια|γραμμαριο|γραμμάριο)\b/i
  );
  const plainNumber = parseNumber(text);

  return {
    currentWeightKg: weightMatch
      ? Number(weightMatch[1])
      : gramsMatch
        ? null
        : legacyDetails.currentWeightKg ?? plainNumber,
    feedingGramsPerDay:
      gramsMatch ? Number(gramsMatch[1]) : legacyDetails.feedingGramsPerDay,
  };
}

function formatAnalysisResult(analysis: PetAnalysis, language: ChatLanguage = "en") {
  const { nutrition, advice } = analysis;
  const translateAdviceTitle = (title: string) => {
    if (language !== "el") return title;
    if (title === "Weight Control") return "Έλεγχος βάρους";
    if (title === "Senior Nutrition") return "Διατροφή senior";
    if (title === "Puppy/Kitten Growth") return "Ανάπτυξη κουταβιού/γατιού";
    if (title === "High Activity") return "Υψηλή δραστηριότητα";
    return title;
  };
  const translateAdviceDescription = (description: string) => {
    if (language !== "el") return description;
    if (
      /Highly active pets may require increased calories and protein levels\./i.test(
        description
      )
    ) {
      return "Τα πολύ δραστήρια ζώα μπορεί να χρειάζονται περισσότερες θερμίδες και επαρκή πρωτεΐνη.";
    }
    return description
      .replace(
        /Neutered or weight-prone pets often need calorie control, measured portions, and treat calories kept within the daily target\./gi,
        "Τα στειρωμένα ή επιρρεπή σε βάρος ζώα συνήθως χρειάζονται έλεγχο θερμίδων, μετρημένες μερίδες και οι λιχουδιές να μένουν μέσα στον ημερήσιο στόχο."
      )
      .replace(
        /Older pets need monitoring for appetite, weight trend, muscle condition, and digestibility\. Do not assume a light diet is best if the pet is losing weight\./gi,
        "Τα μεγαλύτερα ζώα χρειάζονται παρακολούθηση όρεξης, τάσης βάρους, μυϊκής κατάστασης και πέψης. Δεν θεωρούμε αυτόματα ότι μια light τροφή είναι η καλύτερη αν χάνει βάρος."
      );
  };

  if (language === "el") {
    return `Η πρώτη διατροφική ανάλυση είναι έτοιμη:

Θερμίδες ηρεμίας: ${nutrition.rer} kcal/ημέρα
Αυτό είναι περίπου το βασικό ποσό ενέργειας που χρειάζεται το σώμα σε πλήρη ηρεμία.

Βασικός ημερήσιος στόχος: ${nutrition.der} kcal/ημέρα
Αυτός είναι ο στόχος πριν την τελική προσαρμογή για απώλεια ή αύξηση βάρους. Λαμβάνει υπόψη βάρος, ηλικία, δραστηριότητα και στείρωση.

Βασικά σημεία:
${
  advice.length > 0
    ? advice
        .map(
          (item) =>
            `- ${translateAdviceTitle(item.title)}: ${translateAdviceDescription(item.description)}`
        )
        .join("\n")
    : "- Δεν υπάρχουν ειδικές σημειώσεις για αυτή την ανάλυση."
}

Σημείωση: Η καθοδήγηση είναι ενημερωτική και δεν αντικαθιστά κτηνιατρική συμβουλή.`;
  }

  return `Your first nutrition analysis is ready:

Resting calories: ${nutrition.rer} kcal/day
This is roughly the basic energy the body needs at complete rest.

Base daily target: ${nutrition.der} kcal/day
This is the target before the final weight-loss or weight-gain adjustment. It considers weight, age, activity, and neuter status.

Key notes:
${
  advice.length > 0
    ? advice
        .map((item) => `- ${item.title}: ${item.description}`)
        .join("\n")
    : "- No special notes for this analysis."
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

    if (
      Number.isFinite(numberValue) &&
      numberValue >= 20 &&
      numberValue <= 900
    ) {
      return numberValue;
    }
  }

  return null;
}

export default function AccountChatbotPage() {
  const router = useRouter();
  const pathname = usePathname();
  const handledDeepLinkRef = useRef<string | null>(null);
  const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const [step, setStep] = useState<IntakeStep>("petChoice");
  const [chatLanguage, setChatLanguage] = useState<ChatLanguage>("el");
  const [input, setInput] = useState("");
  const [savedPets, setSavedPets] = useState<AccountPet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [followUpPet, setFollowUpPet] = useState<AccountPet | null>(null);
  const [followUpMode, setFollowUpMode] = useState<FollowUpMode>(null);
  const [recommendationMode, setRecommendationMode] =
    useState<RecommendationMode>("default");
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
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [savedPetId, setSavedPetId] = useState<string | null>(null);
  const [recommendedFoodChoices, setRecommendedFoodChoices] = useState<
    RecommendedFoodChoice[]
  >([]);
  const [pendingCompareQueries, setPendingCompareQueries] = useState<string[]>(
    []
  );

  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage(
      "bot",
      "Γεια σου! Επίλεξε ένα αποθηκευμένο κατοικίδιο για νέα ανάλυση ή ξεκίνα με νέο κατοικίδιο."
    ),
  ]);
  const quickReplies = getQuickReplies(step, chatLanguage);
  const inputHelper =
    followUpPet && step === "petChoice" && !followUpMode
      ? botText(
          "Tip: γράψε τωρινό βάρος, γραμμάρια/ημέρα, δεν είδα αποτέλεσμα ή άλλη τροφή.",
          "Tip: write current weight, daily grams, no result, or another food."
        )
      : followUpMode === "progress"
        ? botText(
            "Στείλε βάρος, γραμμάρια/ημέρα, λιχουδιές, όρεξη, κόπρανα ή αλλαγές ενέργειας.",
            "Send weight, daily grams, treats, appetite, stool, or energy changes."
          )
        : followUpMode === "no_result"
          ? botText(
              "Στείλε τωρινό βάρος, γραμμάρια/ημέρα, λιχουδιές και τωρινή τροφή.",
              "Send current weight, grams per day, treats, and current food."
            )
          : showSave
            ? botText(
                "Αποθήκευσε όταν τα στοιχεία είναι σωστά ή γράψε τι θέλει αλλαγή.",
                "Save when the details look right, or write what needs changing."
              )
            : "";

  function addMessages(...nextMessages: ChatMessage[]) {
    const visibleMessages = nextMessages.filter((message) => message.text.trim());
    if (visibleMessages.length === 0) return;

    setMessages((prev) => [...prev, ...visibleMessages]);
  }

  function botText(el: string, en: string) {
    if (!en.trim()) return "";

    return chatLanguage === "el" ? repairCustomerGreekText(el) : en;
  }

  function getNextMissingIntakeStep(draft: PetIntake): IntakeStep {
    if (!draft.species) return "species";
    if (!draft.name) return "name";
    if (!draft.weight) return "weight";
    if (!draft.age) return "age";
    if (!draft.activityLevel) return "activity";
    if (draft.neutered === undefined) return "neutered";
    if ((draft.healthIssues ?? []).length === 0 && (draft.allergies ?? []).length === 0) {
      return "health";
    }
    if (!draft.currentFoodName) return "currentFood";
    if ((draft.preferredProteins ?? []).length === 0 && (draft.excludedIngredients ?? []).length === 0) {
      return "preferences";
    }
    if (!draft.weightGoal) return "weightGoal";
    return "analysis";
  }

  function getIntakeQuestion(nextStep: IntakeStep, draft: PetIntake) {
    const displayName = draft.name ? formatPetDisplayName(draft.name) : undefined;

    switch (nextStep) {
      case "species":
        return botText("Τέλεια. Έχεις σκύλο ή γάτα;", "Great. Do you have a dog or a cat?");
      case "name":
        return draft.species === "cat"
          ? botText("Τέλεια, γάτα. Πώς τον/την λένε;", "Great, a cat. What is their name?")
          : botText("Τέλεια, σκύλος. Πώς τον/την λένε;", "Great, a dog. What is their name?");
      case "weight":
        return botText(
          `Ωραία. Περίπου πόσα κιλά είναι ο/η ${displayName ?? "το κατοικίδιο"};`,
          `Nice. About how many kg is ${displayName ?? "your pet"}?`
        );
      case "age":
        return botText("Τέλεια. Πόσο χρονών είναι;", "Great. How old is your pet?");
      case "activity":
        return botText(
          "Ποιο είναι το επίπεδο δραστηριότητας: χαμηλό, κανονικό ή υψηλό;",
          "What is your pet's activity level: low, normal, or high?"
        );
      case "neutered":
        return botText("Είναι στειρωμένο; Ναι ή όχι;", "Is your pet neutered? Yes or no?");
      case "health":
        return botText(
          "Υπάρχουν αλλεργίες, ευαισθησίες ή θέματα υγείας; Αν όχι, γράψε όχι. Αν ναι, γράψ’ τα με κόμμα.",
          "Any allergies, sensitivities, or health issues? If not, type no. If yes, separate them with commas."
        );
      case "currentFood":
        return botText(
          "Ποια τροφή τρώει τώρα; Γράψε εταιρεία και όνομα προϊόντος αν το ξέρεις. Αν δεν είσαι σίγουρος/η, γράψε δεν ξέρω.",
          "What food are you feeding now? Write the brand and product name if you know it. If you are not sure, type I don't know."
        );
      case "preferences":
        return botText(
          "Υπάρχει γεύση ή πρωτεΐνη που προτιμά ή αποφεύγει; Π.χ. του αρέσει αρνί ή σολομός, δεν τρώει κοτόπουλο. Αν δεν υπάρχει προτίμηση, γράψε όχι.",
          "Does your pet prefer or avoid any flavors or proteins? For example: likes lamb or salmon, does not eat chicken. If there is no preference, type no."
        );
      case "weightGoal":
        return botText(
          "Ποιος είναι ο στόχος βάρους: διατήρηση, απώλεια ή αύξηση;",
          "What is the weight goal: maintain weight, lose weight, or gain weight?"
        );
      default:
        return "";
    }
  }

  function askNextMissingIntakeQuestion(draft: PetIntake) {
    const nextStep = getNextMissingIntakeStep(draft);
    if (nextStep === "analysis") return false;

    setStep(nextStep);
    addMessages(createMessage("bot", getIntakeQuestion(nextStep, draft)));
    return true;
  }

  function isNewPetRequest(text: string) {
    const normalized = normalizeUserText(text);

    return (
      normalized.includes("new pet") ||
      normalized.includes("start new") ||
      normalized.includes("neo katoikidio") ||
      normalized.includes("νέο κατοικίδιο") ||
      normalized.includes("νεο κατοικιδιο")
    );
  }

  function startNewPetFromPetChoice(
    text: string,
    extracted?: AiIntakeExtraction | null
  ) {
    const species = parseSpeciesInput(text);
    const extractedPet = mergeExtractedPetFacts(
      {
        healthIssues: [],
        allergies: [],
        excludedIngredients: [],
        preferredProteins: [],
      },
      extracted
    );
    const startingPet = sanitizePetIntake({
      ...extractedPet,
      species: species ?? extractedPet.species,
    });

    setSelectedPetId(null);
    setFollowUpMode(null);
    setRecommendationMode("default");
    setAnalysisMetadata({});
    setRecommendedFoodChoices([]);
    setPet(startingPet);

    if (!startingPet.species) {
      askNextMissingIntakeQuestion(startingPet);
      return true;
    }

    askNextMissingIntakeQuestion(startingPet);
    return true;
  }

  async function extractIntakeFactsFromMessage(text: string) {
    if (!shouldExtractIntakeFacts(step, text)) return null;

    try {
      const response = await fetch("/api/account/chatbot/extract-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          locale: chatLanguage,
        }),
      });

      if (!response.ok) return null;

      return (await response.json()) as IntakeExtractionApiResponse;
    } catch (error) {
      console.error("Failed to extract intake facts:", error);
      return null;
    }
  }

  async function runFoodComparison(
    queries: string[],
    options: { species?: Species } = {}
  ) {
    try {
      addMessages(
        createMessage(
          "bot",
          botText(
            `Θα συγκρίνω αυτές τις επιλογές: ${queries.join(" vs ")}`,
            `I will compare these foods: ${queries.join(" vs ")}`
          )
        )
      );

      const response = await fetch("/api/account/foods/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          queries,
          species: options.species ?? pet.species ?? "dog",
        }),
      });

      const result = (await response.json()) as FoodCompareResponse;

      if (!response.ok) {
        throw new Error(result.error || "Failed to compare foods.");
      }

      addMessages(createMessage("bot", formatFoodComparison(result, chatLanguage)));
    } catch (error) {
      console.error(error);
      addMessages(
        createMessage(
          "bot",
          botText(
            "Δεν μπόρεσα να ολοκληρώσω τη σύγκριση. Δοκίμασε με πιο ακριβές όνομα εταιρείας και φόρμουλας.",
            "I could not complete the comparison. Try using exact brand and formula names."
          )
        )
      );
    }
  }

  async function submitChatFeedback({
    eventType,
    rating,
    message,
    context,
    showConfirmation = false,
  }: {
    eventType: string;
    rating: string;
    message?: string;
    context?: Record<string, unknown>;
    showConfirmation?: boolean;
  }) {
    try {
      const response = await fetch("/api/feedback/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventType,
          rating,
          message,
          context: {
            petSpecies: pet.species ?? null,
            currentFoodName: pet.currentFoodName ?? null,
            weightGoal: pet.weightGoal ?? null,
            healthIssues: pet.healthIssues,
            allergies: pet.allergies,
            ...context,
          },
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to record feedback.");
      }

      if (showConfirmation) {
        setFeedbackStatus("Thanks. Your feedback was recorded.");
      }
    } catch (error) {
      console.error(error);
      if (showConfirmation) {
        setFeedbackStatus("I could not record feedback right now.");
      }
    }
  }

  async function saveFollowUpProgressLog({
    savedPet,
    mode,
    text,
  }: {
    savedPet: AccountPet;
    mode: Exclude<FollowUpMode, null>;
    text: string;
  }) {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const authUserId = data.session?.user?.id;

      if (!authUserId) return;

      const details = extractReadableProgressDetails(text);

      await fetch(`/api/account/pets/${savedPet.id}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authUserId,
          mode,
          note: text,
          currentWeightKg: details.currentWeightKg,
          feedingGramsPerDay: details.feedingGramsPerDay,
        }),
      });
    } catch (error) {
      console.error("Failed to save follow-up progress log:", error);
    }
  }

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior,
        });
        return;
      }

      messagesEndRef.current?.scrollIntoView({
        behavior,
        block: "end",
      });
    };

    const frame = window.requestAnimationFrame(() => scrollToBottom("auto"));
    const delayed = [120, 350, 800].map((delay) =>
      window.setTimeout(() => scrollToBottom("auto"), delay)
    );
    const container = messagesContainerRef.current;
    const resizeObserver =
      container && "ResizeObserver" in window
        ? new ResizeObserver(() => scrollToBottom("auto"))
        : null;

    if (container && resizeObserver) {
      resizeObserver.observe(container);
      Array.from(container.children).forEach((child) =>
        resizeObserver.observe(child)
      );
    }

    return () => {
      window.cancelAnimationFrame(frame);
      delayed.forEach((timeoutId) => window.clearTimeout(timeoutId));
      resizeObserver?.disconnect();
    };
  }, [messages, showSave, step, isAnalyzing, recommendedFoodChoices.length]);

  useEffect(() => {
    async function loadSavedPets() {
      try {
        setIsLoadingPets(true);

        const supabase = createClient();
        const { data } = await supabase.auth.getSession();

        if (!data.session?.user) {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
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
  }, [pathname, router]);

  function selectSavedPet(savedPet: AccountPet) {
    const nextPet = createIntakeFromSavedPet(savedPet);
    const hasHistory = (savedPet.analysisHistory?.length ?? 0) > 0;

    setSelectedPetId(savedPet.id);
    setPet(nextPet);
    setRecommendedFoodChoices([]);

    if (hasHistory) {
      setFollowUpPet(savedPet);
      setStep("petChoice");

      addMessages(
        createMessage("user", `Use ${savedPet.name}`),
        createMessage(
          "bot",
          formatSavedPetContinuityIntro(savedPet, chatLanguage)
        )
      );

      return;
    }

    setFollowUpPet(null);
    setStep("currentFood");

    addMessages(
      createMessage("user", `Use ${savedPet.name}`),
      createMessage(
        "bot",
        `Great. I will use ${savedPet.name}'s saved profile. What food is ${savedPet.name} eating now? If you are not sure, type "I don't know".`
      )
    );
  }

  function startSavedPetAnalysis(savedPet: AccountPet) {
    const nextPet = createIntakeFromSavedPet(savedPet);

    setSelectedPetId(savedPet.id);
    setFollowUpPet(null);
    setRecommendationMode("default");
    setPet(nextPet);
    setRecommendedFoodChoices([]);
    setStep("currentFood");

    addMessages(
      createMessage(
        "bot",
        `Great. I will run a fresh analysis for ${savedPet.name}. What food is ${savedPet.name} eating now? If you are not sure, type "I don't know".`
      )
    );
  }

  function runFollowUpAction(
    targetPet: AccountPet,
    action: FollowUpAction,
    options: { echoUser?: boolean } = {}
  ) {
    const echoUser = options.echoUser ?? true;

    void submitChatFeedback({
      eventType: "chat_followup_action",
      rating: "unknown",
      message: `User selected saved-pet follow-up action: ${action}.`,
      context: {
        action,
        petId: targetPet.id,
        petName: targetPet.name,
        hasAnalysisHistory: (targetPet.analysisHistory?.length ?? 0) > 0,
        latestAnalysisSummary: formatLatestAnalysisSummary(targetPet),
      },
    });

    const nextPet = createIntakeFromSavedPet(targetPet);
    setSelectedPetId(targetPet.id);
    setFollowUpPet(targetPet);
    setPet(nextPet);

    if (action === "timeline") {
      addMessages(
        ...(echoUser
          ? [createMessage("user", botText("Άνοιγμα ιστορικού", "Open timeline"))]
          : []),
        createMessage(
          "bot",
          botText(
            `Μπορείς να δεις το προηγούμενο διατροφικό ιστορικό του/της ${targetPet.name} εδώ:

- Προφίλ κατοικιδίου: ${siteUrl}/account/pets/${targetPet.id}
- Εκτυπώσιμο timeline: ${siteUrl}/print/pet-timeline/${targetPet.id}

Μετά γύρνα εδώ και γράψε μου τι άλλαξε: βάρος, όρεξη, κόπρανα, λιχουδιές ή αν δέχτηκε την τροφή.`,
            `You can review ${targetPet.name}'s previous nutrition history here:

- Pet profile: ${siteUrl}/account/pets/${targetPet.id}
- Printable timeline: ${siteUrl}/print/pet-timeline/${targetPet.id}

After checking it, come back and tell me what changed: weight, appetite, stool quality, treats, or whether the food was accepted.`
          )
        )
      );
      return;
    }

    if (action === "progress") {
      setStep("petChoice");
      setFollowUpMode("progress");
      addMessages(
        ...(echoUser
          ? [createMessage("user", botText("Έλεγχος προόδου", "Progress check"))]
          : []),
        createMessage(
          "bot",
          botText(
            `Πάμε να ελέγξουμε την πρόοδο του/της ${targetPet.name}, χωρίς να ξεκινήσουμε από την αρχή.

Γράψε μου:
1. Τωρινό βάρος
2. Πόσα γραμμάρια/ημέρα τρώει
3. Λιχουδιές/σνακ ανά ημέρα
4. Τι αλλαγή βλέπεις σε σώμα, όρεξη, κόπρανα ή ενέργεια

Μετά θα σου πω αν το πλάνο φαίνεται να δουλεύει ή αν θέλει προσαρμογή.`,
            `Let's check ${targetPet.name}'s progress without starting from zero.

Tell me:
1. Current weight now
2. How many grams per day you are feeding
3. Treats/snacks per day
4. Any visible change in body shape, appetite, stool, or energy

Then I can help decide whether the plan is working or needs adjustment.`
          ) +
            "\n\n" +
            botText(
              "Μπορείς να ξεκινήσεις μόνο με το τωρινό βάρος, π.χ. 7 kg. Μετά θα σου ζητήσω μόνο ό,τι λείπει.",
              "You can start with only the current weight, for example 7 kg. After that I will ask only for what is missing."
            )
        )
      );
      return;
    }

    if (action === "no_result") {
      setStep("petChoice");
      setFollowUpMode("no_result");
      addMessages(
        ...(echoUser
          ? [
              createMessage(
                "user",
                botText("Δεν είδα αποτέλεσμα", "No visible result")
              ),
            ]
          : []),
        createMessage(
          "bot",
          botText(
            `Αν δεν είδαμε αποτέλεσμα, πρώτα ελέγχουμε τα πρακτικά σημεία:

- Τα γραμμάρια μετριούνται με ζυγαριά;
- Οι λιχουδιές μπαίνουν μέσα στις ημερήσιες θερμίδες;
- Ταΐζει κάποιος άλλος κάτι έξτρα;
- Το βάρος ελέγχεται στην ίδια ζυγαριά;
- Άλλαξε τροφή μετά την τελευταία ανάλυση;

Στείλε μου τωρινό βάρος, γραμμάρια/ημέρα, όνομα τροφής και λιχουδιές/ημέρα. Μετά θα σου πω αν θέλει μικρή μείωση, αλλαγή τροφής ή νέα ανάλυση.`,
            `If there was no weight-loss progress, I would first check the practical blockers:

- Are the grams measured with a scale?
- Are treats included in the daily calories?
- Did anyone else feed extra food?
- Has weight been checked on the same scale?
- Has the food changed since the last analysis?

Send me the current weight, daily grams, food name, and treats per day. I can then suggest whether to reduce portions carefully, change food type, or re-run the full analysis.`
          )
        )
      );
      return;
    }

    if (action === "change_food") {
      setFollowUpPet(null);
      setFollowUpMode(null);
      setRecommendationMode("alternative");
      setStep("currentFood");
      addMessages(
        ...(echoUser
          ? [createMessage("user", botText("Άλλη τροφή", "Try another food"))]
          : []),
        createMessage(
          "bot",
          botText(
            `Κανένα πρόβλημα. Αν ο/η ${targetPet.name} βαρέθηκε γεύση, εταιρία ή φόρμουλα, μπορώ να ψάξω άλλη επιλογή κρατώντας τον ίδιο στόχο.

Ποια τροφή τρώει τώρα; Γράψε ακριβή εταιρία και προϊόν αν τα ξέρεις, αλλιώς γράψε "δεν ξέρω".`,
            `No problem. If ${targetPet.name} got bored of the taste, brand, or formula, I can look for another option while keeping the same goal.

What food is ${targetPet.name} eating now? Write the exact brand and formula if you know it, or type "I don't know".`
          )
        )
      );
      return;
    }

    if (action === "new_analysis") {
      setFollowUpPet(null);
      setFollowUpMode(null);
      startSavedPetAnalysis(targetPet);
    }
  }

  function handleFollowUpAction(
    action: FollowUpAction,
    options: { echoUser?: boolean } = {}
  ) {
    if (!followUpPet) return;

    runFollowUpAction(followUpPet, action, options);
  }

  useEffect(() => {
    if (isLoadingPets) return;

    const query = new URLSearchParams(window.location.search);
    const targetPetId = query.get("petId");
    if (!targetPetId) return;

    const mode = query.get("mode");
    const deepLinkKey = `${targetPetId}:${mode ?? "default"}`;

    if (handledDeepLinkRef.current === deepLinkKey) return;

    const targetPet = savedPets.find((savedPet) => savedPet.id === targetPetId);
    if (!targetPet) return;

    handledDeepLinkRef.current = deepLinkKey;

    if (mode === "progress" && (targetPet.analysisHistory?.length ?? 0) > 0) {
      setSelectedPetId(targetPet.id);
      setFollowUpPet(targetPet);
      setPet(createIntakeFromSavedPet(targetPet));
      setStep("petChoice");
      setFollowUpMode("progress");
      addMessages(
        createMessage("user", "Progress check"),
        createMessage(
          "bot",
          `Let's check ${targetPet.name}'s progress without starting from zero.

Tell me:
1. Current weight now
2. How many grams per day you are feeding
3. Treats/snacks per day
4. Any visible change in body shape, appetite, stool, or energy

Then I can help decide whether the plan is working or needs adjustment.`
            +
            "\n\nYou can start with only the current weight, for example 7 kg. After that I will ask only for what is missing."
        )
      );
      return;
    }

    setSelectedPetId(targetPet.id);
    setPet(createIntakeFromSavedPet(targetPet));

    if ((targetPet.analysisHistory?.length ?? 0) > 0) {
      setFollowUpPet(targetPet);
      setStep("petChoice");
      addMessages(
        createMessage("user", `Use ${targetPet.name}`),
        createMessage("bot", formatSavedPetContinuityIntro(targetPet, chatLanguage))
      );
      return;
    }

    setFollowUpPet(null);
    setStep("currentFood");
    addMessages(
      createMessage("user", `Use ${targetPet.name}`),
      createMessage(
        "bot",
        `Great. I will use ${targetPet.name}'s saved profile. What food is ${targetPet.name} eating now? If you are not sure, type "I don't know".`
      )
    );
  }, [chatLanguage, isLoadingPets, savedPets]);

  function startNewPetAnalysis() {
    setSelectedPetId(null);
    setFollowUpPet(null);
    setFollowUpMode(null);
    setRecommendationMode("default");
    setPet({ healthIssues: [], allergies: [], excludedIngredients: [], preferredProteins: [] });
    setRecommendedFoodChoices([]);
    setStep("species");

    addMessages(
      createMessage("user", botText("Νέο κατοικίδιο", "Start with a new pet")),
      createMessage("bot", botText("Τέλεια. Έχεις σκύλο ή γάτα;", "Great. Do you have a dog or a cat?"))
    );
  }

  async function runAnalysis(nextPet: PetIntake) {
    try {
      setIsAnalyzing(true);
      setStep("analysis");
      setRecommendedFoodChoices([]);

      addMessages(
        createMessage(
          "bot",
          botText(
            "Τέλεια. Υπολογίζω τις διατροφικές ανάγκες και ψάχνω κατάλληλες τροφές...",
            "Great. I am calculating nutrition needs and checking suitable foods..."
          )
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

      addMessages(createMessage("bot", formatAnalysisResult(analysis, chatLanguage)));

      if (nextPet.weightGoal) {
        addMessages(
          createMessage(
          "bot",
          nextPet.weightGoal === "maintain"
            ? botText(
                "Στόχος: διατήρηση βάρους. Οι θερμίδες βασίζονται στις ανάγκες συντήρησης.",
                "Goal: weight maintenance. Calories are based on maintenance needs."
              )
            : nextPet.weightGoal === "loss"
              ? botText(
                  "Στόχος: απώλεια βάρους. Οι θερμίδες μειώνονται προσεκτικά για πιο ασφαλή έλεγχο βάρους.",
                  "Goal: weight loss. Calories have been reduced carefully for safer weight control."
                )
              : botText(
                  "Στόχος: αύξηση βάρους. Οι θερμίδες αυξάνονται ελεγχόμενα.",
                  "Goal: weight gain. Calories have been increased in a controlled way."
                )
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
            botText(
              `Όριο για λιχουδιές:
Οι λιχουδιές καλό είναι να μένουν περίπου στο 10% των ημερήσιων θερμίδων.

Τελικός ημερήσιος στόχος: ${treats.dailyCalories} kcal/ημέρα
Μέγιστο από λιχουδιές: περίπου ${treats.maxTreatCalories} kcal/ημέρα
Θερμίδες από κύρια τροφή: περίπου ${treats.mainFoodCalories} kcal/ημέρα`,
              `Treat allowance:
Treats should stay around 10% of daily calories.

Final daily calorie target: ${treats.dailyCalories} kcal/day
Maximum from treats: about ${treats.maxTreatCalories} kcal/day
Main food calories: about ${treats.mainFoodCalories} kcal/day`
            )
          )
        );
      }

      const guardrailText = buildGuardrailText(nextPet, chatLanguage);

      if (guardrailText) {
        addMessages(createMessage("bot", guardrailText));
      }

      let analysisFoodChoices: RecommendedFoodChoice[] = [];

      try {
        const foodV2Message = await getFoodV2RecommendationMessage(nextPet, {
          mode: recommendationMode,
          language: chatLanguage,
          onChoices: (choices) => {
            analysisFoodChoices = choices;
            setRecommendedFoodChoices(choices);
          },
        });

        if (foodV2Message) {
          addMessages(createMessage("bot", foodV2Message));
        }

        if (analysisFoodChoices.length === 0) {
          setRecommendedFoodChoices([]);
        }
      } catch (error) {
        console.error(error);
      }

      if (pendingCompareQueries.length >= 2) {
        const queries = [...pendingCompareQueries];
        setPendingCompareQueries([]);
        await runFoodComparison(queries, { species: nextPet.species });
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

          if (
            matchResponse.ok &&
            matchResult.match &&
            isConfidentFoodMatch(matchResult)
          ) {
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
                    formatCurrentFoodMatchMessage({
                      language: chatLanguage,
                      brand: matchedFood.brand,
                      name: matchedFood.name,
                      foodScore,
                      qualityNote: getFoodQualityNote(matchedFood),
                      nutritionSummary: nutritionInsights.summary,
                      nutritionPositives: nutritionInsights.positives,
                      nutritionCautions: nutritionInsights.cautions,
                      ingredientPositives: ingredientInsights.positives,
                      ingredientCautions: ingredientInsights.cautions,
                      explanation,
                      grams,
                      treatCalories: treats?.maxTreatCalories ?? null,
                      weightGoal: nextPet.weightGoal,
                    })
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
                  formatCurrentFoodMatchMessage({
                    language: chatLanguage,
                    brand: matchedFood.brand,
                    name: matchedFood.name,
                    foodScore,
                    qualityNote: getFoodQualityNote(matchedFood),
                    nutritionSummary: nutritionInsights.summary,
                    nutritionPositives: nutritionInsights.positives,
                    nutritionCautions: nutritionInsights.cautions,
                    ingredientPositives: ingredientInsights.positives,
                    ingredientCautions: ingredientInsights.cautions,
                    explanation,
                    grams: null,
                    treatCalories: null,
                    weightGoal: nextPet.weightGoal,
                  })
                )
              );
            }
          } else {
            void submitChatFeedback({
              eventType: "failed_food_match",
              rating: "needs_review",
              message: nextPet.currentFoodName,
              context: {
                matchScore: matchResult?.match_score ?? 0,
                matchConfidence: matchResult?.match_confidence ?? "none",
                candidates: matchResult?.candidates ?? [],
              },
            });

            addMessages(
              createMessage(
                "bot",
                formatCurrentFoodNoMatchMessage({
                  language: chatLanguage,
                  candidates: matchResult?.candidates,
                  canShowCandidates: Boolean(matchResponse.ok && matchResult?.candidates),
                })
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

      if (analysisFoodChoices.length === 0) {
        addMessages(
          createMessage(
            "bot",
            botText(
              "Επόμενο βήμα: αποθήκευσε την ανάλυση αν σου φαίνεται σωστή ή στείλε την ακριβή τροφή από τη συσκευασία για πιο συγκεκριμένα γραμμάρια/ημέρα.",
              "Next step: save the analysis if it looks right, or send the exact food from the bag for a more specific grams/day estimate."
            )
          )
        );
      }
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
    if (followUpPet && followUpMode) {
      void saveFollowUpProgressLog({
        savedPet: followUpPet,
        mode: followUpMode,
        text,
      });

      addMessages(
        createMessage(
          "bot",
          buildFollowUpProgressReply({
            text,
            savedPet: followUpPet,
            mode: followUpMode,
            language: chatLanguage,
          })
        )
      );
      return;
    }

    if (followUpPet && step === "petChoice") {
      const followUpAction = detectFollowUpAction(text);

      if (followUpAction) {
        if (followUpAction === "progress" && parseNumber(text) !== null) {
          setFollowUpMode("progress");
          void saveFollowUpProgressLog({
            savedPet: followUpPet,
            mode: "progress",
            text,
          });
          addMessages(
            createMessage(
              "bot",
              buildFollowUpProgressReply({
                text,
                savedPet: followUpPet,
                mode: "progress",
                language: chatLanguage,
              })
            )
          );
          return;
        }

        if (followUpAction === "no_result" && parseNumber(text) !== null) {
          setFollowUpMode("no_result");
          void saveFollowUpProgressLog({
            savedPet: followUpPet,
            mode: "no_result",
            text,
          });
          addMessages(
            createMessage(
              "bot",
              buildFollowUpProgressReply({
                text,
                savedPet: followUpPet,
                mode: "no_result",
                language: chatLanguage,
              })
            )
          );
          return;
        }

        handleFollowUpAction(followUpAction, { echoUser: false });
        return;
      }

      if (hasProgressMetric(text)) {
        setFollowUpMode("progress");
        void saveFollowUpProgressLog({
          savedPet: followUpPet,
          mode: "progress",
          text,
        });
        addMessages(
          createMessage(
            "bot",
            buildFollowUpProgressReply({
              text,
              savedPet: followUpPet,
              mode: "progress",
              language: chatLanguage,
            })
          )
        );
        return;
      }
    }

    const compareQueries = parseCompareQueries(text);

    if (compareQueries.length >= 2 && step !== "analysis") {
      if (step === "petChoice") {
        setPendingCompareQueries(compareQueries);
        addMessages(
          createMessage(
            "bot",
            botText(
              `Το κρατάω: θα συγκρίνω ${compareQueries.join(" vs ")} μόλις έχω τα στοιχεία του κατοικιδίου. Διάλεξε αποθηκευμένο κατοικίδιο ή πάτα Νέο κατοικίδιο.`,
              `Got it: I will compare ${compareQueries.join(" vs ")} once I have the pet details. Choose a saved pet or start with a new pet.`
            )
          )
        );
        return;
      }

      await runFoodComparison(compareQueries);
      return;
    }

    const standaloneReply = getStandaloneNutritionReply(text);

    if (standaloneReply && step !== "analysis") {
      addMessages(createMessage("bot", standaloneReply));
      return;
    }

    const intakeExtraction = await extractIntakeFactsFromMessage(text);
    const workingPet = mergeExtractedPetFacts(pet, intakeExtraction?.data);

    if (step === "petChoice") {
      if (isNewPetRequest(text) || parseSpeciesInput(text)) {
        startNewPetFromPetChoice(text, intakeExtraction?.data);
        return;
      }

      addMessages(
        createMessage(
          "bot",
          botText(
            "Για να σου δώσω σωστή πρόταση, πρώτα διάλεξε ένα αποθηκευμένο κατοικίδιο ή γράψε αν ξεκινάμε νέο με σκύλο ή γάτα. Π.χ. «έχω σκύλο».",
            "To give a useful recommendation, first choose a saved pet or tell me if we are starting a new dog or cat. For example: \"I have a dog\"."
          )
        )
      );
      return;
    }

    if (intakeExtraction?.canUse) {
      setPet(workingPet);
    }

    if (step === "species") {
      const species = parseSpeciesInput(text) ?? workingPet.species;

      if (!species) {
        addMessages(
          createMessage(
            "bot",
            botText(
              "Δεν κατάλαβα αν είναι σκύλος ή γάτα. Γράψε σκύλος ή γάτα.",
              "I could not tell whether this is a dog or cat. Please type dog or cat."
            )
          )
        );

        return;
      }

      const nextPet = sanitizePetIntake({ ...workingPet, species });
      setPet(nextPet);
      askNextMissingIntakeQuestion(nextPet);

      return;
    }

    if (step === "name") {
      const displayName = formatPetDisplayName(workingPet.name ?? text);
      const nextPet = sanitizePetIntake({ ...workingPet, name: displayName });

      setPet(nextPet);
      askNextMissingIntakeQuestion(nextPet);

      return;
    }

    if (step === "weight") {
      const weight = workingPet.weight ?? parseNumber(text) ?? null;
      const maxWeight = getMaxWeightKg(workingPet.species ?? pet.species);

      if (!weight || weight <= 0 || weight > maxWeight) {
        addMessages(
          createMessage(
            "bot",
            botText(
              `Γράψε ένα ρεαλιστικό βάρος σε kg, π.χ. 7. Μέγιστο για ${
                pet.species === "cat" ? "γάτα" : "σκύλο"
              }: ${maxWeight} kg.`,
              `Please enter a realistic weight in kg, for example 7. Maximum for ${
                pet.species === "cat" ? "a cat" : "a dog"
              }: ${maxWeight} kg.`
            )
          )
        );

        return;
      }

      const nextPet = sanitizePetIntake({ ...workingPet, weight });
      setPet(nextPet);
      askNextMissingIntakeQuestion(nextPet);

      return;
    }

    if (step === "age") {
      const age = workingPet.age ?? parseNumber(text) ?? null;

      if (age === null || age < 0 || age > MAX_PET_AGE_YEARS) {
        addMessages(
          createMessage(
            "bot",
            `Please enter a realistic age in years, for example 3. Maximum supported age is ${MAX_PET_AGE_YEARS}.`
          )
        );

        return;
      }

      const nextPet = sanitizePetIntake({ ...workingPet, age });
      setPet(nextPet);
      askNextMissingIntakeQuestion(nextPet);

      return;
    }

    if (step === "activity") {
      const activityLevel = parseActivityInput(text) ?? workingPet.activityLevel;

      if (!activityLevel) {
        addMessages(
          createMessage(
            "bot",
            botText(
              "Διάλεξε μία επιλογή: χαμηλό, κανονικό ή υψηλό.",
              "Choose one option: low, normal, or high activity."
            )
          )
        );

        return;
      }

      const nextPet = sanitizePetIntake({ ...workingPet, activityLevel });
      setPet(nextPet);
      askNextMissingIntakeQuestion(nextPet);

      return;
    }

    if (step === "neutered") {
      const neutered =
        parseYesNoInput(text) ??
        (typeof workingPet.neutered === "boolean" ? workingPet.neutered : null);

      if (neutered === null) {
        addMessages(createMessage("bot", botText("Απάντησε με ναι ή όχι.", "Please answer yes or no.")));
        return;
      }

      const nextPet = sanitizePetIntake({ ...workingPet, neutered });
      setPet(nextPet);
      askNextMissingIntakeQuestion(nextPet);

      return;
    }

    if (step === "health") {
      const intakeClassification = classifyIntakeNotes(parseListOrEmpty(text));

      const nextPet: PetIntake = {
        ...workingPet,
        healthIssues: uniqueTerms([
          ...(workingPet.healthIssues ?? []),
          ...intakeClassification.healthIssues,
        ]),
        allergies: uniqueTerms([
          ...(workingPet.allergies ?? []),
          ...intakeClassification.allergies,
        ]),
      };

      setPet(sanitizePetIntake(nextPet));
      setStep("currentFood");

      addMessages(
        createMessage(
          "bot",
          botText(
            "Ποια τροφή τρώει τώρα; Γράψε εταιρεία και όνομα προϊόντος αν το ξέρεις. Αν δεν είσαι σίγουρος/η, γράψε δεν ξέρω.",
            "What food are you feeding now? Write the brand and product name if you know it. If you are not sure, type I don't know."
          )
        )
      );

      return;
    }

    if (step === "currentFood") {
      const currentFoodName = text.trim();

      const nextPet: PetIntake = {
        ...workingPet,
        currentFoodName:
          isUnknownFoodAnswer(currentFoodName)
            ? undefined
            : workingPet.currentFoodName ?? currentFoodName,
      };

      setPet(sanitizePetIntake(nextPet));
      setStep("preferences");

      addMessages(
        createMessage(
          "bot",
          botText(
            "Υπάρχει γεύση ή πρωτεΐνη που προτιμά ή αποφεύγει; Π.χ. του αρέσει αρνί ή σολομός, δεν τρώει κοτόπουλο. Αν δεν υπάρχει προτίμηση, γράψε όχι.",
            "Does your pet prefer or avoid any flavors or proteins? For example: likes lamb or salmon, does not eat chicken. If there is no preference, type no."
          )
        )
      );

      return;
    }

    if (step === "preferences") {
      const preferences = parseTastePreferences(text);
      const excludedIngredients = uniqueTerms([
        ...(workingPet.excludedIngredients ?? []),
        ...preferences.excludedIngredients,
      ]);
      const preferredProteins = removeExcludedFromPreferred(
        [
          ...(workingPet.preferredProteins ?? []),
          ...preferences.preferredProteins,
        ],
        excludedIngredients
      );

      const nextPet: PetIntake = {
        ...workingPet,
        excludedIngredients,
        preferredProteins,
      };

      setPet(sanitizePetIntake(nextPet));
      setStep("weightGoal");

      addMessages(
        createMessage(
          "bot",
          botText(
            "Ποιος είναι ο στόχος βάρους: διατήρηση, απώλεια ή αύξηση;",
            "What is the weight goal: maintain weight, lose weight, or gain weight?"
          )
        )
      );

      return;
    }

    if (step === "weightGoal") {
      const weightGoal = parseWeightGoalInput(text) ?? workingPet.weightGoal;

      if (!weightGoal) {
        addMessages(
          createMessage(
            "bot",
            botText(
              "Διάλεξε μία επιλογή: διατήρηση, απώλεια ή αύξηση βάρους.",
              "Choose one option: maintain weight, lose weight, or gain weight."
            )
          )
        );

        return;
      }

      const nextPet: PetIntake = {
        ...workingPet,
        weightGoal,
      };

      setPet(sanitizePetIntake(nextPet));

      addMessages(
        createMessage(
          "bot",
          weightGoal === "maintain"
            ? botText(
                "Το κρατάω. Στόχος είναι η διατήρηση βάρους.",
                "Got it. The goal is weight maintenance. I will continue with the analysis."
              )
            : weightGoal === "loss"
              ? botText(
                  "Το κρατάω. Στόχος είναι η απώλεια βάρους, άρα θα είμαι πιο προσεκτικός με τις θερμίδες.",
                  "Got it. The goal is weight loss. I will be more careful with calories."
                )
              : botText(
                  "Το κρατάω. Στόχος είναι η αύξηση βάρους, άρα θα υπολογίσω αυξημένες ανάγκες.",
                  "Got it. The goal is weight gain. I will account for higher energy needs."
                )
        )
      );

      addMessages(
        createMessage(
          "bot",
          botText(
            `Σύντομη περίληψη πριν υπολογίσω:\n${formatPetIntakeSummary(nextPet, "el")}`,
            `Quick summary before I calculate:\n${formatPetIntakeSummary(nextPet, "en")}`
          )
        )
      );

      await runAnalysis(nextPet);
      return;
    }

    if (step === "analysis") {
      addMessages(
        createMessage(
          "bot",
          botText(
            "Περίμενε λίγο, ολοκληρώνω την ανάλυση.",
            "Hold on a moment, I am finishing the analysis."
          )
        )
      );

      return;
    }

    addMessages(
      createMessage(
        "bot",
        botText(
          "Η ανάλυση ολοκληρώθηκε. Μπορείς να την αποθηκεύσεις ή να ξεκινήσεις ξανά.",
          "The analysis is complete. You can save it or press Restart."
        )
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

  async function sendQuickReply(text: string) {
    if (isAnalyzing || isSaving) return;

    addMessages(createMessage("user", text));
    setInput("");

    await handleStep(text);
  }

  function chooseRecommendedFood(choice: RecommendedFoodChoice) {
    addMessages(createMessage("user", choice.name));
    setRecommendedFoodChoices([]);

    const adjustedCalories = latestAnalysis
      ? adjustCaloriesForWeightGoal({
          calories: latestAnalysis.nutrition.der,
          goal: pet.weightGoal,
        })
      : null;
    const portionEstimate = calculateMainFoodPortionEstimate({
      finalDailyCalories: adjustedCalories,
      kcalPer100g: choice.kcalPer100g,
    });
    const gramsPerDay = portionEstimate?.gramsPerDay ?? null;
    const gramsPerMealTwoMeals = portionEstimate?.gramsPerMealTwoMeals ?? null;
    const gramsPerMealThreeMeals = portionEstimate?.gramsPerMealThreeMeals ?? null;

    setPet((prev) => ({
      ...prev,
      currentFoodName: choice.name,
    }));

    setAnalysisMetadata((prev) => ({
      ...(prev ?? {}),
      matchedFoodName: choice.name,
      feedingGramsPerDay: gramsPerDay,
      weightGoal: pet.weightGoal ?? "maintain",
    }));

    const selectedFoodReply = gramsPerDay
      ? botText(
          `Τέλεια, κρατάμε την ${choice.name}.\n\nΠρώτη ημερήσια ποσότητα: περίπου ${gramsPerDay}g.\n\nΑν το χωρίσεις:\n- 2 γεύματα: περίπου ${gramsPerMealTwoMeals}g ανά γεύμα\n- 3 γεύματα: περίπου ${gramsPerMealThreeMeals}g ανά γεύμα\n\nΚράτα τις λιχουδιές μέσα στο ημερήσιο όριο και κάνε έλεγχο σε 3-4 εβδομάδες για βάρος, όρεξη και κόπρανα.\n\nΠάτησε αποθήκευση για να μείνει αυτό το πλάνο στο προφίλ.`,
          `Great, we will keep ${choice.name}.\n\nFirst daily amount: about ${gramsPerDay}g.\n\nIf you split it:\n- 2 meals: about ${gramsPerMealTwoMeals}g per meal\n- 3 meals: about ${gramsPerMealThreeMeals}g per meal\n\nKeep treats inside the daily allowance and recheck weight, appetite, and stool in 3-4 weeks.\n\nPress save to keep this plan on the pet profile.`
        )
      : botText(
          `Τέλεια, κρατάμε την ${choice.name}.\n\nΔεν έχω αρκετές θερμίδες για αξιόπιστα γραμμάρια σε αυτή τη ροή. Μπορείς να την αποθηκεύσεις ως επιλογή ή να διαλέξεις άλλη κάρτα που έχει θερμίδες για πιο πρακτική ποσότητα.`,
          `Great, we will keep ${choice.name}.\n\nI do not have enough calorie data for reliable grams in this flow. You can save it as the chosen food or pick another card with calories for a more practical portion estimate.`
        );

    addMessages(createMessage("bot", selectedFoodReply));
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
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
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
          botText(
            "Η ανάλυση αποθηκεύτηκε. Παρακάτω θα βρεις τα επόμενα βήματα: προφίλ, report, ιστορικό και έλεγχο προόδου.",
            "Saved. Your next steps are ready below: profile, report, timeline, and progress check."
          )
        )
      );

      setSavedPetId(String(result.pet.id));
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
    setPet({ healthIssues: [], allergies: [], excludedIngredients: [], preferredProteins: [] });
    setSelectedPetId(null);
    setFollowUpPet(null);
    setFollowUpMode(null);
    setRecommendationMode("default");
    setInput("");
    setLatestAnalysis(null);
    setIsAnalyzing(false);
    setShowSave(false);
    setIsSaving(false);
    setAnalysisMetadata(null);
    setFeedbackStatus("");
    setSavedPetId(null);
    setRecommendedFoodChoices([]);

    setMessages([
      createMessage(
        "bot",
        savedPets.length > 0
          ? botText(
              "Ξεκινάμε ξανά. Διάλεξε ένα αποθηκευμένο κατοικίδιο ή ξεκίνα με νέο κατοικίδιο.",
              "Let's start again. Choose a saved pet or start with a new pet."
            )
          : botText(
              "Ξεκινάμε ξανά. Έχεις σκύλο ή γάτα;",
              "Let's start again. Do you have a dog or a cat?"
            )
      ),
    ]);
  }

  return (
    <section className="mx-auto flex h-[calc(100svh-8rem)] min-h-[520px] max-w-3xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:h-[calc(100svh-11rem)] sm:min-h-[560px] sm:rounded-2xl">
      <div className="flex shrink-0 flex-col gap-4 border-b border-gray-200 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-black">
            Nutritail AI Chatbot
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            {botText(
              "Ξεκίνα με αποθηκευμένο ή νέο κατοικίδιο και πάρε προτάσεις τροφών, θερμίδες και επόμενο βήμα.",
              "Start with a saved pet or a new profile, then get a grounded food shortlist, calories, and safety notes."
            )}
          </p>
        </div>

        <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
          <div className="col-span-2 flex rounded-lg border border-gray-300 bg-white p-1 sm:col-span-1">
            {(["el", "en"] as const).map((language) => (
              <button
                key={language}
                type="button"
                onClick={() => setChatLanguage(language)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                  chatLanguage === language
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {language.toUpperCase()}
              </button>
            ))}
          </div>

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

      <div
        ref={messagesContainerRef}
        className="flex flex-1 scroll-pb-56 flex-col gap-4 overflow-y-auto overscroll-contain p-3 pb-28 sm:p-5 sm:pb-32"
      >
        {!showSave && messages.length <= 1 && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-emerald-950">
                  {botText("Πώς μπορώ να βοηθήσω;", "What can I help with?")}
                </p>
                <p className="mt-1 text-sm text-emerald-900">
                  {botText(
                    "Διάλεξε πρώτα κατοικίδιο και μετά γράψε τον στόχο ή την ερώτησή σου.",
                    "Choose a pet first, then use one of these goals or write your own question."
                  )}
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
                {botText("Έξυπνη πρόταση τροφής", "Smart food guidance")}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {starterCards.map((card) => (
                <button
                  key={card.title}
                  type="button"
                  onClick={() =>
                    setInput(chatLanguage === "el" ? card.promptEl : card.prompt)
                  }
                  className="rounded-xl border border-emerald-200 bg-white p-4 text-left transition hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <span className="block font-semibold text-black">
                    {chatLanguage === "el" ? card.titleEl : card.title}
                  </span>
                  <span className="mt-1 block text-sm text-gray-600">
                    {chatLanguage === "el" ? card.helperEl : card.helper}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "petChoice" && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="font-semibold text-black">
              {botText("Διάλεξε κατοικίδιο", "Choose a pet")}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {botText(
                "Κάνε νέα ανάλυση με αποθηκευμένο προφίλ ή ξεκίνα με νέο κατοικίδιο.",
                "Run a fresh analysis using a saved profile, or start a new pet."
              )}
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {isLoadingPets ? (
                <p className="text-sm text-gray-600">
                  {botText("Φορτώνω τα αποθηκευμένα κατοικίδια...", "Loading saved pets...")}
                </p>
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
                      {savedPet.species} - {savedPet.weight} kg -{" "}
                      {botText("ηλικία", "age")} {savedPet.age}
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
                    {botText("Νέο κατοικίδιο", "Start with a new pet")}
                  </span>
                  <span className="mt-1 block text-sm text-gray-600">
                    {botText(
                      "Απάντησε τη ροή από την αρχή για νέο προφίλ.",
                      "Answer the full intake flow from scratch."
                    )}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {followUpPet && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-blue-950">
                  {botText(
                    `Συνέχεια για το πλάνο του/της ${followUpPet.name}`,
                    `Continue ${followUpPet.name}'s plan`
                  )}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-blue-900">
                  {formatLatestAnalysisSummary(followUpPet, chatLanguage)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                <a
                  href={`/account/pets/${followUpPet.id}`}
                  className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-900 transition hover:bg-blue-100"
                >
                  {botText("Προφίλ", "Profile")}
                </a>
                <a
                  href={`/print/pet-timeline/${followUpPet.id}`}
                  className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-900 transition hover:bg-blue-100"
                >
                  {botText("Ιστορικό", "Timeline")}
                </a>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {followUpActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleFollowUpAction(action.id)}
                  className="rounded-xl border border-blue-200 bg-white p-4 text-left transition hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <span className="block font-semibold text-black">
                    {botText(action.titleEl, action.title)}
                  </span>
                  <span className="mt-1 block text-sm text-gray-600">
                    {botText(action.helperEl, action.helper)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!showSave && messages.length <= 1 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-950">
              {botText(
                "Πώς κρατάμε τις προτάσεις λογικές",
                "How Nutritail keeps recommendations sensible"
              )}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-amber-900 sm:grid-cols-3">
              <p className="rounded-xl bg-white p-3">
                {botText(
                  "Χρησιμοποιούμε ηλικία, βάρος, δραστηριότητα, στειρωμένο και προτιμήσεις πριν προτείνουμε τροφή.",
                  "We use your pet's age, weight, activity, neuter status, and preferences before suggesting food."
                )}
              </p>
              <p className="rounded-xl bg-white p-3">
                {botText(
                  "Αποφεύγουμε τροφές που συγκρούονται με αλλεργίες, ευαισθησίες ή πρωτεΐνες που δεν τρώει.",
                  "We avoid foods that conflict with declared allergies, sensitivities, or disliked proteins."
                )}
              </p>
              <p className="rounded-xl bg-white p-3">
                {botText(
                  "Ουρολογικό, νεφρικό, παγκρεατίτιδα, αίμα, ανορεξία, εμετός ή διάρροια θέλουν κτηνίατρο.",
                  "Urinary blockage, renal disease, pancreatitis, blood, not eating, vomiting, or diarrhea need veterinary care."
                )}
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[96%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[85%] ${
              message.role === "bot"
                ? "self-start bg-gray-100 text-black"
                : "self-end bg-black text-white"
            }`}
          >
            {message.text}
          </div>
        ))}

        {showSave && recommendedFoodChoices.length > 0 && (
          <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="font-semibold text-emerald-950">
              {botText("Οι τροφές που αξίζει να δεις πρώτα", "Foods worth checking first")}
            </p>
            <p className="mt-1 text-sm text-emerald-900">
              {botText(
                "Ξεκίνα από την πρώτη κάρτα ή διάλεξε άλλη επιλογή αν σε βολεύει καλύτερα σε γεύση, εταιρεία ή budget.",
                "Start with the first card, or choose another option if it fits flavour, brand, or budget better."
              )}
            </p>
            <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-950 ring-1 ring-emerald-100">
              {botText(
                "Πάτησε μία κάρτα για να δω την πρώτη ποσότητα σε γραμμάρια/ημέρα. Μετά μπορείς να αποθηκεύσεις το πλάνο.",
                "Choose one card to estimate the first grams/day. Then you can save the plan."
              )}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-2 text-xs font-semibold text-gray-700 sm:grid-cols-3">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                <span className="block text-emerald-800">
                  {botText("1. Δες", "1. Review")}
                </span>
                <span className="font-normal text-emerald-950">
                  {botText("τι ταιριάζει καλύτερα", "the best fit")}
                </span>
              </div>
              <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2">
                <span className="block text-sky-800">
                  {botText("2. Πάτησε", "2. Choose")}
                </span>
                <span className="font-normal text-sky-950">
                  {botText("μία κάρτα τροφής", "one food card")}
                </span>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
                <span className="block text-amber-800">
                  {botText("3. Πάρε", "3. Get")}
                </span>
                <span className="font-normal text-amber-950">
                  {botText("γραμμάρια/ημέρα", "grams/day")}
                </span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                <span className="block font-semibold text-emerald-950">
                  {botText("Καλύτερα ταιριάσματα", "Best matches")}
                </span>
                <span className="text-xs text-emerald-800">
                  {recommendedFoodChoices.filter((choice) => choice.role !== "value").length}{" "}
                  {botText("τροφή/τροφές που ταιριάζουν περισσότερο", "food option(s) with the best fit")}
                </span>
              </div>
              <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2">
                <span className="block font-semibold text-sky-950">
                  {botText("Πρακτικές επιλογές", "Practical options")}
                </span>
                <span className="text-xs text-sky-800">
                  {recommendedFoodChoices.filter((choice) => choice.role === "value").length}{" "}
                  {botText("καλές εναλλακτικές όταν θέλεις κάτι πιο απλό", "good alternatives when you want something simpler")}
                </span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {recommendedFoodChoices.map((choice, index) => (
                <button
                  key={choice.name}
                  type="button"
                  onClick={() => chooseRecommendedFood(choice)}
                  aria-label={`${botText("Επιλογή τροφής", "Choose food")}: ${choice.name}`}
                  className={getRecommendationCardClassName(choice, index)}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        index === 0
                          ? "bg-emerald-700 text-white"
                          : choice.role === "value"
                            ? "bg-sky-100 text-sky-900"
                            : "bg-emerald-100 text-emerald-900"
                      }`}
                    >
                      {getRecommendationChoiceBadgeLabel(choice, index, chatLanguage)}
                    </span>
                    <span className="shrink-0 rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                      {botText("Εκτίμηση ποσότητας", "Portion estimate")}
                    </span>
                  </span>
                  <span className="mt-3 text-base font-semibold leading-5 text-black group-hover:text-emerald-800">
                    {choice.name}
                  </span>
                  <span className="mt-1 text-sm leading-5 text-gray-600">
                    {getRecommendationChoiceRoleSummary(choice, index, chatLanguage)}
                  </span>
                  {getRecommendationChoiceFacts(choice, chatLanguage).length > 0 && (
                    <span className="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold">
                      {getRecommendationChoiceFacts(choice, chatLanguage).map((fact) => (
                        <span
                          key={`${fact.label}-${fact.value}`}
                          className={`rounded-full px-2 py-1 ring-1 ${fact.tone}`}
                        >
                          {fact.suffix ? `${fact.value}${fact.suffix}` : fact.value}{" "}
                          {fact.label}
                        </span>
                      ))}
                    </span>
                  )}
                  {choice.reason && (
                    <span className="mt-3 rounded-xl bg-white px-3 py-2 text-sm leading-5 text-gray-800 ring-1 ring-gray-100">
                      <span className="block text-xs font-semibold uppercase text-emerald-700">
                        {botText("Γιατί ταιριάζει", "Why it fits")}
                      </span>
                      <span>{choice.reason}</span>
                    </span>
                  )}
                  {getRecommendationChoicePortionPreview(
                    choice,
                    latestAnalysis,
                    pet.weightGoal
                  ) && (
                    <span className="mt-3 rounded-xl bg-lime-50 px-3 py-2 text-sm leading-5 text-lime-950 ring-1 ring-lime-100">
                      <span className="block text-xs font-semibold uppercase text-lime-700">
                        {botText("Περίπου ποσότητα", "Estimated portion")}
                      </span>
                      <span>
                        {getRecommendationChoicePortionPreview(
                          choice,
                          latestAnalysis,
                          pet.weightGoal
                        )}
                        g/{botText("ημέρα", "day")}
                      </span>
                    </span>
                  )}
                  {choice.bestUseCases && choice.bestUseCases.length > 0 && (
                    <span className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm leading-5 text-emerald-950 ring-1 ring-emerald-100">
                      <span className="block text-xs font-semibold uppercase text-emerald-700">
                        {botText("Ιδανικό για", "Best for")}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1.5">
                        {choice.bestUseCases.map((item) => (
                          <span
                            key={item}
                            className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-100"
                          >
                            {item}
                          </span>
                        ))}
                      </span>
                    </span>
                  )}
                  {choice.caution && (
                    <span className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-950 ring-1 ring-amber-100">
                      <span className="block text-xs font-semibold uppercase text-amber-700">
                        {botText("Προσοχή", "Watch")}
                      </span>
                      <span>{choice.caution}</span>
                    </span>
                  )}
                  {choice.notIdealCases && choice.notIdealCases.length > 0 && (
                    <span className="mt-2 rounded-xl bg-orange-50 px-3 py-2 text-sm leading-5 text-orange-950 ring-1 ring-orange-100">
                      <span className="block text-xs font-semibold uppercase text-orange-700">
                        {botText("Όχι πρώτη επιλογή για", "Not first choice for")}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1.5">
                        {choice.notIdealCases.map((item) => (
                          <span
                            key={item}
                            className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-orange-900 ring-1 ring-orange-100"
                          >
                            {item}
                          </span>
                        ))}
                      </span>
                    </span>
                  )}
                  <span className="mt-3 text-xs font-medium text-gray-600">
                    {getRecommendationChoiceActionHint(choice, chatLanguage)}
                  </span>
                  <span className="mt-1 text-xs font-semibold text-emerald-800">
                    {botText(
                      "Διάλεξε για γραμμάρια/ημέρα.",
                      "Choose for grams/day."
                    )}
                  </span>
                  <span className="mt-4 rounded-xl bg-emerald-600 px-3 py-2 text-center text-sm font-semibold text-white transition group-hover:bg-emerald-700">
                    {botText("Υπολόγισε ποσότητα", "Estimate portions")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {showSave && (
          <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="font-semibold text-blue-950">
                {botText("Το πλάνο σου είναι έτοιμο", "Your plan is ready")}
              </p>
              <p className="mt-1 text-sm text-blue-900">
                {botText(
                  "Αποθήκευσέ το για να κρατήσεις θερμίδες, τροφή και πρώτη ποσότητα στο προφίλ. Αν αλλάξει βάρος, όρεξη, κόπρανα ή τροφή, μπορείς να κάνεις νέο έλεγχο προόδου.",
                  "Save it to keep calories, food choice, and first portion on the profile. If weight, appetite, stool, or food choice changes, you can run a new progress check."
                )}
              </p>
            </div>

            {latestAnalysis && (
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="font-semibold text-black">
                  {botText("Το σημερινό πλάνο", "Today's plan")}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {botText(
                    "Τα βασικά που θα κρατηθούν στο προφίλ του κατοικιδίου.",
                    "The essentials that will be saved to the pet profile."
                  )}
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-500">{botText("Κατοικίδιο", "Pet")}</p>
                    <p className="font-semibold text-black">
                      {pet.name ?? botText("Κατοικίδιο", "Pet")} -{" "}
                      {pet.species === "dog"
                        ? botText("σκύλος", "dog")
                        : pet.species === "cat"
                          ? botText("γάτα", "cat")
                          : "pet"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-500">
                      {botText("Τελικός στόχος θερμίδων", "Final calorie target")}
                    </p>
                    <p className="font-semibold text-black">
                      {finalDailyCaloriesForAnalysis(latestAnalysis, pet.weightGoal) ??
                        latestAnalysis.nutrition.der}{" "}
                      {botText("kcal/ημέρα", "kcal/day")}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {botText(
                        "Περιλαμβάνει την προσαρμογή για τον στόχο βάρους.",
                        "Includes the adjustment for the weight goal."
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-500">
                      {botText("Στόχος βάρους", "Weight goal")}
                    </p>
                    <p className="font-semibold text-black">
                      {botText(
                        pet.weightGoal === "loss"
                          ? "απώλεια βάρους"
                          : pet.weightGoal === "gain"
                            ? "αύξηση βάρους"
                            : "διατήρηση βάρους",
                        getWeightGoalLabel(pet.weightGoal)
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-500">
                      {botText("Επιλογή τροφής", "Food match")}
                    </p>
                    <p className="font-semibold text-black">
                      {analysisMetadata?.matchedFoodName ??
                        botText("Δεν επιλέχθηκε ακόμη τροφή", "No matched food")}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-500">
                      {botText("Πρώτη μερίδα", "First portion")}
                    </p>
                    <p className="font-semibold text-black">
                      {analysisMetadata?.feedingGramsPerDay
                        ? `${analysisMetadata.feedingGramsPerDay}g/${botText("ημέρα", "day")}`
                        : botText(
                            "Διάλεξε τροφή για ποσότητα",
                            "Choose a food for portions"
                          )}
                    </p>
                    {analysisMetadata?.feedingGramsPerDay && (
                      <p className="mt-1 text-xs text-gray-600">
                        {botText(
                          `2 \u03b3\u03b5\u03cd\u03bc\u03b1\u03c4\u03b1: \u03c0\u03b5\u03c1\u03af\u03c0\u03bf\u03c5 ${Math.round(
                            analysisMetadata.feedingGramsPerDay / 2
                          )}g/\u03b3\u03b5\u03cd\u03bc\u03b1 - 3 \u03b3\u03b5\u03cd\u03bc\u03b1\u03c4\u03b1: \u03c0\u03b5\u03c1\u03af\u03c0\u03bf\u03c5 ${Math.round(
                            analysisMetadata.feedingGramsPerDay / 3
                          )}g/\u03b3\u03b5\u03cd\u03bc\u03b1`,
                          `2 meals: about ${Math.round(
                            analysisMetadata.feedingGramsPerDay / 2
                          )}g/meal - 3 meals: about ${Math.round(
                            analysisMetadata.feedingGramsPerDay / 3
                          )}g/meal`
                        )}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {botText(
                        "Η εκτίμηση αφήνει χώρο για μικρή ποσότητα λιχουδιών.",
                        "The estimate leaves room for a small treat allowance."
                      )}
                    </p>
                  </div>
                </div>

              </div>
            )}

            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="font-semibold text-black">
                {botText("Αποθήκευση στον λογαριασμό μου", "Save to my account")}
              </p>

              <p className="mt-1 text-sm text-gray-700">
                {botText(
                  "Θα αποθηκευτούν το προφίλ κατοικιδίου, η τελευταία ανάλυση και το report στον λογαριασμό σου.",
                  "This will save the pet profile, latest nutrition analysis, and report entry in your account."
                )}
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-green-900 sm:grid-cols-3">
                <span className="rounded-full bg-white px-3 py-1 text-center">
                  {botText("Προφίλ", "Pet profile")}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-center">
                  {botText("Report διατροφής", "Nutrition report")}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-center">
                  {botText("Ιστορικό", "Analysis history")}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="font-semibold text-black">
                {botText("Ήταν χρήσιμο;", "Was this helpful?")}
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    submitChatFeedback({
                      eventType: "chat_helpfulness",
                      rating: "helpful",
                      message: "User marked chatbot analysis as helpful.",
                      showConfirmation: true,
                    })
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-black transition hover:bg-gray-100"
                >
                  {botText("Χρήσιμο", "Helpful")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    submitChatFeedback({
                      eventType: "chat_helpfulness",
                      rating: "not_helpful",
                      message: "User marked chatbot analysis as not helpful.",
                      showConfirmation: true,
                    })
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-black transition hover:bg-gray-100"
                >
                  {botText("Όχι χρήσιμο", "Not helpful")}
                </button>
              </div>
              {feedbackStatus && (
                <p className="mt-2 text-sm text-gray-600">{feedbackStatus}</p>
              )}
            </div>

            <button
              type="button"
              onClick={saveToMyAccount}
              disabled={isSaving}
              className="w-full rounded-xl bg-green-600 py-3 text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {isSaving
                ? botText("Αποθήκευση...", "Saving...")
                : botText("Αποθήκευση στον λογαριασμό μου", "Save to my account")}
            </button>
          </div>
        )}

        {savedPetId && (
          <div className="space-y-4 rounded-2xl border border-green-200 bg-green-50 p-4">
            <div>
              <p className="font-semibold text-black">
                {botText("Η ανάλυση αποθηκεύτηκε", "Analysis saved")}
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {botText(
                  "Το προφίλ, το report και το ιστορικό είναι έτοιμα. Διάλεξε τι θέλεις να κάνεις τώρα.",
                  "Your pet profile, report, timeline, and progress check are ready. Choose what you want to do next."
                )}
              </p>
            </div>

            <div className="rounded-xl border border-green-200 bg-white px-4 py-3 text-sm text-green-950">
              <p className="font-semibold">
                {botText("Προτεινόμενη συνέχεια", "Recommended next step")}
              </p>
              <p className="mt-1 text-green-900">
                {botText(
                  "Άνοιξε πρώτα το report για να κρατήσεις τις θερμίδες, τη μερίδα και την επιλογή τροφής. Μετά από 2-4 εβδομάδες κάνε έλεγχο προόδου με νέο βάρος, γραμμάρια/ημέρα και λιχουδιές.",
                  "Open the report first to keep calories, portion, and food choice in one place. After 2-4 weeks, run a progress check with updated weight, grams/day, and treats."
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <a
                href={`/account/pets/${savedPetId}`}
                className="rounded-xl border border-green-300 bg-white px-4 py-3 text-sm font-medium text-green-900 transition hover:bg-green-100"
              >
                <span className="block">
                  {botText("Άνοιγμα προφίλ", "Open profile")}
                </span>
                <span className="mt-1 block text-xs font-normal text-green-800">
                  {botText("Στοιχεία κατοικιδίου και αναλύσεις.", "Pet details and analyses.")}
                </span>
              </a>
              <a
                href={`/print/pet-report/${savedPetId}`}
                className="rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-700"
              >
                <span className="block">
                  {botText("Άνοιγμα report", "Open report")}
                </span>
                <span className="mt-1 block text-xs font-normal text-green-50">
                  {botText("Εκτυπώσιμη σύνοψη για τον πελάτη.", "Printable customer summary.")}
                </span>
              </a>
              <a
                href={`/print/pet-timeline/${savedPetId}`}
                className="rounded-xl border border-green-300 bg-white px-4 py-3 text-sm font-medium text-green-900 transition hover:bg-green-100"
              >
                <span className="block">
                  {botText("Ιστορικό / timeline", "Timeline")}
                </span>
                <span className="mt-1 block text-xs font-normal text-green-800">
                  {botText("Προηγούμενες αναλύσεις και αλλαγές.", "Previous analyses and changes.")}
                </span>
              </a>
              <a
                href={`/account/chatbot?petId=${savedPetId}&mode=progress`}
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-950 transition hover:bg-blue-100"
              >
                <span className="block">
                  {botText("Έλεγχος προόδου", "Progress check")}
                </span>
                <span className="mt-1 block text-xs font-normal text-blue-900">
                  {botText("Βάρος, γραμμάρια, λιχουδιές και αποτέλεσμα.", "Weight, grams, treats, and results.")}
                </span>
              </a>
              <button
                type="button"
                onClick={restartChat}
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-left text-sm font-medium text-black transition hover:bg-gray-100 sm:col-span-2"
              >
                <span className="block">
                  {botText("Νέα ανάλυση", "New analysis")}
                </span>
                <span className="mt-1 block text-xs font-normal text-gray-600">
                  {botText("Για άλλο κατοικίδιο ή αλλαγή στόχου/τροφής.", "For another pet or a new goal/food change.")}
                </span>
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 z-20 shrink-0 border-t border-gray-200 bg-white px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_20px_rgba(0,0,0,0.06)] sm:p-5">
        {followUpPet && step === "petChoice" && !followUpMode && (
          <div className="mb-3 grid grid-cols-2 gap-2 sm:hidden">
            <button
              type="button"
              onClick={() => handleFollowUpAction("progress")}
              className="min-h-11 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-900"
            >
              Progress
            </button>
            <button
              type="button"
              onClick={() => handleFollowUpAction("change_food")}
              className="min-h-11 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-900"
            >
              Another food
            </button>
          </div>
        )}

        {quickReplies.length > 0 && !isAnalyzing && !isSaving && (
          <div className="mb-3 flex snap-x gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => sendQuickReply(reply)}
                className="min-h-10 max-w-[82vw] shrink-0 snap-start rounded-full border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-black transition hover:border-black hover:bg-gray-100"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {inputHelper && (
          <p className="mb-2 text-xs leading-5 text-gray-500">{inputHelper}</p>
        )}

        <div className="flex items-end gap-2 sm:gap-3">
          <input
            value={input}
            disabled={isAnalyzing || isSaving}
            aria-label="Chat message"
            autoComplete="off"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
            placeholder={
              isAnalyzing
                ? botText("Γίνεται ανάλυση...", "Analyzing...")
                : botText("Γράψε μήνυμα...", "Write a message...")
            }
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-3 text-base text-black disabled:bg-gray-100 sm:text-sm"
          />

          <button
            type="button"
            onClick={sendMessage}
            disabled={isAnalyzing || isSaving}
            className="min-h-12 shrink-0 rounded-xl bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-50 sm:px-5"
          >
            {isAnalyzing ? "..." : botText("Αποστολή", "Send")}
          </button>
        </div>
      </div>
    </section>
  );
}
