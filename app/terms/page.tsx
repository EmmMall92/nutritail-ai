import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Terms of Use | ${brand.name}`,
  description:
    "Read Nutritail AI's terms for educational pet nutrition guidance.",
  alternates: {
    canonical: "/terms",
  },
};

const sections = [
  {
    title: "Educational guidance only",
    items: [
      "Nutritail AI provides educational pet nutrition guidance, estimates, and food insights.",
      "The service does not provide veterinary diagnosis, treatment, emergency advice, or medical care.",
      "Always consult a licensed veterinarian for medical concerns, disease management, prescription diets, sudden weight change, appetite loss, or urgent symptoms.",
    ],
  },
  {
    title: "Your responsibilities",
    items: [
      "Provide accurate pet, health, activity, and food information so guidance can be as useful as possible.",
      "Use the service as a planning and education tool, not as the only basis for health decisions.",
      "Keep your account credentials secure and notify us if you believe your account has been accessed without permission.",
    ],
  },
  {
    title: "Food data and recommendations",
    items: [
      "Food information may come from product labels, public sources, brand materials, admin review, or user-provided details.",
      "Nutrition data can vary by country, recipe, packaging, reformulation, or serving format.",
      "Food scores and recommendations are estimates and may change as our database and scoring rules improve.",
    ],
  },
  {
    title: "Acceptable use",
    items: [
      "Do not misuse the service, attempt unauthorized access, scrape protected areas, or interfere with normal operation.",
      "Do not upload or submit content that is unlawful, harmful, misleading, or violates another person's rights.",
      "Admin areas and internal tools are restricted to authorized users only.",
    ],
  },
  {
    title: "Changes and availability",
    items: [
      "Nutritail AI may update features, content, database entries, and these terms as the product develops.",
      "We may limit, suspend, or discontinue parts of the service when needed for security, maintenance, or product reasons.",
      "Continued use of the service after updates means you accept the updated terms.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <section className="mx-auto max-w-4xl space-y-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Last updated May 25, 2026
          </p>
          <h1 className="mt-3 text-3xl font-bold text-black">Terms of Use</h1>

          <p className="mt-4 text-gray-600">
            These Terms of Use explain the rules for using {brand.name}. By
            using the service, you agree to use it responsibly and understand
            that it provides educational guidance, not veterinary care.
          </p>
        </div>

        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
          >
            <h2 className="text-xl font-bold text-black">{section.title}</h2>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-gray-600">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-black">Contact</h2>
          <p className="mt-4 text-gray-600">
            Questions about these terms can be sent to{" "}
            <a
              href={`mailto:${brand.contactEmail}`}
              className="font-semibold text-black underline"
            >
              {brand.contactEmail}
            </a>
            .
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-lg border border-black px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-100"
          >
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
