import Link from "next/link";
import { getAllEvents } from "@/lib/db";

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
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
          {events.map((e) => {
            const isLive = e.start_date <= today && e.end_date >= today;
            return (
              <div key={e.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/admin/events/${e.id}`}
                      className="font-medium text-gray-800 dark:text-gray-100 hover:text-red-600 truncate"
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
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {e.start_date} → {e.end_date} · /events/{e.slug}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link
                    href={`/events/${e.slug}`}
                    target="_blank"
                    className="text-xs px-3 py-1 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                  >
                    View
                  </Link>
                  <Link
                    href={`/admin/events/${e.id}`}
                    className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link
        href="/admin"
        className="inline-block mt-6 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600"
      >
        ← Back to Admin
      </Link>
    </div>
  );
}