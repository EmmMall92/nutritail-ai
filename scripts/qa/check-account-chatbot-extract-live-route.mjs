import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const siteUrl = process.env.NUTRITAIL_QA_SITE_URL || "https://nutritail.ai";
const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH ||
  "reports/account_chatbot_extract_live_route_qa.md";
const authCookie = process.env.NUTRITAIL_QA_AUTH_COOKIE?.trim() || "";

const routePath = "/api/account/chatbot/extract-intake";
const sampleMessage =
  "Έχω σκύλο, τη λένε Κύρκη, είναι 6 κιλά, 6 ετών, χαμηλή δραστηριότητα, στειρωμένη. Της αρέσει κοτόπουλο και δεν της αρέσει σολομός.";

function renderTable(rows) {
  return [
    "| Route | Method | Status | Result | Source | Time | Notes |",
    "| --- | --- | ---: | --- | --- | ---: | --- |",
    ...rows.map((row) => {
      const notes = row.error || row.notes || "-";
      return `| ${row.path} | ${row.method} | ${row.status || "error"} | ${
        row.ok ? "pass" : row.skipped ? "skip" : "fail"
      } | ${row.source || "-"} | ${row.duration_ms}ms | ${notes} |`;
    }),
  ].join("\n");
}

function hasExpectedStructuredData(payload) {
  const data = payload?.data;

  return (
    data?.species === "dog" &&
    data?.petName === "Κύρκη" &&
    data?.weightKg === 6 &&
    data?.ageYears === 6 &&
    data?.activityLevel === "low" &&
    data?.neutered === true &&
    Array.isArray(data?.preferredProteins) &&
    data.preferredProteins.includes("chicken") &&
    Array.isArray(data?.excludedIngredients) &&
    data.excludedIngredients.includes("salmon")
  );
}

async function writeReport({
  rows,
  status,
  checked,
  passed,
  failed,
  skipped,
  notes,
}) {
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(
    reportPath,
    [
      "# Account Chatbot Extract Live Route QA",
      "",
      `Generated: ${new Date().toISOString()}`,
      `Site: ${siteUrl}`,
      `Status: ${status}`,
      "",
      "This advisory smoke test verifies the authenticated live route used for OpenAI-backed chatbot intake extraction.",
      "It never writes cookies, tokens, or extracted raw secrets to the report.",
      "",
      "## Summary",
      "",
      `- Routes checked: ${checked}`,
      `- Passed: ${passed}`,
      `- Failed: ${failed}`,
      `- Skipped: ${skipped}`,
      "",
      notes,
      "",
      "## Results",
      "",
      renderTable(rows),
    ].join("\n"),
    "utf8"
  );
}

async function checkRoute() {
  const url = new URL(routePath, siteUrl).toString();
  const started = Date.now();

  if (!authCookie) {
    return {
      path: routePath,
      method: "POST",
      status: 0,
      ok: false,
      skipped: true,
      source: "",
      duration_ms: Date.now() - started,
      notes:
        "Set NUTRITAIL_QA_AUTH_COOKIE to run this against an authenticated live account session.",
      error: "",
    };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      redirect: "manual",
      headers: {
        "Content-Type": "application/json",
        Cookie: authCookie,
        "User-Agent": "NutriTail-account-chatbot-extract-live-route-qa/1.0",
      },
      body: JSON.stringify({
        message: sampleMessage,
        locale: "el",
      }),
    });

    const duration_ms = Date.now() - started;
    const payload = await response.json().catch(() => null);
    const source = typeof payload?.source === "string" ? payload.source : "";

    if (response.status === 401 || response.status === 403) {
      return {
        path: routePath,
        method: "POST",
        status: response.status,
        ok: false,
        skipped: false,
        source,
        duration_ms,
        notes:
          "Authenticated cookie was provided but the live route rejected it; refresh NUTRITAIL_QA_AUTH_COOKIE.",
        error: "",
      };
    }

    const ok = response.status === 200 && hasExpectedStructuredData(payload);

    return {
      path: routePath,
      method: "POST",
      status: response.status,
      ok,
      skipped: false,
      source,
      duration_ms,
      notes: ok
        ? `structured extraction succeeded through ${source || "unknown"} source`
        : `unexpected extraction payload shape; acceptedFields=${payload?.acceptedFields?.join(",") || "-"}`,
      error: "",
    };
  } catch (error) {
    return {
      path: routePath,
      method: "POST",
      status: 0,
      ok: false,
      skipped: false,
      source: "",
      duration_ms: Date.now() - started,
      notes: "",
      error: error instanceof Error ? error.message : "Unknown request error",
    };
  }
}

async function main() {
  const row = await checkRoute();
  const rows = [row];
  const passed = rows.filter((item) => item.ok).length;
  const skipped = rows.filter((item) => item.skipped).length;
  const failed = rows.length - passed - skipped;
  const status = skipped > 0 ? "skipped" : failed === 0 ? "completed" : "failed";

  await writeReport({
    rows,
    status,
    checked: rows.length,
    passed,
    failed,
    skipped,
    notes:
      skipped > 0
        ? "No authenticated cookie was available locally, so this test was skipped safely. Production route availability is still covered by account live-route smoke tests."
        : "The route was called with an authenticated session cookie from the QA environment.",
  });

  console.log(
    JSON.stringify(
      {
        status,
        siteUrl,
        checked: rows.length,
        passed,
        failed,
        skipped,
        report: reportPath,
      },
      null,
      2
    )
  );

  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
