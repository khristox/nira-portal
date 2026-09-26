"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "@/lib/constants";

export default function LanguageSwitcher({ current }: { current: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(current);

  useEffect(() => {
    setSelected(current);
  }, [current]);

  async function change(code: string) {
    setSelected(code);
    setOpen(false);
    await fetch("/api/language", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    router.refresh();
  }

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === selected) ??
    SUPPORTED_LANGUAGES.find((l) => l.code === DEFAULT_LANGUAGE)!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
      >
        <span className="text-base leading-none">{currentLang.emoji}</span>
        <span className="hidden sm:inline text-xs font-semibold text-gray-600 dark:text-gray-300">
          {currentLang.code.toUpperCase()}
        </span>
        <svg
          className="w-3 h-3"
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
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <ul
            role="listbox"
            className="absolute right-0 mt-1 w-56 max-h-80 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <li key={lang.code}>
                <button
                  onClick={() => change(lang.code)}
                  role="option"
                  aria-selected={lang.code === selected}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    lang.code === selected
                      ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 font-medium"
                      : "text-gray-700 dark:text-gray-200"
                  }`}
                >
                  <span className="text-base leading-none">{lang.emoji}</span>
                  <span className="flex-1">{lang.native}</span>
                  {lang.code === selected && (
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}