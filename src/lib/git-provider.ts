import { log } from "@/lib/logger";
import { loadSiteConfig } from "@/lib/site";
import { getETag, setETag } from "./etag-cache";

function getRevalidate(): number | false {
  return loadSiteConfig().features?.revalidate ?? 3600;
}

/* ─── Interface ─── */

export interface IssueResult { url: string }

export interface IssueComment { author: string; body: string; created_at: string }

export interface IssueListItem {
  id: number;
  title: string;
  url: string;
  state: "open" | "closed";
  created_at: string;
  comments: number;
  closedByUser: boolean;
}

export interface ContentProvider {
  readonly supportsIssues: boolean;
  fetchFile(repo: string, path: string, ref?: string): Promise<string | null>;
  listFiles(repo: string, path: string, ref?: string): Promise<string[]>;
  listDirs(repo: string, path: string, ref?: string): Promise<string[]>;
  createIssue(repo: string, title: string, body: string, labels: string[]): Promise<IssueResult | null>;
  listIssues(repo: string, userTag: string): Promise<IssueListItem[]>;
  getIssueComments(repo: string, issueId: number): Promise<IssueComment[]>;
  addComment(repo: string, issueId: number, body: string): Promise<boolean>;
  closeIssue(repo: string, issueId: number): Promise<boolean>;
  /** List tags matching a prefix (e.g., "law/dsgvo/"). Returns tag names sorted descending. */
  listTags(repo: string, prefix: string): Promise<string[]>;
}

/* ─── URL parsing ─── */

export interface RepoRef {
  provider: "github" | "gitlab";
  host: string;       // "github.com" | "gitlab.com" | "git.uni-berlin.de"
  repo: string;       // "org/repo"
}

/** Parse `github://org/repo` or `gitlab://[host/]group/project` */
export function parseRepoUrl(raw: string): RepoRef {
  const match = raw.match(/^(github|gitlab):\/\/(.+)$/);
  if (!match) throw new Error(`Invalid content_repos entry: "${raw}" — must start with github:// or gitlab://`);

  const provider = match[1] as "github" | "gitlab";
  const rest = match[2]!;

  if (provider === "github") {
    return { provider, host: "github.com", repo: rest };
  }

  // gitlab://group/project → gitlab.com
  // gitlab://git.uni-berlin.de/group/project → self-hosted
  const parts = rest.split("/");
  if (parts.length > 2 && parts[0]!.includes(".")) {
    return { provider, host: parts[0]!, repo: parts.slice(1).join("/") };
  }
  return { provider, host: "gitlab.com", repo: rest };
}

/* ─── GitLab provider ─── */

