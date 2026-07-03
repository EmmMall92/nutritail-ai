import { formatFoodV2ChatbotRecommendationSummary } from "@/lib/food-v2/chatbotRecommendationSummary";
import { planFoodV2RecommendationResponse } from "@/lib/food-v2/recommendationResponseAdapter";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH ||
  "reports/clean_customer_wording_proof_qa.md";

const forbiddenCustomerPatterns = [
  /\bneeds[_\s-]?review\b/i,
  /\bsource\s*tier\b/i,
  /\bsource_priority\b/i,
  /\bsource\s*priority\b/i,
  /\bdata\s*quality\b/i,
  /\bmissing\s*nutrition\b/i,
  /\bmissing\s*fields?\b/i,
  /\bquality\s*:/i,
  /\bsource\s*:/i,
  /\bretailer\s*source\b/i,
  /\bretailer\b/i,
  /\bFood\s*V2\b/i,
  /\bscore-debug\b/i,
  /\bdebug\b/i,
  /\bmanual-required\b/i,
  /\bPASS_NON_DESTRUCTIVE\b/i,
  /\bPASS_FULL\b/i,
  /\bopenai\b/i,
  /\bprompt\b/i,
  /\bmodel\b/i,
  /\binternal tooling\b/i,
  /\bconfidence internals\b/i,
  /\bhigh confidence\b/i,
  /\bmedium confidence\b/i,
  /\blow confidence\b/i,
  /\bconfidence\s*[:=]\s*(?:high|medium|low)\b/i,
  /\b(?:score|total_score|match_score)\s*[:=]?\s*\d{1,3}\s*(?:\/\s*100)?\b/i,
];

const customerSurfaceFiles = [
  "app/account/chatbot/page.tsx",
  "app/account/page.tsx",
  "app/account/pets/page.tsx",
  "app/account/pets/[id]/page.tsx",
  "app/print/pet-report/[id]/page.tsx",
  "app/print/pet-timeline/[id]/page.tsx",
  "lib/ai/responseComposer.ts",
  "lib/food-v2/chatbotRecommendationSummary.ts",
  "lib/food-v2/recommendationResponseAdapter.ts",
];

const customerOutputSamples = [
  {
    label: "summary-default-el",
    text: formatFoodV2ChatbotRecommendationSummary(buildBackOfficeHeavyRecommendation(), {
      locale: "el",
      maxItemsPerSection: 3,
    }),
  },
  {
    label: "summary-card-el",
    text: formatFoodV2ChatbotRecommendationSummary(buildBackOfficeHeavyRecommendation(), {
      locale: "el",
      compactForCards: true,
      preferredProteins: ["κοτόπουλο"],
      excludedIngredients: ["αρνί", "μοσχάρι"],
    }),
  },
  {
    label: "summary-default-en",
    text: formatFoodV2ChatbotRecommendationSummary(buildBackOfficeHeavyRecommendation(), {
      locale: "en",
      maxItemsPerSection: 3,
    }),
  },
  {
    label: "adapter-el",
    text: flattenAdapterPlan(
      planFoodV2RecommendationResponse({
        ...buildBackOfficeHeavyRecommendation(),
        locale: "el",
      })
    ),
  },
  {
    label: "adapter-en",
    text: flattenAdapterPlan(
      planFoodV2RecommendationResponse({
        ...buildBackOfficeHeavyRecommendation(),
        locale: "en",
      })
    ),
  },
];

const requiredSourceProtections = [
  {
    file: "lib/ai/promptInstructions.ts",
    markers: [
      "Do not mention needs_review",
      "source tier",
      "missing nutrition fields",
    ],
  },
  {
    file: "lib/ai/responseComposer.ts",
    markers: [
      "removeBackOfficeLines",
      "sanitizeGroundingText",
      "needs_review",
      "source tier",
      "missing nutrition",
    ],
  },
  {
    file: "lib/food-v2/chatbotRecommendationSummary.ts",
    markers: [
      "INTERNAL_NOTE_PATTERNS",
      "needs[_\\s-]?review",
      "retailer source should be worded cautiously",
      "cleanOutput",
    ],
  },
  {
    file: "lib/food-v2/recommendationResponseAdapter.ts",
    markers: [
      "INTERNAL_COPY_PATTERNS",
      "needs[_\\s-]?review",
      "isCustomerSafeLine",
    ],
  },
];

const failures: string[] = [];

for (const sample of customerOutputSamples) {
  const leaks = findForbiddenLeaks(sample.text);
  if (leaks.length > 0) {
    failures.push(`${sample.label}: leaked ${leaks.join(", ")}`);
  }
}

for (const rule of requiredSourceProtections) {
  const source = readFileSync(rule.file, "utf8");
  for (const marker of rule.markers) {
    if (!source.includes(marker)) {
      failures.push(`${rule.file}: missing protection marker "${marker}"`);
    }
  }
}

