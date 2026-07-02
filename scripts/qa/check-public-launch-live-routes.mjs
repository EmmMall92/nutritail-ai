import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const siteUrl = process.env.NUTRITAIL_QA_SITE_URL || "https://nutritail.ai";
const reportPath =
  process.env.NUTRITAIL_QA_REPORT_PATH || "reports/public_launch_live_route_smoke_qa.md";

const checks = [
  {
    path: "/",
    expected: [200],
    label: "Homepage",
    requiredText: ["Nutritail AI", "Τάισε το κατοικίδιό σου"],
    forbiddenText: ["Fit τροφής", "78/100"],
  },
  {
    path: "/login",
    expected: [200],
    label: "Login page",
    requiredText: ["Σύνδεση", "Ξέχασες τον κωδικό"],
  },
  {
    path: "/register",
    expected: [200],
    label: "Register page",
    requiredText: ["Δημιουργία λογαριασμού", "Email"],
  },
  {
    path: "/about",
    expected: [200],
    label: "About page",
    requiredText: ["Nutritail AI", "Σχετικά", "διατροφικές αποφάσεις"],
  },
  {
    path: "/how-it-works",
    expected: [200],
    label: "How it works page",
    requiredText: ["Nutritail AI", "Πώς δουλεύει", "Food V2"],
  },
  {
    path: "/beta",
    expected: [200],
    label: "Beta waitlist page",
    requiredText: ["Nutritail beta", "Θέλω beta πρόσβαση", "Beta πρόσβαση"],
  },
  {
    path: "/plans",
    expected: [200],
    label: "Plans page",
    requiredText: ["NutriTail plans", "Business direction", "Πριν τις πληρωμές"],
  },
  {
    path: "/forgot-password",
    expected: [200],
    label: "Forgot password page",
    requiredText: ["Επαναφορά κωδικού", "Στείλε link επαναφοράς"],
  },
  {
    path: "/reset-password",
    expected: [200],
    label: "Reset password page",
    requiredText: ["Νέος κωδικός", "Ζήτησε νέο link επαναφοράς"],
  },
  {
    path: "/privacy",
    expected: [200],
    label: "Privacy page",
    requiredText: ["Πολιτική απορρήτου", "Nutritail AI"],
  },
  {
    path: "/terms",
    expected: [200],
    label: "Terms page",
    requiredText: ["Όροι χρήσης", "Nutritail AI"],
  },
  {
    path: "/chatbot",
    expected: [307, 308],
    label: "Legacy chatbot redirect",
    expectedLocationIncludes: "/account/chatbot",
    skipBody: true,
  },
  {
    path: "/dashboard",
    expected: [307, 308],
    label: "Legacy dashboard redirect",
    expectedLocationIncludes: "/account",
    skipBody: true,
  },
  {
    path: "/create-pet",
    expected: [307, 308],
    label: "Legacy create pet redirect",
    expectedLocationIncludes: "/account/chatbot",
    skipBody: true,
  },
  {
    path: "/sitemap.xml",
    expected: [200],
    label: "Sitemap",
    contentTypeIncludes: ["xml"],
    requiredText: [
      "<urlset",
      "https://nutritail.ai",
      "https://nutritail.ai/about",
      "https://nutritail.ai/how-it-works",
      "https://nutritail.ai/beta",
      "https://nutritail.ai/plans",
    ],
    forbiddenText: [
      "https://nutritail.ai/chatbot",
      "https://nutritail.ai/dashboard",
      "https://nutritail.ai/create-pet",
    ],
  },
  {
    path: "/robots.txt",
    expected: [200],
    label: "Robots",
    requiredText: ["User-Agent", "Sitemap"],
  },
  {
    path: "/manifest.webmanifest",
    expected: [200],
    label: "Web manifest",
    contentTypeIncludes: ["manifest", "json"],
    requiredText: ["Nutritail AI"],
  },
  {
    path: "/opengraph-image",
    expected: [200],
    label: "OpenGraph image",
    contentTypeIncludes: ["image"],
    skipBody: true,
  },
];

async function checkRoute(check) {
  const url = new URL(check.path, siteUrl).toString();
  const started = Date.now();

  try {
    const response = await fetch(url, {
      redirect: "manual",
      headers: {
        "User-Agent": "NutriTail-public-launch-live-route-smoke-qa/1.0",
      },
    });
    const contentType = response.headers.get("content-type") ?? "";
    const body = check.skipBody ? "" : await response.text();
    const missingText = (check.requiredText ?? []).filter((needle) => !body.includes(needle));
    const forbiddenText = (check.forbiddenText ?? []).filter((needle) => body.includes(needle));
    const missingContentType = (check.contentTypeIncludes ?? []).filter(
      (needle) => !contentType.toLowerCase().includes(needle.toLowerCase()),
    );
    const location = response.headers.get("location") ?? "";
    const missingLocation = check.expectedLocationIncludes && !location.includes(check.expectedLocationIncludes)
      ? [check.expectedLocationIncludes]
      : [];
    const ok =
      check.expected.includes(response.status) &&
      missingText.length === 0 &&
      forbiddenText.length === 0 &&
      missingContentType.length === 0 &&
      missingLocation.length === 0;

    return {
      ...check,
      url,
      status: response.status,
      ok,
      duration_ms: Date.now() - started,
      contentType,
      location,
      missingText,
      forbiddenText,
      missingContentType,
      missingLocation,
      error: "",
    };
  } catch (error) {
    return {
      ...check,
      url,
      status: 0,
      ok: false,
      duration_ms: Date.now() - started,
      contentType: "",
      location: "",
      missingText: check.requiredText ?? [],
      forbiddenText: [],
      missingContentType: check.contentTypeIncludes ?? [],
      missingLocation: check.expectedLocationIncludes ? [check.expectedLocationIncludes] : [],
      error: error instanceof Error ? error.message : "Unknown request error",
    };
  }
}

function renderTable(rows) {
  return [
    "| Route | Status | Result | Time | Content-Type | Notes |",
    "| --- | ---: | --- | ---: | --- | --- |",
    ...rows.map((row) => {
      const notes = [
        row.error,
        row.location ? `redirect=${row.location}` : "",
        row.missingText.length > 0 ? `missing text: ${row.missingText.join(", ")}` : "",
        row.forbiddenText.length > 0 ? `forbidden text: ${row.forbiddenText.join(", ")}` : "",
        row.missingContentType.length > 0
          ? `missing content-type: ${row.missingContentType.join(", ")}`
          : "",
        row.missingLocation.length > 0 ? `missing redirect target: ${row.missingLocation.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("; ");

      return `| ${row.path} | ${row.status || "error"} | ${row.ok ? "pass" : "fail"} | ${row.duration_ms}ms | ${row.contentType || "-"} | ${notes || "-"} |`;
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
      "# Public Launch Live Route Smoke QA",
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
      "This smoke check guards the public launch surface: homepage, auth pages, legal pages, SEO files, web manifest, and OpenGraph image.",
      "",
      "## Results",
      "",
      renderTable(rows),
    ].join("\n"),
    "utf8",
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
      2,
    ),
  );

  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
