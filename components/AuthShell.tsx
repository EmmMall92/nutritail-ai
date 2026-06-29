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
