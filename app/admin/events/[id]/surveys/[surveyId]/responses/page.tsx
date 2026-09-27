import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getEventById,
  getSurveyById,
  getSurveyQuestions,
  getSurveyResponses,
  getSurveyAnswersForResponse,
  getSurveyAnswerTallies,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SurveyResponsesPage({
  params,
}: {
  params: Promise<{ id: string; surveyId: string }>;
}) {
  const { id: idStr, surveyId: surveyIdStr } = await params;
  const id = Number(idStr);
  const surveyId = Number(surveyIdStr);
  if (!Number.isFinite(id) || !Number.isFinite(surveyId)) notFound();

  const event = getEventById(id);
  if (!event) notFound();

  const survey = getSurveyById(surveyId);
  if (!survey || survey.event_id !== id) notFound();

  const questions = getSurveyQuestions(surveyId);
  const responses = getSurveyResponses(surveyId);
  const tallies = getSurveyAnswerTallies(surveyId);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/admin/events/${id}/surveys`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500"
        >
          ← Back to Surveys
        </Link>
        <h1 className="text-2xl font-bold text-red-700 dark:text-red-400 mt-2">
          Responses — {survey.title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {responses.length} response{responses.length === 1 ? "" : "s"} ·{" "}
          {questions.length} question{questions.length === 1 ? "" : "s"}
        </p>
      </div>

      {responses.length === 0 ? (
        <p className="p-8 text-gray-400 dark:text-gray-500 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
          No responses yet.
        </p>
      ) : (
        <>
          {/* Aggregate tallies */}
          <section className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-8">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Aggregate Results
            </h2>
            <div className="space-y-5">
              {questions.map((q) => {
                const t = tallies[q.id] ?? {};
                const total = Object.values(t).reduce((s, n) => s + n, 0);

                // Free-text — just show how many answered
                if (q.kind === "text" || q.kind === "long_text") {
                  return (
                    <div key={q.id}>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {q.prompt}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {total} answer{total === 1 ? "" : "s"} — see individual
                        responses below
                      </p>
                    </div>
                  );
                }

                // Everything else — show bar chart
                const entries = Object.entries(t).sort(
                  (a, b) => b[1] - a[1]
                );
                return (
                  <div key={q.id}>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {q.prompt}
                    </p>
                    <div className="space-y-1.5">
                      {entries.length === 0 && (
                        <p className="text-xs text-gray-400 italic">
                          No answers yet.
                        </p>
                      )}
                      {entries.map(([label, count]) => {
                        const pct =
                          total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={label} className="relative">
                            <div className="relative flex items-center justify-between px-3 py-2 border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                              <div
                                className="absolute inset-y-0 left-0 bg-red-100 dark:bg-red-950"
                                style={{ width: `${pct}%` }}
                              />
                              <span className="relative text-sm text-gray-800 dark:text-gray-100">
                                {label}
                              </span>
                              <span className="relative text-xs text-gray-600 dark:text-gray-300 tabular-nums">
                                {count} · {pct}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Individual responses */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Individual Responses
            </h2>
            {responses.map((response, idx) => {
              const answers = getSurveyAnswersForResponse(response.id);
              const answerMap = new Map(
                answers.map((a) => [a.question_id, a.value_text])
              );

              return (
                <div
                  key={response.id}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5"
                >
                  <div className="flex items-baseline justify-between gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {response.respondent?.trim() || "Anonymous"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      #{responses.length - idx} ·{" "}
                      {new Date(response.created_at + "Z").toLocaleString(
                        "en-GB"
                      )}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {questions.map((q) => {
                      const value = answerMap.get(q.id);
                      return (
                        <div key={q.id}>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {q.prompt}
                          </p>
                          <p className="text-sm text-gray-800 dark:text-gray-100 mt-0.5">
                            {value && value.trim() ? (
                              value
                            ) : (
                              <span className="italic text-gray-400">
                                (no answer)
                              </span>
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}