import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${brand.name} | AI Pet Nutrition Guidance`,
  description:
    "Personalized AI pet nutrition guidance for dogs and cats, including feeding estimates, calorie goals, and food quality insights.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${brand.name} | AI Pet Nutrition Guidance`,
    description:
      "Understand your pet's calories, feeding amounts, weight goals, treats, and food quality with Nutritail AI.",
    url: "/",
    type: "website",
  },
};

const features = [
  {
    title: "Personalized feeding guidance",
    text: "Get calorie and feeding estimates based on your pet's species, age, weight, activity and goals.",
  },
  {
    title: "Food-aware recommendations",
    text: "Connect your pet's needs with the food you already use and understand if it fits.",
  },
  {
    title: "Pet nutrition history",
    text: "Save analyses, track changes and keep every pet profile organized in one account.",
  },
];

const steps = [
  "Create your free account",
  "Answer simple questions about your pet",
  "Get practical nutrition guidance",
];

const trustPillars = [
  {
    title: "Food database first",
    text: "Recommendations are grounded in the saved food catalog instead of brand memory or generic guesses.",
  },
  {
    title: "Confidence stays visible",
    text: "Missing calories, minerals, or retailer-only sources lower confidence, so the answer stays cautious.",
  },
  {
    title: "Vet-safe boundaries",
    text: "Medical red flags move out of shopping mode and toward veterinarian guidance.",
  },
];

const customerOutcomes = [
  {
    title: "Guided chatbot intake",
    text: "Start with your pet's age, weight, activity, neuter status, sensitivities, and current food.",
  },
  {
    title: "Food shortlist",
    text: "See stronger nutrition fits and value-style alternatives when the database has enough safe candidates.",
  },
  {
    title: "Saved pet profile",
    text: "Keep analyses, food context, calorie targets, and progress notes connected to each pet.",
  },
  {
    title: "Printable result",
    text: "Open a clear report or timeline that you can save, print, or review later.",
  },
];

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: brand.domain,
    email: brand.contactEmail,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name,
    url: brand.domain,
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: brand.name,
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    url: brand.domain,
    description: brand.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <header className="border-b border-black/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-xl font-black tracking-tight">
            Nutritail AI
          </Link>

          <nav className="flex w-full gap-2 sm:w-auto">
            <Link
              href="/login"
              className="flex-1 rounded-full border border-black/20 px-5 py-2 text-center text-sm font-medium transition hover:bg-gray-100 sm:flex-none"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="flex-1 rounded-full bg-black px-5 py-2 text-center text-sm font-medium text-white transition hover:opacity-90 sm:flex-none"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div>
          <p className="inline-flex rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">
            AI nutrition guidance for dogs and cats
          </p>

          <h1 className="mt-6 max-w-3xl text-5xl font-black leading-tight tracking-tight md:text-7xl">
            Feed your pet with more confidence.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-700">
            Nutritail AI helps pet parents understand calories, food quantity,
            weight goals, treats and food quality through simple personalized
            guidance.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-full bg-black px-7 py-4 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Start free analysis
            </Link>

            <Link
              href="/login"
              className="rounded-full border border-black/20 bg-white px-7 py-4 text-sm font-semibold transition hover:bg-gray-50"
            >
              I already have an account
            </Link>
          </div>

          <p className="mt-5 text-xs text-gray-500">
            Educational guidance only. Nutritail AI does not replace veterinary
            diagnosis or medical advice.
          </p>
        </div>

        <div className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-xl shadow-black/5">
          <div className="rounded-[1.5rem] bg-gray-50 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-black">Example Analysis</p>
                <p className="text-sm text-gray-500">Luna - Adult cat</p>
              </div>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Good match
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">Daily calories</p>
                <p className="mt-2 text-2xl font-black">235</p>
                <p className="text-xs text-gray-500">kcal/day</p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">Food amount</p>
                <p className="mt-2 text-2xl font-black">58g</p>
                <p className="text-xs text-gray-500">per day</p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">Treat limit</p>
                <p className="mt-2 text-2xl font-black">23</p>
                <p className="text-xs text-gray-500">kcal/day</p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">Food score</p>
                <p className="mt-2 text-2xl font-black">78/100</p>
                <p className="text-xs text-gray-500">very good</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-black p-5 text-white">
              <p className="text-sm font-semibold">
                This food looks suitable, but portion control matters because
                Luna is sterilized.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-black/10 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-6 py-14 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-black/10 bg-[#f7f7f4] p-6"
            >
              <h2 className="text-xl font-bold">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-gray-700">
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Online customer experience
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">
              From sign up to a useful nutrition result.
            </h2>
            <p className="mt-4 max-w-2xl text-gray-600">
              Nutritail AI is built for pet parents using the website directly:
              log in, choose a pet, run an analysis, save the result, and come
              back later for progress checks or another food recommendation.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {customerOutcomes.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-[2rem] bg-black p-8 text-white md:p-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-3xl font-black md:text-5xl">
                Simple enough for every pet parent.
              </h2>
              <p className="mt-4 text-gray-300">
                No complicated nutrition language. Just clear guidance you can
                actually use every day.
              </p>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-white/10 bg-white/10 p-4"
                >
                  <p className="text-sm text-gray-300">Step {index + 1}</p>
                  <p className="mt-1 font-semibold">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Built for careful answers
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">
              Clear recommendations, with confidence you can understand.
            </h2>
            <p className="mt-4 max-w-2xl text-gray-600">
              Nutritail AI separates food facts, pet context, nutrition rules,
              and human explanation. That makes the final answer easier to
              trust and easier to review.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {trustPillars.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-bold">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {pillar.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="rounded-[2rem] border border-black/10 bg-white p-8 text-center shadow-sm">
          <h2 className="text-3xl font-black">
            Start your first nutrition analysis today.
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Create an account, add your pet, and get a practical feeding
            overview in minutes.
          </p>

          <Link
            href="/register"
            className="mt-6 inline-flex rounded-full bg-black px-7 py-4 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Create free account
          </Link>
        </div>
      </section>

      <footer className="border-t border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
          <p>(c) {new Date().getFullYear()} Nutritail AI. All rights reserved.</p>

          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-black">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-black">
              Terms
            </Link>
            <Link href="/login" className="hover:text-black">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
