export const TIMEZONE = "Africa/Kampala";

/**
 * Returns the current date in Uganda time as 'YYYY-MM-DD'.
 */
export function todayInUganda(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Returns the current time in Uganda as minutes-since-midnight.
 * e.g., 14:30 Uganda = 870
 */
export function nowMinutesInUganda(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}