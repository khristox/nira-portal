import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getEventBySlug,
  getEventPolls,
  getPollOptions,
  getPollVoteCounts,
  hasVoted,
} from "@/lib/db";
import { getVoterToken } from "@/lib/voter-token";
import PollCard from "@/components/PollCard";

export const dynamic = "force-dynamic";

export default async function PublicPollsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event || !event.is_published) notFound();

  const { token } = await getVoterToken();
  const polls = getEventPolls(event.id, true);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Link
        href={`/events/${slug}`}
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
        Back to Event
      </Link>

      <header className="mb-8">
<div className="mb-6">
  <Link
    href={`/events/${slug}/polls/results`}
    className="inline-flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 hover:underline"
  >
    📊 View live results →
  </Link>
</div>
        <span className="inline-block bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
          Polls
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-3">
          {event.title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Vote on the polls below. One vote per browser.
        </p>
      </header>

      {polls.length === 0 ? (
        <p className="text-center py-16 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
          No polls are currently open for this event.
        </p>
      ) : (
        <div className="space-y-5">
          {polls.map((poll) => {
            const options = getPollOptions(poll.id);
            const countRows = getPollVoteCounts(poll.id);
            const counts: Record<number, number> = {};
            for (const row of countRows) counts[row.option_id] = row.count;

            const alreadyVoted = hasVoted(poll.id, token);

            return (
              <PollCard
                key={poll.id}
                poll={poll}
                options={options}
                counts={counts}
                hasVoted={alreadyVoted}
                slug={slug}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}