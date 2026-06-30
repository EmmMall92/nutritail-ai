import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(path: string) {
  return readFileSync(path, "utf8");
}

const pages = [
  {
    path: "app/login/page.tsx",
    markers: [
      "Θα συνεχίσεις από εκεί που έμεινες.",
      "στη σωστή σελίδα μετά τη σύνδεση",
      'data-testid="auth-next-step-card"',
      "Έλεγξε email και κωδικό",
    ],
  },
  {
    path: "app/register/page.tsx",
    markers: [
      "Μετά την εγγραφή ξεκινάς αμέσως πρακτικά.",
      "να κρατήσεις",
      "report για μελλοντικό progress check",
      'data-testid="auth-next-step-card"',
    ],
  },
  {
    path: "app/forgot-password/page.tsx",
    markers: [
      "Δεν χάνεις τα αποθηκευμένα στοιχεία σου.",
      "pets",
      "reports",
      "progress checks",
      'data-testid="auth-next-step-card"',
    ],
  },
  {
    path: "app/reset-password/page.tsx",
    markers: [
      "Μετά την αλλαγή θα συνδεθείς ξανά με ασφάλεια.",
      "αποθηκευμένα",
      "reports",
      "νέα ανάλυση",
      'data-testid="auth-next-step-card"',
    ],
  },
];

for (const page of pages) {
  const source = read(page.path);

  for (const marker of page.markers) {
    assert(
      source.includes(marker),
      `${page.path} must include auth customer copy marker: ${marker}`
    );
  }

}

const packageJson = read("package.json");

assert(
  packageJson.includes('"qa:auth-customer-copy"'),
  "package.json must expose qa:auth-customer-copy."
);

assert(
  packageJson.includes(
    "qa:customer-ux-copy && npm run qa:auth-customer-copy && npm run qa:chatbot-customer-recommendations"
  ),
  "CI readiness must include qa:auth-customer-copy."
);

console.log("Auth customer copy contract passed.");
