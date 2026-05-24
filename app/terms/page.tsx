import type { Metadata } from "next";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Terms of Use | ${brand.name}`,
  description:
    "Read Nutritail AI's terms for educational pet nutrition guidance.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <section className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-black">Terms of Use</h1>

        <p className="mt-4 text-gray-600">
          Nutritail AI provides educational nutrition guidance for pet parents.
          It does not replace veterinary diagnosis, treatment, or medical advice.
        </p>

        <p className="mt-4 text-gray-600">
          Final terms will be completed before public launch.
        </p>
      </section>
    </main>
  );
}
