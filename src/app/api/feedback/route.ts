import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import { log } from "@/lib/logger";

export const POST = withAuth("feedback POST", async (req, email) => {
  const { repo, category, location, selectedText, comment } = await req.json();
  if (!repo || !category || !location || !comment) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const pat = process.env.GITHUB_PAT;
  if (!pat) { log.error("GITHUB_PAT not configured"); return NextResponse.json({ error: "Server configuration error" }, { status: 500 }); }

  const labels = ["feedback", category];
  const match = location.match(/\/(book|law)\/([^/]+)\/([^/?]+)/);
  if (match) labels.push(`${match[2]}-${match[3]}`);

  const title = `[${category}] ${selectedText?.slice(0, 60) || comment.slice(0, 60)}`;
  const body = [`**Kategorie:** ${category}`, `**Fundstelle:** ${location}`, selectedText ? `**Markierter Text:**\n> ${selectedText}` : "", `**Kommentar:**\n${comment}`, `\n<!-- openlex-user: ${email} -->`].filter(Boolean).join("\n\n");

  const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: { Authorization: `Bearer ${pat}`, Accept: "application/vnd.github+json" },
    body: JSON.stringify({ title, body, labels }),
  });

  if (!res.ok) { log.error("GitHub issue creation failed: %d", res.status); return NextResponse.json({ error: "Failed to create issue" }, { status: 502 }); }
  return NextResponse.json({ url: (await res.json()).html_url });
});
