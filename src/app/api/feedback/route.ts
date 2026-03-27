import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody } from "@/lib/api-utils";
import { loadSiteConfig } from "@/lib/site";
import { getProvider, parseRepoUrl } from "@/lib/git-provider";
import { rateLimit } from "@/lib/rate-limit";

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
  const body = [`**Kategorie:** ${data.category}`, `**Fundstelle:** ${data.location}`, data.selectedText ? `**Markierter Text:**\n> ${data.selectedText}` : "", `**Kommentar:**\n${data.comment}`, `\n<!-- openlex-user: ${email} -->`].filter(Boolean).join("\n\n");

  const result = await provider.createIssue(repo, title, body, labels);
  if (!result) return NextResponse.json({ error: "Failed to create issue" }, { status: 502 });
  return NextResponse.json({ url: result.url });
});
