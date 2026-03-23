import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/api-auth";
import { getBookmarks, toggleBookmark, isBookmarked } from "@/lib/kv";

export async function GET(req: NextRequest) {
  // Bookmarks GET returns [] for unauthenticated (not 401)
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ bookmarks: [] });
  const path = req.nextUrl.searchParams.get("path");
  if (path) return NextResponse.json({ bookmarked: await isBookmarked(session.user.email, path) });
  return NextResponse.json({ bookmarks: await getBookmarks(session.user.email) });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { path, title } = (await req.json()) as { path: string; title?: string };
  return NextResponse.json({ bookmarked: await toggleBookmark(auth, path, title) });
}
