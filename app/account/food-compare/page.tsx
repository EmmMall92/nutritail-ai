"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Species = "dog" | "cat";
type FoodFormatFilter = "any" | "dry" | "wet";
type LifeStageFilter = "any" | "adult" | "young" | "senior" | "all_life_stages";

type FoodSearchCandidate = {
  id?: string;
  brand?: string | null;
  display_name?: string | null;
  name?: string | null;
  species?: string | null;
  format?: string | null;
  life_stage?: string | null;
  dog_size?: string | null;
  match_confidence?: string | null;
  nutrition?: Record<string, number | null>;
  missing_nutrition_fields?: string[];
};

type FoodSearchResponse = {
  candidates?: FoodSearchCandidate[];
  error?: string;
};

type FoodComparisonItem = {
  query: string;
  query_kind?: string;
  source?: string;
  match: {
    brand?: string | null;
    name?: string | null;
    species?: string | null;
    life_stage?: string | null;
    data_quality_status?: string | null;
    data_source_url?: string | null;
  } | null;
  match_score?: number;
  match_confidence?: string;
  data_confidence?: string;
  nutrition?: Record<string, number | null>;
  missing_nutrition_fields?: string[];
  cautions?: string[];
  candidates?: Array<{
    brand?: string | null;
    name?: string | null;
    score?: number | null;
    source?: string | null;
  }>;
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

const EXAMPLES_BY_SPECIES: Record<Species, string[][]> = {
  dog: [
    ["Royal Canin Mini Adult", "Josera SensiPlus"],
    ["Royal Canin Mini Adult", "Ambrosia Fresh Salmon & Chicken Adult Mini"],
  ],
  cat: [
    ["Purina Pro Plan Sterilised Cat", "Royal Canin Sterilised"],
    ["Royal Canin Sterilised", "Josera NatureCat"],
  ],
};

const NUTRITION_FIELDS = [
  { key: "kcal_per_100g", label: "Θερμίδες", suffix: " kcal/100g" },
  { key: "protein_percent", label: "Πρωτεΐνη", suffix: "%" },
  { key: "fat_percent", label: "Λιπαρά", suffix: "%" },
  { key: "fiber_percent", label: "Ίνες", suffix: "%" },
  { key: "calcium_percent", label: "Ασβέστιο", suffix: "%" },
  { key: "phosphorus_percent", label: "Φώσφορος", suffix: "%" },
  { key: "sodium_percent", label: "Νάτριο", suffix: "%" },
  { key: "magnesium_percent", label: "Μαγνήσιο", suffix: "%" },
];

const FORMAT_FILTERS: Array<{ value: FoodFormatFilter; label: string }> = [
  { value: "any", label: "Όλες" },
  { value: "dry", label: "Ξηρά" },
  { value: "wet", label: "Υγρή" },
];

const LIFE_STAGE_FILTERS: Array<{ value: LifeStageFilter; label: string }> = [
  { value: "any", label: "Όλες" },
  { value: "adult", label: "Adult" },
  { value: "young", label: "Puppy / Kitten" },
  { value: "senior", label: "Senior" },
  { value: "all_life_stages", label: "All life stages" },
];

function getLifeStageSearchValue(filter: LifeStageFilter, species: Species) {
  if (filter === "any") return null;
  if (filter === "young") return species === "cat" ? "kitten" : "puppy";
  return filter;
}

function normalizeFoodName(item: FoodComparisonItem) {
  if (!item.match) return item.query;

  return [item.match.brand, item.match.name]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(" - ");
}

function formatNutritionValue(value: number | null | undefined, suffix: string) {
  if (value === null || value === undefined) return "Δεν υπάρχει στοιχείο";
  return `${value}${suffix}`;
}

function formatConfidence(value?: string) {
  if (value === "high") return "Υψηλή";
  if (value === "moderate") return "Μέτρια";
  if (value === "low") return "Χαμηλή";
  if (value === "needs_formula") return "Θέλει φόρμουλα";
  if (value === "none") return "Δεν βρέθηκε";
  return value ?? "-";
}

function getCandidateNames(item: FoodComparisonItem) {
  return (item.candidates ?? [])
    .map((candidate) =>
      [candidate.brand, candidate.name]
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
        .join(" - ")
    )
    .filter(Boolean)
    .slice(0, 3);
}

function getSearchCandidateName(candidate: FoodSearchCandidate) {
  const brand = String(candidate.brand ?? "").trim();
  const displayName = String(candidate.display_name ?? candidate.name ?? "").trim();

  if (!brand) return displayName;
  if (!displayName) return brand;
  if (displayName.toLowerCase().startsWith(brand.toLowerCase())) return displayName;

  return `${brand} ${displayName}`;
}

function getSearchCandidateMeta(candidate: FoodSearchCandidate) {
  return [candidate.format, candidate.life_stage, candidate.dog_size]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(" · ");
}

function getSearchCandidateNutrition(candidate: FoodSearchCandidate) {
  const protein = candidate.nutrition?.protein_percent;
  const fat = candidate.nutrition?.fat_percent;
  const calories = candidate.nutrition?.kcal_per_100g;
  const parts = [];

  if (typeof protein === "number") parts.push(`Πρωτ. ${protein}%`);
  if (typeof fat === "number") parts.push(`Λίπος ${fat}%`);
  if (typeof calories === "number") parts.push(`${calories} kcal/100g`);

  return parts.join(" · ");
}

function getCautionCopy(caution: string) {
  const normalized = caution.toLowerCase();

  if (normalized.includes("calories")) {
    return "Λείπουν θερμίδες, οπότε η σύγκριση ποσότητας είναι περιορισμένη.";
  }
  if (normalized.includes("calcium") || normalized.includes("phosphorus")) {
    return "Λείπει ασβέστιο/φώσφορος, άρα κουτάβια, ανάπτυξη ή νεφρικά θέματα θέλουν προσοχή.";
  }
  if (normalized.includes("sodium") || normalized.includes("magnesium")) {
    return "Λείπει νάτριο ή μαγνήσιο, άρα ο ουρολογικός/μεταλλικός έλεγχος δεν είναι πλήρης.";
  }

  return caution;
}

export default function AccountFoodComparePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [species, setSpecies] = useState<Species>("dog");
  const [formatFilter, setFormatFilter] = useState<FoodFormatFilter>("any");
  const [lifeStageFilter, setLifeStageFilter] = useState<LifeStageFilter>("any");
  const [queries, setQueries] = useState(["", ""]);
  const [result, setResult] = useState<FoodCompareResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [focusedInputIndex, setFocusedInputIndex] = useState<number | null>(null);
  const [suggestionsByIndex, setSuggestionsByIndex] = useState<
    Record<number, FoodSearchCandidate[]>
  >({});
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const [error, setError] = useState("");

  const cleanQueries = useMemo(
    () => queries.map((item) => item.trim()).filter(Boolean),
    [queries]
  );
  const examples = EXAMPLES_BY_SPECIES[species];

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();

      if (!data.session?.user) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      setIsCheckingSession(false);
    }

    checkSession();
  }, [pathname, router]);

  useEffect(() => {
    if (focusedInputIndex === null) return;

    const query = queries[focusedInputIndex]?.trim() ?? "";

    if (query.length < 2) {
      setSuggestionsByIndex((current) => ({
        ...current,
        [focusedInputIndex]: [],
      }));
      setIsSuggestionLoading(false);
      return;
    }

    let ignore = false;
    const timeout = window.setTimeout(async () => {
      try {
        setIsSuggestionLoading(true);

        const response = await fetch("/api/account/foods/v2-search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            species,
            format: formatFilter === "any" ? null : formatFilter,
            life_stage: getLifeStageSearchValue(lifeStageFilter, species),
            limit: 6,
          }),
        });
        const data = (await response.json()) as FoodSearchResponse;

        if (ignore) return;

        setSuggestionsByIndex((current) => ({
          ...current,
          [focusedInputIndex]: response.ok ? data.candidates ?? [] : [],
        }));
      } catch (err) {
        console.error(err);
        if (!ignore) {
          setSuggestionsByIndex((current) => ({
            ...current,
            [focusedInputIndex]: [],
          }));
        }
      } finally {
        if (!ignore) setIsSuggestionLoading(false);
      }
    }, 250);

    return () => {
      ignore = true;
      window.clearTimeout(timeout);
    };
  }, [focusedInputIndex, formatFilter, lifeStageFilter, queries, species]);

  function updateQuery(index: number, value: string) {
    setQueries((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item))
    );
    setResult(null);
    setError("");
  }

  function updateSpecies(value: Species) {
    setSpecies(value);
    setLifeStageFilter("any");
    setSuggestionsByIndex({});
    setResult(null);
    setError("");
  }

  function updateFormatFilter(value: FoodFormatFilter) {
    setFormatFilter(value);
    setSuggestionsByIndex({});
    setResult(null);
    setError("");
  }

  function updateLifeStageFilter(value: LifeStageFilter) {
    setLifeStageFilter(value);
    setSuggestionsByIndex({});
    setResult(null);
    setError("");
  }

  function chooseSuggestedFood(index: number, candidate: FoodSearchCandidate) {
    setQueries((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? getSearchCandidateName(candidate) : item
      )
    );
    setFocusedInputIndex(null);
    setSuggestionsByIndex((current) => ({
      ...current,
      [index]: [],
    }));
    setResult(null);
    setError("");
  }

  function addFoodInput() {
    setQueries((current) => (current.length >= 5 ? current : [...current, ""]));
  }

  function removeFoodInput(index: number) {
    setQueries((current) =>
      current.length <= 2
        ? current
        : current.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  async function runComparison(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (cleanQueries.length < 2) {
      setError("Βάλε τουλάχιστον δύο τροφές με εταιρεία και φόρμουλα.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setResult(null);

      const response = await fetch("/api/account/foods/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          queries: cleanQueries,
          species,
        }),
      });
      const data = (await response.json()) as FoodCompareResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Δεν μπόρεσα να ολοκληρώσω τη σύγκριση.");
      }

      setResult(data);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Δεν μπόρεσα να ολοκληρώσω τη σύγκριση."
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isCheckingSession) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">Φορτώνω το εργαλείο σύγκρισης...</p>
      </section>
    );
  }

  return (
    <section className="space-y-6" data-testid="account-food-compare">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Food comparison
            </p>
            <h1 className="mt-2 text-3xl font-bold text-black">
              Σύγκριση τροφών
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Σύγκρινε 2 έως 5 τροφές από τη βάση NutriTail χωρίς να ανοίξεις
              συζήτηση στο chatbot. Για ασφαλή επιλογή εξακολουθούν να μετράνε
              ηλικία, βάρος, στείρωση, στόχος και θέματα υγείας.
            </p>
          </div>

          <Link
            href="/account/chatbot"
            className="rounded-xl border border-gray-300 px-5 py-3 text-center text-sm font-medium text-black transition hover:bg-gray-100"
          >
            Άνοιγμα συμβούλου
          </Link>
        </div>
      </div>

      <form
        onSubmit={runComparison}
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-black">Τροφές για σύγκριση</h2>
            <p className="mt-1 text-sm text-gray-600">
              Χρησιμοποίησε όσο πιο ακριβές όνομα υπάρχει στη συσκευασία.
            </p>
          </div>

          <div className="inline-grid grid-cols-2 rounded-xl border border-gray-200 bg-gray-50 p-1">
            {(["dog", "cat"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => updateSpecies(value)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  species === value
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-white"
                }`}
              >
                {value === "dog" ? "Σκύλος" : "Γάτα"}
              </button>
            ))}
          </div>
        </div>

        <div
          className="mt-5 grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 lg:grid-cols-2"
          data-testid="food-compare-helper-controls"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Μορφή
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {FORMAT_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => updateFormatFilter(filter.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    formatFilter === filter.value
                      ? "border-black bg-black text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Ηλικία
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {LIFE_STAGE_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => updateLifeStageFilter(filter.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    lifeStageFilter === filter.value
                      ? "border-black bg-black text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {filter.value === "young"
                    ? species === "cat"
                      ? "Kitten"
                      : "Puppy"
                    : filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {queries.map((query, index) => (
            <div key={index} className="relative">
              <div className="flex gap-2">
              <label className="sr-only" htmlFor={`food-query-${index}`}>
                Τροφή {index + 1}
              </label>
              <input
                id={`food-query-${index}`}
                value={query}
                onChange={(event) => updateQuery(index, event.target.value)}
                onFocus={() => setFocusedInputIndex(index)}
                onBlur={() => setFocusedInputIndex(null)}
                autoComplete="off"
                placeholder={
                  index === 0
                    ? "π.χ. Royal Canin Mini Adult"
                    : "π.χ. Farmina N&D Pumpkin Lamb"
                }
                className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm text-black outline-none transition focus:border-black"
              />
              {queries.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeFoodInput(index)}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                  aria-label={`Αφαίρεση τροφής ${index + 1}`}
                >
                  ×
                </button>
              )}
              </div>

              {focusedInputIndex === index && query.trim().length >= 2 && (
                <div
                  className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
                  data-testid={`food-compare-suggestions-${index}`}
                >
                  {isSuggestionLoading ? (
                    <p className="px-4 py-3 text-sm text-gray-600">
                      Αναζήτηση τροφών...
                    </p>
                  ) : (suggestionsByIndex[index] ?? []).length > 0 ? (
                    <div className="max-h-80 overflow-y-auto">
                      {(suggestionsByIndex[index] ?? []).map(
                        (candidate, candidateIndex) => {
                          const candidateName = getSearchCandidateName(candidate);
                          const meta = getSearchCandidateMeta(candidate);
                          const nutrition = getSearchCandidateNutrition(candidate);

                          return (
                            <button
                              key={candidate.id ?? `${candidateName}-${candidateIndex}`}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                chooseSuggestedFood(index, candidate);
                              }}
                              className="block w-full border-b border-gray-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-teal-50"
                            >
                              <span className="block text-sm font-semibold text-black">
                                {candidateName}
                              </span>
                              {meta && (
                                <span className="mt-1 block text-xs text-gray-600">
                                  {meta}
                                </span>
                              )}
                              {nutrition && (
                                <span className="mt-1 block text-xs font-medium text-teal-800">
                                  {nutrition}
                                </span>
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    <p className="px-4 py-3 text-sm text-gray-600">
                      Δεν βρέθηκε κοντινή τροφή με αυτά τα φίλτρα.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={addFoodInput}
            disabled={queries.length >= 5}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Προσθήκη τροφής
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Συγκρίνω..." : "Σύγκριση"}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {examples.map((example) => (
            <button
              key={example.join(" vs ")}
              type="button"
              onClick={() => {
                setQueries(example);
                setResult(null);
                setError("");
              }}
              className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-900 transition hover:bg-teal-100"
            >
              {example.join(" vs ")}
            </button>
          ))}
        </div>
      </form>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result?.summary && (
        <div className="rounded-2xl border border-teal-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-black">Γρήγορη εικόνα</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-teal-100 bg-teal-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                Χαμηλότερες θερμίδες
              </p>
              <p className="mt-2 font-semibold text-teal-950">
                {result.summary.lowest_calorie ?? "Δεν υπάρχουν αρκετά δεδομένα"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Περισσότερη πρωτεΐνη
              </p>
              <p className="mt-2 font-semibold text-gray-950">
                {result.summary.highest_protein ?? "Δεν υπάρχουν αρκετά δεδομένα"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Περισσότερες ίνες
              </p>
              <p className="mt-2 font-semibold text-gray-950">
                {result.summary.highest_fiber ?? "Δεν υπάρχουν αρκετά δεδομένα"}
              </p>
            </div>
          </div>
        </div>
      )}

      {result?.comparisons && (
        <div className="space-y-4">
          {result.comparisons.map((item, index) => {
            const candidates = getCandidateNames(item);
            const missingFields = item.missing_nutrition_fields ?? [];
            const cautions = (item.cautions ?? []).map(getCautionCopy);

            return (
              <article
                key={`${item.query}-${index}`}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-500">
                      {item.query}
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-black">
                      {item.match
                        ? normalizeFoodName(item)
                        : "Θέλει πιο ακριβές όνομα"}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                      Πηγή: {item.source ?? "-"} · Ταίριασμα:{" "}
                      {formatConfidence(item.match_confidence)} · Δεδομένα:{" "}
                      {formatConfidence(item.data_confidence)}
                    </p>
                  </div>

                  {item.match?.data_quality_status && (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {item.match.data_quality_status}
                    </span>
                  )}
                </div>

                {item.match ? (
                  <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {NUTRITION_FIELDS.map((field) => (
                      <div
                        key={field.key}
                        className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {field.label}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-gray-950">
                          {formatNutritionValue(
                            item.nutrition?.[field.key],
                            field.suffix
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    {item.query_kind === "brand_only"
                      ? "Αυτό μοιάζει με εταιρεία και όχι με συγκεκριμένη φόρμουλα. Δεν θα διαλέξουμε τυχαία προϊόν."
                      : "Δεν βρέθηκε αρκετά σίγουρο προϊόν στη βάση."}
                  </div>
                )}

                {(cautions.length > 0 ||
                  missingFields.length > 0 ||
                  candidates.length > 0) && (
                  <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
                    {cautions.length > 0 && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm font-bold text-amber-950">Προσοχή</p>
                        <ul className="mt-2 space-y-1 text-sm text-amber-900">
                          {cautions.map((caution) => (
                            <li key={caution}>- {caution}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {missingFields.length > 0 && (
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-sm font-bold text-gray-950">
                          Λείπουν στοιχεία
                        </p>
                        <p className="mt-2 text-sm text-gray-700">
                          {missingFields.join(", ")}
                        </p>
                      </div>
                    )}

                    {candidates.length > 0 && (
                      <div className="rounded-xl border border-teal-100 bg-teal-50 p-4">
                        <p className="text-sm font-bold text-teal-950">
                          Πιθανές φόρμουλες
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-teal-900">
                          {candidates.map((candidate) => (
                            <li key={candidate}>- {candidate}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
