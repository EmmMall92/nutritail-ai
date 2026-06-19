import {
  normalizeBrandlessFoodDisplayName,
  normalizeBrandlessFormulaName,
} from "@/lib/food-v2/canonicalFood";

const cases = [
  {
    label: "Josera duplicated brand prefix",
    input: {
      brand: "Josera",
      display_name: "Josera Josera Active Nature",
      formula_name: "Active Nature",
    },
    expected: "Active Nature",
  },
  {
    label: "N&D duplicated brand prefix",
    input: {
      brand: "N&D",
      display_name: "N&D N&D Quinoa Grain Free Duck Neutered Adult Mini",
      formula_name: "Quinoa Grain Free Duck Neutered Adult Mini",
    },
    expected: "Quinoa Grain Free Duck Neutered Adult Mini",
  },
  {
    label: "Monge repeated Vetsolution term",
    input: {
      brand: "Monge",
      display_name: "Monge Vetsolution Vetsolution Urinary Oxalate",
      formula_name: "Vetsolution Urinary Oxalate",
    },
    expected: "Vetsolution Urinary Oxalate",
  },
  {
    label: "AATU repeated adult term",
    input: {
      brand: "AATU",
      display_name: "Aatu Adult Adult Grain Free 80/20 με Oστρακόδερμα",
      formula_name: "Adult Adult Grain Free 80/20 με Oστρακόδερμα",
    },
    expected: "Adult Grain Free 80/20 Με Oστρακόδερμα",
  },
  {
    label: "Royal Canin repeated size term",
    input: {
      brand: "Royal Canin",
      display_name: "Royal Canin Mini Mini Adult",
      formula_name: "Mini Mini Adult",
    },
    expected: "Mini Adult",
  },
  {
    label: "Happy Dog repeated sterilised term",
    input: {
      brand: "Happy Dog",
      display_name: "Happy Dog Naturcroq Duck & Rice Sterilised Sterilised",
      formula_name: "Naturcroq Duck & Rice Sterilised Sterilised",
    },
    expected: "Naturcroq Duck & Rice Sterilised",
  },
  {
    label: "Formula-only display remains unchanged",
    input: {
      brand: "Royal Canin",
      display_name: "Mini Adult",
      formula_name: "Mini Adult",
    },
    expected: "Mini Adult",
  },
] as const;

const failures = cases.flatMap((testCase) => {
  const actual = normalizeBrandlessFoodDisplayName(testCase.input);
  if (actual !== testCase.expected) {
    return [`${testCase.label}: expected "${testCase.expected}", got "${actual}"`];
  }
  return [];
});

const brandlessFormulaCases = [
  {
    label: "Josera formula brand prefix",
    input: {
      brand: "Josera",
      formula_name: "Josera Active Nature",
    },
    expected: "Active Nature",
  },
  {
    label: "Royal Canin formula without brand",
    input: {
      brand: "Royal Canin",
      formula_name: "Mini Adult",
    },
    expected: "Mini Adult",
  },
] as const;

for (const testCase of brandlessFormulaCases) {
  const actual = normalizeBrandlessFormulaName(testCase.input);
  if (actual !== testCase.expected) {
    failures.push(
      `${testCase.label}: expected "${testCase.expected}", got "${actual}"`
    );
  }
}

if (failures.length > 0) {
  console.error("Food V2 display-name cleanup QA failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Food V2 display-name cleanup QA passed.");
