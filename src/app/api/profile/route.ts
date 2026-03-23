import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { exportUserData, deleteAllUserData, getUserSettings, setUserSetting } from "@/lib/redis";
import { log } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  try {
    if (req.nextUrl.searchParams.has("settings")) {
      return NextResponse.json({ settings: await getUserSettings(auth) });
    }
    return NextResponse.json(await exportUserData(auth));
  } catch (err) {
    log.error(err, "profile GET failed");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  try {
    const { key, value } = (await req.json()) as { key: string; value: string };
    await setUserSetting(auth, key, value);
    return NextResponse.json({ settings: await getUserSettings(auth) });
  } catch (err) {
    log.error(err, "profile PATCH failed");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  try {
    await deleteAllUserData(auth);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    log.error(err, "profile DELETE failed");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
