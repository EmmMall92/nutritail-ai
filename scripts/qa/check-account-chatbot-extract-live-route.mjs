import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const siteUrl = process.env.NUTRITAIL_QA_SITE_URL || "https://nutritail.ai";
const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH ||
  "reports/account_chatbot_extract_live_route_qa.md";
const defaultCookieFile = ".qa-secrets/nutritail-auth-cookie.txt";
const fallbackCookieFiles = [".qa-secrets/account-cookie.txt"];
const authCookieFile =
  process.env.NUTRITAIL_QA_AUTH_COOKIE_FILE?.trim() || defaultCookieFile;

const routePath = "/api/account/chatbot/extract-intake";
const sampleMessage =
  "\u0388\u03c7\u03c9 \u03c3\u03ba\u03cd\u03bb\u03bf, \u03c4\u03b7 \u03bb\u03ad\u03bd\u03b5 \u039a\u03cd\u03c1\u03ba\u03b7, \u03b5\u03af\u03bd\u03b1\u03b9 6 \u03ba\u03b9\u03bb\u03ac, 6 \u03b5\u03c4\u03ce\u03bd, \u03c7\u03b1\u03bc\u03b7\u03bb\u03ae \u03b4\u03c1\u03b1\u03c3\u03c4\u03b7\u03c1\u03b9\u03cc\u03c4\u03b7\u03c4\u03b1, \u03c3\u03c4\u03b5\u03b9\u03c1\u03c9\u03bc\u03ad\u03bd\u03b7. \u03a4\u03b7\u03c2 \u03b1\u03c1\u03ad\u03c3\u03b5\u03b9 \u03ba\u03bf\u03c4\u03cc\u03c0\u03bf\u03c5\u03bb\u03bf \u03ba\u03b1\u03b9 \u03b4\u03b5\u03bd \u03c4\u03b7\u03c2 \u03b1\u03c1\u03ad\u03c3\u03b5\u03b9 \u03c3\u03bf\u03bb\u03bf\u03bc\u03cc\u03c2.";

function loadAuthCookie() {
  const fromEnv = process.env.NUTRITAIL_QA_AUTH_COOKIE?.trim() || "";
  if (fromEnv) {
    return {
      value: fromEnv,
      source: "NUTRITAIL_QA_AUTH_COOKIE",
      warning: "",
    };
  }

  const candidateFiles = [
    authCookieFile,
    ...fallbackCookieFiles.filter((file) => file !== authCookieFile),
  ];
  const existingFile = candidateFiles.find((file) => existsSync(file));

  if (!existingFile) {
    return {
      value: "",
      source: "missing",
      warning: `No cookie file found at ${candidateFiles.join(" or ")}.`,
    };
  }

  try {
    const fromFile = readFileSync(existingFile, "utf8").trim();

    return {
      value: fromFile,
      source: fromFile
        ? existingFile === authCookieFile
          ? "NUTRITAIL_QA_AUTH_COOKIE_FILE"
          : "fallback cookie file"
        : "empty NUTRITAIL_QA_AUTH_COOKIE_FILE",
      warning: fromFile
        ? ""
        : `The cookie file ${existingFile} was readable but empty.`,
    };
  } catch (error) {
    return {
      value: "",
      source: "unreadable NUTRITAIL_QA_AUTH_COOKIE_FILE",
      warning: error instanceof Error ? error.message : "Unknown cookie file read error",
    };
  }
}

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
    data?.petName === "\u039a\u03cd\u03c1\u03ba\u03b7" &&
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
  authCookieSource,
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
      `- Auth cookie source: ${authCookieSource}`,
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
  const authCookie = loadAuthCookie();

  if (!authCookie.value) {
    return {
      path: routePath,
      method: "POST",
      status: 0,
      ok: false,
      skipped: true,
      source: "",
      duration_ms: Date.now() - started,
      notes:
        "Set NUTRITAIL_QA_AUTH_COOKIE, set NUTRITAIL_QA_AUTH_COOKIE_FILE, or place a cookie in .qa-secrets/nutritail-auth-cookie.txt to run this against an authenticated live account session.",
      error: authCookie.warning,
      authCookieSource: authCookie.source,
    };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      redirect: "manual",
      headers: {
        "Content-Type": "application/json",
        Cookie: authCookie.value,
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
          "Authenticated cookie was provided but the live route rejected it; refresh the QA account cookie.",
        error: "",
        authCookieSource: authCookie.source,
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
        : `unexpected extraction payload shape; acceptedFields=${
            payload?.acceptedFields?.join(",") || "-"
          }`,
      error: "",
      authCookieSource: authCookie.source,
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
      authCookieSource: authCookie.source,
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
  const authCookieSource = row.authCookieSource || "unknown";

  await writeReport({
    rows,
    status,
    checked: rows.length,
    passed,
    failed,
    skipped,
    authCookieSource,
    notes:
      skipped > 0
        ? "No authenticated cookie was available locally, so this test was skipped safely. To run it, set NUTRITAIL_QA_AUTH_COOKIE directly, set NUTRITAIL_QA_AUTH_COOKIE_FILE, or place the Cookie header in .qa-secrets/nutritail-auth-cookie.txt. Do not commit or print the cookie."
        : `The route was called with an authenticated session cookie from ${authCookieSource}. The cookie value was not written to this report.`,
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
        auth_cookie_source: authCookieSource,
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
