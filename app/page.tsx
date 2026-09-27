import Link from "next/link";
import {
  getLiveEvent,
  getUpcomingEvents,
  getTodayProgram,
  getLocalizedServices,
} from "@/lib/db";
import { getActiveLanguage } from "@/lib/language";
import { todayInUganda, nowMinutesInUganda } from "@/lib/time";
import ServicesList from "./ServicesList";

export const dynamic = "force-dynamic";

function formatShortDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
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

function daysUntil(iso: string) {
  const today = todayInUganda();
  const now = new Date(today + "T00:00:00");
  const target = new Date(iso + "T00:00:00");
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

function minutesFromTime(t: string): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export default async function Home() {
  const today = todayInUganda();
  const nowMin = nowMinutesInUganda();

  const liveEvent = getLiveEvent(today);
  const upcoming = !liveEvent ? getUpcomingEvents(today, 1)[0] : undefined;
  const featuredEvent = liveEvent ?? upcoming;

  const todayProgram = liveEvent ? getTodayProgram(liveEvent.id, today) : null;

  let currentActivityId: number | null = null;
  if (todayProgram) {
    for (const a of todayProgram.activities) {
      const startMin = minutesFromTime(a.start_time);
      const endMin = a.end_time ? minutesFromTime(a.end_time) : 23 * 60 + 59;
      if (nowMin >= startMin && nowMin <= endMin) {
        currentActivityId = a.id;
        break;
      }
    }
  }

  // ============================================================
  // STATE A: Event exists — light neutral card
  // ============================================================
  if (featuredEvent) {
    return (
      <section className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

          {/* Badge */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            {liveEvent ? (
              <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                Live Now
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                ⏰ Coming Soon
              </span>
            )}
            {!liveEvent && upcoming && (
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Starts in {daysUntil(upcoming.start_date)} day
                {daysUntil(upcoming.start_date) === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight max-w-4xl text-gray-900 dark:text-gray-50">
            {featuredEvent.title}
          </h1>

          {featuredEvent.subtitle &&
            featuredEvent.subtitle !== featuredEvent.title && (
              <p className="mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
                {featuredEvent.subtitle}
              </p>
            )}

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            <span>
              📅 {formatShortDate(featuredEvent.start_date)} –{" "}
              {formatShortDate(featuredEvent.end_date)}
            </span>
            {featuredEvent.location && (
              <span>📍 {featuredEvent.location}</span>
            )}
          </div>

          {/* Today's preview */}
          {liveEvent && todayProgram && todayProgram.activities.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                {todayProgram.day.label || "Today"} — Happening Now
              </h2>
              <div className="space-y-2">
                {todayProgram.activities.slice(0, 6).map((act) => {
                  const isNow = act.id === currentActivityId;
                  const startMin = minutesFromTime(act.start_time);
                  const endMin = act.end_time
                    ? minutesFromTime(act.end_time)
                    : 23 * 60 + 59;
                  const isPast = nowMin > endMin;
                  return (
                    <div
                      key={act.id}
                      className={`flex flex-col sm:flex-row gap-2 sm:gap-4 rounded-lg p-3 sm:p-4 border-2 transition-colors ${
                        isNow
                          ? "bg-red-50 dark:bg-red-950 border-red-500 dark:border-red-600"
                          : isPast
                          ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60"
                          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
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
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                            {act.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {todayProgram.activities.length > 6 && (
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  + {todayProgram.activities.length - 6} more activit
                  {todayProgram.activities.length - 6 === 1 ? "y" : "ies"} today
                </p>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/events/${featuredEvent.slug}`}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3.5 rounded-lg font-semibold transition-colors text-sm sm:text-base"
            >
              View Full Program
              <span>→</span>
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700 px-6 py-3.5 rounded-lg font-medium transition-colors text-sm sm:text-base"
            >
              Browse All Services
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // STATE B: No event — limited services preview
  // ============================================================
  const language = await getActiveLanguage();
  const allServices = getLocalizedServices(language);
  const previewServices = allServices.slice(0, 6);
  const hasMore = allServices.length > 6;

  return (
    <div>
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          NIRA Services
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Access National Identification and Registration Authority services.
        </p>
      </header>

      <ServicesList initialServices={previewServices} />

      {hasMore && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-4 text-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            View all {allServices.length} services
            <span>→</span>
          </Link>
        </div>
      )}
    </div>
  );
}