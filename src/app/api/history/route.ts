import { NextResponse } from "next/server";
import { withAuth, withSession } from "@/lib/api-utils";
import { addHistory, getHistory } from "@/lib/redis";

export const GET = withSession("history GET", async (_req, email) => {
  if (!email) return NextResponse.json({ history: [] });
  return NextResponse.json({ history: await getHistory(email) });
});

export const POST = withAuth("history POST", async (req, email) => {
  const { path, title } = (await req.json()) as { path: string; title: string };
  await addHistory(email, path, title);
  return NextResponse.json({ ok: true });
});
