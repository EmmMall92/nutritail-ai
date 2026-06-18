export type BrandProfile = {
  brand: string;
  positioning_tags: string[];
  typical_strengths: string[];
  review_notes: string[];
};

export type IngredientProfile = {
  tag: string;
  class: "animal_protein" | "carbohydrate" | "fiber" | "fat" | "functional" | "unknown";
  strengths: string[];
  cautions: string[];
};

export type NutrientProfile = {
  field: string;
  role: string;
  useful_for: string[];
  cautions: string[];
};

export const nutrientProfiles: NutrientProfile[] = [
  {
    field: "protein_percent",
    role: "Supports lean mass, growth, repair, and satiety.",
    useful_for: ["growth", "weight_control", "active_working", "senior"],
    cautions: ["Interpret with digestibility and medical context; renal cases need vet guidance."],
  },
  {
    field: "fat_percent",
    role: "Main energy source and palatability driver.",
    useful_for: ["active_working", "fussy_eater", "coat_support"],
    cautions: ["High fat can be unsuitable for pancreatitis or weight-loss goals."],
  },
  {
    field: "fiber_percent",
    role: "Supports stool quality, satiety, and hairball management depending on type.",
    useful_for: ["weight_control", "sensitive_digestion", "hairball"],
    cautions: ["Very high fiber may reduce calorie density and palatability."],
  },
  {
    field: "calcium_percent",
    role: "Bone and teeth mineral; critical for growth diets.",
    useful_for: ["puppy_growth", "kitten_growth"],
    cautions: ["Large breed puppies need careful calcium and phosphorus balance."],
  },
  {
    field: "phosphorus_percent",
    role: "Bone, energy metabolism, and renal diet assessment.",
    useful_for: ["growth", "renal"],
    cautions: ["Renal cases require phosphorus-aware veterinary diet decisions."],
  },
  {
    field: "magnesium_percent",
    role: "Mineral relevant to urinary assessment.",
    useful_for: ["urinary"],
    cautions: ["Do not use magnesium alone for urinary decisions."],
  },
  {
    field: "sodium_percent",
    role: "Electrolyte and mineral balance marker.",
    useful_for: ["urinary", "cardiac_review"],
    cautions: ["Medical cases need veterinarian interpretation."],
  },
  {
    field: "epa_percent",
    role: "Omega-3 fatty acid associated with inflammatory and joint-support reasoning.",
    useful_for: ["senior", "skin", "joint_support", "renal_review"],
    cautions: ["Use published data only; do not infer exact EPA from generic fish ingredients."],
  },
  {
    field: "dha_percent",
    role: "Omega-3 fatty acid important for brain, vision, and growth reasoning.",
    useful_for: ["puppy_growth", "kitten_growth"],
    cautions: ["Use published data only; do not infer exact DHA from generic fish ingredients."],
  },
  {
    field: "epa_dha_percent",
    role: "Combined omega-3 detail useful when brands publish EPA/DHA together.",
    useful_for: ["skin", "coat_support", "joint_support", "senior", "renal_review"],
    cautions: ["Combined EPA/DHA is useful, but separate EPA and DHA values are more precise."],
  },
];

export const ingredientProfiles: IngredientProfile[] = [
  {
    tag: "chicken",
    class: "animal_protein",
    strengths: ["Common palatable animal protein source."],
    cautions: ["Avoid when chicken allergy or preference exclusion is declared."],
  },
  {
    tag: "lamb",
    class: "animal_protein",
    strengths: ["Useful alternative protein for some preference/allergy histories."],
    cautions: ["Not automatically hypoallergenic if the pet has eaten lamb before."],
  },
  {
    tag: "salmon",
    class: "animal_protein",
    strengths: ["Fish protein often pairs with omega fatty-acid positioning."],
    cautions: ["Check exact EPA/DHA values instead of assuming."],
  },
  {
    tag: "rice",
    class: "carbohydrate",
    strengths: ["Common digestible carbohydrate source."],
    cautions: ["Neutral ingredient; not a quality proof by itself."],
  },
  {
    tag: "grain_free",
    class: "carbohydrate",
    strengths: ["Can fit specific owner preference or grain intolerance history."],
    cautions: ["Not automatically better and not carbohydrate-free."],
  },
  {
    tag: "digestive_support",
    class: "fiber",
    strengths: ["May indicate prebiotic or stool-support formulation."],
    cautions: ["Confirm actual ingredients and fiber level."],
  },
];

export function buildBrandProfile(brand: string): BrandProfile {
  const normalized = brand.trim();
  return {
    brand: normalized,
    positioning_tags: [],
    typical_strengths: [],
    review_notes: [
      "Brand profile is generated from normalized product data, not marketing memory.",
      "Use official sources and Food V2 quality status before making confident claims.",
    ],
  };
}
