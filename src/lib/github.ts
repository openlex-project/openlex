import { log } from "@/lib/logger";
import type { ContentProvider } from "./git-provider";
import { getRevalidate } from "./git-provider";
import { Redis } from "@upstash/redis";

const GITHUB_PAT = process.env.GITHUB_PAT ?? "";
const API = "https://api.github.com";

const redis = (process.env.REDIS_REST_URL && process.env.REDIS_REST_TOKEN)
  ? new Redis({ url: process.env.REDIS_REST_URL, token: process.env.REDIS_REST_TOKEN })
  : null;

interface ETagEntry { etag: string; body: string }

/** In-memory ETag cache (fallback when Redis unavailable) */
const memEtags = new Map<string, ETagEntry>();

async function getETag(key: string): Promise<ETagEntry | null> {
  if (redis) {
    try { return await redis.get<ETagEntry>(key); } catch { /* fall through */ }
  }
  return memEtags.get(key) ?? null;
}

async function setETag(key: string, entry: ETagEntry): Promise<void> {
  memEtags.set(key, entry);
  if (redis) {
    try { await redis.set(key, entry); } catch { /* ignore */ }
  }
}

async function ghFetch(url: string, cacheKey?: string): Promise<{ body: string; status: number } | null> {
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${GITHUB_PAT}`,
      Accept: "application/vnd.github.v3+json",
    };

    const cached = cacheKey ? await getETag(cacheKey) : null;
    if (cached?.etag) headers["If-None-Match"] = cached.etag;

    const res = await fetch(url, { headers, next: { revalidate: getRevalidate() } });

    if (res.status === 304 && cached) {
      return { body: cached.body, status: 304 };
    }

    if (!res.ok) {
      log.warn("GitHub API %d: %s", res.status, url);
      // Rate limited but have cache? Return stale data
      if (res.status === 403 && cached) return { body: cached.body, status: 403 };
      return null;
    }

    const body = await res.text();
    const etag = res.headers.get("etag");
    if (cacheKey && etag) await setETag(cacheKey, { etag, body });

    return { body, status: 200 };
  } catch (err) {
    log.error(err, "GitHub fetch failed: %s", url);
    return null;
  }
}

export const github: ContentProvider = {
  async fetchFile(repo, path, ref = "main") {
    const result = await ghFetch(
      `${API}/repos/${repo}/contents/${path}?ref=${ref}`,
      `etag:gh:${repo}:${path}:${ref}`,
    );
    if (!result) return null;
    const data = JSON.parse(result.body) as { content?: string; encoding?: string };
    if (!data.content || data.encoding !== "base64") return null;
    return Buffer.from(data.content, "base64").toString("utf-8");
  },

  async listFiles(repo, path, ref = "main") {
    const result = await ghFetch(
      `${API}/repos/${repo}/contents/${path}?ref=${ref}`,
      `etag:gh:${repo}:${path}:${ref}:list`,
    );
    if (!result) return [];
    const data = JSON.parse(result.body) as { name: string; type: string }[];
    if (!Array.isArray(data)) return [];
    return data.filter((f) => f.type === "file").map((f) => f.name);
  },

  async listDirs(repo, path, ref = "main") {
    const result = await ghFetch(
      `${API}/repos/${repo}/contents/${path}?ref=${ref}`,
      `etag:gh:${repo}:${path}:${ref}:dirs`,
    );
    if (!result) return [];
    const data = JSON.parse(result.body) as { name: string; type: string }[];
    if (!Array.isArray(data)) return [];
    return data.filter((f) => f.type === "dir").map((f) => f.name);
  },
};
