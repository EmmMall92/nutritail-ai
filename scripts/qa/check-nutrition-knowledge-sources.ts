import {
  NUTRITAIL_KNOWLEDGE_ALLOWED_USES,
  NUTRITAIL_KNOWLEDGE_SOURCES,
  isKnowledgeUseAllowed,
  sortKnowledgeSourcesByPriority,
  type NutritionKnowledgeSourceId,
} from "@/lib/nutrition-v2/knowledgeSources";

const expectedOrder: NutritionKnowledgeSourceId[] = [
  "CANINE_FELINE_NUTRITION_BOOK",
  "SMALL_ANIMAL_CLINICAL_NUTRITION",
  "WSAVA",
  "FEDIAF",
  "NRC",
  "WALTHAM",
  "TUFTS_VETERINARY_NUTRITION",
  "UC_DAVIS_VETERINARY_NUTRITION",
  "VETFOLIO",
  "WIKIVET",
];

const failures: string[] = [];
const actualOrder = NUTRITAIL_KNOWLEDGE_SOURCES.map((source) => source.id);
const sortedOrder = sortKnowledgeSourcesByPriority(actualOrder);

if (JSON.stringify(actualOrder) !== JSON.stringify(expectedOrder)) {
  failures.push(`source order changed: ${actualOrder.join(", ")}`);
}

if (JSON.stringify(sortedOrder) !== JSON.stringify(expectedOrder)) {
  failures.push(`priority sorting changed: ${sortedOrder.join(", ")}`);
}

for (const [index, source] of NUTRITAIL_KNOWLEDGE_SOURCES.entries()) {
  const expectedPriority = index + 1;
  if (source.priority !== expectedPriority) {
    failures.push(`${source.id} priority expected ${expectedPriority}, got ${source.priority}`);
  }

  for (const use of NUTRITAIL_KNOWLEDGE_ALLOWED_USES) {
    if (!isKnowledgeUseAllowed(source.id, use)) {
      failures.push(`${source.id} does not allow ${use}`);
    }
  }
}

console.log(
  JSON.stringify(
    {
      checked: NUTRITAIL_KNOWLEDGE_SOURCES.length,
      passed: failures.length === 0,
      source_order: actualOrder,
      allowed_uses: NUTRITAIL_KNOWLEDGE_ALLOWED_USES,
      failures,
    },
    null,
    2
  )
);

if (failures.length > 0) process.exit(1);
