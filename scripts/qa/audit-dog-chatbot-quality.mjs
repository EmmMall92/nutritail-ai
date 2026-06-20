import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const inputPath = process.env.NUTRITAIL_QA_DOG_REPORT_PATH || "reports/dog_chatbot_200_live_cases.md";
const outputPath =
  process.env.NUTRITAIL_QA_DOG_QUALITY_REPORT_PATH ||
  "reports/dog_chatbot_quality_audit.md";
const maxReviewItems =
  process.env.NUTRITAIL_QA_DOG_QUALITY_MAX_REVIEW === undefined
    ? null
    : Number(process.env.NUTRITAIL_QA_DOG_QUALITY_MAX_REVIEW);

const GROUPS = [
  {
    label: "Large breed puppy and growth",
    ids: [4, 32, 33, 38, 105, 106, 107, 108, 178],
    positive: ["puppy", "junior", "large breed", "med/maxi", "maxi", "giant", "youngstar", "kids"],
    negative: ["adult", "senior", "mature", "light", "sterilised", "renal", "urinary"],
    top3Positive: true,
    note: "Growth cases should surface puppy/junior formulas, and large/giant cases should avoid adult-only positioning.",
  },
  {
    label: "Weight control and sterilised",
    ids: [2, 5, 41, 45, 97, 112, 116, 117, 119, 194],
    positive: ["light", "weight", "sterilised", "sterilized", "neutered", "satiety", "obesity"],
    negative: ["active", "performance", "high energy", "sporting", "trail 4300", "puppy"],
    note: "Sterilised or weight-prone cases should avoid active/high-energy first picks.",
  },
  {
    label: "High activity and working dogs",
    ids: [9, 22, 24, 42, 43, 44, 94, 102, 109, 110, 111, 113, 114, 115, 192, 193, 195],
    positive: ["active", "performance", "energy", "sport", "sporting", "trail", "working", "profi", "high energy"],
    negative: ["light", "sterilised", "sterilized", "neutered", "renal", "urinary", "satiety", "obesity"],
    top3Positive: true,
    note: "Active dogs should not start with diet, renal, urinary, or low-energy formulas.",
  },
  {
    label: "Renal",
    ids: [14, 56, 154, 155, 156],
    positive: ["renal", "kidney"],
    negative: ["urinary struvite", "active", "performance", "high energy", "puppy"],
    top3Positive: true,
    note: "Renal cases should surface renal/kidney-positioned formulas first.",
  },
  {
    label: "Urinary",
    ids: [15, 90, 151, 152, 153],
    positive: ["urinary", "struvite", "oxalate", "u/c"],
    negative: ["active", "performance", "high energy", "puppy"],
    top3Positive: true,
    note: "Urinary cases should surface urinary-positioned formulas and avoid generic active food.",
  },
  {
    label: "Senior and mobility",
    ids: [6, 7, 51, 52, 53, 54, 55, 57, 58, 59, 60, 161, 162, 163, 164, 165, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190],
    positive: ["senior", "mature", "ageing", "aging", "joint", "mobility", "7+", "8+", "9+", "12+"],
    negative: ["puppy", "junior", "high energy"],
    top3Positive: true,
    note: "Senior/mobility cases should surface senior, ageing, joint, or mobility-aware options.",
  },
  {
    label: "Allergy and skin",
    ids: [10, 11, 19, 20, 29, 30, 99, 103, 125, 126, 128, 129, 136, 141, 142, 143, 144, 145, 146, 147],
    positive: ["hypo", "hydro", "derm", "sensitive", "salmon", "fish", "monoprotein", "insect", "duck", "lamb"],
    negative: [],
    note: "Allergy/skin cases should surface allergy-aware, hydrolysed, sensitive, or clear protein-positioned options.",
  },
  {
    label: "Sensitive digestion and GI",
    ids: [8, 12, 18, 25, 35, 40, 61, 104, 121, 122, 123, 131, 132, 133, 134, 135],
    positive: ["gastro", "intestinal", "digestion", "sensitive", "hypo", "hydro"],
    negative: ["active", "performance", "high energy"],
    note: "GI cases should surface gastrointestinal, sensitive digestion, or hydrolysed-style options first.",
  },
];

const CASE_SPECIFIC_ACCEPTABLE_TERMS = {
  35: ["duck & potato", "junior", "puppy", "kids", "youngstar"],
  40: ["duck & potato", "junior", "puppy", "kids", "youngstar"],
};

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function splitMarkdownRow(line) {
  const cells = [];
  let current = "";
  let escaped = false;

  for (const char of line.trim()) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === "|") {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current.trim());
  return cells.filter((cell, index, all) => !(index === 0 || index === all.length - 1) || cell);
}

