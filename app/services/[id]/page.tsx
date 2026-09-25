import { notFound } from "next/navigation";
import Link from "next/link";
import { getServiceById } from "@/lib/db";
import RichContent from "@/components/RichContent";
import ChartEmbed from "@/components/ChartEmbed";

export const dynamic = "force-dynamic";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = getServiceById(Number(id));
  if (!service) notFound();

  const hasEmoji = !!service.emoji?.trim();
  const hasUrl = !!service.url?.trim();
  const hasHtml = !!service.content_html?.trim();
  const hasChart = !!service.chart_url?.trim();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Back link */}
      <Link
        href="/"
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500"
      >
        ← Back to all services
      </Link>

      {/* Header — emoji hidden on mobile (< 640px) */}
      <header className="mt-4 flex items-start gap-3 sm:gap-4">
        {hasEmoji && (
          <div className="hidden sm:flex w-16 h-16 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 text-3xl">
            {service.emoji}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
            {service.title}
          </h1>
          {service.description && (
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
              {service.description}
            </p>
          )}
        </div>
      </header>

      {/* Open external link — only when URL exists */}
      {hasUrl && (
        <div className="mt-5 sm:mt-6">
          <a
            href={service.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-red-600 text-white px-4 sm:px-5 py-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm sm:text-base"
          >
            Open Service
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
                d="M14 3h7m0 0v7m0-7L10 14M5 21h14a2 2 0 002-2V9a2 2 0 00-2-2h-5"
              />
            </svg>
          </a>
        </div>
      )}

      {/* Rich HTML content */}
      {hasHtml && (
        <section className="mt-6 sm:mt-10">
          <RichContent html={service.content_html} />
        </section>
      )}

      {/* Chart embed */}
      {hasChart && (
        <section className="mt-6 sm:mt-10">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
            Live Data
          </h2>
          <ChartEmbed url={service.chart_url} />
        </section>
      )}

      {/* Fallback when nothing else */}
      {!hasUrl && !hasHtml && !hasChart && (
        <div className="mt-8 p-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
          This service has no additional content yet.
        </div>
      )}
    </div>
  );
}