import { NextRequest, NextResponse } from "next/server";
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE,
} from "@/lib/constants";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const requested = typeof body.code === "string" ? body.code : "";

  const valid = SUPPORTED_LANGUAGES.some((l) => l.code === requested)
    ? requested
    : DEFAULT_LANGUAGE;

  const res = NextResponse.json({ ok: true, language: valid });
  res.cookies.set(LANGUAGE_COOKIE, valid, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
    httpOnly: false, // readable by JS if needed
  });
  return res;
}

export async function GET() {
  return NextResponse.json({
    supported: SUPPORTED_LANGUAGES,
    default: DEFAULT_LANGUAGE,
  });
}