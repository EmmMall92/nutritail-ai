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
    label: "Purina registered mark and mojibake salmon token",
    input: {
      brand: "Purina Pro Plan",
      display_name:
        "Purina Pro Plan PRO PlanΒ® MEDIUM & LARGE ADULT 7+ Sensitive Skin Ξ£ΞΏΞ»ΞΏΞΌΟΟ‚",
      formula_name:
        "PRO PlanΒ® MEDIUM & LARGE ADULT 7+ Sensitive Skin Ξ£ΞΏΞ»ΞΏΞΌΟΟ‚",
    },
    expected: "PRO Plan® MEDIUM & LARGE ADULT 7+ Sensitive Skin Salmon",
  },
  {
    label: "Purina mojibake chicken token",
    input: {
      brand: "Purina Pro Plan",
      display_name:
        "Purina Pro Plan PRO PlanΒ® SMALL&MINI ADULT LIGHT/STERILISED ΞΞΏΟ„ΟΟ€ΞΏΟ…Ξ»ΞΏ",
      formula_name:
        "PRO PlanΒ® SMALL&MINI ADULT LIGHT/STERILISED ΞΞΏΟ„ΟΟ€ΞΏΟ…Ξ»ΞΏ",
    },
    expected: "PRO Plan® SMALL&MINI ADULT LIGHT/STERILISED Chicken",
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
    label: "Happy Dog repeated Happy title token",
    input: {
      brand: "Happy Dog",
      display_name: "Happy Dog Happy Happy Naturcroq Duck & Rice Sterilised",
      formula_name: "Happy Happy Naturcroq Duck & Rice Sterilised",
    },
    expected: "Naturcroq Duck & Rice Sterilised",
  },
  {
    label: "Josera feeding table title tail",
    input: {
      brand: "Josera",
      display_name:
        "Josera Active Nature Active Nature Weight Activity / day up to 1 hour Activity / day up to 3 hrs",
      formula_name:
        "Active Nature Active Nature Weight Activity / day up to 1 hour Activity / day up to 3 hrs",
    },
    expected: "Active Nature",
  },
  {
    label: "Josera feeding recommendation title tail",
    input: {
      brand: "Josera",
      display_name: "Josera Sensi Plus Sensi Plus Feeding Recommendation Adult 10kg",
      formula_name: "Sensi Plus Sensi Plus Feeding Recommendation Adult 10kg",
    },
    expected: "Sensi Plus",
  },
  {
    label: "Royal Canin analytical panel title tail",
    input: {
      brand: "Royal Canin",
      display_name:
        "Royal Canin Mini Adult Analytical Constituents Protein 27% Fat content 16%",
      formula_name: "Mini Adult Analytical Constituents Protein 27% Fat content 16%",
    },
    expected: "Mini Adult",
  },
  {
    label: "Monge composition panel title tail",
    input: {
      brand: "Monge",
      display_name: "Monge Vetsolution Renal Composition: rice, dried chicken",
      formula_name: "Vetsolution Renal Composition: rice, dried chicken",
    },
    expected: "Vetsolution Renal",
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
