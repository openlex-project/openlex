import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseBody } from "@/lib/api-utils";
import { exportUserData, deleteAllUserData, getUserSettings, setUserSetting } from "@/lib/redis";

const settingSchema = z.object({ key: z.string().min(1), value: z.string() });

export const GET = withAuth("profile GET", async (req, email) => {
  if (req.nextUrl.searchParams.has("settings")) return NextResponse.json({ settings: await getUserSettings(email) });
  return NextResponse.json(await exportUserData(email));
});

export const PATCH = withAuth("profile PATCH", async (req, email) => {
  const data = await parseBody(req, settingSchema);
  if (data instanceof NextResponse) return data;
  await setUserSetting(email, data.key, data.value);
  return NextResponse.json({ settings: await getUserSettings(email) });
});

export const DELETE = withAuth("profile DELETE", async (_req, email) => {
  await deleteAllUserData(email);
  return NextResponse.json({ deleted: true });
});
