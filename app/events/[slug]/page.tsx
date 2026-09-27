import { notFound } from "next/navigation";
import Link from "next/link";
import { getEventWithProgram } from "@/lib/db";
import { todayInUganda, nowMinutesInUganda } from "@/lib/time";
import ProgramTabs from "./ProgramTabs";
import { getEventSpeakers, getEventProducts, getEventPolls, getEventSurveys } from "@/lib/db";



export const dynamic = "force-dynamic";

function formatDateShort(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatDateLong(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEventWithProgram(slug);
  
  if (!event || !event.is_published) notFound();
  const speakers = getEventSpeakers(event.id);
const products = getEventProducts(event.id);
const activePolls = getEventPolls(event.id, true);
const activeSurveys = getEventSurveys(event.id, true);


  const today = todayInUganda();
  const nowMin = nowMinutesInUganda();
  const isLive = event.start_date <= today && event.end_date >= today;

  const hasDescription = !!event.description?.trim();
  const hasSubtitle =
    !!event.subtitle?.trim() && event.subtitle.trim() !== event.title.trim();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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

      <header className={hasDescription ? "mb-8" : "mb-4"}>
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
              Live Now
            </span>
          ) : (
            <span className="inline-block bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              Event
            </span>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDateShort(event.start_date)} – {formatDateShort(event.end_date)}
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50 leading-tight">
          {event.title}
        </h1>

        {hasSubtitle && (
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mt-2">
            {event.subtitle}
          </p>
        )}

        {event.location?.trim() && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            📍 {event.location}
          </p>
        )}

        {!hasDescription && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            📅 {formatDateLong(event.start_date)} –{" "}
            {formatDateLong(event.end_date)}
          </p>
        )}
      </header>

      {hasDescription && (
        <div
          className="prose prose-slate dark:prose-invert max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: event.description }}
        />
      )}

      <ProgramTabs
        days={event.days}
        today={today}
        nowMin={nowMin}
        isLive={isLive}
      />

{activePolls.length > 0 && (
  <section className="mt-10">
    <Link
      href={`/events/${slug}/polls`}
      className="flex items-center justify-between gap-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl p-5 hover:bg-red-100 dark:hover:bg-red-950 transition-colors"
    >
      <div className="min-w-0">
        <h3 className="font-semibold text-red-800 dark:text-red-300">
          📊 Vote in our polls
        </h3>
        <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">
          {activePolls.length} active poll{activePolls.length === 1 ? "" : "s"} · One vote per browser
        </p>
      </div>
      <span className="text-red-700 dark:text-red-400 text-xl flex-shrink-0">→</span>
    </Link>
  </section>
)}

{activeSurveys.length > 0 && (
  <section className="mt-4">
    <Link
      href={`/events/${slug}/surveys`}
      className="flex items-center justify-between gap-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-5 hover:bg-blue-100 dark:hover:bg-blue-950 transition-colors"
    >
      <div className="min-w-0">
        <h3 className="font-semibold text-blue-800 dark:text-blue-300">
          📝 Take our survey
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-400 mt-0.5">
          {activeSurveys.length} open surve{activeSurveys.length === 1 ? "y" : "ys"} · Help us improve
        </p>
      </div>
      <span className="text-blue-700 dark:text-blue-400 text-xl flex-shrink-0">→</span>
    </Link>
  </section>
)}
    
    {/* Speakers */}
{speakers.length > 0 && (
  <section className="mt-14">
    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-5">
      Speakers
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {speakers.map((s) => (
        <div
          key={s.id}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex flex-col items-center text-center"
        >
          {s.photo_base64 ? (
            <img
              src={s.photo_base64}
              alt={s.name}
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-100 dark:border-gray-800 mb-3"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 flex items-center justify-center text-3xl font-bold mb-3">
              {s.name.charAt(0).toUpperCase()}
            </div>
          )}

          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {s.name}
          </h3>

          {s.title && (
            <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">
              {s.title}
            </p>
          )}

          {s.organization && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {s.organization}
            </p>
          )}

          {s.bio && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">
              {s.bio}
            </p>
          )}

          {s.website && (
            <a
              href={s.website}
              target="_blank"
              rel="noreferrer"
              className="mt-3 text-xs text-red-600 dark:text-red-500 hover:underline"
            >
              Website →
            </a>
          )}
        </div>
      ))}
    </div>
  </section>
)}

{/* Products */}
{products.length > 0 && (
  <section className="mt-14">
    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-5">
      Products on Display
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {products.map((p) => (
        <div
          key={p.id}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden flex flex-col"
        >
          {p.image_base64 ? (
            <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <img
                src={p.image_base64}
                alt={p.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[4/3] bg-red-50 dark:bg-red-950 flex items-center justify-center text-5xl">
              📦
            </div>
          )}

          <div className="p-5 flex flex-col flex-1">
            {p.category && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full self-start mb-2">
                {p.category}
              </span>
            )}

            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {p.name}
            </h3>

            {p.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed flex-1">
                {p.description}
              </p>
            )}

            {p.website && (
              <a
                href={p.website}
                target="_blank"
                rel="noreferrer"
                className="mt-3 text-sm text-red-600 dark:text-red-500 hover:underline self-start"
              >
                Learn more →
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  </section>
)}
      {event.sponsors.length > 0 && (
        <section className="mt-14">
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
                  <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
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