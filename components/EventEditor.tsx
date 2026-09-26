"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveEventAction, deleteEventAction, togglePublishAction } from "@/lib/events-actions";
import type { EventWithProgram } from "@/lib/db";

type DayDraft = {
  key: string;
  date: string;
  label: string;
  activities: {
    key: string;
    start_time: string;
    end_time: string;
    title: string;
    description: string;
  }[];
};

type SponsorDraft = {
  key: string;
  name: string;
  logo_base64: string;
  website: string;
  tier: string;
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyDay(): DayDraft {
  return { key: uid(), date: "", label: "", activities: [emptyActivity()] };
}

function emptyActivity() {
  return {
    key: uid(),
    start_time: "",
    end_time: "",
    title: "",
    description: "",
  };
}

function emptySponsor(): SponsorDraft {
  return { key: uid(), name: "", logo_base64: "", website: "", tier: "partner" };
}

export default function EventEditor({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: EventWithProgram | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [startDate, setStartDate] = useState(initial?.start_date ?? "");
  const [endDate, setEndDate] = useState(initial?.end_date ?? "");
  const [isPublished, setIsPublished] = useState(!!initial?.is_published);

  const [days, setDays] = useState<DayDraft[]>(
    initial?.days.length
      ? initial.days.map((d) => ({
          key: uid(),
          date: d.date,
          label: d.label,
          activities: d.activities.length
            ? d.activities.map((a) => ({
                key: uid(),
                start_time: a.start_time,
                end_time: a.end_time,
                title: a.title,
                description: a.description,
              }))
            : [emptyActivity()],
        }))
      : [emptyDay()]
  );

  const [sponsors, setSponsors] = useState<SponsorDraft[]>(
    initial?.sponsors.length
      ? initial.sponsors.map((s) => ({
          key: uid(),
          name: s.name,
          logo_base64: s.logo_base64,
          website: s.website,
          tier: s.tier,
        }))
      : []
  );

  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Auto-slug from title
  function updateTitle(v: string) {
    setTitle(v);
    if (!initial && (!slug || slug === slugify(title))) {
      setSlug(slugify(v));
    }
  }

  function slugify(s: string) {
    return s.toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function addDay() {
    setDays((prev) => [...prev, emptyDay()]);
  }
  function removeDay(key: string) {
    setDays((prev) => prev.filter((d) => d.key !== key));
  }
  function updateDay(key: string, patch: Partial<DayDraft>) {
    setDays((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }

  function addActivity(dayKey: string) {
    setDays((prev) =>
      prev.map((d) =>
        d.key === dayKey
          ? { ...d, activities: [...d.activities, emptyActivity()] }
          : d
      )
    );
  }
  function removeActivity(dayKey: string, actKey: string) {
    setDays((prev) =>
      prev.map((d) =>
        d.key === dayKey
          ? { ...d, activities: d.activities.filter((a) => a.key !== actKey) }
          : d
      )
    );
  }
  function updateActivity(dayKey: string, actKey: string, patch: Partial<DayDraft["activities"][number]>) {
    setDays((prev) =>
      prev.map((d) =>
        d.key === dayKey
          ? {
              ...d,
              activities: d.activities.map((a) =>
                a.key === actKey ? { ...a, ...patch } : a
              ),
            }
          : d
      )
    );
  }

  function addSponsor() {
    setSponsors((prev) => [...prev, emptySponsor()]);
  }
  function removeSponsor(key: string) {
    setSponsors((prev) => prev.filter((s) => s.key !== key));
  }
  function updateSponsor(key: string, patch: Partial<SponsorDraft>) {
    setSponsors((prev) =>
      prev.map((s) => (s.key === key ? { ...s, ...patch } : s))
    );
  }

  async function handleFile(key: string, file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Logo must be an image.");
      return;
    }
    if (file.size > 150_000) {
      setError("Logo must be under 150 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateSponsor(key, { logo_base64: reader.result as string });
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  function save() {
    setError(null);
    setSavedMsg(null);

    if (!title.trim()) return setError("Title is required.");
    if (!slug.trim()) return setError("Slug is required.");
    if (!startDate || !endDate) return setError("Start and end dates are required.");
    if (endDate < startDate) return setError("End date must be on or after start date.");

    const payload = {
      id: initial?.id,
      slug: slug.trim(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      location: location.trim(),
      banner_url: initial?.banner_url ?? "",
      start_date: startDate,
      end_date: endDate,
      is_published: isPublished,
      days: days.map((d, di) => ({
        date: d.date,
        label: d.label,
        sort_order: di,
        activities: d.activities
          .filter((a) => a.title.trim())
          .map((a, ai) => ({
            start_time: a.start_time,
            end_time: a.end_time,
            title: a.title.trim(),
            description: a.description.trim(),
            sort_order: ai,
          })),
      })),
      sponsors: sponsors
        .filter((s) => s.name.trim())
        .map((s, si) => ({
          name: s.name.trim(),
          logo_base64: s.logo_base64,
          website: s.website.trim(),
          tier: s.tier,
          sort_order: si,
        })),
    };

    const fd = new FormData();
    fd.set("payload", JSON.stringify(payload));

    startTransition(async () => {
      const res = await saveEventAction(fd);
      if (res?.ok) {
        setSavedMsg("Saved.");
        if (mode === "create" && res.id) {
          router.replace(`/admin/events/${res.id}`);
        } else {
          router.refresh();
        }
      } else {
        setError(res?.error ?? "Save failed.");
      }
    });
  }

  function remove() {
    if (!initial?.id) return;
    if (!confirm("Delete this event permanently?")) return;
    const fd = new FormData();
    fd.set("id", String(initial.id));
    startTransition(async () => {
      await deleteEventAction(fd);
    });
  }

  function togglePublish() {
    const next = !isPublished;
    setIsPublished(next);
    if (initial?.id) {
      const fd = new FormData();
      fd.set("id", String(initial.id));
      fd.set("publish", next ? "1" : "0");
      startTransition(async () => {
        await togglePublishAction(fd);
      });
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/admin/events"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600"
          >
            ← All Events
          </Link>
          <h1 className="text-2xl font-bold text-red-700 dark:text-red-400 mt-1">
            {mode === "create" ? "New Event" : "Edit Event"}
          </h1>
        </div>
        {initial?.id && (
          <div className="flex gap-2">
            <button
              onClick={togglePublish}
              type="button"
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                isPublished
                  ? "border-green-300 text-green-700 dark:text-green-400 dark:border-green-900 hover:bg-green-50 dark:hover:bg-green-950"
                  : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {isPublished ? "Unpublish" : "Publish"}
            </button>
            <button
              onClick={remove}
              type="button"
              className="px-3 py-1.5 text-sm rounded-lg border border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      {savedMsg && (
        <div className="mb-5 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 text-sm text-green-700 dark:text-green-400">
          {savedMsg}
        </div>
      )}

      {/* Basic fields */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              value={title}
              onChange={(e) => updateTitle(e.target.value)}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              placeholder="My Identity Expo & Symposium 2026"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug *</label>
            <input
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 font-mono text-sm"
              placeholder="my-identity-expo-2026"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              URL: /events/{slug || "..."}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              placeholder="Kampala, Uganda"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Subtitle</label>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              placeholder="Short one-line description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Date *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date *</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Description (optional HTML)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 font-mono text-sm"
            />
          </div>
        </div>
      </section>

      {/* Days & activities */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Program Days</h2>
          <button
            type="button"
            onClick={addDay}
            className="text-sm px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            + Add Day
          </button>
        </div>

        <div className="space-y-6">
          {days.map((day, di) => (
            <div key={day.key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-3 mb-4">
                <input
                  value={day.label}
                  onChange={(e) => updateDay(day.key, { label: e.target.value })}
                  placeholder={`Day ${di + 1}`}
                  className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                />
                <input
                  type="date"
                  value={day.date}
                  onChange={(e) => updateDay(day.key, { date: e.target.value })}
                  className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                />
                <button
                  type="button"
                  onClick={() => removeDay(day.key)}
                  className="text-sm text-red-600 dark:text-red-400 px-3"
                >
                  Remove
                </button>
              </div>

              <div className="space-y-2">
                {day.activities.map((a) => (
                  <div
                    key={a.key}
                    className="grid grid-cols-1 sm:grid-cols-[100px_100px_1fr_1fr_auto] gap-2"
                  >
                    <input
                      type="time"
                      value={a.start_time}
                      onChange={(e) => updateActivity(day.key, a.key, { start_time: e.target.value })}
                      className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                    />
                    <input
                      type="time"
                      value={a.end_time}
                      onChange={(e) => updateActivity(day.key, a.key, { end_time: e.target.value })}
                      className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                    />
                    <input
                      value={a.title}
                      onChange={(e) => updateActivity(day.key, a.key, { title: e.target.value })}
                      placeholder="Activity title"
                      className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                    />
                    <input
                      value={a.description}
                      onChange={(e) => updateActivity(day.key, a.key, { description: e.target.value })}
                      placeholder="Description (optional)"
                      className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeActivity(day.key, a.key)}
                      className="text-red-500 px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addActivity(day.key)}
                  className="text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                  + Add activity
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sponsors */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Sponsors</h2>
          <button
            type="button"
            onClick={addSponsor}
            className="text-sm px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            + Add Sponsor
          </button>
        </div>

        {sponsors.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No sponsors yet.
          </p>
        ) : (
          <div className="space-y-4">
            {sponsors.map((s) => (
              <div
                key={s.key}
                className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-center border border-gray-200 dark:border-gray-700 rounded-lg p-3"
              >
                <input
                  value={s.name}
                  onChange={(e) => updateSponsor(s.key, { name: e.target.value })}
                  placeholder="Sponsor name"
                  className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                />
                <input
                  value={s.website}
                  onChange={(e) => updateSponsor(s.key, { website: e.target.value })}
                  placeholder="https://..."
                  className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(s.key, f);
                  }}
                  className="text-xs"
                />
                <div className="flex items-center gap-2">
                  {s.logo_base64 && (
                    <img
                      src={s.logo_base64}
                      alt={s.name}
                      className="h-8 object-contain border border-gray-200 dark:border-gray-700 rounded"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeSponsor(s.key)}
                    className="text-red-500 text-sm px-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="sticky bottom-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-4 flex items-center justify-between gap-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {mode === "create" ? "Creating new event" : `Editing event #${initial?.id}`}
        </div>
        <button
          onClick={save}
          disabled={pending}
          type="button"
          className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save Event"}
        </button>
      </div>
    </div>
  );
}