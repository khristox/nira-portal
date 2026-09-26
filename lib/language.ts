import { cookies } from "next/headers";
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE,
} from "./constants";

// Re-export for server-side imports
export {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE,
  getLanguageLabel,
  isSupportedLanguage,
} from "./constants";

/**
 * Reads the language cookie on the server. Falls back to DEFAULT_LANGUAGE
 * if the cookie is missing or contains an unsupported code.
 *
 * Server-only — do not import this file from a client component.
 */
export async function getActiveLanguage(): Promise<string> {
  const store = await cookies();
  const value = store.get(LANGUAGE_COOKIE)?.value;
  if (value && SUPPORTED_LANGUAGES.some((l) => l.code === value)) {
    return value;
  }
  return DEFAULT_LANGUAGE;
}