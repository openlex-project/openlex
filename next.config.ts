import type { NextConfig } from "next";
import { resolve } from "path";
import { readFileSync } from "fs";
import { parse } from "yaml";

function buildCsp(): string {
  try {
    const site = parse(readFileSync("site.yaml", "utf-8")) as { content_repos?: string[]; features?: { analytics?: { provider?: string; url?: string } } };
    const apiHosts = [...new Set((site.content_repos ?? []).map((r) => {
      if (r.startsWith("github://")) return "https://api.github.com";
      const m = r.match(/^gitlab:\/\/([^/]+)/);
      return m && m[1]!.includes(".") ? `https://${m[1]}` : "https://gitlab.com";
    }))];
    const ah: string[] = [];
    const p = site.features?.analytics?.provider;
    if (p === "plausible") ah.push("https://plausible.io");
    else if ((p === "matomo" || p === "umami" || p === "goatcounter") && site.features?.analytics?.url) ah.push(site.features.analytics.url);
    else if (p === "vercel") ah.push("https://vitals.vercel-insights.com");
    return [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' ${ah.join(" ")}`.trim(),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      `connect-src 'self' ${[...apiHosts, "https://*.upstash.io", ...ah].join(" ")}`.trim(),
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; ");
  } catch { return ""; }
}

const csp = buildCsp();

const nextConfig: NextConfig = {
  turbopack: { root: resolve(__dirname) },
  ...(csp && {
    headers: async () => [{
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      headers: [{ key: "Content-Security-Policy", value: csp }],
    }],
  }),
};

export default nextConfig;
