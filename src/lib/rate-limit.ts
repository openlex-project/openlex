import { NextResponse } from "next/server";

const windows = new Map<string, number[]>();
const MAX_KEYS = 10_000;

/** In-memory sliding window rate limiter. Returns 429 if limit exceeded. */
export function rateLimit(key: string, maxPerMinute: number): NextResponse | null {
  const now = Date.now();
  const cutoff = now - 60_000;
  const hits = (windows.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= maxPerMinute) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": "60" } });
  }
  hits.push(now);
  windows.set(key, hits);
  // Evict stale keys periodically
  if (windows.size > MAX_KEYS) {
    for (const [k, v] of windows) { if (v.every((t) => t <= cutoff)) windows.delete(k); }
  }
  return null;
}
