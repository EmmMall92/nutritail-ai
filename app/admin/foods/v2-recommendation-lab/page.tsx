"use client";

import { useState } from "react";
import Link from "next/link";

type RecommendationGoal =
  | "general"
  | "premium"
  | "value"
  | "weight_control"
  | "sensitive_digestion"
  | "allergy"
  | "urinary"
  | "renal"
  | "growth"
  | "sterilised"
  | "senior";

type RecommendationItem = {
  id: string;
  brand: string;
  display_name: string;
  formula_key: string;
  species: string;
  format: string;
  life_stage: string;
  dog_size: string | null;
  data_quality_status: string;
  source_priority: string;
  data_source_url: string | null;
  ranking: {
    total_score: number;
    fit_score: number;
    quality_score: number;
    value_score: number;
    confidence: "high" | "medium" | "low";
    bucket: "premium" | "value" | "hold";
    value_tier: string;
    reasons: string[];
    cautions: string[];
  };
  nutrition: {
    kcal_per_100g: number | null;
    protein_percent: number | null;
    fat_percent: number | null;
    fiber_percent: number | null;
    calcium_percent: number | null;
    phosphorus_percent: number | null;
    sodium_percent: number | null;
    magnesium_percent: number | null;
    omega3_percent: number | null;
    omega6_percent: number | null;
    epa_percent: number | null;
    dha_percent: number | null;
    epa_dha_percent: number | null;
  };
};

type RecommendationResponse = {
  goal: RecommendationGoal;
  total_candidates: number;
  premium: RecommendationItem[];
  value: RecommendationItem[];
  hold: RecommendationItem[];
  notes: string[];
};

const goalOptions: Array<{ value: RecommendationGoal; label: string }> = [
  { value: "general", label: "General fit" },
  { value: "premium", label: "Premium" },
  { value: "value", label: "Value" },
  { value: "weight_control", label: "Weight control" },
  { value: "sensitive_digestion", label: "Sensitive digestion" },
  { value: "allergy", label: "Allergy" },
  { value: "urinary", label: "Urinary" },
  { value: "renal", label: "Renal" },
  { value: "growth", label: "Growth" },
  { value: "sterilised", label: "Sterilised" },
  { value: "senior", label: "Senior" },
];

type LabPreset = {
  label: string;
  helper: string;
  species: "dog" | "cat";
  breed: string;
  age: string;
  weight: string;
  activityLevel: "low" | "normal" | "high";
  neutered: boolean;
  goal: RecommendationGoal;
  allergies: string;
  excludedIngredients: string;
  preferredProteins: string;
  healthIssues: string;
  brand: string;
};

const labPresets: LabPreset[] = [
  {
    label: "Large dog 30kg",
    helper: "Catches small/mini size mismatches.",
    species: "dog",
    breed: "Labrador",
    age: "4",
    weight: "30",
    activityLevel: "normal",
    neutered: true,
    goal: "sterilised",
    allergies: "",
    excludedIngredients: "",
    preferredProteins: "",
    healthIssues: "weight control",
    brand: "",
  },
  {
    label: "Small dog 7kg",
    helper: "Checks small-breed positioning.",
    species: "dog",
    breed: "Maltese",
    age: "5",
    weight: "7",
    activityLevel: "normal",
    neutered: true,
    goal: "sterilised",
    allergies: "",
    excludedIngredients: "",
    preferredProteins: "",
    healthIssues: "",
    brand: "",
  },
  {
    label: "Avoid chicken",
    helper: "Taste dislike or non-medical preference.",
    species: "dog",
    breed: "Labrador",
    age: "4",
    weight: "30",
    activityLevel: "normal",
    neutered: true,
    goal: "general",
    allergies: "",
    excludedIngredients: "chicken",
    preferredProteins: "lamb, salmon",
    healthIssues: "",
    brand: "",
  },
  {
    label: "Chicken allergy",
    helper: "Medical-style hard exclusion.",
    species: "dog",
    breed: "Mixed breed",
    age: "3",
    weight: "18",
    activityLevel: "normal",
    neutered: false,
    goal: "allergy",
    allergies: "chicken",
    excludedIngredients: "",
    preferredProteins: "lamb, duck, salmon",
    healthIssues: "skin allergy",
    brand: "",
  },
  {
    label: "Large puppy",
    helper: "Growth plus calcium/phosphorus confidence.",
    species: "dog",
    breed: "German Shepherd",
    age: "0.6",
    weight: "22",
    activityLevel: "normal",
    neutered: false,
    goal: "growth",
    allergies: "",
    excludedIngredients: "",
    preferredProteins: "",
    healthIssues: "",
    brand: "",
  },
  {
    label: "Sterilised cat 5kg",
    helper: "Weight-aware cat ranking.",
    species: "cat",
    breed: "European shorthair",
    age: "5",
    weight: "5",
    activityLevel: "low",
    neutered: true,
    goal: "sterilised",
    allergies: "",
    excludedIngredients: "",
    preferredProteins: "",
    healthIssues: "weight control",
    brand: "",
  },
  {
    label: "Urinary cat",
    helper: "Urinary positioning and mineral cautions.",
    species: "cat",
    breed: "European shorthair",
    age: "5",
    weight: "5",
    activityLevel: "normal",
    neutered: true,
    goal: "urinary",
    allergies: "",
    excludedIngredients: "",
    preferredProteins: "",
    healthIssues: "urinary",
    brand: "",
  },
  {
    label: "Senior dog",
    helper: "Senior positioning with cautious minerals.",
    species: "dog",
    breed: "Mixed breed",
    age: "10",
    weight: "18",
    activityLevel: "low",
    neutered: true,
    goal: "senior",
    allergies: "",
    excludedIngredients: "",
    preferredProteins: "",
    healthIssues: "joint support",
    brand: "",
  },
  {
    label: "Sensitive digestion",
    helper: "GI terms, fibers and sensitive formulas.",
    species: "dog",
    breed: "French Bulldog",
    age: "3",
    weight: "12",
    activityLevel: "normal",
    neutered: true,
    goal: "sensitive_digestion",
    allergies: "",
    excludedIngredients: "",
    preferredProteins: "",
    healthIssues: "sensitive digestion, gas",
    brand: "",
  },
];