function parseRows(markdown) {
  return markdown
    .split(/\r?\n/u)
    .filter((line) => /^\|\s*\d+\s*\|/u.test(line))
    .map((line) => {
      const cells = splitMarkdownRow(line);
      const id = Number(cells[0]);
      const foods = String(cells[2] ?? "")
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean);
      return {
        id,
        status: cells[1] ?? "",
        foods,
        notes: cells[3] ?? "",
        text: normalize(foods.join(" ")),
        firstText: normalize(foods[0] ?? ""),
      };
    })
    .filter((row) => Number.isFinite(row.id));
}

function hasAny(text, terms) {
  return terms.some((term) => text.includes(normalize(term)));
}

function topFoodTexts(row, limit = 3) {
  return row.foods.slice(0, limit).map((food, index) => ({
    index: index + 1,
    text: normalize(food),
  }));
}

function auditGroup(group, rowsById) {
  const covered = group.ids.map((id) => rowsById.get(id)).filter(Boolean);
  const missing = group.ids.filter((id) => !rowsById.has(id));
  const review = [];

  for (const row of covered) {
    const caseSpecificTerms = CASE_SPECIFIC_ACCEPTABLE_TERMS[row.id] ?? [];
    const positiveTerms = [...group.positive, ...caseSpecificTerms];
    const positiveHit = positiveTerms.length === 0 || hasAny(row.text, positiveTerms);
    const negativeFirst = group.negative.length > 0 && hasAny(row.firstText, group.negative);
    const nonMatchingTopFoods = group.top3Positive
      ? topFoodTexts(row).filter((food) => !hasAny(food.text, positiveTerms))
      : [];

    if (!positiveHit || negativeFirst || nonMatchingTopFoods.length > 0) {
      review.push({
        id: row.id,
        reason: [
          !positiveHit ? "no expected positioning in visible foods" : null,
          negativeFirst ? "first food has conflicting positioning" : null,
          nonMatchingTopFoods.length > 0
            ? `top foods lack expected positioning: #${nonMatchingTopFoods
                .map((food) => food.index)
                .join(", #")}`
            : null,
        ].filter(Boolean).join("; "),
        foods: row.foods,
      });
    }
  }

  return {
    ...group,
    covered: covered.length,
    missing,
    review,
  };
}

function renderAudit({ source, generated, rows, groupResults }) {
  const totalReview = groupResults.reduce((sum, group) => sum + group.review.length, 0);
  const totalMissing = groupResults.reduce((sum, group) => sum + group.missing.length, 0);
  const lines = [
    "# Dog Chatbot Quality Audit",
    "",
    `Generated: ${generated}`,
    `Source report: ${source}`,
    "",
    "## Summary",
    "",
    `- Parsed cases: ${rows.length}`,
    `- Groups checked: ${groupResults.length}`,
    `- Quality review items: ${totalReview}`,
    `- Missing expected group rows: ${totalMissing}`,
    "",
    "This is a qualitative audit over the generated live-case report. It does not replace the endpoint-level guards; it highlights cases that technically pass but may not be the best customer-facing recommendation.",
    "",
    "## Group Results",
    "",
  ];

  for (const group of groupResults) {
    lines.push(`### ${group.label}`);
    lines.push("");
    lines.push(group.note);
    lines.push("");
    lines.push(`- Covered expected cases: ${group.covered}/${group.ids.length}`);
    lines.push(`- Review items: ${group.review.length}`);
    if (group.missing.length > 0) {
      lines.push(`- Missing ids in source report: ${group.missing.join(", ")}`);
    }
    lines.push("");

    if (group.review.length === 0) {
      lines.push("No qualitative review items found for this group.");
      lines.push("");
      continue;
    }

    lines.push("| Case | Reason | Visible top foods |");
    lines.push("| --- | --- | --- |");
    for (const item of group.review) {
      lines.push(
        `| ${item.id} | ${item.reason.replace(/\|/g, "\\|")} | ${item.foods.join("; ").replace(/\|/g, "\\|")} |`
      );
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const markdown = await readFile(inputPath, "utf8");
  const rows = parseRows(markdown);

  if (rows.length === 0) {
    throw new Error(`No case rows parsed from ${inputPath}`);
  }

  const rowsById = new Map(rows.map((row) => [row.id, row]));
  const groupResults = GROUPS.map((group) => auditGroup(group, rowsById));
  const report = renderAudit({
    source: inputPath,
    generated: new Date().toISOString(),
    rows,
    groupResults,
  });

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, report, "utf8");

  console.log(
    JSON.stringify(
      {
        source: inputPath,
        report: outputPath,
        parsedCases: rows.length,
        reviewItems: groupResults.reduce((sum, group) => sum + group.review.length, 0),
        maxReviewItems,
      },
      null,
      2
    )
  );

  const reviewItems = groupResults.reduce((sum, group) => sum + group.review.length, 0);
  if (
    maxReviewItems !== null &&
    (!Number.isFinite(maxReviewItems) || reviewItems > maxReviewItems)
  ) {
    throw new Error(
      `Dog chatbot quality audit exceeded review budget: ${reviewItems}/${maxReviewItems}. See ${outputPath}.`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
