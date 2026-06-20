import { readFileSync } from "node:fs";

const rankingSource = readFileSync("lib/food-v2/recommendationRanking.ts", "utf8");
const guardSource = readFileSync("lib/food-v2/recommendationGuards.ts", "utf8");

const excludeSignals = [
  ...rankingSource.matchAll(/addSignal\(\s*signals,\s*"exclude",\s*"([^"]+)"/g),
]
  .map((match) => match[1])
  .filter(Boolean);

const uniqueExcludeSignals = [...new Set(excludeSignals)].sort();
const missing = uniqueExcludeSignals.filter(
  (code) => !guardSource.includes(`${code}: {`) && !guardSource.includes(`code: "${code}"`)
);

if (missing.length > 0) {
  console.error("Food V2 exclude signals are missing guard mappings:");
  console.error(missing.join(", "));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      checkedExcludeSignals: uniqueExcludeSignals.length,
      missing: 0,
    },
    null,
    2
  )
);
