import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL ?? "",
  token: process.env.KV_REST_API_TOKEN ?? "",
});

/** Get user bookmarks */
export async function getBookmarks(userId: string): Promise<string[]> {
  return (await redis.smembers(`bookmarks:${userId}`)) ?? [];
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
