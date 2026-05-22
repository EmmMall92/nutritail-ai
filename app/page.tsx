const features = [
  "Daily calorie estimate",
  "Food quantity guidance",
  "Weight goal support",
  "Treat allowance",
  "Pet analysis history",
  "Simple explanations",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <a href="/" className="text-xl font-bold text-black">
            Nutritail AI
          </a>

          <div className="flex w-full gap-2 sm:w-auto">
<a
  href="/login"
  className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-center text-sm text-black transition hover:bg-gray-100 sm:flex-none"
>
  Login
</a>

<a
  href="/register"
  className="flex-1 rounded-xl bg-black px-4 py-2 text-center text-sm text-white transition hover:opacity-90 sm:flex-none"
>
  Get Started
</a>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-16 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            AI nutrition guidance for dogs and cats
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-black md:text-6xl">
            Understand what your pet really needs to eat.
          </h1>

          <p className="mt-6 text-lg leading-8 text-gray-600">
            Nutritail AI helps pet parents calculate calories, estimate daily
            food quantity, understand food choices, and keep nutrition history
            in one simple account.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/register"
              className="rounded-xl bg-black px-6 py-3 text-white transition hover:opacity-90"
            >
              Create free account
            </a>

            <a
              href="/login"
              className="rounded-xl border border-black px-6 py-3 text-black transition hover:bg-white"
            >
              Login
            </a>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Guidance only. Nutritail AI does not replace veterinary care.
          </p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="rounded-2xl bg-gray-50 p-5">
            <p className="text-sm font-semibold text-black">
              Example result
            </p>

            <div className="mt-5 space-y-4 text-sm text-gray-700">
              <div className="rounded-xl bg-white p-4">
                <p className="font-semibold text-black">Luna — Adult cat</p>
                <p className="mt-1">Target: weight maintenance</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white p-4">
                  <p className="text-gray-500">Calories</p>
                  <p className="mt-1 text-xl font-semibold text-black">
                    235 kcal
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <p className="text-gray-500">Food/day</p>
                  <p className="mt-1 text-xl font-semibold text-black">
                    58g
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-white p-4">
                <p>
                  Treats should stay under about 10% of daily calories.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-3xl font-bold text-black">
            Built for everyday pet parents
          </h2>

          <p className="mt-3 max-w-3xl text-gray-600">
            No complicated nutrition language. Nutritail AI turns pet details
            into practical, understandable feeding guidance.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
              >
                <p className="font-semibold text-black">✓ {feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-6 py-14 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="font-semibold text-black">1. Create account</h3>
            <p className="mt-2 text-sm text-gray-600">
              Start with a simple profile and keep your pet nutrition history.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="font-semibold text-black">2. Chat with AI</h3>
            <p className="mt-2 text-sm text-gray-600">
              Answer simple questions about species, age, weight, activity and
              food.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="font-semibold text-black">3. Get guidance</h3>
            <p className="mt-2 text-sm text-gray-600">
              Receive calories, grams/day, treat limits and practical notes.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-black">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-14 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">
              Start your pet nutrition journey.
            </h2>
            <p className="mt-2 text-gray-300">
              Create an account and run your first analysis.
            </p>
          </div>

          <a
            href="/register"
            className="rounded-xl bg-white px-6 py-3 text-center text-black transition hover:opacity-90"
          >
            Get Started
          </a>
        </div>
      </section>
      <footer className="border-t border-gray-200 bg-white">
  <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
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