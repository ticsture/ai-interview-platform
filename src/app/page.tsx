import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-10 md:flex-row md:items-center">
      <section className="flex-1 space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Full-stack interview practice platform
        </div>

        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Practice tech interviews with{" "}
          <span className="text-emerald-400">structure</span> and{" "}
          <span className="text-emerald-400">feedback</span>.
        </h1>

        <p className="max-w-xl text-sm text-zinc-300">
          Manage your own question bank, run timed practice sessions, and
          track your accuracy across topics like DSA, Web development, and
          Java. All powered by your own full-stack app.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/practice"
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-black hover:bg-emerald-400"
          >
            Start practicing
          </Link>
          <Link
            href="/questions"
            className="inline-flex items-center justify-center rounded-full border border-zinc-700 px-5 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-900"
          >
            Manage questions
          </Link>
          <Link
            href="/stats"
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium text-zinc-300 hover:text-white"
          >
            View stats
          </Link>
        </div>
      </section>

      <section className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 text-xs text-zinc-300">
        <h2 className="mb-3 text-sm font-semibold text-zinc-100">
          What&apos;s inside this project?
        </h2>
        <ul className="space-y-2">
          <li>
            • <span className="font-medium">Questions</span> — CRUD interface
            backed by MongoDB.
          </li>
          <li>
            • <span className="font-medium">Practice mode</span> — one-by-one
            questions with timers and result tracking.
          </li>
          <li>
            • <span className="font-medium">Stats dashboard</span> — attempts
            aggregated by topic, accuracy, and average time.
          </li>
          <li>
            • <span className="font-medium">Clean architecture</span> — Next.js
            frontend, Express backend, Atlas DB.
          </li>
        </ul>
      </section>
    </div>
  );
}
