import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { log } from "@/lib/logger";
import type { z } from "zod";

type Handler = (req: NextRequest, email: string) => Promise<NextResponse>;
type SessionHandler = (req: NextRequest, email: string | null) => Promise<NextResponse>;

/** Wrap an API handler with try/catch + required auth. */
export function withAuth(label: string, handler: Handler) {
  return async (req: NextRequest) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      return await handler(req, session.user.email);
    } catch (err) {
      log.error(err, "%s failed", label);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
  };
}

/** Wrap an API handler with try/catch + optional session (email may be null). */
export function withSession(label: string, handler: SessionHandler) {
  return async (req: NextRequest) => {
    try {
      const session = await getServerSession(authOptions);
      return await handler(req, session?.user?.email ?? null);
    } catch (err) {
      log.error(err, "%s failed", label);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
  };
}

/** Parse and validate request JSON body with a zod schema. Returns parsed data or a 400 NextResponse. */
export async function parseBody<T extends z.ZodType>(req: NextRequest, schema: T): Promise<z.infer<T> | NextResponse> {
  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const result = schema.safeParse(raw);
  if (!result.success) return NextResponse.json({ error: "Validation failed", issues: result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 400 });
  return result.data;
}
