import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const { repo, category, location, selectedText, comment } = await req.json();
  if (!repo || !category || !location || !comment) {
    return NextResponse.json({ error: "Fehlende Felder" }, { status: 400 });
  }

  const pat = process.env.GITHUB_PAT;
  if (!pat) {
    return NextResponse.json({ error: "Server-Konfigurationsfehler" }, { status: 500 });
  }

  const labels = ["feedback", category];
  // Extract article/paragraph from location URL
  const match = location.match(/\/(book|law)\/([^/]+)\/([^/?]+)/);
  if (match) labels.push(`${match[2]}-${match[3]}`);

  const title = `[${category}] ${selectedText?.slice(0, 60) || comment.slice(0, 60)}`;
  const body = [
    `**Kategorie:** ${category}`,
    `**Fundstelle:** ${location}`,
    selectedText ? `**Markierter Text:**\n> ${selectedText}` : "",
    `**Kommentar:**\n${comment}`,
    `\n<!-- openlex-user: ${session.user.email ?? session.user.name ?? "unknown"} -->`,
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
    return NextResponse.json({ error: "Issue konnte nicht erstellt werden" }, { status: 502 });
  }

  const issue = await res.json();
  return NextResponse.json({ url: issue.html_url });
}
