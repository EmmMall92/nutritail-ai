import Link from "next/link";
import { brand } from "@/lib/brand";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

const TRUST_POINTS = [
  "Προσωπική καθοδήγηση για σκύλους και γάτες",
  "Προτάσεις τροφής με βάση το κατοικίδιο",
  "Αποθηκευμένα προφίλ, αναφορές και νέες αναλύσεις",
];

const CUSTOMER_JOURNEY_STEPS = [
  {
    label: "\u03a3\u03cd\u03bd\u03b4\u03b5\u03c3\u03b7",
    detail:
      "\u039c\u03c0\u03b1\u03af\u03bd\u03b5\u03b9\u03c2 \u03bc\u03b5 \u03b1\u03c3\u03c6\u03ac\u03bb\u03b5\u03b9\u03b1 \u03ba\u03b1\u03b9 \u03c3\u03c5\u03bd\u03b5\u03c7\u03af\u03b6\u03b5\u03b9\u03c2 \u03b1\u03ba\u03c1\u03b9\u03b2\u03ce\u03c2 \u03b5\u03ba\u03b5\u03af \u03c0\u03bf\u03c5 \u03ae\u03c3\u03bf\u03c5\u03bd.",
  },
  {
    label: "\u0391\u03bd\u03ac\u03bb\u03c5\u03c3\u03b7",
    detail:
      "\u0394\u03b7\u03bc\u03b9\u03bf\u03c5\u03c1\u03b3\u03b5\u03af\u03c2 \u03ae \u03b1\u03bd\u03bf\u03af\u03b3\u03b5\u03b9\u03c2 \u03ba\u03b1\u03c4\u03bf\u03b9\u03ba\u03af\u03b4\u03b9\u03bf \u03ba\u03b1\u03b9 \u03c0\u03b1\u03af\u03c1\u03bd\u03b5\u03b9\u03c2 \u03c3\u03c4\u03bf\u03c7\u03b5\u03c5\u03bc\u03ad\u03bd\u03b7 \u03c0\u03c1\u03cc\u03c4\u03b1\u03c3\u03b7.",
  },
  {
    label: "\u03a0\u03b1\u03c1\u03b1\u03ba\u03bf\u03bb\u03bf\u03cd\u03b8\u03b7\u03c3\u03b7",
    detail:
      "\u039a\u03c1\u03b1\u03c4\u03ac\u03c2 report, \u03c0\u03cc\u03c3\u03b1 \u03b3\u03c1\u03b1\u03bc\u03bc\u03ac\u03c1\u03b9\u03b1 \u03ba\u03b1\u03b9 \u03bd\u03ad\u03bf progress check \u03b3\u03b9\u03b1 \u03bc\u03b5\u03c4\u03ac.",
  },
];

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#f6f7f5] px-4 py-8 text-black sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="order-2 space-y-8 lg:order-1">
          <Link
            href="/"
            className="hidden items-center gap-3 text-sm font-semibold text-black lg:inline-flex"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
              NT
            </span>
            {brand.name}
          </Link>

          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-green-700">
              {eyebrow}
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-black sm:text-5xl">
              Διατροφική καθοδήγηση που βγάζει νόημα από το πρώτο βήμα.
            </h1>
            <p className="mt-5 text-base leading-7 text-gray-700">
              Το Nutritail AI βοηθά να καταλάβεις θερμίδες, ποσότητα τροφής,
              ευαισθησίες και πρακτικά επόμενα βήματα χωρίς να μπερδεύει τη
              διατροφή με δύσκολους πίνακες.
            </p>
          </div>

          <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
            {TRUST_POINTS.map((point) => (
              <div
                key={point}
                className="rounded-xl border border-gray-200 bg-white/80 p-4 shadow-sm"
              >
                <div className="h-2 w-10 rounded-full bg-green-500" />
                <p className="mt-3 text-sm font-medium text-gray-800">
                  {point}
                </p>
              </div>
            ))}
          </div>

          <div
            className="max-w-2xl rounded-2xl border border-green-100 bg-white/85 p-4 shadow-sm"
            data-testid="auth-customer-journey-strip"
          >
            <p className="text-sm font-semibold text-gray-950">
              {"\u0397 \u03c1\u03bf\u03ae \u03b5\u03af\u03bd\u03b1\u03b9 \u03b1\u03c0\u03bb\u03ae \u03ba\u03b1\u03b9 \u03c3\u03c5\u03bd\u03b5\u03c7\u03ae\u03c2"}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {CUSTOMER_JOURNEY_STEPS.map((step, index) => (
                <div
                  key={step.label}
                  className="rounded-xl bg-[#f6f7f5] p-3"
                  data-testid="auth-customer-journey-step"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="mt-2 text-sm font-semibold text-gray-950">
                    {step.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-600">
                    {step.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="order-1 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 lg:order-2">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-3 text-sm font-semibold text-black lg:hidden"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
              NT
            </span>
            {brand.name}
          </Link>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-green-700">
              {eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-bold text-black">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {description}
            </p>
          </div>

          <div className="mt-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
