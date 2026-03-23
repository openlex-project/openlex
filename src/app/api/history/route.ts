import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addHistory, getHistory } from "@/lib/kv";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ history: [] });
  }
  const history = await getHistory(session.user.email);
  return NextResponse.json({ history });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { path, title } = (await req.json()) as { path: string; title: string };
  await addHistory(session.user.email, path, title);
  return NextResponse.json({ ok: true });
}
