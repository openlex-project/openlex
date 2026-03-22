import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBookmarks, toggleBookmark } from "@/lib/kv";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ bookmarks: [] });
  const path = req.nextUrl.searchParams.get("path");
  if (path) {
    const bookmarks = await getBookmarks(session.user.email);
    return NextResponse.json({ bookmarked: bookmarks.some((b) => b.path === path) });
  }
  return NextResponse.json({ bookmarks: await getBookmarks(session.user.email) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { path, title } = (await req.json()) as { path: string; title?: string };
  const added = await toggleBookmark(session.user.email, path, title);
  return NextResponse.json({ bookmarked: added });
}
