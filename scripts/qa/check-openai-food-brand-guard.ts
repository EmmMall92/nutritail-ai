import {
  mentionsAtLeastOneAllowedFood,
  mentionsUnallowedGuardedBrand,
  normalizeComposerGuardText,
} from "@/lib/ai/foodBrandGuard";

type GuardCase = {
  name: string;
  text: string;
  foods: Array<{ brand?: string; display_name?: string; formula_name?: string }>;
  expectUnallowedBrand: boolean;
  expectAllowedFoodMention: boolean;
};

const cases: GuardCase[] = [
  {
    name: "allows exact allowed food",
    text: "Πρώτη επιλογή: Royal Canin - Mini Adult. Είναι καλή αφετηρία για μικρό ενήλικο σκύλο.",
    foods: [{ brand: "Royal Canin", display_name: "Mini Adult" }],
    expectUnallowedBrand: false,
    expectAllowedFoodMention: true,
  },
  {
    name: "blocks extra guarded brand",
    text: "Πρώτη επιλογή: Royal Canin - Mini Adult. Εναλλακτικά μπορείς να δεις και Acana.",
    foods: [{ brand: "Royal Canin", display_name: "Mini Adult" }],
    expectUnallowedBrand: true,
    expectAllowedFoodMention: true,
  },
  {
    name: "allows all listed brands in compare style answer",
    text: "Royal Canin - Mini Adult είναι πιο ελεγχόμενη επιλογή, ενώ Acana - Adult Small Breed είναι πιο πλούσια.",
    foods: [
      { brand: "Royal Canin", display_name: "Mini Adult" },
      { brand: "Acana", display_name: "Adult Small Breed" },
    ],
    expectUnallowedBrand: false,
    expectAllowedFoodMention: true,
  },
  {
    name: "does not block general answer with empty shortlist",
    text: "Θέλω πρώτα το ακριβές όνομα της σακούλας ή μια φωτογραφία label πριν συγκρίνω brands.",
    foods: [],
    expectUnallowedBrand: false,
    expectAllowedFoodMention: true,
  },
  {
    name: "normalizes Hill's apostrophe variants",
    text: "Hills - Science Plan Adult είναι μέσα στις επιλογές που βλέπω.",
    foods: [{ brand: "Hill's", display_name: "Science Plan Adult" }],
    expectUnallowedBrand: false,
    expectAllowedFoodMention: true,
  },
  {
    name: "normalizes N&D ampersand variants",
    text: "Farmina N&D - Quinoa Grain Free Neutered Duck Adult Mini είναι η καλύτερη αφετηρία.",
    foods: [
      {
        brand: "Farmina",
        display_name: "N&D Quinoa Grain Free Neutered Duck Adult Mini",
      },
    ],
    expectUnallowedBrand: false,
    expectAllowedFoodMention: true,
  },
  {
    name: "blocks brand-level winner outside shortlist",
    text: "Για αυτό το ζώο θα διάλεγα γενικά Orijen, παρότι η λίστα δείχνει Josera - Sensi Plus Adult.",
    foods: [{ brand: "Josera", display_name: "Sensi Plus Adult" }],
    expectUnallowedBrand: true,
    expectAllowedFoodMention: true,
  },
];

const failures: string[] = [];

function expect(condition: unknown, message: string) {
  if (!condition) failures.push(message);
}

expect(
  normalizeComposerGuardText("Hill's N&D") === "hills n and d",
  "normalizer should align apostrophes and ampersands"
);

for (const item of cases) {
  const unallowedBrand = mentionsUnallowedGuardedBrand(item.text, item.foods);
  const allowedFoodMention = mentionsAtLeastOneAllowedFood(item.text, item.foods);

  expect(
    unallowedBrand === item.expectUnallowedBrand,
    `${item.name}: expected unallowed brand ${item.expectUnallowedBrand}, got ${unallowedBrand}`
  );
  expect(
    allowedFoodMention === item.expectAllowedFoodMention,
    `${item.name}: expected allowed food mention ${item.expectAllowedFoodMention}, got ${allowedFoodMention}`
  );
}

if (failures.length > 0) {
  console.error("OpenAI food brand guard QA failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      checked: cases.length,
      passed: cases.length,
    },
    null,
    2
  )
);
