import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const siteUrl = process.env.NUTRITAIL_QA_SITE_URL || "https://nutritail.ai";
const reportPath = "reports/food_v2_live_route_smoke_qa.md";

const checks = [
  { path: "/", expected: [200], label: "Homepage" },
  { path: "/admin/foods", expected: [200, 302, 307], label: "Admin foods page" },
  { path: "/admin/foods/v2-preview", expected: [200, 302, 307], label: "Food V2 preview page" },
  { path: "/admin/foods/v2-post-import-qa", expected: [200, 302, 307], label: "Food V2 post-import QA page" },
  {
    path: "/admin/foods/v2-recommendation-visibility",
    expected: [200, 302, 307],
    label: "Food V2 recommendation visibility page",
  },
  {
    path: "/admin/validation",
    expected: [200, 302, 307],
    label: "Admin validation and AI policy page",
  },
  {
    path: "/api/admin/foods/v2-best-candidates/summary",
    expected: [200, 401, 403, 307],
    label: "Best candidates summary API",
  },
  {
    path: "/api/admin/foods/v2-post-import-qa",
    expected: [200, 401, 403, 307],
    label: "Post-import QA API",
  },
  {
    path: "/api/admin/foods/v2-brand-batches",
    expected: [200, 401, 403, 307],
    label: "Brand batches API",
  },
  {
    path: "/api/admin/ai-status",
    expected: [200, 401, 403, 307],
    label: "Admin AI status API",
  },
];

async function checkRoute(check) {
  const url = new URL(check.path, siteUrl).toString();
  const started = Date.now();

  try {
    const response = await fetch(url, {
      redirect: "manual",
      headers: {
        "User-Agent": "NutriTail-live-route-smoke-qa/1.0",
      },
    });

    const status = response.status;
    return {
      ...check,
      url,
      status,
      ok: check.expected.includes(status),
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
    "| Route | Status | Result | Time | Notes |",
    "| --- | ---: | --- | ---: | --- |",
    ...rows.map((row) => {
      const notes = row.error || (row.location ? `redirect=${row.location}` : "");
      return `| ${row.path} | ${row.status || "error"} | ${
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
      "# Food V2 Live Route Smoke QA",
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
      "Admin API routes may return 401/403 without an authenticated admin session; that is accepted for this smoke check because it proves the route is deployed and protected.",
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
