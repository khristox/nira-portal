"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, ValidationError } from "./db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventInput = {
  id?: number | null;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  location?: string | null;
  banner_url?: string | null;
  start_date: string;
  end_date: string;
  is_published?: number | boolean | null;
  days: {
    id?: number | null;
    date: string;
    label?: string | null;
    sort_order?: number | null;
    activities: {
      id?: number | null;
      start_time?: string | null;
      end_time?: string | null;
      title: string;
      description?: string | null;
      sort_order?: number | null;
    }[];
  }[];
  sponsors: {
    id?: number | null;
    name: string;
    logo_base64?: string | null;
    website?: string | null;
    tier?: string | null;
    sort_order?: number | null;
  }[];
};

type DayInput = EventInput["days"][number];
type ActivityInput = DayInput["activities"][number];
type SponsorInput = EventInput["sponsors"][number];

// ---------------------------------------------------------------------------
// saveEventAction — create or update an event with nested days, activities,
//                   and sponsors. All in one transaction.
// ---------------------------------------------------------------------------

export async function saveEventAction(formData: FormData) {
  const raw = String(formData.get("payload") ?? "");

  let input: EventInput;
  try {
    input = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Invalid payload." };
  }

  const title = String(input.title ?? "").trim();
  if (!title) return { ok: false, error: "Title is required." };

  const slug = String(input.slug ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  if (!slug) return { ok: false, error: "Slug is required." };

  const start_date = String(input.start_date ?? "").trim();
  const end_date = String(input.end_date ?? "").trim();
  if (!start_date || !end_date) {
    return { ok: false, error: "Start and end dates are required." };
  }
  if (end_date < start_date) {
    return { ok: false, error: "End date must be on or after start date." };
  }

  const is_published = input.is_published ? 1 : 0;

  try {
    const tx = db.transaction(() => {
      let eventId = input.id ? Number(input.id) : 0;

      if (eventId && Number.isFinite(eventId)) {
        // Update existing event
        db.prepare(
          `UPDATE events
           SET slug = ?, title = ?, subtitle = ?, description = ?, location = ?,
               banner_url = ?, start_date = ?, end_date = ?, is_published = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`
        ).run(
          slug,
          title,
          String(input.subtitle ?? "").trim(),
          String(input.description ?? "").trim(),
          String(input.location ?? "").trim(),
          String(input.banner_url ?? "").trim(),
          start_date,
          end_date,
          is_published,
          eventId
        );
      } else {
        // Insert new event
        const result = db
          .prepare(
            `INSERT INTO events
               (slug, title, subtitle, description, location, banner_url,
                start_date, end_date, is_published)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            slug,
            title,
            String(input.subtitle ?? "").trim(),
            String(input.description ?? "").trim(),
            String(input.location ?? "").trim(),
            String(input.banner_url ?? "").trim(),
            start_date,
            end_date,
            is_published
          );
        eventId = Number(result.lastInsertRowid);
      }

      // --- Days: wipe and reinsert ---
      db.prepare(`DELETE FROM event_days WHERE event_id = ?`).run(eventId);

      const insertDay = db.prepare(
        `INSERT INTO event_days (event_id, date, label, sort_order)
         VALUES (?, ?, ?, ?)`
      );
      const insertActivity = db.prepare(
        `INSERT INTO event_activities
           (day_id, start_time, end_time, title, description, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`
      );

      const days = Array.isArray(input.days) ? input.days : [];
      days.forEach((d: DayInput, dayIdx: number) => {
        const dayResult = insertDay.run(
          eventId,
          String(d.date ?? "").trim(),
          String(d.label ?? "").trim(),
          Number(d.sort_order ?? dayIdx)
        );
        const dayId = Number(dayResult.lastInsertRowid);

        const acts = Array.isArray(d.activities) ? d.activities : [];
        acts.forEach((a: ActivityInput, actIdx: number) => {
          const actTitle = String(a.title ?? "").trim();
          if (!actTitle) return; // skip blank rows
          insertActivity.run(
            dayId,
            String(a.start_time ?? "").trim(),
            String(a.end_time ?? "").trim(),
            actTitle,
            String(a.description ?? "").trim(),
            Number(a.sort_order ?? actIdx)
          );
        });
      });

      // --- Sponsors: wipe and reinsert ---
      db.prepare(`DELETE FROM event_sponsors WHERE event_id = ?`).run(eventId);

      const insertSponsor = db.prepare(
        `INSERT INTO event_sponsors
           (event_id, name, logo_base64, website, tier, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`
      );

      const sponsors = Array.isArray(input.sponsors) ? input.sponsors : [];
      sponsors.forEach((s: SponsorInput, idx: number) => {
        const name = String(s.name ?? "").trim();
        if (!name) return; // skip blank rows
        insertSponsor.run(
          eventId,
          name,
          String(s.logo_base64 ?? ""),
          String(s.website ?? "").trim(),
          String(s.tier ?? "partner").trim(),
          Number(s.sort_order ?? idx)
        );
      });

      return eventId;
    });

    const eventId = tx();

    revalidatePath("/");
    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath(`/events/${slug}`);

    return { ok: true, id: eventId, slug };
  } catch (err) {
    if (err instanceof ValidationError) {
      return { ok: false, error: err.message };
    }
    console.error("saveEventAction failed:", err);
    return { ok: false, error: "Save failed." };
  }
}

// ---------------------------------------------------------------------------
// deleteEventAction
// ---------------------------------------------------------------------------

export async function deleteEventAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return { ok: false, error: "Invalid id." };

  db.prepare(`DELETE FROM events WHERE id = ?`).run(id);

  revalidatePath("/");
  revalidatePath("/admin/events");
  redirect("/admin/events");
}

// ---------------------------------------------------------------------------
// togglePublishAction
// ---------------------------------------------------------------------------

export async function togglePublishAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const publish = String(formData.get("publish") ?? "") === "1";

  if (!Number.isFinite(id)) return { ok: false, error: "Invalid id." };

  db.prepare(
    `UPDATE events
     SET is_published = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(publish ? 1 : 0, id);

  revalidatePath("/");
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id}`);

  return { ok: true };
}