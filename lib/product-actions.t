"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getEventById,
  ValidationError,
} from "./db";

export async function createProductAction(formData: FormData) {
  const eventId = Number(formData.get("event_id"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const image_base64 = String(formData.get("image_base64") ?? "");
  const category = String(formData.get("category") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const sponsorRaw = String(formData.get("sponsor_id") ?? "").trim();
  const sponsor_id = sponsorRaw ? Number(sponsorRaw) : null;
  const sort_order = Number(formData.get("sort_order") ?? 0);

  const event = getEventById(eventId);
  if (!event) redirect("/admin/events");

  try {
    createProduct(eventId, {
      name,
      description,
      image_base64,
      category,
      website,
      sponsor_id,
      sort_order,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      redirect(`/admin/events/${eventId}/products?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath(`/admin/events/${eventId}/products`);
  revalidatePath(`/events/${event.slug}`);
  revalidatePath("/");
  redirect(`/admin/events/${eventId}/products`);
}

export async function updateProductAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const eventId = Number(formData.get("event_id"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const image_base64 = String(formData.get("image_base64") ?? "");
  const category = String(formData.get("category") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const sponsorRaw = String(formData.get("sponsor_id") ?? "").trim();
  const sponsor_id = sponsorRaw ? Number(sponsorRaw) : null;
  const sort_order = Number(formData.get("sort_order") ?? 0);

  const event = getEventById(eventId);
  if (!event) redirect("/admin/events");

  try {
    updateProduct(id, {
      name,
      description,
      image_base64,
      category,
      website,
      sponsor_id,
      sort_order,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      redirect(`/admin/events/${eventId}/products?error=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }

  revalidatePath(`/admin/events/${eventId}/products`);
  revalidatePath(`/events/${event.slug}`);
  revalidatePath("/");
  redirect(`/admin/events/${eventId}/products`);
}

export async function deleteProductAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const eventId = Number(formData.get("event_id"));
  if (!Number.isFinite(id) || !Number.isFinite(eventId)) {
    redirect("/admin/events");
  }
  deleteProduct(id);

  const event = getEventById(eventId);
  revalidatePath(`/admin/events/${eventId}/products`);
  if (event) revalidatePath(`/events/${event.slug}`);
  revalidatePath("/");
}