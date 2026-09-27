import { cookies } from "next/headers";
import { randomBytes } from "crypto";

const COOKIE_NAME = "nira_voter_token";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Reads the voter token cookie on the server. If missing, generates a new
 * one. Returns the token value (does not set the cookie — the caller
 * responsible for setting it if needed).
 */
export async function getVoterToken(): Promise<{
  token: string;
  isNew: boolean;
}> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;

  if (existing && existing.length >= 16) {
    return { token: existing, isNew: false };
  }

  const fresh = randomBytes(24).toString("hex");
  return { token: fresh, isNew: true };
}

/**
 * Sets the voter token cookie. Should be called from a server action or
 * route handler, not from a page render.
 */
export async function setVoterToken(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
    httpOnly: true,
  });
}