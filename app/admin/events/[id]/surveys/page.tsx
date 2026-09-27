import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getEventById,
  getEventSurveys,
  getSurveyQuestions,
  getSurveyResponseCount,
} from "@/lib/db";
import {
  createSurveyAction,
  updateSurveyAction,
  deleteSurveyAction,
  createSurveyQuestionAction,
  deleteSurveyQuestionAction,
} from "@/lib/survey-actions";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  text: "Short text",
  long_text: "Long text",
  single_choice: "Single choice",
  multi_choice: "Multiple choice",
  rating: "Rating (1-5)",
  yes_no: "Yes / No",
};

export default async function AdminSurveysPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();

  const event = getEventById(id);
  if (!event) notFound();

  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;

  const surveys = getEventSurveys(id);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/admin/events/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500"
        >
          ← Back to Event
        </Link>
        <h1 className="text-2xl font-bold text-red-700 dark:text-red-400 mt-2">
          Surveys — {event.title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {surveys.length} surve{surveys.length === 1 ? "y" : "ys"} · Public URL:{" "}
          <span className="font-mono">/events/{event.slug}/surveys</span>
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-400">
          <strong className="font-medium">Could not save:</strong> {error}
        </div>
      )}

      {/* Add survey */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Add Survey
        </h2>
        <form
          action={createSurveyAction}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <input type="hidden" name="event_id" value={id} />

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Title <span className="text-red-600">*</span>
            </label>
            <input
              name="title"
              required
              placeholder="Post-event feedback"
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              rows={2}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" name="is_active" value="1" defaultChecked id="survey_active" />
            <label htmlFor="survey_active" className="text-sm">
              Active (accepts responses)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Closes at (optional)</label>
            <input
              name="closes_at"
              type="datetime-local"
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sort order</label>
            <input
              name="sort_order"
              type="number"
              defaultValue={0}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              className="bg-red-600 text-white px-5 py-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Add Survey
            </button>
          </div>
        </form>
      </section>

      {/* Existing surveys */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Existing Surveys ({surveys.length})
        </h2>

        {surveys.length === 0 ? (
          <p className="p-5 text-gray-400 dark:text-gray-500 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
            No surveys yet.
          </p>
        ) : (
          surveys.map((survey) => {
            const questions = getSurveyQuestions(survey.id);
            const responseCount = getSurveyResponseCount(survey.id);

            return (
              <div
                key={survey.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5"
              >
                <form action={updateSurveyAction} className="space-y-3">
                  <input type="hidden" name="id" value={survey.id} />
                  <input type="hidden" name="event_id" value={id} />

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Title
                    </label>
                    <input
                      name="title"
                      defaultValue={survey.title}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Description
                    </label>
                    <input
                      name="description"
                      defaultValue={survey.description}
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_active"
                        value="1"
                        defaultChecked={survey.is_active === 1}
                      />
                      Active
                    </label>
<Link
  href={`/admin/events/${id}/surveys/${survey.id}/responses`}
  className="text-red-600 dark:text-red-400 hover:underline text-sm font-medium"
>
  View {responseCount} response{responseCount === 1 ? "" : "s"} →
</Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Closes at
                      </label>
                      <input
                        name="closes_at"
                        type="datetime-local"
                        defaultValue={survey.closes_at ?? ""}
                        className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Sort order
                      </label>
                      <input
                        name="sort_order"
                        type="number"
                        defaultValue={survey.sort_order}
                        className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                  >
                    Update Survey
                  </button>
                </form>

                {/* Questions */}
                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Questions ({questions.length})
                  </h3>

                  <ol className="space-y-3 mb-4 list-decimal pl-5">
                    {questions.map((q) => {
                      let options: string[] = [];
                      try {
                        options = JSON.parse(q.options_json || "[]");
                      } catch {
                        options = [];
                      }
                      return (
                        <li key={q.id} className="text-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <span className="text-gray-800 dark:text-gray-100">
                                {q.prompt}
                              </span>
                              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                {KIND_LABELS[q.kind] ?? q.kind}
                              </span>
                              {q.is_required === 1 && (
                                <span className="ml-2 text-[10px] font-bold uppercase text-red-600">
                                  Required
                                </span>
                              )}
                              {options.length > 0 && (
                                <ul className="text-xs text-gray-500 dark:text-gray-400 mt-1 list-disc pl-4">
                                  {options.map((opt, i) => (
                                    <li key={i}>{opt}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <form action={deleteSurveyQuestionAction}>
                              <input type="hidden" name="id" value={q.id} />
                              <input type="hidden" name="event_id" value={id} />
                              <button
                                type="submit"
                                className="text-xs text-red-600 dark:text-red-400 hover:underline"
                              >
                                Remove
                              </button>
                            </form>
                          </div>
                        </li>
                      );
                    })}
                    {questions.length === 0 && (
                      <li className="text-xs text-gray-400 dark:text-gray-500 italic list-none -ml-5">
                        No questions yet — add at least one.
                      </li>
                    )}
                  </ol>

                  <form
                    action={createSurveyQuestionAction}
                    className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  >
                    <input type="hidden" name="survey_id" value={survey.id} />
                    <input type="hidden" name="event_id" value={id} />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Prompt
                        </label>
                        <input
                          name="prompt"
                          required
                          placeholder="How satisfied were you with the event?"
                          className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Type
                        </label>
                        <select
                          name="kind"
                          defaultValue="text"
                          className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                        >
                          {Object.entries(KIND_LABELS).map(([k, label]) => (
                            <option key={k} value={k}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Help text (optional)
                        </label>
                        <input
                          name="help_text"
                          className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Options (one per line — for choice types only)
                        </label>
                        <textarea
                          name="options_raw"
                          rows={3}
                          placeholder={"Very satisfied\nSatisfied\nNeutral\nDissatisfied"}
                          className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-mono"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="is_required"
                          value="1"
                          id={`req_${survey.id}`}
                        />
                        <label htmlFor={`req_${survey.id}`} className="text-sm">
                          Required
                        </label>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Sort order
                        </label>
                        <input
                          name="sort_order"
                          type="number"
                          defaultValue={0}
                          className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600 text-sm font-medium"
                    >
                      Add Question
                    </button>
                  </form>
                </div>

                {/* Delete survey */}
                <form
                  action={deleteSurveyAction}
                  className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800"
                >
                  <input type="hidden" name="id" value={survey.id} />
                  <input type="hidden" name="event_id" value={id} />
                  <button
                    type="submit"
                    className="text-sm px-3 py-1 border border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    Delete Survey
                  </button>
                </form>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}