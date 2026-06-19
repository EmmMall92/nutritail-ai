import {
  isLikelyDescriptiveFoodTitle,
  normalizeBrandlessFoodDisplayName,
  normalizeBrandlessFormulaName,
} from "@/lib/food-v2/canonicalFood";
import {
  customerFoodDisplayName,
  customerFoodName,
} from "@/lib/food-v2/customerFoodName";

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
    label: "Schesir repeated leading token after brand cleanup",
    input: {
      brand: "Schesir",
      display_name: "Schesir Schesir Adult Medium Chicken",
      formula_name: "Schesir Adult Medium Chicken",
    },
    expected: "Adult Medium Chicken",
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
    label: "Royal Canin Veterinary Diet alias prefix",
    input: {
      brand: "Royal Canin Veterinary Diet",
      display_name: "Royal Canin Veterinary Canine Gastrointestinal Low Fat",
      formula_name: "Royal Canin Veterinary Canine Gastrointestinal Low Fat",
    },
    expected: "Canine Gastrointestinal Low Fat",
  },
  {
    label: "Royal Canin Vet Diet alias prefix",
    input: {
      brand: "Royal Canin Veterinary Diet",
      display_name: "Royal Canin Vet Diet Dog Urinary UC Low P",
      formula_name: "Royal Canin Vet Diet Dog Urinary UC Low P",
    },
    expected: "Urinary UC Low P",
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
  {
    label: "Royal Canin pack size suffix removed",
    input: {
      brand: "Royal Canin",
      display_name: "Royal Canin Shih Tzu Adult 1.5kg",
      formula_name: "Shih Tzu Adult 1.5kg",
    },
    expected: "Shih Tzu Adult",
  },
  {
    label: "Royal Canin senior plus age is preserved while grams are removed",
    input: {
      brand: "Royal Canin",
      display_name: "Royal Canin Sterilised +7 400g",
      formula_name: "Sterilised +7 400g",
    },
    expected: "Sterilised +7",
  },
  {
    label: "Royal Canin age plus formula remains intact",
    input: {
      brand: "Royal Canin",
      display_name: "Royal Canin Mini Adult 8+",
      formula_name: "Mini Adult 8+",
    },
    expected: "Mini Adult 8+",
  },
  {
    label: "Multipack prefix and try-now promo are removed",
    input: {
      brand: "Wolf of Wilderness",
      display_name:
        "2 x 1kg Wolf of Wilderness Appalachian Valley Small Breed - Try Now!",
      formula_name:
        "2 x 1kg Wolf of Wilderness Appalachian Valley Small Breed - Try Now!",
    },
    expected: "Appalachian Valley Small Breed",
  },
  {
    label: "Greek gift pack promo is removed",
    input: {
      brand: "Ecopet Natural",
      display_name: "Ecopet Natural Adult Medium 12kg + 2kg ΔΩΡΟ",
      formula_name: "Adult Medium 12kg + 2kg ΔΩΡΟ",
    },
    expected: "Adult Medium",
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

const descriptiveTitleCases = [
  {
    label: "Ambrosia retailer SEO description title",
    input: {
      brand: "Ambrosia",
      display_name:
        "Ambrosia ολιστική τροφή για ενήλικους σκύλους όλων των φυλών με κοτόπουλο και λαχανικά grain free",
      formula_name:
        "ολιστική τροφή για ενήλικους σκύλους όλων των φυλών με κοτόπουλο και λαχανικά grain free",
    },
  },
  {
    label: "Concise Ambrosia official-style formula title",
    input: {
      brand: "Ambrosia",
      display_name:
        "Ambrosia Mediterranean Diet Grain Free Adult Fresh Chicken & Vegetables",
      formula_name: "Mediterranean Diet Grain Free Adult Fresh Chicken & Vegetables",
    },
    expectedDescriptive: false,
  },
] as const;

const customerFoodNameCases = [
  {
    label: "Purina Pro Plan customer label removes repeated line name",
    input: {
      brand: "Purina Pro Plan",
      display_name: "PRO Plan® MEDIUM ADULT Sensitive Skin Salmon",
    },
    expectedDisplay: "MEDIUM ADULT Sensitive Skin Salmon",
    expectedName: "Purina Pro Plan - MEDIUM ADULT Sensitive Skin Salmon",
  },
  {
    label: "Purina veterinary customer label removes repeated Pro Plan prefix",
    input: {
      brand: "Purina Pro Plan Veterinary Diets",
      display_name: "PRO Plan® VETERINARY DIETS CANINE OM OBESITY MANAGEMENT",
    },
    expectedDisplay: "CANINE OM OBESITY MANAGEMENT",
    expectedName:
      "Purina Pro Plan Veterinary Diets - CANINE OM OBESITY MANAGEMENT",
  },
  {
    label: "Regular brand and display name stays readable",
    input: {
      brand: "Happy Dog",
      display_name: "Naturcroq Duck & Rice Sterilised",
    },
    expectedDisplay: "Naturcroq Duck & Rice Sterilised",
    expectedName: "Happy Dog - Naturcroq Duck & Rice Sterilised",
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

for (const testCase of descriptiveTitleCases) {
  const actual = isLikelyDescriptiveFoodTitle(testCase.input);
  const expected =
    "expectedDescriptive" in testCase ? testCase.expectedDescriptive : true;
  if (actual !== expected) {
    failures.push(
      `${testCase.label}: expected descriptive=${expected}, got ${actual}`
    );
  }
}

for (const testCase of customerFoodNameCases) {
  const actualDisplay = customerFoodDisplayName(testCase.input);
  const actualName = customerFoodName(testCase.input);
  if (actualDisplay !== testCase.expectedDisplay) {
    failures.push(
      `${testCase.label}: expected customer display "${testCase.expectedDisplay}", got "${actualDisplay}"`
    );
  }
  if (actualName !== testCase.expectedName) {
    failures.push(
      `${testCase.label}: expected customer name "${testCase.expectedName}", got "${actualName}"`
    );
  }
}

if (failures.length > 0) {
  console.error("Food V2 display-name cleanup QA failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Food V2 display-name cleanup QA passed.");
