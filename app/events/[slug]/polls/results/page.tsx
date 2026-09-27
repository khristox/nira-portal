import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getEventBySlug,
  getEventPolls,
  getPollOptions,
  getPollVoteCounts,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PollResultsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event || !event.is_published) notFound();

  const polls = getEventPolls(event.id, true);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Link
        href={`/events/${slug}/polls`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 mb-6"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back to Polls
      </Link>

      <header className="mb-8">
        <span className="inline-block bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
          Live Results
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-3">
          {event.title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Results update as votes come in.
        </p>
      </header>

      {polls.length === 0 ? (
        <p className="text-center py-16 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
          No active polls.
        </p>
      ) : (
        <div className="space-y-6">
          {polls.map((poll) => {
            const options = getPollOptions(poll.id);
            const countRows = getPollVoteCounts(poll.id);
            const counts: Record<number, number> = {};
            for (const row of countRows) counts[row.option_id] = row.count;
            const total = Object.values(counts).reduce((s, n) => s + n, 0);

            return (
              <div
                key={poll.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 sm:p-6"
              >
                <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-1">
                  {poll.question}
                </h2>
                {poll.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {poll.description}
                  </p>
                )}

                <ul className="mt-4 space-y-2">
                  {options.map((opt) => {
                    const votes = counts[opt.id] ?? 0;
                    const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
                    return (
                      <li key={opt.id}>
                        <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-red-100 dark:bg-red-950"
                            style={{ width: `${pct}%` }}
                          />
                          <div className="relative flex items-center justify-between px-4 py-3">
                            <span className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                              {opt.label}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-300 tabular-nums">
                              {votes} · {pct}%
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  {total} vote{total === 1 ? "" : "s"} total
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}