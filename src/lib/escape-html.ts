/** Escape HTML special characters to prevent XSS in interpolated strings. */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Strip all HTML tags except <mark> from a string (for Pagefind excerpts). */
export function sanitizeExcerpt(html: string): string {
  return html.replace(/<(?!\/?mark\b)[^>]+>/gi, "");
}

/** Safe JSON-LD serialization — escapes </script> to prevent injection. */
export function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/<\//g, "<\\/");
}
