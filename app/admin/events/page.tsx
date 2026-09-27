import Link from "next/link";
import { getAllEvents, getEventPollStats, getEventSurveyStats } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function AdminEventsPage() {
  const events = getAllEvents();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-red-700 dark:text-red-400">
            Events
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create and manage events and their programs.
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
        >
          + New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-10 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No events yet. Click <strong>+ New Event</strong> to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((e) => {
            const isLive = e.start_date <= today && e.end_date >= today;
            const pollStats = getEventPollStats(e.id);
            const surveyStats = getEventSurveyStats(e.id);

            return (
              <div
                key={e.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {/* Title + badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/admin/events/${e.id}`}
                        className="font-semibold text-gray-800 dark:text-gray-100 hover:text-red-600 truncate text-base sm:text-lg"
                      >
                        {e.title}
                      </Link>
                      {e.is_published ? (
                        <span className="text-[10px] font-semibold uppercase bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-900">
                          Published
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold uppercase bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                          Draft
                        </span>
                      )}
                      {isLive && e.is_published && (
                        <span className="text-[10px] font-semibold uppercase bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900">
                          Live
                        </span>
                      )}
                    </div>

                    {/* Date range + slug */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                      {e.start_date} → {e.end_date} · /events/{e.slug}
                    </p>

                    {/* Poll + Survey stats */}
                    {(pollStats.totalPolls > 0 || surveyStats.totalSurveys > 0) && (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {pollStats.totalPolls > 0 && (
                          <Link
                            href={`/admin/events/${e.id}/polls`}
                            className="inline-flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-2.5 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            📊 {pollStats.totalPolls} poll
                            {pollStats.totalPolls === 1 ? "" : "s"} ·{" "}
                            <span className="font-medium">
                              {pollStats.totalVotes} vote
                              {pollStats.totalVotes === 1 ? "" : "s"}
                            </span>
                          </Link>
                        )}

                        {surveyStats.totalSurveys > 0 && (
                          <Link
                            href={`/admin/events/${e.id}/surveys`}
                            className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-950"
                          >
                            📝 {surveyStats.totalSurveys} survey
                            {surveyStats.totalSurveys === 1 ? "" : "s"} ·{" "}
                            <span className="font-medium">
                              {surveyStats.totalResponses} response
                              {surveyStats.totalResponses === 1 ? "" : "s"}
                            </span>
                          </Link>
                        )}

                        {/* Direct shortcut if there are responses */}
                        {surveyStats.totalResponses > 0 && (
                          <Link
                            href={`/admin/events/${e.id}/surveys`}
                            className="inline-flex items-center gap-1.5 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full hover:bg-green-100 dark:hover:bg-green-950 font-medium"
                          >
                            ✓ View Responses →
                          </Link>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Link
                      href={`/events/${e.slug}`}
                      target="_blank"
                      className="text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/events/${e.id}`}
                      className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 mt-6 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500"
      >
        ← Back to Admin
      </Link>
    </div>
  );
}