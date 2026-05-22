const features = [
  {
    title: "Personalized feeding guidance",
    text: "Get calorie and feeding estimates based on your pet’s species, age, weight, activity and goals.",
  },
  {
    title: "Food-aware recommendations",
    text: "Connect your pet’s needs with the food you already use and understand if it fits.",
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

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-black">
      <header className="border-b border-black/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <a href="/" className="text-xl font-black tracking-tight">
            Nutritail AI
          </a>

          <nav className="flex w-full gap-2 sm:w-auto">
            <a
              href="/login"
              className="flex-1 rounded-full border border-black/20 px-5 py-2 text-center text-sm font-medium transition hover:bg-gray-100 sm:flex-none"
            >
              Login
            </a>

            <a
              href="/register"
              className="flex-1 rounded-full bg-black px-5 py-2 text-center text-sm font-medium text-white transition hover:opacity-90 sm:flex-none"
            >
              Get Started
            </a>
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
            <a
              href="/register"
              className="rounded-full bg-black px-7 py-4 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Start free analysis
            </a>

            <a
              href="/login"
              className="rounded-full border border-black/20 bg-white px-7 py-4 text-sm font-semibold transition hover:bg-gray-50"
            >
              I already have an account
            </a>
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
                <p className="text-sm text-gray-500">Luna · Adult cat</p>
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
                “This food looks suitable, but portion control matters because
                Luna is sterilized.”
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
        <div className="rounded-[2rem] border border-black/10 bg-white p-8 text-center shadow-sm">
          <h2 className="text-3xl font-black">
            Start your first nutrition analysis today.
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Create an account, add your pet, and get a practical feeding
            overview in minutes.
          </p>

          <a
            href="/register"
            className="mt-6 inline-flex rounded-full bg-black px-7 py-4 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Create free account
          </a>
        </div>
      </section>

      <footer className="border-t border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Nutritail AI. All rights reserved.</p>

          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-black">
              Privacy
            </a>
            <a href="/terms" className="hover:text-black">
              Terms
            </a>
            <a href="/login" className="hover:text-black">
              Login
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}