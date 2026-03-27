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
  supportsIssues: true,
  async fetchFile(repo, path, ref = "main") {
    const result = await ghFetch(`${API}/repos/${repo}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${ref}`, `etag:gh:${repo}:${path}:${ref}`);
    if (!result) return null;
    const data = safeParse<{ content?: string; encoding?: string }>(result.body);
    if (!data?.content || data.encoding !== "base64") return null;
    return Buffer.from(data.content, "base64").toString("utf-8");
  },

  async listFiles(repo, path, ref = "main") {
    const result = await ghFetch(`${API}/repos/${repo}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${ref}`, `etag:gh:${repo}:${path}:${ref}:list`);
    if (!result) return [];
    const data = safeParse<{ name: string; type: string }[]>(result.body);
    if (!Array.isArray(data)) return [];
    return data.filter((f) => f.type === "file").map((f) => f.name);
  },

  async listDirs(repo, path, ref = "main") {
    const result = await ghFetch(`${API}/repos/${repo}/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${ref}`, `etag:gh:${repo}:${path}:${ref}:dirs`);
    if (!result) return [];
    const data = safeParse<{ name: string; type: string }[]>(result.body);
    if (!Array.isArray(data)) return [];
    return data.filter((f) => f.type === "dir").map((f) => f.name);
  },

  async createIssue(repo, title, body, labels) {
    try {
      const res = await fetch(`${API}/repos/${repo}/issues`, {
        method: "POST",
        headers: { Authorization: `Bearer ${GITHUB_PAT}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, labels }),
      });
      if (!res.ok) { log.error("GitHub issue creation failed: %d", res.status); return null; }
      const data = await res.json();
      return { url: data.html_url };
    } catch (err) { log.error(err, "GitHub createIssue failed"); return null; }
  },

  async listIssues(repo, userTag) {
    try {
      const res = await fetch(`${API}/repos/${repo}/issues?labels=feedback&state=all&per_page=100`, {
        headers: { Authorization: `Bearer ${GITHUB_PAT}`, Accept: "application/vnd.github+json" },
        cache: "no-store",
      });
      if (!res.ok) return [];
      const issues = (await res.json()) as { number: number; title: string; html_url: string; state: string; created_at: string; comments: number; body?: string; closed_by?: { login: string }; user?: { login: string } }[];
      return issues
        .filter((i) => i.body?.includes(`<!-- openlex-user: ${userTag} -->`))
        .map((i) => ({ id: i.number, title: i.title, url: i.html_url, state: i.state as "open" | "closed", created_at: i.created_at, comments: i.comments, closedByUser: i.state === "closed" && i.closed_by?.login === i.user?.login }));
    } catch (err) { log.error(err, "GitHub listIssues failed"); return []; }
  },

  async getIssueComments(repo, issueId) {
    try {
      const res = await fetch(`${API}/repos/${repo}/issues/${issueId}/comments?per_page=100`, {
        headers: { Authorization: `Bearer ${GITHUB_PAT}`, Accept: "application/vnd.github+json" },
        cache: "no-store",
      });
      if (!res.ok) return [];
      const comments = (await res.json()) as { user?: { login: string }; body: string; created_at: string }[];
      return comments.map((c) => ({ author: c.user?.login ?? "unknown", body: c.body, created_at: c.created_at }));
    } catch (err) { log.error(err, "GitHub getIssueComments failed"); return []; }
  },

  async addComment(repo, issueId, body) {
    try {
      const res = await fetch(`${API}/repos/${repo}/issues/${issueId}/comments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${GITHUB_PAT}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      return res.ok;
    } catch (err) { log.error(err, "GitHub addComment failed"); return false; }
  },

  async closeIssue(repo, issueId) {
    try {
      const res = await fetch(`${API}/repos/${repo}/issues/${issueId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${GITHUB_PAT}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
        body: JSON.stringify({ state: "closed" }),
      });
      return res.ok;
    } catch (err) { log.error(err, "GitHub closeIssue failed"); return false; }
  },
};
