import { Redis } from "@upstash/redis";

interface ETagEntry { etag: string; body: string }

const redis = (process.env.REDIS_REST_URL && process.env.REDIS_REST_TOKEN)
  ? new Redis({ url: process.env.REDIS_REST_URL, token: process.env.REDIS_REST_TOKEN })
  : null;

const mem = new Map<string, ETagEntry>();

export async function getETag(key: string): Promise<ETagEntry | null> {
  if (redis) { try { return await redis.get<ETagEntry>(key); } catch { /* fall through */ } }
  return mem.get(key) ?? null;
}

export async function setETag(key: string, entry: ETagEntry): Promise<void> {
  mem.set(key, entry);
  if (redis) { try { await redis.set(key, entry); } catch { /* ignore */ } }
}
