import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Support | ${brand.name}`,
  description:
    "How to get help with NutriTail beta access, pet reports, saved analyses, data requests, and nutrition guidance boundaries.",
  alternates: {
    canonical: "/support",
  },
};

const supportTopics = [
  {
    title: "Account or beta access",
    detail:
      "Use this for login trouble, beta access questions, password recovery, or if a beta limit blocks a real test.",
    action: "Include the email you use for NutriTail and what page you were on.",
  },
  {
    title: "Nutrition analysis or report",
    detail:
      "Use this when the recommendation looks confusing, the grams/day do not make sense, or a saved report is missing context.",
    action:
      "Send the pet name, goal, selected food if any, and the part of the answer that felt unclear.",
  },
  {
    title: "Food data or missing product",
    detail:
      "Use this when a food is missing, the formula title looks wrong, or nutrients look incomplete.",
    action:
      "Send the brand, exact product name, product link or label photo, and which field looks wrong.",
  },
  {
    title: "Privacy or data request",
    detail:
      "Use this for account data, pet profile correction, export, or deletion questions.",
    action:
      "Tell us whether you want correction, export, deletion, or a privacy explanation.",
  },
] as const;

const responseFlow = [
  "We first identify whether the issue is account access, nutrition output, food data, privacy, or urgent veterinary risk.",
  "For product issues, we check the saved pet context, selected food, report, and feedback trail before changing rules.",
  "For food-data issues, we prefer official sources, label photos, or trusted retailer pages before updating the database.",
  "For medical red flags, NutriTail stops shopping advice and points the user to a veterinarian.",
] as const;

const emergencySignals = [
  "cat straining or unable to urinate",
  "blood in urine or stool",
  "repeated vomiting or diarrhea",
  "not eating, collapse, or severe pain",
  "known kidney disease, pancreatitis, diabetes, or serious allergy symptoms",
] as const;

export default function SupportPage() {
  const mailto = `mailto:${brand.contactEmail}?subject=NutriTail support request`;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-xl font-black tracking-tight">
            Nutritail AI
          </Link>
          <nav className="flex flex-wrap gap-2 text-sm font-semibold">
            <Link href="/how-it-works" className="rounded-full border border-slate-300 px-4 py-2">
              How it works
            </Link>
            <Link href="/privacy" className="rounded-full border border-slate-300 px-4 py-2">
              Privacy
            </Link>
            <Link href="/login" className="rounded-full bg-slate-950 px-4 py-2 text-white">
              Login
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14 md:py-20" data-testid="support-hero">
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
          NutriTail support
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
          Help for beta access, reports, food data, and account questions.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">
          NutriTail is still in beta, so support is intentionally simple: tell
          us what happened, include the pet or food context when relevant, and
          we will use it to improve the product loop.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={mailto}
            className="rounded-full bg-emerald-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
            data-testid="support-primary-email"
          >
            Email support
          </a>
          <Link
            href="/account/chatbot"
            className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold transition hover:bg-slate-100"
          >
            Open chatbot
          </Link>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white" data-testid="support-request-types">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              What to send
            </p>
            <h2 className="mt-2 text-3xl font-black">
              The fastest support request includes the right context.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {supportTopics.map((topic) => (
              <article
                key={topic.title}
                className="rounded-lg border border-slate-200 bg-slate-50 p-5"
                data-testid="support-request-type"
              >
                <h3 className="text-lg font-black">{topic.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">{topic.detail}</p>
                <p className="mt-4 rounded-lg bg-white p-3 text-sm font-semibold leading-6 text-slate-950">
                  {topic.action}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          data-testid="support-operating-flow"
        >
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
            Support operating flow
          </p>
          <h2 className="mt-2 text-3xl font-black">
            How we handle beta feedback.
          </h2>
          <div className="mt-6 grid gap-3">
            {responseFlow.map((step, index) => (
              <div key={step} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm leading-6 text-slate-700">
                  <span className="font-black text-slate-950">{index + 1}. </span>
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside
          className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm"
          data-testid="support-vet-boundary"
        >
          <p className="text-sm font-bold uppercase tracking-wide text-red-700">
            Veterinary boundary
          </p>
          <h2 className="mt-2 text-2xl font-black text-red-950">
            Some cases should not wait for app support.
          </h2>
          <p className="mt-4 text-sm leading-6 text-red-950">
            NutriTail can help organize nutrition information, but it does not
            diagnose, treat, or replace veterinary care. Contact a veterinarian
            urgently for:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-red-950">
            {emergencySignals.map((signal) => (
              <li key={signal} className="rounded-lg bg-white px-3 py-2">
                {signal}
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="border-t border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-emerald-300">
              Customer trust
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Support feedback becomes product improvement.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Helpful and not-helpful signals, missing foods, confusing report
              sections, and beta access issues are reviewed as part of the
              launch feedback loop.
            </p>
          </div>
          <Link
            href="/about"
            className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
          >
            Read our trust promise
          </Link>
        </div>
      </section>
    </main>
  );
}
