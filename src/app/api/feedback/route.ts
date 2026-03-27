import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody } from "@/lib/api-utils";
import { loadSiteConfig } from "@/lib/site";
import { parseRepoUrl } from "@/lib/git-provider";
import { rateLimit } from "@/lib/rate-limit";
import { log } from "@/lib/logger";

const feedbackSchema = z.object({
  repo: z.string().min(1),
  category: z.string().min(1),
  location: z.string().min(1),
  selectedText: z.string().optional(),
  comment: z.string().min(1),
});

export const POST = withAuth("feedback POST", async (req, email) => {
  const data = await parseBody(req, feedbackSchema);
  if (data instanceof NextResponse) return data;

  // #2 SSRF prevention: validate repo against configured content_repos
  const allowedRepos = new Set((loadSiteConfig().content_repos ?? []).map((r) => parseRepoUrl(r).repo));
  if (!allowedRepos.has(data.repo)) return NextResponse.json({ error: "Invalid repo" }, { status: 403 });

  // #6 Rate limit: 10 feedback per minute
  const limited = rateLimit(email, 10);
  if (limited) return limited;

  const pat = process.env.GITHUB_PAT;
  if (!pat) { log.error("GITHUB_PAT not configured"); return NextResponse.json({ error: "Server configuration error" }, { status: 500 }); }

  const labels = ["feedback", data.category];
  const match = data.location.match(/\/(book|law)\/([^/]+)\/([^/?]+)/);
  if (match) labels.push(`${match[2]}-${match[3]}`);

  const title = `[${data.category}] ${data.selectedText?.slice(0, 60) || data.comment.slice(0, 60)}`;
  const body = [`**Kategorie:** ${data.category}`, `**Fundstelle:** ${data.location}`, data.selectedText ? `**Markierter Text:**\n> ${data.selectedText}` : "", `**Kommentar:**\n${data.comment}`, `\n<!-- openlex-user: ${email} -->`].filter(Boolean).join("\n\n");

  const res = await fetch(`https://api.github.com/repos/${data.repo}/issues`, {
    method: "POST",
    headers: { Authorization: `Bearer ${pat}`, Accept: "application/vnd.github+json" },
    body: JSON.stringify({ title, body, labels }),
  });

  if (!res.ok) { log.error("GitHub issue creation failed: %d", res.status); return NextResponse.json({ error: "Failed to create issue" }, { status: 502 }); }
  return NextResponse.json({ url: (await res.json()).html_url });
});
