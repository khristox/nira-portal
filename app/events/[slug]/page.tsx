import { notFound } from "next/navigation";
import Link from "next/link";
import { getEventWithProgram } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")}${ampm}`;
}

function timeRange(start: string, end: string) {
  if (start && end) return `${formatTime(start)} – ${formatTime(end)}`;
  if (start) return formatTime(start);
  if (end) return `until ${formatTime(end)}`;
  return "All day";
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEventWithProgram(slug);
  if (!event || !event.is_published) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const isLive = event.start_date <= today && event.end_date >= today;
  const todayDay = event.days.find((d) => d.date === today);
  const otherDays = event.days.filter((d) => d.date !== today);
  const showTodayFirst = isLive && !!todayDay;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back link */}
      <Link
        href="/"
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
        Back to Home
      </Link>

      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center flex-wrap gap-3 mb-3">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live Now
            </span>
          ) : (
            <span className="inline-block bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              Event
            </span>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatShortDate(event.start_date)} – {formatShortDate(event.end_date)}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
          {event.title}
        </h1>
        {event.subtitle && (
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
            {event.subtitle}
          </p>
        )}
        {event.location && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            📍 {event.location}
          </p>
        )}
      </header>

      {/* Description */}
      {event.description && (
        <div
          className="prose prose-slate dark:prose-invert max-w-none mb-10"
          dangerouslySetInnerHTML={{ __html: event.description }}
        />
      )}

      {/* Program */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {showTodayFirst ? "Happening Today" : "Program"}
          </h2>
          {showTodayFirst && otherDays.length > 0 && (
            <a
              href="#full-program"
              className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
            >
              View Full Program ↓
            </a>
          )}
        </div>

        {event.days.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            Program will be announced soon.
          </p>
        ) : showTodayFirst ? (
          <>
            {/* Today's program */}
            <div className="mb-4">
              <div className="flex items-baseline gap-3 mb-4 pb-2 border-b-2 border-red-500">
                <h3 className="text-lg font-bold text-red-700 dark:text-red-400">
                  {todayDay!.label || "Today"}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(todayDay!.date)}
                </span>
                <span className="ml-auto text-[10px] font-bold uppercase bg-red-600 text-white px-2 py-0.5 rounded-full">
                  Today
                </span>
              </div>

              {todayDay!.activities.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No activities scheduled for today.
                </p>
              ) : (
                <div className="space-y-3">
                  {todayDay!.activities.map((act) => {
                    const now = new Date();
                    const nowMin = now.getHours() * 60 + now.getMinutes();
                    const [sh, sm] = act.start_time
                      ? act.start_time.split(":").map(Number)
                      : [0, 0];
                    const [eh, em] = act.end_time
                      ? act.end_time.split(":").map(Number)
                      : [23, 59];
                    const startMin = sh * 60 + sm;
                    const endMin = eh * 60 + em;
                    const isNow = nowMin >= startMin && nowMin <= endMin;
                    const isPast = nowMin > endMin;

                    return (
                      <div
                        key={act.id}
                        className={`flex flex-col sm:flex-row gap-2 sm:gap-6 rounded-lg p-4 border-2 transition-all ${
                          isNow
                            ? "bg-red-50 dark:bg-red-950 border-red-500 shadow-lg"
                            : isPast
                            ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60"
                            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <div className="sm:w-44 flex-shrink-0 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {timeRange(act.start_time, act.end_time)}
                          {isNow && (
                            <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-red-600 text-white px-1.5 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                              Now
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {act.title}
                          </p>
                          {act.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {act.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Other days summary */}
            {otherDays.length > 0 && (
              <div
                id="full-program"
                className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800"
              >
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-4">
                  Other Days
                </h3>
                <div className="space-y-5">
                  {otherDays.map((day) => (
                    <div key={day.id}>
                      <div className="flex items-baseline gap-3 mb-3 pb-1 border-b border-red-100 dark:border-red-900">
                        <h4 className="font-semibold text-red-700 dark:text-red-400">
                          {day.label || "Day"}
                        </h4>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(day.date)}
                        </span>
                        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                          {day.activities.length} activit
                          {day.activities.length === 1 ? "y" : "ies"}
                        </span>
                      </div>
                      <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300 list-disc pl-5">
                        {day.activities.slice(0, 4).map((act) => (
                          <li key={act.id}>
                            <span className="text-gray-500 dark:text-gray-400">
                              {timeRange(act.start_time, act.end_time)} —{" "}
                            </span>
                            {act.title}
                          </li>
                        ))}
                        {day.activities.length > 4 && (
                          <li className="text-gray-400 dark:text-gray-500 italic">
                            + {day.activities.length - 4} more
                          </li>
                        )}
                        {day.activities.length === 0 && (
                          <li className="text-gray-400 dark:text-gray-500 italic">
                            No activities yet
                          </li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Not live — full program inline */
          <div className="space-y-10">
            {event.days.map((day) => {
              const isToday = day.date === today;
              return (
                <div key={day.id}>
                  <div
                    className={`flex items-baseline gap-3 mb-4 pb-2 border-b-2 ${
                      isToday
                        ? "border-red-500"
                        : "border-red-100 dark:border-red-900"
                    }`}
                  >
                    <h3 className="text-lg font-bold text-red-700 dark:text-red-400">
                      {day.label || "Day"}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(day.date)}
                    </span>
                    {isToday && (
                      <span className="ml-auto text-[10px] font-bold uppercase bg-red-600 text-white px-2 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </div>

                  {day.activities.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      No activities scheduled yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {day.activities.map((act) => (
                        <div
                          key={act.id}
                          className="flex flex-col sm:flex-row gap-2 sm:gap-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                        >
                          <div className="sm:w-44 flex-shrink-0 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {timeRange(act.start_time, act.end_time)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {act.title}
                            </p>
                            {act.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {act.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Sponsors */}
      {event.sponsors.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-5">
            Sponsors &amp; Partners
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {event.sponsors.map((s) => (
              <a
                key={s.id}
                href={s.website || "#"}
                target={s.website ? "_blank" : undefined}
                rel="noreferrer"
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex items-center justify-center h-24 hover:shadow-md transition-shadow"
                title={s.name}
              >
                {s.logo_base64 ? (
                  <img
                    src={s.logo_base64}
                    alt={s.name}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-gray-500 text-center">
                    {s.name}
                  </span>
                )}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}