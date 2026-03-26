import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, withSession, parseBody } from "@/lib/api-utils";
import { addHistory, getHistory } from "@/lib/redis";

const addSchema = z.object({ path: z.string().min(1), title: z.string().min(1) });

export const GET = withSession("history GET", async (_req, email) => {
  if (!email) return NextResponse.json({ history: [] });
  return NextResponse.json({ history: await getHistory(email) });
});

export const POST = withAuth("history POST", async (req, email) => {
  const data = await parseBody(req, addSchema);
  if (data instanceof NextResponse) return data;
  await addHistory(email, data.path, data.title);
  return NextResponse.json({ ok: true });
});
