"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSurvey,
  updateSurvey,
  deleteSurvey,
  createSurveyQuestion,
  deleteSurveyQuestion,
  submitSurveyResponse,
  getSurveyById,
  getSurveyQuestionById,
  getEventById,
  getSurveyQuestions,
  ValidationError,
} from "./db";

// ---------------------------------------------------------------------------
// Admin actions
// ---------------------------------------------------------------------------

export async function createSurveyAction(formData: FormData) {
  const eventId = Number(formData.get("event_id"));
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const is_active = formData.get("is_active") === "1";
  const closes_at = String(formData.get("closes_at") ?? "").trim() || null;
  const sort_order = Number(formData.get("sort_order") ?? 0);

  const event = getEventById(eventId);
  if (!event) redirect("/admin/events");

  try {
    createSurvey(eventId, {
      title,
      description,
      is_active,
      closes_at,
      sort_order,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      redirect(`/admin/events/${eventId}/surveys?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath(`/admin/events/${eventId}/surveys`);
  revalidatePath(`/events/${event.slug}/surveys`);
  redirect(`/admin/events/${eventId}/surveys`);
}

export async function updateSurveyAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const eventId = Number(formData.get("event_id"));
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const is_active = formData.get("is_active") === "1";
  const closes_at = String(formData.get("closes_at") ?? "").trim() || null;
  const sort_order = Number(formData.get("sort_order") ?? 0);

  const event = getEventById(eventId);
  if (!event) redirect("/admin/events");

  try {
    updateSurvey(id, {
      title,
      description,
      is_active,
      closes_at,
      sort_order,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      redirect(`/admin/events/${eventId}/surveys?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath(`/admin/events/${eventId}/surveys`);
  revalidatePath(`/events/${event.slug}/surveys`);
  redirect(`/admin/events/${eventId}/surveys`);
}

export async function deleteSurveyAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const eventId = Number(formData.get("event_id"));
  if (!Number.isFinite(id) || !Number.isFinite(eventId)) {
    redirect("/admin/events");
  }
  deleteSurvey(id);

  const event = getEventById(eventId);
  revalidatePath(`/admin/events/${eventId}/surveys`);
  if (event) revalidatePath(`/events/${event.slug}/surveys`);
}

export async function createSurveyQuestionAction(formData: FormData) {
  const surveyId = Number(formData.get("survey_id"));
  const eventId = Number(formData.get("event_id"));
  const kind = String(formData.get("kind") ?? "text");
  const prompt = String(formData.get("prompt") ?? "").trim();
  const help_text = String(formData.get("help_text") ?? "").trim();
  const optionsRaw = String(formData.get("options_raw") ?? "").trim();
  const is_required = formData.get("is_required") === "1";
  const sort_order = Number(formData.get("sort_order") ?? 0);

  if (!Number.isFinite(surveyId) || !Number.isFinite(eventId)) {
    redirect("/admin/events");
  }

  // Convert newline-separated options to JSON array
  let options_json = "[]";
  if (kind === "single_choice" || kind === "multi_choice") {
    const list = optionsRaw
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    options_json = JSON.stringify(list);
  }

  try {
    createSurveyQuestion(surveyId, {
      kind: kind as never,
      prompt,
      help_text,
      options_json,
      is_required,
      sort_order,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      redirect(`/admin/events/${eventId}/surveys?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  const event = getEventById(eventId);
  revalidatePath(`/admin/events/${eventId}/surveys`);
  if (event) revalidatePath(`/events/${event.slug}/surveys`);
  redirect(`/admin/events/${eventId}/surveys`);
}

export async function deleteSurveyQuestionAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const eventId = Number(formData.get("event_id"));
  if (!Number.isFinite(id) || !Number.isFinite(eventId)) {
    redirect("/admin/events");
  }
  deleteSurveyQuestion(id);

  const event = getEventById(eventId);
  revalidatePath(`/admin/events/${eventId}/surveys`);
  if (event) revalidatePath(`/events/${event.slug}/surveys`);
}

// ---------------------------------------------------------------------------
// Public submission
// ---------------------------------------------------------------------------

export async function submitSurveyAction(formData: FormData) {
  const surveyId = Number(formData.get("survey_id"));
  const slug = String(formData.get("slug") ?? "").trim();

  if (!Number.isFinite(surveyId) || !slug) {
    return { ok: false, error: "Invalid request." };
  }

  const survey = getSurveyById(surveyId);
  if (!survey) return { ok: false, error: "Survey not found." };
  if (!survey.is_active) {
    return { ok: false, error: "This survey is no longer accepting responses." };
  }

  const respondent = String(formData.get("respondent") ?? "").trim();

  const questions = getSurveyQuestions(surveyId);
  const answers: { question_id: number; value_text: string }[] = [];

  for (const q of questions) {
    const fieldName = `q_${q.id}`;

    if (q.kind === "multi_choice") {
      // Checkboxes come as multiple form entries
      const all = formData.getAll(fieldName).map((v) => String(v));
      answers.push({ question_id: q.id, value_text: all.join(", ") });
      continue;
    }

    const value = String(formData.get(fieldName) ?? "").trim();

    if (q.is_required && !value) {
      return { ok: false, error: `"${q.prompt}" is required.` };
    }

    answers.push({ question_id: q.id, value_text: value });
  }

  try {
    submitSurveyResponse(surveyId, respondent, answers);
  } catch (err) {
    if (err instanceof ValidationError) {
      return { ok: false, error: err.message };
    }
    console.error("submitSurveyResponse failed:", err);
    return { ok: false, error: "Could not submit. Please try again." };
  }

  revalidatePath(`/events/${slug}/surveys`);
  redirect(`/events/${slug}/surveys?submitted=${surveyId}`);
}