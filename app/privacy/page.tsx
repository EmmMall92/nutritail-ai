import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Privacy Policy | ${brand.name}`,
  description:
    "Read how Nutritail AI handles account, pet profile, and nutrition analysis data.",
  alternates: {
    canonical: "/privacy",
  },
};

const sections = [
  {
    title: "Information we collect",
    items: [
      "Account details such as your email address and authentication information.",
      "Pet profile details you choose to enter, including species, age, weight, activity level, health notes, allergies, and nutrition goals.",
      "Food and analysis details used to generate nutrition guidance, saved reports, and account history.",
      "Basic technical information needed to operate and secure the service, such as request metadata and error logs.",
    ],
  },
  {
    title: "How we use information",
    items: [
      "To provide personalized pet nutrition estimates, food matching, reports, and saved pet history.",
      "To maintain your account, authenticate access, and protect admin/customer areas.",
      "To improve product quality, troubleshoot issues, and understand which features are useful.",
      "To communicate about account, support, or service-related matters when needed.",
    ],
  },
  {
    title: "How we handle data",
    items: [
      "We do not sell personal information.",
      "Pet nutrition guidance is educational and should not be treated as veterinary diagnosis or treatment.",
      "We use service providers, including hosting, authentication, and database infrastructure, to operate Nutritail AI.",
      "Access to administrative data is restricted to authorized roles.",
    ],
  },
  {
    title: "Your choices",
    items: [
      "You can update pet and profile information from your account where supported.",
      "You can request help with account access, correction, export, or deletion by contacting us.",
      "Some information may need to be retained for security, legal, or operational reasons.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <section className="mx-auto max-w-4xl space-y-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Last updated May 25, 2026
          </p>
          <h1 className="mt-3 text-3xl font-bold text-black">
            Privacy Policy
          </h1>

          <p className="mt-4 text-gray-600">
            This Privacy Policy explains how {brand.name} handles information
            when you use our pet nutrition guidance service. It is written for
            the current beta version of the product and may be updated as the
            service grows.
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
            For privacy questions or account data requests, contact{" "}
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
