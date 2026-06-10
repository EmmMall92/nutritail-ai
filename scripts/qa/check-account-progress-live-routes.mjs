import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const siteUrl = process.env.NUTRITAIL_QA_SITE_URL || "https://nutritail.ai";
const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH ||
  "reports/account_progress_live_route_smoke_qa.md";

const fakePetId = "11111111-1111-4111-8111-111111111111";

const checks = [
  { path: "/", method: "GET", expected: [200], label: "Homepage" },
  { path: "/login", method: "GET", expected: [200], label: "Login page" },
  {
    path: "/account",
    method: "GET",
    expected: [200, 302, 307],
    label: "Account dashboard",
  },
  {
    path: "/account/chatbot",
    method: "GET",
    expected: [200, 302, 307],
    label: "Account chatbot",
  },
  {
    path: "/account/pets",
    method: "GET",
    expected: [200, 302, 307],
    label: "Account pets",
  },
  {
    path: `/account/pets/${fakePetId}`,
    method: "GET",
    expected: [200, 302, 307, 404],
    label: "Account pet detail",
  },
  {
    path: `/print/pet-report/${fakePetId}`,
    method: "GET",
    expected: [200, 404],
    label: "Printable pet report",
  },
  {
    path: `/print/pet-timeline/${fakePetId}`,
    method: "GET",
    expected: [200, 404],
    label: "Printable pet timeline",
  },
  {
    path: `/api/account/pets/${fakePetId}/progress`,
    method: "GET",
    expected: [405],
    label: "Progress API rejects GET",
  },
  {
    path: `/api/print/pet-report/${fakePetId}`,
    method: "GET",
    expected: [404],
    label: "Print report API handles missing pet",
  },
];

async function checkRoute(check) {
  const url = new URL(check.path, siteUrl).toString();
  const started = Date.now();

  try {
    const response = await fetch(url, {
      method: check.method,
      redirect: "manual",
      headers: {
        "User-Agent": "NutriTail-account-progress-live-route-smoke-qa/1.0",
      },
    });

    return {
      ...check,
      url,
      status: response.status,
      ok: check.expected.includes(response.status),
      duration_ms: Date.now() - started,
      location: response.headers.get("location") ?? "",
      error: "",
    };
  } catch (error) {
    return {
      ...check,
      url,
      status: 0,
      ok: false,
      duration_ms: Date.now() - started,
      location: "",
      error: error instanceof Error ? error.message : "Unknown request error",
    };
  }
}

function renderTable(rows) {
  return [
    "| Route | Method | Status | Result | Time | Notes |",
    "| --- | --- | ---: | --- | ---: | --- |",
    ...rows.map((row) => {
      const notes = row.error || (row.location ? `redirect=${row.location}` : "");
      return `| ${row.path} | ${row.method} | ${row.status || "error"} | ${
        row.ok ? "pass" : "fail"
      } | ${row.duration_ms}ms | ${notes || "-"} |`;
    }),
  ].join("\n");
}

async function main() {
  const rows = [];
  for (const check of checks) {
    rows.push(await checkRoute(check));
  }

  const passed = rows.filter((row) => row.ok).length;
  const failed = rows.length - passed;

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(
    reportPath,
    [
      "# Account Progress Live Route Smoke QA",
      "",
      `Generated: ${new Date().toISOString()}`,
      `Site: ${siteUrl}`,
      "",
      "## Summary",
      "",
      `- Routes checked: ${rows.length}`,
      `- Passed: ${passed}`,
      `- Failed: ${failed}`,
      "",
      "Authenticated account pages may return redirects without a session. Missing fake pet routes may return 404. The progress API should reject GET because progress writes must use POST.",
      "",
      "## Results",
      "",
      renderTable(rows),
    ].join("\n"),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        siteUrl,
        checked: rows.length,
        passed,
        failed,
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
