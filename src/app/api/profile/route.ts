import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exportUserData, deleteAllUserData, getUserSettings, setUserSetting } from "@/lib/kv";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (req.nextUrl.searchParams.has("settings")) {
    return NextResponse.json({ settings: await getUserSettings(session.user.email) });
  }
  const data = await exportUserData(session.user.email);
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { key, value } = (await req.json()) as { key: string; value: string };
  await setUserSetting(session.user.email, key, value);
  const settings = await getUserSettings(session.user.email);
  return NextResponse.json({ settings });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deleteAllUserData(session.user.email);
  return NextResponse.json({ deleted: true });
}
