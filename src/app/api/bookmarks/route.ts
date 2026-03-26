import { NextResponse } from "next/server";
import { withAuth, withSession } from "@/lib/api-utils";
import { getBookmarks, toggleBookmark, isBookmarked } from "@/lib/redis";

export const GET = withSession("bookmarks GET", async (req, email) => {
  if (!email) return NextResponse.json({ bookmarks: [] });
  const path = req.nextUrl.searchParams.get("path");
  if (path) return NextResponse.json({ bookmarked: await isBookmarked(email, path) });
  return NextResponse.json({ bookmarks: await getBookmarks(email) });
});

export const POST = withAuth("bookmarks POST", async (req, email) => {
  const { path, title } = (await req.json()) as { path: string; title?: string };
  return NextResponse.json({ bookmarked: await toggleBookmark(email, path, title) });
});
