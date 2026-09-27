"use client";

import { useState, useTransition } from "react";
import { submitSurveyAction } from "@/lib/survey-actions";

type Question = {
  id: number;
  kind: string;
  prompt: string;
  help_text: string;
  options_json: string;
  is_required: number;
  sort_order: number;
};

export default function SurveyForm({
  surveyId,
  slug,
  title,
  description,
  questions,
}: {
  surveyId: number;
  slug: string;
  title: string;
  description: string;
  questions: Question[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await submitSurveyAction(formData);
      if (res && !res.ok) {
        setError(res.error ?? "Could not submit.");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
className="bg-white dark:bg-gray-900 border-0 sm:border sm:border-gray-200 sm:dark:border-gray-800 rounded-none sm:rounded-xl p-4 sm:p-6 space-y-5 sm:space-y-6"
    >
      <input type="hidden" name="survey_id" value={surveyId} />
      <input type="hidden" name="slug" value={slug} />

      <header>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
            {description}
          </p>
        )}
      </header>

      {questions.map((q, idx) => {
        let options: string[] = [];
        try {
          options = JSON.parse(q.options_json || "[]");
        } catch {
          options = [];
        }

        const name = `q_${q.id}`;

        return (
          <div
            key={q.id}
            className="border-t border-gray-100 dark:border-gray-800 pt-4 sm:pt-5"
          >
            <label className="block font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm sm:text-base leading-snug">
              <span className="text-gray-400 dark:text-gray-500 mr-1.5">
                {idx + 1}.
              </span>
              {q.prompt}
              {q.is_required === 1 && (
                <span className="text-red-600 ml-1" aria-label="required">
                  *
                </span>
              )}
            </label>

            {q.help_text && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2.5 leading-relaxed">
                {q.help_text}
              </p>
            )}

            {q.kind === "text" && (
              <input
                name={name}
                required={q.is_required === 1}
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-base"
              />
            )}

            {q.kind === "long_text" && (
              <textarea
                name={name}
                rows={4}
                required={q.is_required === 1}
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-base resize-y"
              />
            )}

            {q.kind === "single_choice" && (
              <div className="space-y-1">
                {options.map((opt, i) => (
                  <label
                    key={i}
                    className="flex items-start gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <input
                      type="radio"
                      name={name}
                      value={opt}
                      required={q.is_required === 1 && i === 0}
                      className="mt-0.5 w-4 h-4 flex-shrink-0 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                      {opt}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {q.kind === "multi_choice" && (
              <div className="space-y-1">
                {options.map((opt, i) => (
                  <label
                    key={i}
                    className="flex items-start gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <input
                      type="checkbox"
                      name={name}
                      value={opt}
                      className="mt-0.5 w-4 h-4 flex-shrink-0 text-red-600 rounded focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                      {opt}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {q.kind === "rating" && (
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label
                    key={n}
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name={name}
                      value={String(n)}
                      required={q.is_required === 1 && n === 1}
                      className="sr-only peer"
                    />
                    <span
                      className="text-3xl sm:text-4xl text-gray-300 dark:text-gray-700 peer-checked:text-yellow-500 group-hover:text-yellow-400 transition-colors leading-none"
                      aria-hidden="true"
                    >
                      ★
                    </span>
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                      {n}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {q.kind === "yes_no" && (
              <div className="flex gap-2 sm:gap-3 flex-wrap">
                {["Yes", "No"].map((v) => (
                  <label
                    key={v}
                    className="flex items-center gap-2 text-sm px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-w-[5rem]"
                  >
                    <input
                      type="radio"
                      name={name}
                      value={v}
                      required={q.is_required === 1 && v === "Yes"}
                      className="w-4 h-4 text-red-600 focus:ring-red-500"
                    />
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {v}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Respondent name */}
      <div className="border-t border-gray-100 dark:border-gray-800 pt-4 sm:pt-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Your name{" "}
          <span className="text-gray-400 dark:text-gray-500 font-normal">
            (optional)
          </span>
        </label>
        <input
          name="respondent"
          placeholder="Leave blank for anonymous"
          className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-base"
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-base"
      >
        {pending ? "Submitting…" : "Submit Response"}
      </button>
    </form>
  );
}