import { log } from "@/lib/logger";
import type { ContentProvider } from "./git-provider";

const GITHUB_PAT = process.env.GITHUB_PAT ?? "";
const API = "https://api.github.com";

interface GHContentResponse {
  content?: string;
  encoding?: string;
  message?: string;
}

async function ghFetch(url: string): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_PAT}`,
        Accept: "application/vnd.github.v3+json",
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) log.warn("GitHub API %d: %s", res.status, url);
    return res;
  } catch (err) {
    log.error(err, "GitHub fetch failed: %s", url);
    return null;
  }
}

export const github: ContentProvider = {
  async fetchFile(repo, path, ref = "main") {
    const res = await ghFetch(`${API}/repos/${repo}/contents/${path}?ref=${ref}`);
    if (!res?.ok) return null;
    const data = (await res.json()) as GHContentResponse;
    if (!data.content || data.encoding !== "base64") return null;
    return Buffer.from(data.content, "base64").toString("utf-8");
  },

  async listFiles(repo, path, ref = "main") {
    const res = await ghFetch(`${API}/repos/${repo}/contents/${path}?ref=${ref}`);
    if (!res?.ok) return [];
    const data = (await res.json()) as { name: string; type: string }[];
    if (!Array.isArray(data)) return [];
    return data.filter((f) => f.type === "file").map((f) => f.name);
  },

  async listDirs(repo, path, ref = "main") {
    const res = await ghFetch(`${API}/repos/${repo}/contents/${path}?ref=${ref}`);
    if (!res?.ok) return [];
    const data = (await res.json()) as { name: string; type: string }[];
    if (!Array.isArray(data)) return [];
    return data.filter((f) => f.type === "dir").map((f) => f.name);
  },
};
