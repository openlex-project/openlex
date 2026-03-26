import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import { exportUserData, deleteAllUserData, getUserSettings, setUserSetting } from "@/lib/redis";

export const GET = withAuth("profile GET", async (req, email) => {
  if (req.nextUrl.searchParams.has("settings")) return NextResponse.json({ settings: await getUserSettings(email) });
  return NextResponse.json(await exportUserData(email));
});

export const PATCH = withAuth("profile PATCH", async (req, email) => {
  const { key, value } = (await req.json()) as { key: string; value: string };
  await setUserSetting(email, key, value);
  return NextResponse.json({ settings: await getUserSettings(email) });
});

export const DELETE = withAuth("profile DELETE", async (_req, email) => {
  await deleteAllUserData(email);
  return NextResponse.json({ deleted: true });
});
