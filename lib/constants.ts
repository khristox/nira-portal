// Shared constants — safe to import from client AND server components.

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English",   native: "English",      emoji: "🇬🇧" },
  { code: "sw", label: "Swahili",   native: "Kiswahili",    emoji: "🇹🇿" },
  { code: "lg", label: "Luganda",   native: "Luganda",      emoji: "🇺🇬" },
  { code: "nyn", label: "Runyankole", native: "Runyankore", emoji: "🐄" },
  { code: "ach", label: "Acholi",   native: "Luo (Acholi)", emoji: "🥁" },
  { code: "teo", label: "Ateso",    native: "Ateso",        emoji: "🐐" },
  { code: "lgg", label: "Lugbara",  native: "Lugbara",      emoji: "🛖" },
  { code: "myx", label: "Madi",     native: "Madi",         emoji: "🌾" },
  { code: "rub", label: "Rutooro",  native: "Rutooro",      emoji: "🐘" },
  { code: "xog", label: "Lusoga",   native: "Lusoga",       emoji: "🍌" },
  { code: "cgg", label: "Rukiga",   native: "Rukiga",       emoji: "⛰️" },
  { code: "fr",  label: "French",   native: "Français",     emoji: "🇫🇷" },
  { code: "ar",  label: "Arabic",   native: "العربية",      emoji: "🇸🇦" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: LanguageCode = "en";

export const LANGUAGE_COOKIE = "nira_lang";

export function getLanguageLabel(code: string): string {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.label ?? code;
}

export function getLanguageNative(code: string): string {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.native ?? code;
}

export function getLanguageEmoji(code: string): string {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.emoji ?? "🌐";
}

export function isSupportedLanguage(code: string): boolean {
  return SUPPORTED_LANGUAGES.some((l) => l.code === code);
}