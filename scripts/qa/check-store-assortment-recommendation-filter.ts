import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  matchStoreAssortment,
  parseStoreAssortmentText,
} from "../../lib/food-v2/storeAssortment";

const foods = [
  {
    id: "rc-mini",
    brand: "Royal Canin",
    name: "Royal Canin Mini Adult",
  },
  {
    id: "rc-maxi",
    brand: "Royal Canin",
    name: "Royal Canin Maxi Adult",
  },
  {
    id: "josera-sensi",
    brand: "Josera",
    name: "Josera SensiPlus",
  },
  {
    id: "monge-renal-a",
    brand: "Monge",
    name: "Monge VetSolution Renal",
  },
  {
    id: "monge-renal-b",
    brand: "Monge",
    name: "Monge VetSolution Renal",
  },
];

const parsed = parseStoreAssortmentText(
  [
    "brand,product",
    "Royal Canin",
    "Josera | SensiPlus",
    "Josera | SensiPlus",
    "# internal note",
  ].join("\n")
);
assert.equal(parsed.length, 2, "Header, comments, and duplicates must be ignored.");
assert.equal(parsed[0]?.brand, "Royal Canin");
assert.equal(parsed[0]?.product, null);
assert.equal(parsed[1]?.brand, "Josera");
assert.equal(parsed[1]?.product, "SensiPlus");

const cleanMatch = matchStoreAssortment(
  ["Royal Canin", "Josera | Josera SensiPlus"].join("\n"),
  foods
);
assert.deepEqual(
  cleanMatch.matchedFoodIds.sort(),
  ["josera-sensi", "rc-maxi", "rc-mini"],
  "A brand line must allow the full brand, while a product line allows only the exact formula."
);
assert.equal(cleanMatch.unmatchedEntries.length, 0);
assert.equal(cleanMatch.ambiguousEntries.length, 0);

const guardedMatch = matchStoreAssortment(
  ["Unknown Brand", "Monge | VetSolution Renal"].join("\n"),
  foods
);
assert.deepEqual(guardedMatch.unmatchedEntries, ["Unknown Brand"]);
assert.deepEqual(guardedMatch.ambiguousEntries, [
  "Monge | VetSolution Renal",
]);
assert.equal(
  guardedMatch.matchedFoodIds.length,
  0,
  "Unmatched and ambiguous rows must never be silently enabled."
);

async function main() {
  const root = process.cwd();
  const recommendationRoute = await readFile(
    path.join(
      root,
      "app",
      "api",
      "account",
      "foods",
      "v2-recommendations",
      "route.ts"
    ),
    "utf8"
  );
  assert.match(
    recommendationRoute,
    /\.neq\("is_recommendable", false\)/,
    "Customer recommendations must exclude products outside the active assortment."
  );

  const visibilityRoute = await readFile(
    path.join(
      root,
      "app",
      "api",
      "admin",
      "foods",
      "recommendation-visibility",
      "route.ts"
    ),
    "utf8"
  );
  assert.match(
    visibilityRoute,
    /body\.confirm_replace !== true/,
    "Replacing the live assortment must require explicit confirmation."
  );
  assert.match(
    visibilityRoute,
    /Resolve all unmatched or ambiguous entries/,
    "Unresolved assortment entries must block live replacement."
  );

  console.log(
    "Store assortment recommendation filter QA passed: parsing, exact matching, ambiguity guards, confirmation, and customer filtering are intact."
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
