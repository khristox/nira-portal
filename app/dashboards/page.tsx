import Link from "next/link";
import { getAllServices } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function DashboardsPage() {
  const dashboards = getAllServices().filter(
    (s) => s.chart_url && s.chart_url.trim() !== ""
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Live Dashboards
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Real-time data feeds from NIRA services.
        </p>
      </header>

      {dashboards.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
          <svg
            className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 3v18h18M7 14l4-4 4 4 6-6"
            />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">
            No dashboards configured yet.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Add a chart embed URL when creating a service to see it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dashboards.map((service) => (
            <div
              key={service.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col"
            >
              <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 min-w-0">
                  {service.emoji?.trim() && (
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 text-xl">
                      {service.emoji}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                      {service.title}
                    </h2>
                    {service.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {service.description}
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  href={`/services/${service.id}`}
                  className="text-xs text-red-600 dark:text-red-500 hover:underline flex-shrink-0"
                >
                  Details →
                </Link>
              </div>

              <iframe
                src={service.chart_url ?? ""}
                title={service.title}
                className="w-full h-[400px] border-0 bg-gray-50 dark:bg-gray-950"
                sandbox="allow-scripts allow-same-origin allow-popups"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}