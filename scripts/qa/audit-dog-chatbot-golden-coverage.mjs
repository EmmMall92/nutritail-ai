import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const liveCasesPath = "scripts/qa/run-dog-chatbot-live-cases.ts";
const edgeFixturePath = "data/evals/chatbot-dog-edge-cases-101-200.json";
const reportPath = "reports/dog_chatbot_golden_coverage_audit.md";

const damagedTextPattern =
  /(?:\?{3,}|Ξ|Ο[€‡ƒ„‰…]|Β®|�)/u;

function extractLiveCaseIds(source) {
  return [...source.matchAll(/\{\s*id:\s*(\d+),\s*message:\s*"([^"]*)"/gu)].map(
    (match) => ({
      id: Number(match[1]),
      prompt: match[2],
    })
  );
}

function summarizeIds(cases, from, to) {
  const ids = cases.map((item) => item.id);
  const uniqueIds = new Set(ids);
  const missing = Array.from({ length: to - from + 1 }, (_, index) => index + from).filter(
    (id) => !uniqueIds.has(id)
  );
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

  return {
    count: cases.length,
    unique: uniqueIds.size,
    missing,
    duplicates: [...new Set(duplicates)],
  };
}

function damagedCases(cases) {
  return cases
    .filter((item) => damagedTextPattern.test(item.prompt ?? ""))
    .map((item) => item.id);
}

async function main() {
  const liveSource = await readFile(liveCasesPath, "utf8");
  const liveCases = extractLiveCaseIds(liveSource);
  const liveSummary = summarizeIds(liveCases, 1, 200);

  const edgeFixture = JSON.parse(await readFile(edgeFixturePath, "utf8"));
  const edgeCases = (edgeFixture.cases ?? []).map((item) => ({
    id: Number(String(item.id ?? "").match(/^dog-(\d+)/u)?.[1]),
    prompt: item.prompt,
  }));
  const edgeSummary = summarizeIds(edgeCases, 101, 200);

  const liveDamaged = damagedCases(liveCases);
  const edgeDamaged = damagedCases(edgeCases);
  const blockingProblems = [
    liveSummary.count !== 200
      ? `Live runner should contain 200 cases, found ${liveSummary.count}.`
      : null,
    liveSummary.missing.length > 0
      ? `Live runner missing ids: ${liveSummary.missing.join(", ")}.`
      : null,
    liveSummary.duplicates.length > 0
      ? `Live runner duplicate ids: ${liveSummary.duplicates.join(", ")}.`
      : null,
    edgeSummary.count !== 100
      ? `Edge fixture should contain 100 cases, found ${edgeSummary.count}.`
      : null,
    edgeSummary.missing.length > 0
      ? `Edge fixture missing ids: ${edgeSummary.missing.join(", ")}.`
      : null,
    edgeSummary.duplicates.length > 0
      ? `Edge fixture duplicate ids: ${edgeSummary.duplicates.join(", ")}.`
      : null,
  ].filter(Boolean);

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(
    reportPath,
    [
      "# Dog Chatbot Golden Coverage Audit",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Summary",
      "",
      `- Live runner cases: ${liveSummary.count}`,
      `- Live runner unique ids: ${liveSummary.unique}`,
      `- External 101-200 fixture cases: ${edgeSummary.count}`,
      `- External 101-200 fixture unique ids: ${edgeSummary.unique}`,
      `- Live runner damaged prompts: ${liveDamaged.length}`,
      `- External fixture damaged prompts: ${edgeDamaged.length}`,
      `- Blocking structural problems: ${blockingProblems.length}`,
      "",
      "## Damaged Prompt Cleanup",
      "",
      liveDamaged.length > 0
        ? `- Live runner ids needing prompt cleanup: ${liveDamaged.join(", ")}`
        : "- Live runner prompts look clean.",
      edgeDamaged.length > 0
        ? `- External fixture ids needing prompt cleanup: ${edgeDamaged.join(", ")}`
        : "- External fixture prompts look clean.",
      "",
      "## Blocking Problems",
      "",
      blockingProblems.length > 0
        ? blockingProblems.map((item) => `- ${item}`).join("\n")
        : "- none",
      "",
      "## Next Step",
      "",
      liveDamaged.length > 0 || edgeDamaged.length > 0
        ? "Replace damaged prompts with clean Greek source text, then promote this audit from warning-style coverage to a strict golden-suite gate."
        : "Promote the cleaned 200-case set into a strict golden-suite gate and start tracking recommendation regressions by scenario.",
      "",
    ].join("\n"),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        liveCases: liveSummary.count,
        edgeCases: edgeSummary.count,
        liveDamagedPrompts: liveDamaged.length,
        edgeDamagedPrompts: edgeDamaged.length,
        blockingProblems: blockingProblems.length,
        report: reportPath,
      },
      null,
      2
    )
  );

  if (blockingProblems.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
