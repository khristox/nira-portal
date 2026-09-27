import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getEventById,
  getEventPolls,
  getPollOptions,
  getPollVoteCounts,
} from "@/lib/db";
import {
  createPollAction,
  updatePollAction,
  deletePollAction,
  createPollOptionAction,
  deletePollOptionAction,
} from "@/lib/poll-actions";

export const dynamic = "force-dynamic";

export default async function AdminPollsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();

  const event = getEventById(id);
  if (!event) notFound();

  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;

  const polls = getEventPolls(id);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/admin/events/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500"
        >
          ← Back to Event
        </Link>
        <h1 className="text-2xl font-bold text-red-700 dark:text-red-400 mt-2">
          Polls — {event.title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {polls.length} poll{polls.length === 1 ? "" : "s"} · Public URL:{" "}
          <span className="font-mono">/events/{event.slug}/polls</span>
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-400">
          <strong className="font-medium">Could not save:</strong> {error}
        </div>
      )}

      {/* Add poll */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Add Poll
        </h2>
        <form
          action={createPollAction}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <input type="hidden" name="event_id" value={id} />

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Question <span className="text-red-600">*</span>
            </label>
            <input
              name="question"
              required
              placeholder="What session did you enjoy most?"
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              name="description"
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" name="is_active" value="1" defaultChecked id="poll_active" />
            <label htmlFor="poll_active" className="text-sm">
              Active (accepts votes)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" name="allow_multiple" value="1" id="poll_multiple" />
            <label htmlFor="poll_multiple" className="text-sm">
              Allow multiple votes per voter
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Closes at (optional)</label>
            <input
              name="closes_at"
              type="datetime-local"
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sort order</label>
            <input
              name="sort_order"
              type="number"
              defaultValue={0}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              className="bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Add Poll
            </button>
          </div>
        </form>
      </section>

      {/* Existing polls */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Existing Polls ({polls.length})
        </h2>

        {polls.length === 0 ? (
          <p className="p-5 text-gray-400 dark:text-gray-500 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
            No polls yet.
          </p>
        ) : (
          polls.map((poll) => {
            const options = getPollOptions(poll.id);
            const counts = getPollVoteCounts(poll.id);
            const countMap = new Map(counts.map((c) => [c.option_id, c.count]));
            const totalVotes = counts.reduce((sum, c) => sum + c.count, 0);

            return (
              <div
                key={poll.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5"
              >
                <form action={updatePollAction} className="space-y-3">
                  <input type="hidden" name="id" value={poll.id} />
                  <input type="hidden" name="event_id" value={id} />

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Question
                    </label>
                    <input
                      name="question"
                      defaultValue={poll.question}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Description
                    </label>
                    <input
                      name="description"
                      defaultValue={poll.description}
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_active"
                        value="1"
                        defaultChecked={poll.is_active === 1}
                      />
                      Active
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="allow_multiple"
                        value="1"
                        defaultChecked={poll.allow_multiple === 1}
                      />
                      Allow multiple votes
                    </label>
                    <span className="text-gray-500 dark:text-gray-400">
                      {totalVotes} vote{totalVotes === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Closes at
                      </label>
                      <input
                        name="closes_at"
                        type="datetime-local"
                        defaultValue={poll.closes_at ?? ""}
                        className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Sort order
                      </label>
                      <input
                        name="sort_order"
                        type="number"
                        defaultValue={poll.sort_order}
                        className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                  >
                    Update Poll
                  </button>
                </form>

                {/* Options */}
                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Options ({options.length})
                  </h3>

                  <ul className="space-y-2 mb-3">
                    {options.map((opt) => {
                      const votes = countMap.get(opt.id) ?? 0;
                      const pct =
                        totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                      return (
                        <li
                          key={opt.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-gray-800 dark:text-gray-100">
                              {opt.label}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                              {votes} vote{votes === 1 ? "" : "s"} · {pct}%
                            </span>
                          </div>
                          <form action={deletePollOptionAction}>
                            <input type="hidden" name="id" value={opt.id} />
                            <input type="hidden" name="event_id" value={id} />
                            <button
                              type="submit"
                              className="text-xs text-red-600 dark:text-red-400 hover:underline"
                            >
                              Remove
                            </button>
                          </form>
                        </li>
                      );
                    })}
                    {options.length === 0 && (
                      <li className="text-xs text-gray-400 dark:text-gray-500 italic">
                        No options yet — add at least two.
                      </li>
                    )}
                  </ul>

                  <form
                    action={createPollOptionAction}
                    className="flex gap-2 items-center"
                  >
                    <input type="hidden" name="poll_id" value={poll.id} />
                    <input type="hidden" name="event_id" value={id} />
                    <input
                      name="label"
                      placeholder="Add an option..."
                      className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                    <button
                      type="submit"
                      className="bg-gray-800 dark:bg-gray-700 text-white px-3 py-2 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600 text-sm"
                    >
                      Add
                    </button>
                  </form>
                </div>

                {/* Delete poll */}
                <form
                  action={deletePollAction}
                  className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800"
                >
                  <input type="hidden" name="id" value={poll.id} />
                  <input type="hidden" name="event_id" value={id} />
                  <button
                    type="submit"
                    className="text-sm px-3 py-1 border border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    Delete Poll
                  </button>
                </form>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}