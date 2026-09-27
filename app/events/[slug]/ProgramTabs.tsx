"use client";

import { useState } from "react";

type EventActivity = {
  id: number;
  day_id: number;
  start_time: string;
  end_time: string;
  title: string;
  description: string;
  sort_order: number;
};

type EventDay = {
  id: number;
  event_id: number;
  date: string;
  label: string;
  sort_order: number;
  activities: EventActivity[];
};

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

function minutesFromTime(t: string): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export default function ProgramTabs({
  days,
  today,
  nowMin,
  isLive,
}: {
  days: EventDay[];
  today: string;
  nowMin: number;
  isLive: boolean;
}) {
  const defaultIdx = (() => {
    if (isLive) {
      const i = days.findIndex((d) => d.date === today);
      if (i >= 0) return i;
    }
    return 0;
  })();

  const [activeIdx, setActiveIdx] = useState(defaultIdx);
  const activeDay = days[activeIdx];

  if (days.length === 0) {
    return (
      <section>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          Program
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Program will be announced soon.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Program
      </h2>

      {/* Mobile: dropdown */}
      <div className="md:hidden mb-5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
          Select a day
        </label>
        <div className="relative">
          <select
            value={activeIdx}
            onChange={(e) => setActiveIdx(Number(e.target.value))}
            className="w-full appearance-none p-3 pr-10 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {days.map((day, idx) => {
              const isToday = day.date === today;
              return (
                <option key={day.id} value={idx}>
                  {day.label || `Day ${idx + 1}`} — {formatDateShort(day.date)}
                  {isToday ? " (Today)" : ""}
                </option>
              );
            })}
          </select>
          <svg
            className="w-4 h-4 text-gray-500 dark:text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Desktop: tabs */}
      <div className="hidden md:block border-b border-gray-200 dark:border-gray-800 mb-5">
        <div className="flex gap-1 overflow-x-auto -mb-px pb-1">
          {days.map((day, idx) => {
            const isToday = day.date === today;
            const isActive = idx === activeIdx;
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-red-600 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{day.label || `Day ${idx + 1}`}</span>
                  {isToday && (
                    <span className="text-[10px] font-bold uppercase bg-red-600 text-white px-1.5 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-normal text-gray-500 dark:text-gray-500 mt-0.5">
                  {formatDateShort(day.date)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active day's content */}
      <div className="mb-5">
        <div className="flex items-baseline gap-3 mb-4 flex-wrap">
          <h3 className="text-lg font-bold text-red-700 dark:text-red-400">
            {activeDay.label || `Day ${activeIdx + 1}`}
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatDateLong(activeDay.date)}
          </span>
          {activeDay.date === today && isLive && (
            <span className="text-[10px] font-bold uppercase bg-red-600 text-white px-2 py-0.5 rounded-full">
              Today
            </span>
          )}
        </div>

        {activeDay.activities.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No activities scheduled for this day.
          </p>
        ) : (
          <div className="space-y-3">
            {activeDay.activities.map((act) => {
              const isToday = activeDay.date === today;
              const startMin = minutesFromTime(act.start_time);
              const endMin = act.end_time
                ? minutesFromTime(act.end_time)
                : 23 * 60 + 59;
              const isNow =
                isLive && isToday && nowMin >= startMin && nowMin <= endMin;
              const isPast = isLive && isToday && nowMin > endMin;

              return (
                <div
                  key={act.id}
                  className={`flex flex-col sm:flex-row gap-2 sm:gap-6 rounded-lg p-4 border-2 transition-colors ${
                    isNow
                      ? "bg-red-50 dark:bg-red-950 border-red-500 shadow-md"
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

      {/* Prev / Next */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
          disabled={activeIdx === 0}
          className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-colors ${
            activeIdx === 0
              ? "border-gray-200 dark:border-gray-800 text-gray-300 dark:text-gray-700 cursor-not-allowed"
              : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          ← Previous
        </button>

        <span className="text-xs text-gray-500 dark:text-gray-400">
          {activeIdx + 1} / {days.length}
        </span>

        <button
          type="button"
          onClick={() => setActiveIdx((i) => Math.min(days.length - 1, i + 1))}
          disabled={activeIdx === days.length - 1}
          className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-colors ${
            activeIdx === days.length - 1
              ? "border-gray-200 dark:border-gray-800 text-gray-300 dark:text-gray-700 cursor-not-allowed"
              : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          Next →
        </button>
      </div>
    </section>
  );
}