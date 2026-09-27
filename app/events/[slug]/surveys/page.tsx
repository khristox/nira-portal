import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getEventBySlug,
  getEventSurveys,
  getSurveyQuestions,
} from "@/lib/db";
import SurveyForm from "@/components/SurveyForm";

export const dynamic = "force-dynamic";

export default async function PublicSurveysPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event || !event.is_published) notFound();

  const sp = await searchParams;
  const submittedId = sp.submitted ? Number(sp.submitted) : null;

  const surveys = getEventSurveys(event.id, true);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Link
        href={`/events/${slug}`}
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
        Back to Event
      </Link>

     <header className="mb-6 sm:mb-8">
        <span className="inline-block bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
          Surveys
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-3">
          {event.title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Share your feedback. Your responses help us improve.
        </p>
      </header>

      {submittedId && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 text-green-800 dark:text-green-300 text-sm">
          ✓ Thank you! Your response has been recorded.
        </div>
      )}

      {surveys.length === 0 ? (
        <p className="text-center py-16 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
          No surveys are currently open for this event.
        </p>
      ) : (
        <div className="space-y-8">
          {surveys.map((s) => {
            const questions = getSurveyQuestions(s.id);
            if (questions.length === 0) return null;
            return (
              <SurveyForm
                key={s.id}
                surveyId={s.id}
                slug={slug}
                title={s.title}
                description={s.description}
                questions={questions}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}