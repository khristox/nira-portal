import Link from "next/link";
import {
  getLocalizedServices,
  getLiveEvent,
  getUpcomingEvents,
} from "@/lib/db";
import { getActiveLanguage, DEFAULT_LANGUAGE } from "@/lib/language";
import ServicesList from "./ServicesList";

export const dynamic = "force-dynamic";

function formatShortDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function daysUntil(iso: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(iso + "T00:00:00");
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

export default async function Home() {
  const language = await getActiveLanguage();
  const services = getLocalizedServices(language);
  const today = new Date().toISOString().slice(0, 10);

  const liveEvent = getLiveEvent(today);
  const upcoming = !liveEvent ? getUpcomingEvents(today, 1)[0] : undefined;
  const featuredEvent = liveEvent ?? upcoming;

  const anyTranslated = services.some((s) => s.translationApplied);
  const showFallbackNotice = language !== DEFAULT_LANGUAGE && !anyTranslated;

  return (
    <>
      {showFallbackNotice && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="text-xs bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 rounded-lg px-3 py-2 text-center">
            Content not yet available in your language. Showing English.
          </div>
        </div>
      )}

      {/* Featured event — live or upcoming */}
      {featuredEvent ? (
        <section className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex items-center gap-3 mb-4">
              {liveEvent ? (
                <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Live Now
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  ⏰ Coming Soon
                </span>
              )}
              {!liveEvent && upcoming && (
                <span className="text-xs text-red-100">
                  Starts in {daysUntil(upcoming.start_date)} day
                  {daysUntil(upcoming.start_date) === 1 ? "" : "s"}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight max-w-4xl">
              {featuredEvent.title}
            </h1>

            {featuredEvent.subtitle && (
              <p className="mt-3 text-base sm:text-lg text-red-100 max-w-3xl">
                {featuredEvent.subtitle}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-red-100">
              <span>
                📅 {formatShortDate(featuredEvent.start_date)} –{" "}
                {formatShortDate(featuredEvent.end_date)}
              </span>
              {featuredEvent.location && (
                <span>📍 {featuredEvent.location}</span>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/events/${featuredEvent.slug}`}
                className="inline-flex items-center gap-2 bg-white text-red-700 px-5 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors text-sm sm:text-base"
              >
                View Full Program
                <span>→</span>
              </Link>
              <a
                href="#services"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-lg font-medium transition-colors text-sm sm:text-base border border-white/20"
              >
                Browse Services
              </a>
            </div>
          </div>
        </section>
      ) : null}

      {/* Services section */}
      <section id="services" className="pt-2">
        {featuredEvent && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              All NIRA Services
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Search, filter, and open any service below.
            </p>
          </div>
        )}
        <ServicesList initialServices={services} />
      </section>
    </>
  );
}