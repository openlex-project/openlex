import { createHash } from "crypto";

/** Hash email to a privacy-safe identifier for issue tagging. */
export function hashUserId(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? "openlex";
  return createHash("sha256").update(`${email}:${secret}`).digest("hex").slice(0, 16);
}
