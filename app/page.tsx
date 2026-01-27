import Link from "next/link";

export default function Home() {
  return (
    <div className="px-6 py-12 md:py-20">
      <div className="max-w-2xl mx-auto">
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-accent">
          True Cost
        </h1>

        {/* Intro */}
        <section className="mb-16">
          <p className="text-xl text-zinc-300 mb-6">
            See what your life is really asking of you.
          </p>
          <p className="text-zinc-400 mb-6">
            True Cost helps you understand where your time, energy, and attention are actually going.
          </p>
          <p className="text-zinc-400 mb-6">
            Not to optimise your life.<br />
            Not to fix you.<br />
            Just to make the invisible visible.
          </p>
          <p className="text-zinc-400">
            Most pressure doesn't come from one big thing.<br />
            It comes from what quietly accumulates.
          </p>
        </section>

        {/* What True Cost does */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-4 text-zinc-200">
            What True Cost does
          </h2>
          <p className="text-zinc-400 mb-4">
            True Cost is a small set of calculators that show the gap between how things look on paper and how they feel in real life.
          </p>
          <p className="text-zinc-400">
            Each one looks at a different kind of cost.
          </p>
        </section>

        {/* Calculator 1: Salary Reality */}
        <section className="mb-12">
          <Link
            href="/salary-reality"
            className="block p-6 rounded-xl bg-card-bg border border-card-border hover:border-accent/50 transition-colors"
          >
            <h3 className="text-xl font-semibold mb-4 text-zinc-200">
              Salary Reality
            </h3>
            <p className="text-zinc-400 mb-4">
              What your job pays on paper isn't always what it pays in practice.
            </p>
            <p className="text-zinc-400 mb-4">
              Salary Reality shows your true hourly rate once you account for unpaid time, commuting, recovery, and work related costs.
            </p>
            <p className="text-zinc-500 text-sm">
              It doesn't tell you what to do.<br />
              It just shows the number.
            </p>
            <span className="inline-block mt-6 px-4 py-2 bg-accent text-zinc-900 font-medium rounded-lg hover:bg-accent/90 transition-colors">
              Open Calculator →
            </span>
          </Link>
        </section>

        {/* Calculator 2: Time Cost */}
        <section className="mb-12">
          <Link
            href="/time-cost"
            className="block p-6 rounded-xl bg-card-bg border border-card-border hover:border-accent/50 transition-colors"
          >
            <h3 className="text-xl font-semibold mb-4 text-zinc-200">
              Time Cost
            </h3>
            <p className="text-zinc-400 mb-4">
              Every "yes" comes with a hidden cost.
            </p>
            <p className="text-zinc-400 mb-4">
              Time Cost helps you see what a commitment actually takes once you include preparation, follow-ups, and the energy it draws afterward.
            </p>
            <p className="text-zinc-500 text-sm">
              It's for the moments when something sounds small, but never quite is.
            </p>
            <span className="inline-block mt-6 px-4 py-2 bg-accent text-zinc-900 font-medium rounded-lg hover:bg-accent/90 transition-colors">
              Open Calculator →
            </span>
          </Link>
        </section>

        {/* Calculator 3: Life Friction */}
        <section className="mb-16">
          <Link
            href="/life-friction"
            className="block p-6 rounded-xl bg-card-bg border border-card-border hover:border-accent/50 transition-colors"
          >
            <h3 className="text-xl font-semibold mb-4 text-zinc-200">
              Life Friction
            </h3>
            <p className="text-zinc-400 mb-4">
              Not everything that causes friction feels dramatic.
            </p>
            <p className="text-zinc-400 mb-4">
              Life Friction helps you identify the small, constant resistance that quietly drains your energy each day.
            </p>
            <p className="text-zinc-500 text-sm mb-4">
              The admin.<br />
              The noise.<br />
              The overload that doesn't have a name.
            </p>
            <p className="text-zinc-500 text-sm">
              Sometimes knowing where the drag is changes how heavy everything feels.
            </p>
            <span className="inline-block mt-6 px-4 py-2 bg-accent text-zinc-900 font-medium rounded-lg hover:bg-accent/90 transition-colors">
              Open Calculator →
            </span>
          </Link>
        </section>

        {/* Closing Note */}
        <section className="mb-16">
          <p className="text-zinc-400 mb-4">
            True Cost is not a productivity tool.<br />
            It doesn't promise improvement.<br />
            It offers clarity.
          </p>
          <p className="text-zinc-400">
            And sometimes, that's enough to help you decide what must change for you.
          </p>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-card-border">
          <p className="text-sm text-zinc-600">
            For informational purposes only.
          </p>
          <p className="text-sm text-zinc-600">
            Awareness doesn't fix everything. But it often shows where to start.
          </p>
          <p className="text-sm text-zinc-600">DEPLOY CHECK</p>
        </footer>
      </div>
    </div>
  );
}
