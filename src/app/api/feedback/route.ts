import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { log } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const { repo, category, location, selectedText, comment } = await req.json();
    if (!repo || !category || !location || !comment) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const pat = process.env.GITHUB_PAT;
    if (!pat) {
      log.error("GITHUB_PAT not configured");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const labels = ["feedback", category];
    const match = location.match(/\/(book|law)\/([^/]+)\/([^/?]+)/);
    if (match) labels.push(`${match[2]}-${match[3]}`);

    const title = `[${category}] ${selectedText?.slice(0, 60) || comment.slice(0, 60)}`;
    const body = [
      `**Kategorie:** ${category}`,
      `**Fundstelle:** ${location}`,
      selectedText ? `**Markierter Text:**\n> ${selectedText}` : "",
      `**Kommentar:**\n${comment}`,
      `\n<!-- openlex-user: ${auth} -->`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({ title, body, labels }),
    });

    if (!res.ok) {
      log.error("GitHub issue creation failed: %d %s", res.status, await res.text());
      return NextResponse.json({ error: "Failed to create issue" }, { status: 502 });
    }

    const issue = await res.json();
    return NextResponse.json({ url: issue.html_url });
  } catch (err) {
    log.error(err, "feedback POST failed");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
