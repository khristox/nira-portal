"use client";

import { useState } from "react";
import Link from "next/link";
import type { Service } from "@/lib/db";

// One color per letter of the alphabet (A → Z)
const LETTER_COLORS: Record<string, string> = {
  A: "border-t-red-500",
  B: "border-t-orange-500",
  C: "border-t-amber-500",
  D: "border-t-yellow-500",
  E: "border-t-lime-500",
  F: "border-t-green-500",
  G: "border-t-emerald-500",
  H: "border-t-teal-500",
  I: "border-t-cyan-500",
  J: "border-t-sky-500",
  K: "border-t-blue-500",
  L: "border-t-indigo-500",
  M: "border-t-violet-500",
  N: "border-t-purple-500",
  O: "border-t-fuchsia-500",
  P: "border-t-pink-500",
  Q: "border-t-rose-500",
  R: "border-t-red-600",
  S: "border-t-orange-600",
  T: "border-t-amber-600",
  U: "border-t-yellow-600",
  V: "border-t-lime-600",
  W: "border-t-emerald-600",
  X: "border-t-teal-600",
  Y: "border-t-cyan-600",
  Z: "border-t-blue-600",
};

// Fallback for numbers or non-Latin first characters
const FALLBACK_COLOR = "border-t-gray-400";

function getAccent(title: string): string {
  const firstChar = title.trim().charAt(0).toUpperCase();
  return LETTER_COLORS[firstChar] ?? FALLBACK_COLOR;
}

export default function ServicesList({
  initialServices,
}: {
  initialServices: Service[];
}) {
  const [search, setSearch] = useState("");

  const filtered = initialServices.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      (s.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <h2 className="text-center text-gray-700 dark:text-gray-300 text-lg sm:text-xl font-semibold mb-4">
        Search services
      </h2>

      <div className="max-w-2xl mx-auto mb-8">
        <input
          type="text"
          placeholder="Search by title or URL..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 sm:p-4 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 dark:text-gray-500">
            {initialServices.length === 0
              ? "No services have been added yet."
              : "No services match your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map((service) => {
            const accent = getAccent(service.title);
            const hasEmoji = !!service.emoji?.trim();

            return (
              <Link
                key={service.id}
                href={`/services/${service.id}`}
                className={`group bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 border-t-4 ${accent} hover:shadow-md transition-all flex items-start gap-4 p-5`}
              >
                {hasEmoji && (
                  <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 text-2xl">
                    {service.emoji}
                  </div>
                )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-base sm:text-lg group-hover:text-red-700 dark:group-hover:text-red-500 transition-colors">
                  {service.title}
                </h3>
                {service.chart_url?.trim() && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-100 dark:border-red-900">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M7 14l4-4 4 4 6-6" />
                    </svg>
                    Dashboard
                  </span>
                )}
              </div>
              {service.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                  {service.description}
                </p>
              )}
            </div>

                <svg
                  className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-red-600 flex-shrink-0 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}