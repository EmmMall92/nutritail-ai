import { existsSync, readFileSync } from "node:fs";

type MobileCheck = {
  area: string;
  file: string;
  markers: string[];
};

function read(path: string) {
  if (!existsSync(path)) {
    throw new Error(`Missing file for mobile customer readiness: ${path}`);
  }

  return readFileSync(path, "utf8");
}

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const checks: MobileCheck[] = [
  {
    area: "Global responsive shell",
    file: "app/layout.tsx",
    markers: [
      'import type { Metadata, Viewport } from "next"',
      "export const viewport",
      "themeColor",
      "<html lang=\"el\">",
    ],
  },
  {
    area: "Account chatbot mobile frame",
    file: "app/account/chatbot/page.tsx",
    markers: [
      "h-[calc(100svh-8rem)]",
      "sm:h-[calc(100svh-11rem)]",
      "overflow-hidden",
      "scroll-pb-72",
      "[overflow-anchor:none]",
      "sticky bottom-0",
      "env(safe-area-inset-bottom)",
      "ResizeObserver",
    ],
  },
  {
    area: "Account chatbot mobile food cards",
    file: "app/account/chatbot/page.tsx",
    markers: [
      "recommendedFoodChoices",
      "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3",
      "Calculate grams/day",
      'data-testid="selected-food-plan-card"',
      'data-testid="selected-food-next-steps"',
      "w-full rounded-xl bg-green-600",
      "max-w-[96%]",
      "sm:max-w-[85%]",
    ],
  },
  {
    area: "Account dashboard mobile cards",
    file: "app/account/page.tsx",
    markers: [
      'data-testid="account-today-command-center"',
      'data-testid="account-latest-activity-strip"',
      'data-testid="account-plan-snapshot"',
      'data-testid="account-beta-usage"',
      "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4",
      "flex flex-col gap-4 lg:flex-row",
      "w-full max-w-sm",
      "md:grid-cols-4",
    ],
  },
  {
    area: "Saved pets mobile actions",
    file: "app/account/pets/page.tsx",
    markers: [
      "flex flex-col gap-4",
      "md:flex-row",
      "grid grid-cols-1 gap-4 md:grid-cols-4",
      "/account/chatbot?petId=",
      "/print/pet-report/",
      "/print/pet-timeline/",
      "max-w-full",
    ],
  },
  {
    area: "Printable report mobile sections",
    file: "app/print/pet-report/[id]/page.tsx",
    markers: [
      'data-testid="report-start-checklist"',
      'data-testid="report-customer-takeaway"',
      'data-testid="report-tomorrow-feeding-plan"',
      'data-testid="report-next-action-summary"',
      'data-testid="report-progress-return-kit"',
      "grid grid-cols-1",
      "md:grid-cols",
      "max-w-",
    ],
  },
  {
    area: "Printable timeline mobile route",
    file: "app/print/pet-timeline/[id]/page.tsx",
    markers: [
      "PetTimelineReportPage",
      "progressLogs",
      "grid",
      "sm:p-8",
      "md:grid-cols-2",
      "max-w-",
      "p-",
    ],
  },
  {
    area: "Customer journey includes mobile contract",
    file: "package.json",
    markers: [
      '"qa:mobile-customer-readiness-contract"',
      "qa:mobile-customer-readiness-contract",
    ],
  },
];

for (const check of checks) {
  const source = read(check.file);

  for (const marker of check.markers) {
    assert(
      source.includes(marker),
      `Mobile customer readiness missing "${marker}" for ${check.area} in ${check.file}.`
    );
  }
}

const packageJson = read("package.json");

assert(
  packageJson.includes(
    "qa:mobile-customer-readiness-contract && npm run qa:saved-pet-continuation-contract && npm run qa:customer-journey-readiness-contract"
  ),
  "CI readiness must run mobile, saved-pet, and full customer journey contracts in order."
);

console.log(`Mobile customer readiness contract passed (${checks.length} areas covered).`);
