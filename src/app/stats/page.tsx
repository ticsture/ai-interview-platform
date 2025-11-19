type TopicStats = {
  topic: string;
  totalAttempts: number;
  correctAttempts: number;
  avgTimeSeconds: number | null;
};

import { API_BASE } from "@/lib/config";

async function fetchStats(): Promise<TopicStats[]> {
  const res = await fetch(`${API_BASE}/api/attempts/stats`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch stats");
  }

  return res.json();
}

export default async function StatsPage() {
  const stats = await fetchStats();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-start py-16 px-6 bg-white dark:bg-black sm:items-start">
        <h1 className="mb-4 text-3xl font-semibold text-black dark:text-zinc-50">
          Practice Stats
        </h1>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          Summary of your attempts, per topic.
        </p>

        {stats.length === 0 ? (
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            No attempts yet. Try practicing some questions first.
          </p>
        ) : (
          <div className="w-full overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                <tr>
                  <th className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
                    Topic
                  </th>
                  <th className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
                    Attempts
                  </th>
                  <th className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
                    Correct
                  </th>
                  <th className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
                    Accuracy
                  </th>
                  <th className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
                    Avg Time / Q
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.map((row) => {
                  const accuracy =
                    row.totalAttempts > 0
                      ? (row.correctAttempts / row.totalAttempts) * 100
                      : 0;

                  const avgTime =
                    row.avgTimeSeconds !== null
                      ? `${row.avgTimeSeconds.toFixed(1)}s`
                      : "—";

                  return (
                    <tr key={row.topic} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
                        {row.topic}
                      </td>
                      <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
                        {row.totalAttempts}
                      </td>
                      <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
                        {row.correctAttempts}
                      </td>
                      <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
                        {accuracy.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
                        {avgTime}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
