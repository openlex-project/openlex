import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody } from "@/lib/api-utils";
import { loadSiteConfig } from "@/lib/site";
import { buildRegistry } from "@/lib/registry";
import { getProvider, parseRepoUrl } from "@/lib/git-provider";
import { rateLimit } from "@/lib/rate-limit";
import { hashUserId } from "@/lib/user-hash";

export const GET = withAuth("feedback GET", async (_req, email) => {
  const registry = await buildRegistry();
  const tag = hashUserId(email);
  const feedbackRepos = new Set<string>();
  for (const b of registry.books.values()) if (b.feedbackEnabled) feedbackRepos.add(b.repo);
  for (const l of registry.laws.values()) if (l.feedbackEnabled) feedbackRepos.add(l.repo);
  for (const j of registry.journals.values()) if (j.feedbackEnabled) feedbackRepos.add(j.repo);
  const all = await Promise.all([...feedbackRepos].map(async (repoUrl) => {
    const { provider, repo } = getProvider(repoUrl);
    const issues = await provider.listIssues(repo, tag);
    return issues.map((i) => ({ ...i, repo: parseRepoUrl(repoUrl).repo }));
  }));
  const issues = all.flat().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return NextResponse.json({ issues });
});

const feedbackSchema = z.object({
  repo: z.string().min(1),
  category: z.string().min(1).max(50),
  location: z.string().min(1).max(2000).refine((v) => v.startsWith("/"), "Must be a relative path"),
  selectedText: z.string().max(500).optional(),
  comment: z.string().min(1).max(5000),
});

export const POST = withAuth("feedback POST", async (req, email) => {
  const data = await parseBody(req, feedbackSchema);
  if (data instanceof NextResponse) return data;

  const repoUrls = loadSiteConfig().content_repos ?? [];
  const repoUrl = repoUrls.find((r) => parseRepoUrl(r).repo === data.repo);
  if (!repoUrl) return NextResponse.json({ error: "Invalid repo" }, { status: 403 });

  const limited = rateLimit(email, 10);
  if (limited) return limited;

  const { provider, repo } = getProvider(repoUrl);

  const labels = ["feedback", data.category];
  const match = data.location.match(/\/([^/]+)\/([^/?]+)/);
  if (match) labels.push(`${match[1]}-${match[2]}`);

  const title = `[${data.category}] ${data.selectedText?.slice(0, 60) || data.comment.slice(0, 60)}`;
  const body = [`> 🤖 *Submitted via [OpenLex](${loadSiteConfig().base_url ?? "https://openlex.vercel.app"}) feedback system on behalf of a user.*`, `**Kategorie:** ${data.category}`, `**Fundstelle:** ${data.location}`, data.selectedText ? `**Markierter Text:**\n> ${data.selectedText}` : "", `**Kommentar:**\n${data.comment}`, `\n<!-- openlex-user: ${hashUserId(email)} -->`].filter(Boolean).join("\n\n");

  const result = await provider.createIssue(repo, title, body, labels);
  if (!result) return NextResponse.json({ error: "Failed to create issue" }, { status: 502 });
  return NextResponse.json({ url: result.url });
});
