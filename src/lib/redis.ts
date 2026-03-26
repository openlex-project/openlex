import { Redis } from "@upstash/redis";
import { log } from "@/lib/logger";

const redis = (process.env.REDIS_REST_URL && process.env.REDIS_REST_TOKEN)
  ? new Redis({ url: process.env.REDIS_REST_URL, token: process.env.REDIS_REST_TOKEN })
  : null;

if (!redis) log.warn("Redis not configured — bookmarks, history, and profile will be unavailable");

const HISTORY_TTL = 90 * 24 * 60 * 60; // 90 days

async function safe<T>(fn: (r: Redis) => Promise<T>, fallback: T): Promise<T> {
  if (!redis) return fallback;
  try { return await fn(redis); } catch (err) { log.error(err, "Redis operation failed"); return fallback; }
}

/* ─── Bookmarks (Hash: path → title) ─── */

export async function getBookmarks(userId: string): Promise<{ path: string; title: string }[]> {
  return safe(async (r) => {
    const data = (await r.hgetall(`bookmarks:${userId}`)) ?? {};
    return Object.entries(data).map(([path, title]) => ({ path, title: title as string }));
  }, []);
}

export async function isBookmarked(userId: string, path: string): Promise<boolean> {
  return safe(async (r) => !!(await r.hexists(`bookmarks:${userId}`, path)), false);
}

export async function toggleBookmark(userId: string, path: string, title?: string): Promise<boolean> {
  return safe(async (r) => {
    const key = `bookmarks:${userId}`;
    if (await r.hexists(key, path)) { await r.hdel(key, path); return false; }
    await r.hset(key, { [path]: title ?? path });
    return true;
  }, false);
}

/* ─── History (Sorted Set with dedup hash) ─── */

export interface HistoryEntry { path: string; title: string; ts: number }

export async function addHistory(userId: string, path: string, title: string): Promise<void> {
  await safe(async (r) => {
    const setKey = `history:${userId}`;
    const dedupKey = `history-dedup:${userId}`;
    // Remove previous entry for same path via dedup hash
    const prev = await r.hget<string>(dedupKey, path);
    if (prev) await r.zrem(setKey, prev);
    // Add new entry
    const member = JSON.stringify({ path, title, ts: Date.now() });
    await r.zadd(setKey, { score: Date.now(), member });
    await r.hset(dedupKey, { [path]: member });
    // Trim to 50 + set TTL
    const count = await r.zcard(setKey);
    if (count > 50) await r.zremrangebyrank(setKey, 0, count - 51);
    await r.expire(setKey, HISTORY_TTL);
    await r.expire(dedupKey, HISTORY_TTL);
  }, undefined);
}

export async function getHistory(userId: string, limit = 50): Promise<HistoryEntry[]> {
  return safe(async (r) => {
    const raw = await r.zrange<string[]>(`history:${userId}`, 0, limit - 1, { rev: true });
    return raw.map((s) => (typeof s === "string" ? JSON.parse(s) : s) as HistoryEntry);
  }, []);
}

/* ─── Settings (Hash) ─── */

export async function getUserSettings(userId: string): Promise<Record<string, string>> {
  return safe(async (r) => (await r.hgetall(`settings:${userId}`)) ?? {}, {});
}

export async function setUserSetting(userId: string, key: string, value: string): Promise<void> {
  await safe((r) => r.hset(`settings:${userId}`, { [key]: value }), 0);
}

/* ─── GDPR ─── */

export async function exportUserData(userId: string): Promise<Record<string, unknown>> {
  const [bookmarks, history, settings] = await Promise.all([getBookmarks(userId), getHistory(userId), getUserSettings(userId)]);
  return { bookmarks, history, settings };
}

export async function deleteAllUserData(userId: string): Promise<void> {
  await safe(async (r) => {
    await Promise.all([r.del(`bookmarks:${userId}`), r.del(`history:${userId}`), r.del(`history-dedup:${userId}`), r.del(`settings:${userId}`)]);
  }, undefined);
}
