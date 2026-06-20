import { mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const booksFolder =
  process.env.NUTRITAIL_BOOKS_FOLDER || "C:\\Users\\NIOstb\\Downloads\\BOOKS";
const reportPath =
  process.env.NUTRITAIL_BOOKS_AUDIT_REPORT ||
  "reports/nutrition_books_folder_audit.md";

const topicRules = [
  {
    topic: "renal_urinary",
    pattern: /renal|kidney|phosphorus|urinary|urologic|flutd|struvite|oxalate|cystitis|lower-urinary/i,
  },
  {
    topic: "gi_pancreatitis",
    pattern: /gastro|intestinal|bowel|pancreatitis|pancreatic|diarrhea|gastritis|lower-bowel/i,
  },
  {
    topic: "growth_puppy_kitten",
    pattern: /puppy|kitten|growing|growth|babycat|waltham/i,
  },
  {
    topic: "senior_lifestage",
    pattern: /senior|adult-dog|adult dog|mature/i,
  },
  {
    topic: "obesity_weight",
    pattern: /obesity|weight|body-condition|bcs|diabetic|diabetes/i,
  },
  {
    topic: "allergy_skin",
    pattern: /allerg|hypoallergenic|alopecia|skin|dermat|shedding/i,
  },
  {
    topic: "core_clinical_nutrition",
    pattern: /clinical-nutrition|clinical nutrition|veterinary-nutrition|veterinary nutrition|dietetics|nutrient-requirements|nutrition-and-dietetics|handbook-canine-feline/i,
  },
  {
    topic: "brand_product_guides",
    pattern: /royal-canin|hills|hill-s|product-guide|catalogo|puppy-guide/i,
  },
  {
    topic: "breed_reference",
    pattern: /breed|rottweiler|husky|chihuahua|labrador|yorkshire|pitbull|ragdoll|shorthair|turkish-van/i,
  },
  {
    topic: "market_or_general_pet_care",
    pattern: /market|pet-food-report|complete-cat-care|home-veterinary|holistic|cat-care|dog-selling/i,
  },
];

function formatBytes(value) {
  const units = ["B", "KB", "MB", "GB"];
  let current = value;
  let index = 0;

  while (current >= 1024 && index < units.length - 1) {
    current /= 1024;
    index += 1;
  }

  return `${current.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function classify(name) {
  const matches = topicRules
    .filter((rule) => rule.pattern.test(name))
    .map((rule) => rule.topic);

  return matches.length > 0 ? matches : ["unclassified"];
}

function listFilesRecursive(folder, relativePrefix = "") {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(folder, entry.name);
    const relativePath = path.join(relativePrefix, entry.name);

    if (entry.isDirectory()) {
      return listFilesRecursive(absolutePath, relativePath);
    }

    if (!entry.isFile()) return [];

    const stats = statSync(absolutePath);

    return [
      {
        name: entry.name,
        relativePath,
        extension: path.extname(entry.name).toLowerCase() || "(none)",
        size: stats.size,
        topics: classify(relativePath),
        partial: entry.name.toLowerCase().endsWith(".crdownload"),
      },
    ];
  });
}

const files = listFilesRecursive(booksFolder).sort((left, right) =>
  left.relativePath.localeCompare(right.relativePath)
);

const extensionCounts = new Map();
const topicCounts = new Map();

for (const file of files) {
  extensionCounts.set(file.extension, (extensionCounts.get(file.extension) ?? 0) + 1);

  for (const topic of file.topics) {
    topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
  }
}

const highPriorityTopics = new Set([
  "core_clinical_nutrition",
  "renal_urinary",
  "gi_pancreatitis",
  "growth_puppy_kitten",
  "senior_lifestage",
  "obesity_weight",
  "allergy_skin",
]);

const highPriorityFiles = files.filter((file) =>
  file.topics.some((topic) => highPriorityTopics.has(topic))
);
const partialFiles = files.filter((file) => file.partial);
const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

const lines = [
  "# Nutrition Books Folder Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  `Folder: ${booksFolder}`,
  "",
  "## Summary",
  "",
  `- Files: ${files.length}`,
  `- Total size: ${formatBytes(totalBytes)}`,
  `- High-priority nutrition files: ${highPriorityFiles.length}`,
  `- Partial downloads: ${partialFiles.length}`,
  "",
  "## Extensions",
  "",
  ...[...extensionCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([extension, count]) => `- ${extension}: ${count}`),
  "",
  "## Topic Buckets",
  "",
  ...[...topicCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([topic, count]) => `- ${topic}: ${count}`),
  "",
  "## Partial Downloads",
  "",
  ...(partialFiles.length > 0
    ? partialFiles.map((file) => `- ${file.relativePath}`)
    : ["- None"]),
  "",
  "## High Priority Files",
  "",
  ...highPriorityFiles.map(
    (file) => `- ${file.relativePath} (${file.topics.join(", ")}, ${formatBytes(file.size)})`
  ),
  "",
  "## Policy",
  "",
  "- Do not copy book text into NutriTail.",
  "- Convert source concepts into structured rules, cautions, uncertainty logic, and source-map metadata.",
  "- Food V2 and deterministic rules remain the source of truth for food ranking.",
];

mkdirSync(path.dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      folder: booksFolder,
      files: files.length,
      total_size: formatBytes(totalBytes),
      high_priority_files: highPriorityFiles.length,
      partial_downloads: partialFiles.map((file) => file.relativePath),
      report: reportPath,
    },
    null,
    2
  )
);
