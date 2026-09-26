import { NextRequest, NextResponse } from "next/server";
import {
  getTranslationsForService,
  upsertTranslation,
  deleteTranslation,
  ValidationError,
} from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const serviceId = Number(id);
  if (!Number.isFinite(serviceId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  return NextResponse.json({
    translations: getTranslationsForService(serviceId),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const serviceId = Number(id);
  if (!Number.isFinite(serviceId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));

  try {
    const saved = upsertTranslation(serviceId, {
      language: String(body.language ?? ""),
      title: String(body.title ?? ""),
      description: String(body.description ?? ""),
      content_html: String(body.content_html ?? ""),
    });
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath(`/services/${serviceId}`);
    return NextResponse.json({ ok: true, translation: saved });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const serviceId = Number(id);
  const language = req.nextUrl.searchParams.get("language") ?? "";
  const ok = deleteTranslation(serviceId, language);
  revalidatePath("/");
  revalidatePath("/admin");
  return NextResponse.json({ ok });
}