"use client";

import { useTransition } from "react";
import { voteAction } from "@/lib/poll-actions";

type PollOption = {
  id: number;
  poll_id: number;
  label: string;
  sort_order: number;
};

type Poll = {
  id: number;
  question: string;
  description: string;
  is_active: number;
  allow_multiple: number;
  closes_at: string | null;
};

export default function PollCard({
  poll,
  options,
  counts,
  hasVoted,
  slug,
}: {
  poll: Poll;
  options: PollOption[];
  counts: Record<number, number>;
  hasVoted: boolean;
  slug: string;
}) {
  const [pending, startTransition] = useTransition();
  const totalVotes = Object.values(counts).reduce((s, n) => s + n, 0);

  function submit(optionId: number) {
    const fd = new FormData();
    fd.set("poll_id", String(poll.id));
    fd.set("option_id", String(optionId));
    fd.set("slug", slug);
    startTransition(async () => {
      await voteAction(fd);
    });
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 sm:p-6">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
        {poll.question}
      </h3>
      {poll.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {poll.description}
        </p>
      )}

      <ul className="mt-5 space-y-2.5">
        {options.map((opt) => {
          const votes = counts[opt.id] ?? 0;
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

          return (
            <li key={opt.id}>
              {hasVoted ? (
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
              ) : (
                <button
                  type="button"
                  disabled={pending || poll.is_active !== 1}
                  onClick={() => submit(opt.id)}
                  className="w-full text-left border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 font-medium text-sm text-gray-800 dark:text-gray-100 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {opt.label}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        {totalVotes} vote{totalVotes === 1 ? "" : "s"}
        {hasVoted && " · You have voted"}
        {poll.is_active !== 1 && " · Poll closed"}
      </p>
    </div>
  );
}