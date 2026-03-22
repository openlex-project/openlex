import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL ?? "",
  token: process.env.KV_REST_API_TOKEN ?? "",
});

/** Get user bookmarks */
export async function getBookmarks(userId: string): Promise<string[]> {
  return (await redis.smembers(`bookmarks:${userId}`)) ?? [];
}

/** Store user email + name on sign-in */
export async function storeUserEmail(email: string, name?: string): Promise<void> {
  await redis.hset(`user:${email}`, { email, name: name ?? "", ts: Date.now() });
}

/** Get all stored user emails */
export async function getUserEmails(): Promise<string[]> {
  const keys = await redis.keys("user:*");
  return keys.map((k) => k.replace("user:", ""));
}

/** Toggle a bookmark, returns new state */
export async function toggleBookmark(
  userId: string,
  path: string,
): Promise<boolean> {
  const key = `bookmarks:${userId}`;
  const exists = await redis.sismember(key, path);
  if (exists) {
    await redis.srem(key, path);
    return false;
  }
  await redis.sadd(key, path);
  return true;
}

export interface HistoryEntry {
  path: string;
  title: string;
  ts: number;
}

/** Add a page visit to history (sorted set, max 50) */
export async function addHistory(userId: string, path: string, title: string): Promise<void> {
  const key = `history:${userId}`;
  // Remove old entry for same path, then add with current timestamp
  const existing = await redis.zrange<string[]>(key, 0, -1);
  for (const e of existing) {
    try {
      const parsed = typeof e === "string" ? JSON.parse(e) : e;
      if (parsed.path === path) await redis.zrem(key, e);
    } catch {}
  }
  await redis.zadd(key, { score: Date.now(), member: JSON.stringify({ path, title, ts: Date.now() }) });
  // Trim to 50 entries
  const count = await redis.zcard(key);
  if (count > 50) {
    await redis.zremrangebyrank(key, 0, count - 51);
  }
}

/** Get recent history entries (newest first) */
export async function getHistory(userId: string, limit = 50): Promise<HistoryEntry[]> {
  const raw = await redis.zrange<string[]>(`history:${userId}`, 0, limit - 1, { rev: true });
  return raw.map((s) => (typeof s === "string" ? JSON.parse(s) : s) as HistoryEntry);
}

/** User settings */
export async function getUserSettings(userId: string): Promise<Record<string, string>> {
  return (await redis.hgetall(`settings:${userId}`)) ?? {};
}

export async function setUserSetting(userId: string, key: string, value: string): Promise<void> {
  await redis.hset(`settings:${userId}`, { [key]: value });
}

/** Check if a bookmark exists */
export async function hasBookmark(userId: string, path: string): Promise<boolean> {
  return !!(await redis.sismember(`bookmarks:${userId}`, path));
}

/** Export all user data (GDPR Art. 15) */
export async function exportUserData(userId: string): Promise<Record<string, unknown>> {
  const email = userId; // userId is the email
  const [user, bookmarks, history, settings] = await Promise.all([
    redis.hgetall(`user:${email}`),
    getBookmarks(userId),
    getHistory(userId),
    getUserSettings(userId),
  ]);
  return { user, bookmarks, history, settings };
}

/** Delete all user data (GDPR Art. 17) */
export async function deleteAllUserData(userId: string): Promise<void> {
  const email = userId;
  await Promise.all([
    redis.del(`user:${email}`),
    redis.del(`bookmarks:${userId}`),
    redis.del(`history:${userId}`),
    redis.del(`settings:${userId}`),
  ]);
}
