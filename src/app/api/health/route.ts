import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {};

  // Redis
  try {
    const url = process.env.REDIS_REST_URL;
    const token = process.env.REDIS_REST_TOKEN;
    if (url && token) { await new Redis({ url, token }).ping(); checks.redis = "ok"; }
    else checks.redis = "error";
  } catch { checks.redis = "error"; }

  // GitHub
  try {
    const pat = process.env.GITHUB_PAT;
    if (pat) {
      const res = await fetch("https://api.github.com/rate_limit", { headers: { Authorization: `Bearer ${pat}` }, cache: "no-store" });
      checks.github = res.ok ? "ok" : "error";
    } else checks.github = "error";
  } catch { checks.github = "error"; }

  const status = Object.values(checks).every((v) => v === "ok") ? "ok" : "degraded";
  return NextResponse.json({ status, ...checks }, { status: status === "ok" ? 200 : 503 });
}
