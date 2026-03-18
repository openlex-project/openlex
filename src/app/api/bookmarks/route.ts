import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBookmarks, toggleBookmark } from "@/lib/kv";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ bookmarks: [] });
  }
  const bookmarks = await getBookmarks(session.user.email);
  return NextResponse.json({ bookmarks });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }
  const { path } = (await req.json()) as { path: string };
  const added = await toggleBookmark(session.user.email, path);
  return NextResponse.json({ bookmarked: added });
}
