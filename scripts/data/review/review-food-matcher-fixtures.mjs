import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const paths = {
  fixtures: "data/evals/food-matcher-fixtures.json",
  report: "reports/food_matcher_fixture_summary.md",
};

const genericQueryWords = new Set([
  "adult",
  "brand",
  "cat",
  "chicken",
  "dog",
  "dry",
  "food",
  "formula",
  "recipe",
  "wet",
]);

const queryAliases = [
  [/\brc\b/g, "royal canin"],
  [/\b\u03c1\u03bf\u03b3\u03b9\u03b1\u03bb\s+\u03ba\u03b1\u03bd\u03b9\u03bd\b/g, "royal canin"],
  [/\broyal\s+canine\b/g, "royal canin"],
  [/\broyal\s+kanin\b/g, "royal canin"],
  [/\broial\s+(canin|kanin)\b/g, "royal canin"],
  [/\broyalcanin\b/g, "royal canin"],
  [/\bproplan\b/g, "pro plan"],
  [/\bn\s*&\s*d\b/g, "n d"],
  [/\bn\s+and\s+d\b/g, "n d"],
  [/\bnd\b/g, "n d"],
];

function normalizeSearchText(value) {
  let normalized = String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[+]/g, " plus ")
    .replace(/[-_/]/g, " ")
    .replace(/['’]/g, "");

  for (const [pattern, replacement] of queryAliases) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized.replace(/\s+/g, " ").trim();
}

function getSearchWords(query) {
  return normalizeSearchText(query)
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9-]/g, ""))
    .filter((word) => word.length >= 3 && !genericQueryWords.has(word));
}

function scoreFood(food, query) {
  const normalizedQuery = normalizeSearchText(query);
  const searchWords = getSearchWords(normalizedQuery);
  const brand = normalizeSearchText(food.brand);
  const name = normalizeSearchText(food.name);
  const fullName = `${brand} ${name}`;

  let score = 0;

  if (fullName.includes(normalizedQuery)) score += 100;
  if (normalizedQuery.includes(brand) && brand) score += 30;
  if (normalizedQuery.includes(name) && name) score += 50;

  for (const word of searchWords) {
    if (fullName.includes(word)) score += 10;
  }

  if (brand && normalizedQuery.startsWith(brand)) score += 10;
  if (name && normalizedQuery.endsWith(name)) score += 10;

  return score;
}

function runCase(foods, testCase) {
  const candidates = foods
    .filter((food) => !testCase.species || food.species === testCase.species)
    .map((food) => ({
      id: food.id,
      brand: food.brand,
      name: food.name,
      score: scoreFood(food, testCase.query),
    }))
    .sort((a, b) => b.score - a.score);

  const top = candidates[0] ?? null;
  const issues = [];

  if (!top || top.id !== testCase.expectedTopId) {
    issues.push(
      `Expected ${testCase.expectedTopId}, got ${top?.id ?? "no match"}`
    );
  }

  if (!top || top.score < testCase.minimumScore) {
    issues.push(
      `Expected score >= ${testCase.minimumScore}, got ${top?.score ?? 0}`
    );
  }

  return {
    ...testCase,
    actualTopId: top?.id ?? null,
    actualScore: top?.score ?? 0,
    passed: issues.length === 0,
    issues,
    topCandidates: candidates.slice(0, 3),
  };
}

function renderReport(results) {
  const now = new Date().toISOString();
  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;

  return `# Food Matcher Fixture Summary

Generated: ${now}

## Result

${failed === 0 ? "PASS" : "FAIL"}

Cases: ${results.length}
Passed: ${passed}
Failed: ${failed}

## Cases

${results
  .map((result) => {
    const status = result.passed ? "PASS" : "FAIL";
    const issueText =
      result.issues.length > 0
        ? `\n  Issues: ${result.issues.join("; ")}`
        : "";

    return `- ${status} ${result.id}: ${result.query} -> ${result.actualTopId} (${result.actualScore})${issueText}`;
  })
  .join("\n")}
`;
}

async function main() {
  const raw = await readFile(paths.fixtures, "utf8");
  const fixtures = JSON.parse(raw);

  if (!Array.isArray(fixtures.foods) || !Array.isArray(fixtures.cases)) {
    throw new Error("Fixture file must include foods and cases arrays.");
  }

  const results = fixtures.cases.map((testCase) =>
    runCase(fixtures.foods, testCase)
  );
  const report = renderReport(results);

  await mkdir(path.dirname(paths.report), { recursive: true });
  await writeFile(paths.report, report);

  console.log(`Reviewed ${results.length} food matcher fixtures.`);
  console.log(`Report written to ${paths.report}`);

  if (results.some((result) => !result.passed)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
