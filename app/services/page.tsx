import Link from "next/link";
import { getLocalizedServices } from "@/lib/db";
import { getActiveLanguage } from "@/lib/language";
import ServicesList from "../ServicesList";

export const dynamic = "force-dynamic";

export default async function AllServicesPage() {
  const language = await getActiveLanguage();
  const services = getLocalizedServices(language);

  return (
    <div>
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 mb-3"
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          All NIRA Services
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {services.length} services available. Search or browse below.
        </p>
      </header>

      <ServicesList initialServices={services} />
    </div>
  );
}