function gitlabProvider(host: string): ContentProvider {
  const base = `https://${host}/api/v4`;
  const token = host === "gitlab.com"
    ? process.env.GITLAB_PAT ?? ""
    : process.env[`GITLAB_${host.replace(/[.-]/g, "_").toUpperCase()}_PAT`] ?? process.env.GITLAB_PAT ?? "";

  async function glFetch(url: string, cacheKey?: string): Promise<Response | null> {
    try {
      const headers: Record<string, string> = { "PRIVATE-TOKEN": token };
      const cached = cacheKey ? await getETag(cacheKey) : null;
      if (cached?.etag) headers["If-None-Match"] = cached.etag;

      const res = await fetch(url, { headers, next: { revalidate: getRevalidate() } });

      if (res.status === 304 && cached) return new Response(cached.body, { status: 304 });

      if (!res.ok) {
        log.warn("GitLab API %d: %s", res.status, url);
        if (res.status === 429 && cached) return new Response(cached.body, { status: 429 });
        return null;
      }

      const body = await res.text();
      const etag = res.headers.get("etag");
      if (cacheKey && etag) await setETag(cacheKey, { etag, body });

      return new Response(body, { status: 200 });
    } catch (err) {
      log.error(err, "GitLab fetch failed: %s", url);
      return null;
    }
  }

  const pid = (repo: string) => encodeURIComponent(repo);

  return {
    supportsIssues: true,
    async fetchFile(repo, path, ref = "main") {
      const res = await glFetch(`${base}/projects/${pid(repo)}/repository/files/${encodeURIComponent(path)}?ref=${ref}`, `etag:gl:${host}:${repo}:${path}:${ref}`);
      if (!res?.ok) return null;
      const data = (await res.json()) as { content?: string; encoding?: string };
      if (!data.content || data.encoding !== "base64") return null;
      return Buffer.from(data.content, "base64").toString("utf-8");
    },

    async listFiles(repo, path, ref = "main") {
      const res = await glFetch(`${base}/projects/${pid(repo)}/repository/tree?path=${encodeURIComponent(path)}&ref=${ref}&per_page=100`, `etag:gl:${host}:${repo}:${path}:${ref}:list`);
      if (!res?.ok) return [];
      const data = (await res.json()) as { name: string; type: string }[];
      if (!Array.isArray(data)) return [];
      return data.filter((f) => f.type === "blob").map((f) => f.name);
    },

    async listDirs(repo, path, ref = "main") {
      const res = await glFetch(`${base}/projects/${pid(repo)}/repository/tree?path=${encodeURIComponent(path)}&ref=${ref}&per_page=100`, `etag:gl:${host}:${repo}:${path}:${ref}:dirs`);
      if (!res?.ok) return [];
      const data = (await res.json()) as { name: string; type: string }[];
      if (!Array.isArray(data)) return [];
      return data.filter((f) => f.type === "tree").map((f) => f.name);
    },

    async createIssue(repo, title, body, labels) {
      try {
        const res = await fetch(`${base}/projects/${pid(repo)}/issues`, {
          method: "POST",
          headers: { "PRIVATE-TOKEN": token, "Content-Type": "application/json" },
          body: JSON.stringify({ title, description: body, labels: labels.join(",") }),
        });
        if (!res?.ok) { log.error("GitLab issue creation failed: %d", res?.status); return null; }
        const data = await res.json();
        return { url: data.web_url };
      } catch (err) { log.error(err, "GitLab createIssue failed"); return null; }
    },

    async listIssues(repo, userTag) {
      try {
        const res = await fetch(`${base}/projects/${pid(repo)}/issues?labels=feedback&state=all&per_page=100`, {
          headers: { "PRIVATE-TOKEN": token },
          cache: "no-store",
        });
        if (!res?.ok) return [];
        const issues = (await res.json()) as { iid: number; title: string; web_url: string; state: string; created_at: string; user_notes_count: number; description?: string; closed_by?: { username: string }; author?: { username: string } }[];
        return issues
          .filter((i) => i.description?.includes(`<!-- openlex-user: ${userTag} -->`))
          .map((i) => ({ id: i.iid, title: i.title, url: i.web_url, state: (i.state === "closed" ? "closed" : "open") as "open" | "closed", created_at: i.created_at, comments: i.user_notes_count, closedByUser: i.state === "closed" && i.closed_by?.username === i.author?.username }));
      } catch (err) { log.error(err, "GitLab listIssues failed"); return []; }
    },

    async getIssueComments(repo, issueId) {
      try {
        const res = await fetch(`${base}/projects/${pid(repo)}/issues/${issueId}/notes?per_page=100&sort=asc`, {
          headers: { "PRIVATE-TOKEN": token },
          cache: "no-store",
        });
        if (!res?.ok) return [];
        const notes = (await res.json()) as { author: { username: string }; body: string; created_at: string; system: boolean }[];
        return notes.filter((n) => !n.system).map((n) => ({ author: n.author.username, body: n.body, created_at: n.created_at }));
      } catch (err) { log.error(err, "GitLab getIssueComments failed"); return []; }
    },

    async addComment(repo, issueId, body) {
      try {
        const res = await fetch(`${base}/projects/${pid(repo)}/issues/${issueId}/notes`, {
          method: "POST",
          headers: { "PRIVATE-TOKEN": token, "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        });
        return !!res?.ok;
      } catch (err) { log.error(err, "GitLab addComment failed"); return false; }
    },

    async closeIssue(repo, issueId) {
      try {
        const res = await fetch(`${base}/projects/${pid(repo)}/issues/${issueId}`, {
          method: "PUT",
          headers: { "PRIVATE-TOKEN": token, "Content-Type": "application/json" },
          body: JSON.stringify({ state_event: "close" }),
        });
        return !!res?.ok;
      } catch (err) { log.error(err, "GitLab closeIssue failed"); return false; }
    },

    async listTags(repo, prefix) {
      try {
        const res = await fetch(`${base}/projects/${pid(repo)}/repository/tags?per_page=100&search=${encodeURIComponent(prefix)}`, {
          headers: { "PRIVATE-TOKEN": token },
          cache: "no-store",
        });
        if (!res?.ok) return [];
        const tags = (await res.json()) as { name: string }[];
        return tags.map((t) => t.name).filter((n) => n.startsWith(prefix)).sort().reverse();
      } catch (err) { log.error(err, "GitLab listTags failed"); return []; }
    },
  };
}

/* ─── Factory ─── */

import { github } from "./github";

const providers = new Map<string, ContentProvider>();

/** Get a ContentProvider for a repo URL string from site.yaml */
export function getProvider(repoUrl: string): { provider: ContentProvider; repo: string } {
  const ref = parseRepoUrl(repoUrl);
  const key = `${ref.provider}:${ref.host}`;

  let p = providers.get(key);
  if (!p) {
    p = ref.provider === "github" ? github : gitlabProvider(ref.host);
    providers.set(key, p);
  }

  return { provider: p, repo: ref.repo };
}
