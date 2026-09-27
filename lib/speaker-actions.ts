"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSpeaker,
  updateSpeaker,
  deleteSpeaker,
  getEventById,
  ValidationError,
} from "./db";

export async function createSpeakerAction(formData: FormData) {
  const eventId = Number(formData.get("event_id"));
  const name = String(formData.get("name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const organization = String(formData.get("organization") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const photo_base64 = String(formData.get("photo_base64") ?? "");
  const activityRaw = String(formData.get("activity_id") ?? "").trim();
  const activity_id = activityRaw ? Number(activityRaw) : null;
  const sort_order = Number(formData.get("sort_order") ?? 0);

  const event = getEventById(eventId);
  if (!event) redirect("/admin/events");

  try {
    createSpeaker(eventId, {
      name,
      title,
      organization,
      bio,
      website,
      photo_base64,
      activity_id,
      sort_order,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      redirect(`/admin/events/${eventId}/speakers?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath(`/admin/events/${eventId}/speakers`);
  revalidatePath(`/events/${event.slug}`);
  revalidatePath("/");
  redirect(`/admin/events/${eventId}/speakers`);
}

export async function updateSpeakerAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const eventId = Number(formData.get("event_id"));
  const name = String(formData.get("name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const organization = String(formData.get("organization") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const photo_base64 = String(formData.get("photo_base64") ?? "");
  const activityRaw = String(formData.get("activity_id") ?? "").trim();
  const activity_id = activityRaw ? Number(activityRaw) : null;
  const sort_order = Number(formData.get("sort_order") ?? 0);

  const event = getEventById(eventId);
  if (!event) redirect("/admin/events");

  try {
    updateSpeaker(id, {
      name,
      title,
      organization,
      bio,
      website,
      photo_base64,
      activity_id,
      sort_order,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      redirect(`/admin/events/${eventId}/speakers?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath(`/admin/events/${eventId}/speakers`);
  revalidatePath(`/events/${event.slug}`);
  revalidatePath("/");
  redirect(`/admin/events/${eventId}/speakers`);
}

export async function deleteSpeakerAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const eventId = Number(formData.get("event_id"));
  if (!Number.isFinite(id) || !Number.isFinite(eventId)) {
    redirect("/admin/events");
  }
  deleteSpeaker(id);

  const event = getEventById(eventId);
  revalidatePath(`/admin/events/${eventId}/speakers`);
  if (event) revalidatePath(`/events/${event.slug}`);
  revalidatePath("/");
}