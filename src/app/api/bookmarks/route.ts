import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/api-auth";
import { getBookmarks, toggleBookmark, isBookmarked } from "@/lib/redis";
import { log } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ bookmarks: [] });
    const path = req.nextUrl.searchParams.get("path");
    if (path) return NextResponse.json({ bookmarked: await isBookmarked(session.user.email, path) });
    return NextResponse.json({ bookmarks: await getBookmarks(session.user.email) });
  } catch (err) {
    log.error(err, "bookmarks GET failed");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { path, title } = (await req.json()) as { path: string; title?: string };
    return NextResponse.json({ bookmarked: await toggleBookmark(auth, path, title) });
  } catch (err) {
    log.error(err, "bookmarks POST failed");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