for (const file of customerSurfaceFiles) {
  const source = readFileSync(file, "utf8");
  if (file.startsWith("app/") && source.includes("source tier")) {
    failures.push(`${file}: customer UI source must not contain literal "source tier" copy.`);
  }
  if (file.startsWith("app/") && source.includes("missing nutrition")) {
    failures.push(`${file}: customer UI source must not contain literal "missing nutrition" copy.`);
  }
  if (file.startsWith("app/") && source.includes("Food V2")) {
    failures.push(`${file}: customer UI source must not contain literal "Food V2" copy.`);
  }
}

writeReport();

if (failures.length > 0) {
  console.error("Clean customer wording proof failed:");
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Clean customer wording proof passed.");

function buildBackOfficeHeavyRecommendation() {
  return {
    goal: "sterilised" as const,
    total_candidates: 6,
    premium: [
      {
        brand: "Happy Dog",
        display_name: "Naturcroq Duck & Rice Sterilised",
        data_quality_status: "needs_review",
        source_priority: "retailer",
        missing_nutrition_fields: ["sodium_percent", "magnesium_percent"],
        ranking: {
          total_score: 88,
          confidence: "high" as const,
          reasons: [
            "Matches adult life stage.",
            "Ingredient data is available.",
            "Data is usable but still needs review.",
            "Retailer source should be worded cautiously.",
          ],
          cautions: [
            "Data is usable but still needs review.",
            "Retailer source should be worded cautiously.",
            "Missing nutrition fields: sodium_percent, magnesium_percent.",
            "Fat is not low enough to be a first pick for a sterilised or weight-control case.",
          ],
        },
        nutrition: {
          kcal_per_100g: 332,
          protein_percent: 22,
          fat_percent: 9,
          fiber_percent: 2.5,
          calcium_percent: 1.2,
          phosphorus_percent: 0.8,
        },
      },
      {
        brand: "Royal Canin",
        display_name: "Xsmall Sterilised Adult",
        data_quality_status: "partial",
        source_priority: "official",
        missing_nutrition_fields: ["magnesium_percent"],
        ranking: {
          total_score: 84,
          confidence: "medium" as const,
          reasons: ["Matches adult life stage.", "Useful weight-aware positioning."],
          cautions: ["Detailed mineral data is incomplete."],
        },
        nutrition: {
          kcal_per_100g: 348.6,
          protein_percent: 26,
          fat_percent: 14,
          fiber_percent: 5.2,
        },
      },
    ],
    value: [
      {
        brand: "Josera",
        display_name: "Sensi Plus Adult",
        data_quality_status: "needs_review",
        source_priority: "retailer",
        missing_nutrition_fields: ["sodium_percent"],
        ranking: {
          total_score: 77,
          confidence: "medium" as const,
          reasons: ["Matches adult life stage.", "Ingredient data is available."],
          cautions: ["Retailer source should be worded cautiously."],
        },
        nutrition: {
          kcal_per_100g: 344.2,
          protein_percent: 24,
          fat_percent: 12,
          fiber_percent: 2.3,
        },
      },
    ],
    hold: [],
    notes: [
      "Food V2 source tier: retailer.",
      "data quality: needs_review.",
      "missing nutrition fields: sodium_percent, magnesium_percent.",
      "PASS_NON_DESTRUCTIVE proof status should never appear to customers.",
    ],
  };
}

function flattenAdapterPlan(plan: ReturnType<typeof planFoodV2RecommendationResponse>) {
  return [
    plan.title,
    plan.summary,
    ...plan.sections.flatMap((section) => [section.title, ...section.items]),
    ...plan.cautions,
    plan.followUpQuestion,
  ].join("\n");
}

function findForbiddenLeaks(text: string) {
  return forbiddenCustomerPatterns
    .filter((pattern) => pattern.test(text))
    .map((pattern) => pattern.source);
}

function writeReport() {
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(
    reportPath,
    [
      "# Clean Customer Wording Proof QA",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "This proof verifies that customer-visible recommendation text hides Food V2/back-office details even when the raw recommendation payload contains them.",
      "",
      "## Scope",
      "",
      `- Customer output samples checked: ${customerOutputSamples.length}`,
      `- Customer surface files checked: ${customerSurfaceFiles.length}`,
      `- Forbidden customer patterns checked: ${forbiddenCustomerPatterns.length}`,
      "",
      "## Result",
      "",
      failures.length === 0 ? "PASS" : "FAIL",
      "",
      "## Failures",
      "",
      ...(failures.length > 0 ? failures.map((failure) => `- ${failure}`) : ["- none"]),
    ].join("\n") + "\n",
    "utf8",
  );
}
