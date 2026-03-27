import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, withSession, parseBody } from "@/lib/api-utils";
import { getBookmarks, toggleBookmark, isBookmarked } from "@/lib/redis";

const toggleSchema = z.object({ path: z.string().min(1).max(500), title: z.string().max(300).optional() });

export const GET = withSession("bookmarks GET", async (req, email) => {
  if (!email) return NextResponse.json({ bookmarks: [] });
  const path = req.nextUrl.searchParams.get("path");
  if (path) return NextResponse.json({ bookmarked: await isBookmarked(email, path) });
  return NextResponse.json({ bookmarks: await getBookmarks(email) });
});

export const POST = withAuth("bookmarks POST", async (req, email) => {
  const data = await parseBody(req, toggleSchema);
  if (data instanceof NextResponse) return data;
  return NextResponse.json({ bookmarked: await toggleBookmark(email, data.path, data.title) });
});
