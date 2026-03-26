import { log } from "@/lib/logger";
import type { ContentProvider } from "./git-provider";
import { getETag, setETag } from "./etag-cache";
import { loadSiteConfig } from "./site";

const GITHUB_PAT = process.env.GITHUB_PAT ?? "";
const API = "https://api.github.com";

async function ghFetch(url: string, cacheKey?: string): Promise<{ body: string; status: number } | null> {
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${GITHUB_PAT}`,
      Accept: "application/vnd.github.v3+json",
    };

    const cached = cacheKey ? await getETag(cacheKey) : null;
    if (cached?.etag) headers["If-None-Match"] = cached.etag;

    const res = await fetch(url, { headers, next: { revalidate: loadSiteConfig().features?.revalidate ?? 3600 } });

    if (res.status === 304 && cached) return { body: cached.body, status: 304 };

    if (!res.ok) {
      log.warn("GitHub API %d: %s", res.status, url);
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

function safeParse<T>(body: string): T | null {
  try { return JSON.parse(body); } catch { return null; }
}

export const github: ContentProvider = {
  async fetchFile(repo, path, ref = "main") {
    const result = await ghFetch(`${API}/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${ref}`, `etag:gh:${repo}:${path}:${ref}`);
    if (!result) return null;
    const data = safeParse<{ content?: string; encoding?: string }>(result.body);
    if (!data?.content || data.encoding !== "base64") return null;
    return Buffer.from(data.content, "base64").toString("utf-8");
  },

  async listFiles(repo, path, ref = "main") {
    const result = await ghFetch(`${API}/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${ref}`, `etag:gh:${repo}:${path}:${ref}:list`);
    if (!result) return [];
    const data = safeParse<{ name: string; type: string }[]>(result.body);
    if (!Array.isArray(data)) return [];
    return data.filter((f) => f.type === "file").map((f) => f.name);
  },

  async listDirs(repo, path, ref = "main") {
    const result = await ghFetch(`${API}/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${ref}`, `etag:gh:${repo}:${path}:${ref}:dirs`);
    if (!result) return [];
    const data = safeParse<{ name: string; type: string }[]>(result.body);
    if (!Array.isArray(data)) return [];
    return data.filter((f) => f.type === "dir").map((f) => f.name);
  },
};