function splitText(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function nutritionText(item: RecommendationItem) {
  const nutrition = item.nutrition;
  return [
    nutrition.kcal_per_100g !== null ? `${nutrition.kcal_per_100g} kcal/100g` : null,
    nutrition.protein_percent !== null ? `${nutrition.protein_percent}% protein` : null,
    nutrition.fat_percent !== null ? `${nutrition.fat_percent}% fat` : null,
    nutrition.fiber_percent !== null ? `${nutrition.fiber_percent}% fiber` : null,
    nutrition.calcium_percent !== null ? `${nutrition.calcium_percent}% Ca` : null,
    nutrition.phosphorus_percent !== null ? `${nutrition.phosphorus_percent}% P` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function scoreClass(score: number) {
  if (score >= 80) return "bg-green-50 text-green-700";
  if (score >= 60) return "bg-amber-50 text-amber-700";
  return "bg-gray-100 text-gray-700";
}

function ResultCard({ item }: { item: RecommendationItem }) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-black">{item.brand}</p>
          <h3 className="mt-1 text-lg font-bold text-black">{item.display_name}</h3>
          <p className="mt-1 font-mono text-xs text-gray-500">{item.formula_key}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-bold ${scoreClass(
            item.ranking.total_score
          )}`}
        >
          {item.ranking.total_score}/100
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
          fit {item.ranking.fit_score}
        </span>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
          quality {item.ranking.quality_score}
        </span>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
          value {item.ranking.value_score}
        </span>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
          {item.ranking.confidence} confidence
        </span>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
          {item.data_quality_status} · {item.source_priority}
        </span>
      </div>

      <p className="mt-3 text-sm text-gray-700">{nutritionText(item) || "Nutrition values are limited."}</p>

      {item.ranking.reasons.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Why it ranks
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {item.ranking.reasons.slice(0, 4).map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {item.ranking.cautions.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            Cautions
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
            {item.ranking.cautions.slice(0, 3).map((caution) => (
              <li key={caution}>{caution}</li>
            ))}
          </ul>
        </div>
      )}

      {item.data_source_url && (
        <a
          href={item.data_source_url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-black transition hover:bg-gray-50"
        >
          Open source
        </a>
      )}
    </article>
  );
}

function ResultSection({
  title,
  helper,
  items,
}: {
  title: string;
  helper: string;
  items: RecommendationItem[];
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-black">{title}</h2>
        <p className="mt-1 text-sm text-gray-600">{helper}</p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
          No matches in this bucket.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {items.map((item) => (
            <ResultCard key={`${item.ranking.bucket}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function FoodV2RecommendationLabPage() {
  const [species, setSpecies] = useState<"dog" | "cat">("dog");
  const [breed, setBreed] = useState("Labrador");
  const [age, setAge] = useState("4");
  const [weight, setWeight] = useState("30");
  const [activityLevel, setActivityLevel] = useState<"low" | "normal" | "high">(
    "normal"
  );
  const [neutered, setNeutered] = useState(true);
  const [goal, setGoal] = useState<RecommendationGoal>("sterilised");
  const [allergies, setAllergies] = useState("");
  const [excludedIngredients, setExcludedIngredients] = useState("");
  const [preferredProteins, setPreferredProteins] = useState("");
  const [healthIssues, setHealthIssues] = useState("weight control");
  const [brand, setBrand] = useState("");
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function loadPreset(preset: LabPreset) {
    setSpecies(preset.species);
    setBreed(preset.breed);
    setAge(preset.age);
    setWeight(preset.weight);
    setActivityLevel(preset.activityLevel);
    setNeutered(preset.neutered);
    setGoal(preset.goal);
    setAllergies(preset.allergies);
    setExcludedIngredients(preset.excludedIngredients);
    setPreferredProteins(preset.preferredProteins);
    setHealthIssues(preset.healthIssues);
    setBrand(preset.brand);
    setResult(null);
    setError("");
  }

  async function runRanking() {
    try {
      setError("");
      setIsLoading(true);

      const response = await fetch("/api/account/foods/v2-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pet: {
            species,
            breed,
            age: Number(age),
            weight: Number(weight),
            activityLevel,
            neutered,
            allergies: splitText(allergies),
            excludedIngredients: splitText(excludedIngredients),
            preferredProteins: splitText(preferredProteins),
            healthIssues: splitText(healthIssues),
          },
          goal,
          format: "dry",
          brand: brand.trim() || undefined,
          limit_per_bucket: 3,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not rank Food V2 recommendations.");
      }

      setResult(data as RecommendationResponse);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not rank Food V2 recommendations."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Food V2
        </p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">Recommendation Lab</h1>
            <p className="mt-2 max-w-3xl text-gray-600">
              Test how Food V2 ranks dry foods for a specific pet before the
              logic is surfaced in the chatbot. The output separates stronger
              options from value candidates and shows the exact scoring reasons.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/foods/v2-recommendation-visibility"
              className="rounded-xl border border-black px-5 py-3 text-sm font-medium text-black transition hover:bg-gray-100"
            >
              Visibility
            </Link>
            <Link
              href="/admin/foods/v2-nutrient-gaps"
              className="rounded-xl border border-black px-5 py-3 text-sm font-medium text-black transition hover:bg-gray-100"
            >
              Nutrient Gaps
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <p className="text-sm font-semibold text-black">Quick scenarios</p>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {labPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => loadPreset(preset)}
                className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-left transition hover:border-gray-400 hover:bg-white"
              >
                <span className="block text-sm font-semibold text-black">
                  {preset.label}
                </span>
                <span className="mt-1 block text-xs text-gray-600">
                  {preset.helper}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-black">Species</span>
            <select
              value={species}
              onChange={(event) => setSpecies(event.target.value as "dog" | "cat")}
              className="w-full rounded-xl border border-gray-300 p-3 text-black"
            >
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-black">Breed</span>
            <input
              value={breed}
              onChange={(event) => setBreed(event.target.value)}
              className="w-full rounded-xl border border-gray-300 p-3 text-black"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-black">Age</span>
            <input
              value={age}
              onChange={(event) => setAge(event.target.value)}
              inputMode="decimal"
              className="w-full rounded-xl border border-gray-300 p-3 text-black"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-black">Weight kg</span>
            <input
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              inputMode="decimal"
              className="w-full rounded-xl border border-gray-300 p-3 text-black"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-black">Activity</span>
            <select
              value={activityLevel}
              onChange={(event) =>
                setActivityLevel(event.target.value as "low" | "normal" | "high")
              }
              className="w-full rounded-xl border border-gray-300 p-3 text-black"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-black">Goal</span>
            <select
              value={goal}
              onChange={(event) => setGoal(event.target.value as RecommendationGoal)}
              className="w-full rounded-xl border border-gray-300 p-3 text-black"
            >
              {goalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-black">Allergies</span>
            <input
              value={allergies}
              onChange={(event) => setAllergies(event.target.value)}
              placeholder="chicken, wheat"
              className="w-full rounded-xl border border-gray-300 p-3 text-black"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-black">
              Avoid ingredients / flavors
            </span>
            <input
              value={excludedIngredients}
              onChange={(event) => setExcludedIngredients(event.target.value)}
              placeholder="chicken, beef"
              className="w-full rounded-xl border border-gray-300 p-3 text-black"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-black">
              Preferred proteins / flavors
            </span>
            <input
              value={preferredProteins}
              onChange={(event) => setPreferredProteins(event.target.value)}
              placeholder="lamb, salmon"
              className="w-full rounded-xl border border-gray-300 p-3 text-black"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-black">Health issues</span>
            <input
              value={healthIssues}
              onChange={(event) => setHealthIssues(event.target.value)}
              placeholder="urinary, sensitive digestion"
              className="w-full rounded-xl border border-gray-300 p-3 text-black"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-black">Brand optional</span>
            <input
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              placeholder="Royal Canin"
              className="w-full rounded-xl border border-gray-300 p-3 text-black"
            />
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm text-black">
            <input
              type="checkbox"
              checked={neutered}
              onChange={(event) => setNeutered(event.target.checked)}
              className="h-4 w-4"
            />
            Sterilised / neutered
          </label>
        </div>

        <button
          type="button"
          onClick={runRanking}
          disabled={isLoading}
          className="mt-5 rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {isLoading ? "Ranking..." : "Run ranking"}
        </button>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <section className="space-y-7">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-600">
              Ranked {result.total_candidates} candidates for goal{" "}
              <span className="font-semibold text-black">{result.goal}</span>.
            </p>
            {result.notes.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-600">
                {result.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            )}
          </div>

          <ResultSection
            title="Premium candidates"
            helper="Best overall fit and data quality for this pet context."
            items={result.premium}
          />
          <ResultSection
            title="Value candidates"
            helper="Good fit with value-style positioning. This becomes stronger when real price data exists."
            items={result.value}
          />
          <ResultSection
            title="Hold / excluded"
            helper="Rows held out because of species mismatch, allergen conflict, or other hard signals."
            items={result.hold}
          />
        </section>
      )}
    </main>
  );
}
