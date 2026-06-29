import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? "npm.cmd" : "npm";

const checks = [
  {
    name: "Cat ranking balance",
    args: ["run", "qa:cat-v2-ranking-balance"],
    covers: "kitten growth, sterilised cat, renal cat, senior cat, and urinary/renal mismatch guards",
  },
  {
    name: "Senior visible ranking",
    args: ["run", "qa:food-v2-senior-visible-ranking"],
    covers: "customer-visible senior positioning",
  },
  {
    name: "Food preference and puppy ranking",
    args: ["run", "qa:food-v2-preference-ranking"],
    covers: "taste avoidances, preferred proteins, weight control, and large-breed puppy guards",
  },
  {
    name: "Food V2 ranking scenarios",
    args: ["run", "audit:food-v2-ranking-scenarios"],
    covers: "condition-specific live Food V2 recommendation scenarios",
  },
  {
    name: "Dog live smoke",
    args: ["run", "qa:dog-chatbot-live-smoke"],
    covers: "live dog recommendation endpoint across growth, allergy, urinary, renal, senior, and rescue cases",
  },
  {
    name: "Cat live safety",
    args: ["run", "qa:cat-chatbot-live-safety"],
    covers: "live cat emergency, urinary, renal, kitten, allergy, senior, and digestion cases",
  },
];

const startedAt = new Date();
const results = [];

for (const check of checks) {
  console.log(`\n=== ${check.name} ===`);
  const result =
    process.platform === "win32"
      ? spawnSync(`${command} ${check.args.join(" ")}`, {
          cwd: process.cwd(),
          env: process.env,
          shell: true,
          stdio: "inherit",
        })
      : spawnSync(command, check.args, {
          cwd: process.cwd(),
          env: process.env,
          stdio: "inherit",
        });

  results.push({
    name: check.name,
    covers: check.covers,
    status: result.status === 0 ? "pass" : "fail",
  });

  if (result.status !== 0) {
    console.error(`\n${check.name} failed.`);
    console.error(JSON.stringify({ startedAt, finishedAt: new Date(), results }, null, 2));
    process.exit(result.status ?? 1);
  }
}

console.log(
  JSON.stringify(
    {
      startedAt,
      finishedAt: new Date(),
      checked: results.length,
      passed: results.filter((result) => result.status === "pass").length,
      review: results.filter((result) => result.status !== "pass").length,
      results,
    },
    null,
    2
  )
);
