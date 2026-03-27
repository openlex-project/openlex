/** Format a date string or timestamp for display, respecting the app locale. */
export function formatDate(value: string | number, locale: string, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof value === "number" ? new Date(value) : new Date(value.includes("T") ? value : value + "T00:00:00");
  return date.toLocaleDateString(locale, opts ?? { year: "numeric", month: "2-digit", day: "2-digit" });
}

/** Format a date with time. */
export function formatDateTime(value: string | number, locale: string): string {
  return formatDate(value, locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
