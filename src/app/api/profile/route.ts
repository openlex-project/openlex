import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { exportUserData, deleteAllUserData, getUserSettings, setUserSetting } from "@/lib/kv";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  if (req.nextUrl.searchParams.has("settings")) {
    return NextResponse.json({ settings: await getUserSettings(auth) });
  }
  return NextResponse.json(await exportUserData(auth));
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { key, value } = (await req.json()) as { key: string; value: string };
  await setUserSetting(auth, key, value);
  return NextResponse.json({ settings: await getUserSettings(auth) });
}

export async function DELETE() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  await deleteAllUserData(auth);
  return NextResponse.json({ deleted: true });
}
