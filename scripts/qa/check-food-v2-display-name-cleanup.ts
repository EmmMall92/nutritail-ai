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
    expected: "PRO Plan® MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός",
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
    expected: "PRO Plan® SMALL&MINI ADULT LIGHT/STERILISED Κοτόπουλο",
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
    label: "Ambrosia Greek retailer SEO title becomes concise formula",
    input: {
      brand: "Ambrosia",
      display_name:
        "Ambrosia Ολιστική Τροφή Για Ενήλικους Σκύλους, Όλων Των Φυλών, Με Σαρδέλα Και Τόνο",
      formula_name:
        "Ολιστική Τροφή Για Ενήλικους Σκύλους, Όλων Των Φυλών, Με Σαρδέλα Και Τόνο",
    },
    expected: "All Breeds Adult Sardine & Tuna",
  },
  {
    label: "Ambrosia grain-free Greek retailer SEO title becomes concise formula",
    input: {
      brand: "Ambrosia",
      display_name:
        "Ambrosia Ολιστική τροφή για κουτάβια όλων των φυλών χωρίς σιτηρά, με σαρδέλα και ρέγγα",
      formula_name:
        "Ολιστική τροφή για κουτάβια όλων των φυλών χωρίς σιτηρά, με σαρδέλα και ρέγγα",
    },
    expected: "Grain Free All Breeds Puppy Sardine & Herring",
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
    label: "Clean Greek Ambrosia retailer SEO description title",
    input: {
      brand: "Ambrosia",
      display_name:
        "Ambrosia Ολιστική Τροφή Για Ενήλικους Σκύλους, Όλων Των Φυλών, Με Σαρδέλα Και Τόνο",
      formula_name:
        "Ολιστική Τροφή Για Ενήλικους Σκύλους, Όλων Των Φυλών, Με Σαρδέλα Και Τόνο",
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
  {
    label: "English complete dry food retailer SEO title",
    input: {
      brand: "Example Brand",
      display_name:
        "Example Brand Complete dry food for adult dogs of all breeds with chicken and rice",
      formula_name:
        "Complete dry food for adult dogs of all breeds with chicken and rice",
    },
  },
  {
    label: "Concise English official-style dry formula title",
    input: {
      brand: "Example Brand",
      display_name: "Example Brand Adult Chicken & Rice",
      formula_name: "Adult Chicken & Rice",
    },
    expectedDescriptive: false,
  },
] as const;

function legacyGreekMojibake(value: string) {
  return new TextDecoder("iso-8859-7").decode(new TextEncoder().encode(value));
}

function hasLegacyGreekMojibake(value: string) {
  return /(?:Ξ[\u0080-\u00ff\u0370-\u03ff]|Ο[\u0080-\u00ff]|[Γγ][\u0080-\u00ff]|[Ββ][®€]|β€)/u.test(value);
}

const customerFoodNameCases = [
  {
    label: "Customer Purina UTF-8 Latin mojibake salmon title is readable",
    input: {
      brand: "Purina Pro Plan",
      display_name: "PRO Plan® MEDIUM ADULT Sensitive Skin Î£Î¿Î»Î¿Î¼ÏÏ",
    },
    expectedDisplay: "MEDIUM ADULT Sensitive Skin Σολομός",
    expectedName: "Purina Pro Plan - MEDIUM ADULT Sensitive Skin Σολομός",
  },
  {
    label: "Customer Happy Dog UTF-8 Latin mojibake salmon rice title is readable",
    input: {
      brand: "Happy Dog",
      display_name: "Happy Dog Naturcroq Î£Î¿Î»Î¿Î¼ÏÏ & Î¡ÏÎ¶Î¹",
    },
    expectedDisplay: "Naturcroq Σολομός & Ρύζι",
    expectedName: "Happy Dog - Naturcroq Σολομός & Ρύζι",
  },
  {
    label: "Customer Purina partially repaired salmon title is readable",
    input: {
      brand: "Purina Pro Plan",
      display_name:
        "PRO PlanΒ® MEDIUM & LARGE ADULT 7+ Sensitive Skin Ξ£ΞΏΞ»ΞΏΞΌΟΟ‚",
    },
    expectedDisplay: "MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός",
    expectedName:
      "Purina Pro Plan - MEDIUM & LARGE ADULT 7+ Sensitive Skin Σολομός",
  },
  {
    label: "Customer Purina partially repaired chicken title is readable",
    input: {
      brand: "Purina Pro Plan",
      display_name:
        "PRO PlanΒ® MEDIUM & LARGE ADULT Age Defence 7+ ΞΞΏΟ„ΟΟ€ΞΏΟ…Ξ»ΞΏ",
    },
    expectedDisplay: "MEDIUM & LARGE ADULT Age Defence 7+ Κοτόπουλο",
    expectedName:
      "Purina Pro Plan - MEDIUM & LARGE ADULT Age Defence 7+ Κοτόπουλο",
  },
  {
    label: "Customer Happy Dog partially repaired salmon rice title is readable",
    input: {
      brand: "Happy Dog",
      display_name: "Happy Dog Naturcroq Ξ£ΞΏΞ»ΞΏΞΌΟΟ‚ & Ξ΅ΟΞ¶ΞΉ",
    },
    expectedDisplay: "Naturcroq Σολομός & Ρύζι",
    expectedName: "Happy Dog - Naturcroq Σολομός & Ρύζι",
  },
  {
    label: "Customer Purina chicken token is repaired from legacy Greek mojibake",
    input: {
      brand: "Purina Pro Plan",
      display_name: `PRO Plan® SMALL&MINI ADULT Age Defence 9+ ${legacyGreekMojibake("Κοτόπουλο")}`,
    },
    expectedDisplay: "SMALL&MINI ADULT Age Defence 9+ Κοτόπουλο",
    expectedName:
      "Purina Pro Plan - SMALL&MINI ADULT Age Defence 9+ Κοτόπουλο",
  },
  {
    label: "Customer Purina salmon token is repaired from legacy Greek mojibake",
    input: {
      brand: "Purina Pro Plan",
      display_name: `PRO Plan® MEDIUM ADULT Sensitive Skin ${legacyGreekMojibake("Σολομός")}`,
    },
    expectedDisplay: "MEDIUM ADULT Sensitive Skin Σολομός",
    expectedName: "Purina Pro Plan - MEDIUM ADULT Sensitive Skin Σολομός",
  },
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
    label: "Customer visible Purina Greek salmon token is fully readable",
    input: {
      brand: "Purina Pro Plan",
      display_name: "MEDIUM ADULT Sensitive Skin Ξ£ΞΏΞ»ΞΏΞΌΟΟ‚",
    },
    expectedDisplay: "MEDIUM ADULT Sensitive Skin Σολομός",
    expectedName: "Purina Pro Plan - MEDIUM ADULT Sensitive Skin Σολομός",
  },
  {
    label: "Customer visible Purina Greek lamb token is fully readable",
    input: {
      brand: "Purina Pro Plan",
      display_name: "MEDIUM ADULT Sensitive Digestion Ξ‘ΟΞ½Ξ―",
    },
    expectedDisplay: "MEDIUM ADULT Sensitive Digestion Αρνί",
    expectedName: "Purina Pro Plan - MEDIUM ADULT Sensitive Digestion Αρνί",
  },
  {
    label: "Customer Purina registered mark mojibake is removed from visible name",
    input: {
      brand: "Purina Pro Plan",
      display_name:
        "PRO PlanΞ’Β® MEDIUM & LARGE ADULT 7+ Sensitive Skin ΞΒ£ΞΞΞΒ»ΞΞΞΞΞΒΞβ€",
    },
    expectedDisplay: "MEDIUM & LARGE ADULT 7+ Sensitive Skin Salmon",
    expectedName:
      "Purina Pro Plan - MEDIUM & LARGE ADULT 7+ Sensitive Skin Salmon",
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
  {
    label: "Customer Happy Dog duplicated happy token is removed",
    input: {
      brand: "Happy Dog",
      display_name: "Happy Dog Happy Happy Naturcroq Duck & Rice Sterilised",
    },
    expectedDisplay: "Naturcroq Duck & Rice Sterilised",
    expectedName: "Happy Dog - Naturcroq Duck & Rice Sterilised",
  },
  {
    label: "Customer Ambrosia Greek retailer SEO title is simplified",
    input: {
      brand: "Ambrosia",
      display_name:
        "Ambrosia Ολιστική Τροφή Για Ενήλικους Σκύλους, Όλων Των Φυλών, Με Σαρδέλα Και Τόνο",
      formula_name:
        "Ολιστική Τροφή Για Ενήλικους Σκύλους, Όλων Των Φυλών, Με Σαρδέλα Και Τόνο",
    },
    expectedDisplay: "All Breeds Adult Sardine & Tuna",
    expectedName: "Ambrosia - All Breeds Adult Sardine & Tuna",
  },
  {
    label: "Customer Royal Canin repeated size token is cleaned",
    input: {
      brand: "Royal Canin",
      display_name: "Royal Canin Mini Mini Adult",
    },
    expectedDisplay: "Mini Adult",
    expectedName: "Royal Canin - Mini Adult",
  },
  {
    label: "Customer Monge repeated veterinary line token is cleaned",
    input: {
      brand: "Monge",
      display_name: "Monge Vetsolution Vetsolution Urinary Oxalate",
    },
    expectedDisplay: "Vetsolution Urinary Oxalate",
    expectedName: "Monge - Vetsolution Urinary Oxalate",
  },
  {
    label: "Customer Monge VetSolution brand does not repeat veterinary line token",
    input: {
      brand: "Monge VetSolution",
      display_name: "VetSolution Renal And Oxalate",
    },
    expectedDisplay: "Renal And Oxalate",
    expectedName: "Monge VetSolution - Renal And Oxalate",
  },
  {
    label: "Customer AATU repeated life-stage token is cleaned",
    input: {
      brand: "AATU",
      display_name: "AATU Adult Adult Grain Free 80/20 Shellfish",
    },
    expectedDisplay: "Adult Grain Free 80/20 Shellfish",
    expectedName: "AATU - Adult Grain Free 80/20 Shellfish",
  },
  {
    label: "Customer possessive brand tail is joined",
    input: {
      brand: "Nature",
      display_name: ",'s Protection Dark Coat Poultry Adult All Breeds",
    },
    expectedDisplay: "Nature's Protection Dark Coat Poultry Adult All Breeds",
    expectedName: "Nature's Protection Dark Coat Poultry Adult All Breeds",
  },
  {
    label: "Customer pack size suffix is removed",
    input: {
      brand: "Nature",
      display_name: "Nature's Protection Dark Coat Poultry Adult All Breeds 1.5kg",
    },
    expectedDisplay: "Nature's Protection Dark Coat Poultry Adult All Breeds",
    expectedName: "Nature's Protection Dark Coat Poultry Adult All Breeds",
  },
  {
    label: "Customer multipack promo title is simplified",
    input: {
      brand: "Wolf of Wilderness",
      display_name: "2 x 1kg Wolf of Wilderness Appalachian Valley Small Breed - Try Now!",
    },
    expectedDisplay: "Appalachian Valley Small Breed",
    expectedName: "Wolf of Wilderness - Appalachian Valley Small Breed",
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
  if (hasLegacyGreekMojibake(actualDisplay)) {
    failures.push(
      `${testCase.label}: customer display still contains Greek mojibake "${actualDisplay}"`
    );
  }
  if (hasLegacyGreekMojibake(actualName)) {
    failures.push(
      `${testCase.label}: customer name still contains Greek mojibake "${actualName}"`
    );
  }
}

if (failures.length > 0) {
  console.error("Food V2 display-name cleanup QA failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Food V2 display-name cleanup QA passed.");
