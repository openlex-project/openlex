import { NextResponse } from "next/server";

/** In-memory sliding window rate limiter. Returns 429 if limit exceeded. */
const windows = new Map<string, number[]>();

export function rateLimit(key: string, maxPerMinute: number): NextResponse | null {
  const now = Date.now();
  const cutoff = now - 60_000;
  const hits = (windows.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= maxPerMinute) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": "60" } });
  }
  hits.push(now);
  windows.set(key, hits);
  return null;
}
