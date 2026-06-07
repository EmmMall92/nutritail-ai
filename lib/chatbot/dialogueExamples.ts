import type { ChatbotIntent, ChatbotPetContext } from "@/lib/chatbot/types";

export type DialogueExample = {
  id: string;
  title: string;
  user_message: string;
  expected_intent: ChatbotIntent;
  pet?: ChatbotPetContext;
  expected_behavior: string[];
};

export const dialogueExamples: DialogueExample[] = [
  {
    id: "adult-dog-recommendation",
    title: "Adult dog recommendation",
    user_message: "Τι τροφή να πάρω για τον σκύλο μου;",
    expected_intent: "food_recommendation",
    pet: { species: "dog", age: 4, weight: 18, neutered: false },
    expected_behavior: ["Ask about health issues/allergies only if unknown.", "Return premium and value options if foods are matched."],
  },
  {
    id: "budget-dog-food",
    title: "Budget dog food",
    user_message: "Θέλω οικονομική αλλά καλή τροφή για σκύλο.",
    expected_intent: "food_recommendation",
    pet: { species: "dog", age: 5, weight: 20 },
    expected_behavior: ["Respect budget goal.", "Do not ignore life stage or allergies."],
  },
  {
    id: "premium-food",
    title: "Premium food",
    user_message: "Θέλω μια premium τροφή για ενήλικο σκύλο.",
    expected_intent: "food_recommendation",
    pet: { species: "dog", age: 4, weight: 22 },
    expected_behavior: ["Rank high confidence foods first.", "Explain data quality and ingredient/nutrient fit."],
  },
  {
    id: "royal-canin-vs-acana",
    title: "Royal Canin vs Acana",
    user_message: "Royal Canin ή Acana;",
    expected_intent: "brand_comparison",
    pet: { species: "dog", age: 3, weight: 16 },
    expected_behavior: ["Ask which exact formulas if not provided.", "Do not compare vague brand reputation only."],
  },
  {
    id: "chicken-allergy",
    title: "Chicken allergy",
    user_message: "Ο σκύλος μου έχει αλλεργία στο κοτόπουλο.",
    expected_intent: "allergy",
    pet: { species: "dog", age: 4, weight: 20, allergies: ["chicken"] },
    expected_behavior: ["Exclude chicken/poultry conflicts.", "Mention elimination trial/vet guidance without diagnosing."],
  },
  {
    id: "sensitive-digestion",
    title: "Sensitive digestion",
    user_message: "Τον πειράζει η τροφή και κάνει μαλακά κακά.",
    expected_intent: "sensitive_digestion",
    pet: { species: "dog", age: 2, weight: 12, healthIssues: ["soft stool"] },
    expected_behavior: ["Ask duration/severity if needed.", "Mention transition and red flags."],
  },
  {
    id: "pancreatitis",
    title: "Pancreatitis",
    user_message: "Έχει παγκρεατίτιδα, τι τροφή να πάρω;",
    expected_intent: "pancreatitis",
    pet: { species: "dog", age: 7, weight: 14, vetDiagnosis: "pancreatitis" },
    expected_behavior: ["Hard medical caution.", "No treatment claim.", "Discuss low-fat data only carefully."],
  },
  {
    id: "renal-case",
    title: "Renal case",
    user_message: "Η γάτα μου έχει νεφρικό.",
    expected_intent: "renal",
    pet: { species: "cat", age: 12, weight: 4, vetDiagnosis: "renal disease" },
    expected_behavior: ["Recommend veterinarian-guided diet.", "Require phosphorus data for confidence."],
  },
  {
    id: "overweight-dog",
    title: "Overweight dog",
    user_message: "Ο σκύλος μου είναι παχύς.",
    expected_intent: "obesity",
    pet: { species: "dog", age: 5, weight: 32, neutered: true, bodyCondition: "overweight" },
    expected_behavior: ["Ask ideal weight/body condition if missing.", "Use calorie and satiety logic."],
  },
  {
    id: "daily-grams",
    title: "Daily grams",
    user_message: "Πόσα γραμμάρια να δίνω;",
    expected_intent: "portion_size",
    pet: { species: "dog", age: 3, weight: 15, activityLevel: "normal" },
    expected_behavior: ["Require current food calories.", "Do not calculate exact grams without kcal."],
  },
  {
    id: "large-breed-puppy",
    title: "Puppy large breed",
    user_message: "Θέλω τροφή για κουτάβι μεγαλόσωμης φυλής.",
    expected_intent: "puppy_growth",
    pet: { species: "dog", age: 0.5, weight: 22, breed: "German Shepherd" },
    expected_behavior: ["Prioritize puppy/large breed fit.", "Require calcium/phosphorus for confidence."],
  },
  {
    id: "senior-dog",
    title: "Senior dog",
    user_message: "Έχω ηλικιωμένο σκύλο, τι να προσέξω;",
    expected_intent: "senior",
    pet: { species: "dog", age: 11, weight: 18 },
    expected_behavior: ["Ask about weight trend and appetite.", "Do not assume senior means diet/light food."],
  },
  {
    id: "adult-sterilised-cat",
    title: "Adult sterilised cat",
    user_message: "Έχω στειρωμένη γάτα 5 κιλά, τι τροφή να πάρω;",
    expected_intent: "sterilised",
    pet: { species: "cat", age: 4, weight: 5, neutered: true },
    expected_behavior: ["Use sterilised/weight-aware ranking.", "Ask body condition if needed."],
  },
  {
    id: "overweight-cat",
    title: "Overweight cat",
    user_message: "Η γάτα μου πάχυνε μετά τη στείρωση.",
    expected_intent: "obesity",
    pet: { species: "cat", age: 4, weight: 6, neutered: true, bodyCondition: "overweight" },
    expected_behavior: ["Treat calories carefully.", "Mention gradual monitored weight loss."],
  },
  {
    id: "kitten-food",
    title: "Kitten food",
    user_message: "Τι τροφή να δώσω σε γατάκι;",
    expected_intent: "kitten_growth",
    pet: { species: "cat", age: 0.4, weight: 1.8 },
    expected_behavior: ["Use kitten complete foods.", "Avoid adult-only food recommendations."],
  },
  {
    id: "urinary-male-cat-emergency",
    title: "Urinary male cat emergency",
    user_message: "Ο αρσενικός γάτος μου πάει στην άμμο αλλά δεν κατουράει.",
    expected_intent: "medical_red_flag",
    pet: { species: "cat", age: 5, weight: 5, neutered: true, healthIssues: ["no urine"] },
    expected_behavior: ["Hard stop.", "Recommend emergency veterinarian now.", "No shopping mode."],
  },
  {
    id: "fussy-cat",
    title: "Fussy cat",
    user_message: "Η γάτα μου είναι πολύ δύσκολη με την τροφή.",
    expected_intent: "fussy_eater",
    pet: { species: "cat", age: 3, weight: 4 },
    expected_behavior: ["Ask if appetite is reduced or only preference.", "Warn if not eating."],
  },
  {
    id: "photo-label-extraction",
    title: "Photo label extraction",
    user_message: "Σου στέλνω φωτογραφία από την ετικέτα της τροφής.",
    expected_intent: "photo_grounding",
    pet: { species: "dog" },
    expected_behavior: ["Ask for front, ingredients, analytical constituents, calories, barcode.", "Do not infer unreadable fields."],
  },
];
