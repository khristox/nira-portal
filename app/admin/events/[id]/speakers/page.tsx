import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getEventById,
  getEventSpeakers,
  getEventDays,
  getEventActivities,
} from "@/lib/db";
import {
  createSpeakerAction,
  updateSpeakerAction,
  deleteSpeakerAction,
} from "@/lib/speaker-actions";

export const dynamic = "force-dynamic";

export default async function AdminSpeakersPage({
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

  const speakers = getEventSpeakers(id);

  // Build a flat list of activities across all days for the dropdown
  const days = getEventDays(id);
  const activityOptions: { id: number; label: string }[] = [];
  for (const day of days) {
    const acts = getEventActivities(day.id);
    for (const act of acts) {
      activityOptions.push({
        id: act.id,
        label: `${day.label || "Day"} — ${act.title}`,
      });
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/admin/events/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500"
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
        <h1 className="text-2xl font-bold text-red-700 dark:text-red-400 mt-2">
          Speakers — {event.title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {speakers.length} speaker{speakers.length === 1 ? "" : "s"} · Each
          speaker can be linked to a program activity.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-400">
          <strong className="font-medium">Could not save:</strong> {error}
        </div>
      )}

      {/* Add new speaker form */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Add Speaker
        </h2>
        <form
          action={createSpeakerAction}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <input type="hidden" name="event_id" value={id} />

          <div>
            <label className="block text-sm font-medium mb-1">
              Name <span className="text-red-600">*</span>
            </label>
            <input
              name="name"
              required
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Title / Role</label>
            <input
              name="title"
              placeholder="e.g., Chief Guest"
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Organization</label>
            <input
              name="organization"
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Website</label>
            <input
              name="website"
              type="url"
              placeholder="https://..."
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Link to Activity (optional)
            </label>
            <select
              name="activity_id"
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">— Not linked to a specific activity —</option>
              {activityOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              name="bio"
              rows={3}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Photo (base64 — paste a data: URL or leave blank)
            </label>
            <input
              name="photo_base64"
              placeholder="data:image/jpeg;base64,..."
              className="w-full p-2.5 font-mono text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
              Add Speaker
            </button>
          </div>
        </form>
      </section>

      {/* Existing speakers */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Existing Speakers ({speakers.length})
        </h2>

        {speakers.length === 0 ? (
          <p className="p-5 text-gray-400 dark:text-gray-500 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
            No speakers yet.
          </p>
        ) : (
          speakers.map((s) => (
            <div
              key={s.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5"
            >
              <form
                action={updateSpeakerAction}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="event_id" value={id} />

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Name
                  </label>
                  <input
                    name="name"
                    defaultValue={s.name}
                    required
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Title / Role
                  </label>
                  <input
                    name="title"
                    defaultValue={s.title}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Organization
                  </label>
                  <input
                    name="organization"
                    defaultValue={s.organization}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Website
                  </label>
                  <input
                    name="website"
                    type="url"
                    defaultValue={s.website}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Linked Activity
                  </label>
                  <select
                    name="activity_id"
                    defaultValue={s.activity_id ?? ""}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="">— Not linked —</option>
                    {activityOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    rows={2}
                    defaultValue={s.bio}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Photo (base64)
                  </label>
                  <input
                    name="photo_base64"
                    defaultValue={s.photo_base64}
                    className="w-full p-2 font-mono text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Sort order
                  </label>
                  <input
                    name="sort_order"
                    type="number"
                    defaultValue={s.sort_order}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                  >
                    Update
                  </button>
                  {s.photo_base64 && (
                    <img
                      src={s.photo_base64}
                      alt={s.name}
                      className="h-12 w-12 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                    />
                  )}
                </div>
              </form>

              <form action={deleteSpeakerAction} className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="event_id" value={id} />
                <button
                  type="submit"
                  className="text-sm px-3 py-1 border border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950"
                >
                  Delete Speaker
                </button>
              </form>
            </div>
          ))
        )}
      </section>
    </div>
  );
}