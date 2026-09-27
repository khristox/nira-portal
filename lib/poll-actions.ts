"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createPoll,
  updatePoll,
  deletePoll,
  createPollOption,
  deletePollOption,
  recordVote,
  getPollById,
  getEventById,
  hasVoted,
  ValidationError,
} from "./db";
import { getVoterToken, setVoterToken } from "./voter-token";

// ---------------------------------------------------------------------------
// Admin actions
// ---------------------------------------------------------------------------

export async function createPollAction(formData: FormData) {
  const eventId = Number(formData.get("event_id"));
  const question = String(formData.get("question") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const is_active = formData.get("is_active") === "1";
  const allow_multiple = formData.get("allow_multiple") === "1";
  const closes_at = String(formData.get("closes_at") ?? "").trim() || null;
  const sort_order = Number(formData.get("sort_order") ?? 0);

  const event = getEventById(eventId);
  if (!event) redirect("/admin/events");

  try {
    createPoll(eventId, {
      question,
      description,
      is_active,
      allow_multiple,
      closes_at,
      sort_order,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      redirect(`/admin/events/${eventId}/polls?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath(`/admin/events/${eventId}/polls`);
  revalidatePath(`/events/${event.slug}/polls`);
  redirect(`/admin/events/${eventId}/polls`);
}

export async function updatePollAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const eventId = Number(formData.get("event_id"));
  const question = String(formData.get("question") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const is_active = formData.get("is_active") === "1";
  const allow_multiple = formData.get("allow_multiple") === "1";
  const closes_at = String(formData.get("closes_at") ?? "").trim() || null;
  const sort_order = Number(formData.get("sort_order") ?? 0);

  const event = getEventById(eventId);
  if (!event) redirect("/admin/events");

  try {
    updatePoll(id, {
      question,
      description,
      is_active,
      allow_multiple,
      closes_at,
      sort_order,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      redirect(`/admin/events/${eventId}/polls?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath(`/admin/events/${eventId}/polls`);
  revalidatePath(`/events/${event.slug}/polls`);
  redirect(`/admin/events/${eventId}/polls`);
}

export async function deletePollAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const eventId = Number(formData.get("event_id"));
  if (!Number.isFinite(id) || !Number.isFinite(eventId)) {
    redirect("/admin/events");
  }
  deletePoll(id);

  const event = getEventById(eventId);
  revalidatePath(`/admin/events/${eventId}/polls`);
  if (event) revalidatePath(`/events/${event.slug}/polls`);
}

export async function createPollOptionAction(formData: FormData) {
  const pollId = Number(formData.get("poll_id"));
  const eventId = Number(formData.get("event_id"));
  const label = String(formData.get("label") ?? "").trim();
  const sort_order = Number(formData.get("sort_order") ?? 0);

  if (!Number.isFinite(pollId) || !Number.isFinite(eventId)) {
    redirect("/admin/events");
  }

  try {
    createPollOption(pollId, { label, sort_order });
  } catch (err) {
    if (err instanceof ValidationError) {
      redirect(`/admin/events/${eventId}/polls?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  const event = getEventById(eventId);
  revalidatePath(`/admin/events/${eventId}/polls`);
  if (event) revalidatePath(`/events/${event.slug}/polls`);
  redirect(`/admin/events/${eventId}/polls`);
}

export async function deletePollOptionAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const eventId = Number(formData.get("event_id"));
  if (!Number.isFinite(id) || !Number.isFinite(eventId)) {
    redirect("/admin/events");
  }
  deletePollOption(id);

  const event = getEventById(eventId);
  revalidatePath(`/admin/events/${eventId}/polls`);
  if (event) revalidatePath(`/events/${event.slug}/polls`);
}

// ---------------------------------------------------------------------------
// Public voting
// ---------------------------------------------------------------------------

export async function voteAction(formData: FormData) {
  const pollId = Number(formData.get("poll_id"));
  const optionId = Number(formData.get("option_id"));
  const slug = String(formData.get("slug") ?? "").trim();

  if (!Number.isFinite(pollId) || !Number.isFinite(optionId) || !slug) {
    return;
  }

  const { token, isNew } = await getVoterToken();

  if (isNew) {
    await setVoterToken(token);
  }

  try {
    // Reject duplicate vote for the same option
    if (hasVoted(pollId, token, optionId)) {
      revalidatePath(`/events/${slug}/polls`);
      return;
    }
    recordVote(pollId, optionId, token);
  } catch (err) {
    // Silent failure — the public page will re-render with the current tally.
    console.error("Vote failed:", err);
  }

  revalidatePath(`/events/${slug}/polls`);
}