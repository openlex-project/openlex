import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody } from "@/lib/api-utils";
import { loadSiteConfig } from "@/lib/site";
import { getProvider, parseRepoUrl } from "@/lib/git-provider";
import { rateLimit } from "@/lib/rate-limit";

const commentSchema = z.object({ repo: z.string().min(1), issueId: z.number(), body: z.string().min(1).max(5000) });
const closeSchema = z.object({ repo: z.string().min(1), issueId: z.number() });

function resolveProvider(repo: string) {
  const repoUrl = (loadSiteConfig().content_repos ?? []).find((r) => parseRepoUrl(r).repo === repo);
  if (!repoUrl) return null;
  return getProvider(repoUrl);
}

export const GET = withAuth("feedback comments GET", async (req, _email) => {
  const repo = req.nextUrl.searchParams.get("repo");
  const issueId = Number(req.nextUrl.searchParams.get("issueId"));
  if (!repo || !issueId) return NextResponse.json({ error: "Missing params" }, { status: 400 });
  const p = resolveProvider(repo);
  if (!p) return NextResponse.json({ error: "Invalid repo" }, { status: 403 });
  const comments = await p.provider.getIssueComments(p.repo, issueId);
  return NextResponse.json({ comments });
});

export const POST = withAuth("feedback comments POST", async (req, email) => {
  const data = await parseBody(req, z.discriminatedUnion("action", [
    z.object({ action: z.literal("comment"), ...commentSchema.shape }),
    z.object({ action: z.literal("close"), ...closeSchema.shape }),
  ]));
  if (data instanceof NextResponse) return data;

  const limited = rateLimit(email, 10);
  if (limited) return limited;

  const p = resolveProvider(data.repo);
  if (!p) return NextResponse.json({ error: "Invalid repo" }, { status: 403 });

  if (data.action === "comment") {
    const ok = await p.provider.addComment(p.repo, data.issueId, data.body);
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Failed" }, { status: 502 });
  }

  if (data.action === "close") {
    const ok = await p.provider.closeIssue(p.repo, data.issueId);
    return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Failed" }, { status: 502 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
});
