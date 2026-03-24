import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/api-auth";
import { addHistory, getHistory } from "@/lib/redis";
import { log } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ history: [] });
    return NextResponse.json({ history: await getHistory(session.user.email) });
  } catch (err) {
    log.error(err, "history GET failed");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { path, title } = (await req.json()) as { path: string; title: string };
    await addHistory(auth, path, title);
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error(err, "history POST failed");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
