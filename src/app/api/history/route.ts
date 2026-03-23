import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/api-auth";
import { addHistory, getHistory } from "@/lib/kv";

export async function GET() {
  // History GET returns [] for unauthenticated (not 401)
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ history: [] });
  return NextResponse.json({ history: await getHistory(session.user.email) });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { path, title } = (await req.json()) as { path: string; title: string };
  await addHistory(auth, path, title);
  return NextResponse.json({ ok: true });
}
