import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, locales } from "@/lib/i18n";
import { loadSiteConfig } from "@/lib/site";
import { parseRepoUrl } from "@/lib/git-provider";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes, static files, Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/pagefind/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if pathname starts with a locale
  const pathnameLocale = locales.find(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`,
  );

  // Default locale: no prefix needed, just pass through
  if (!pathnameLocale && !locales.some((l) => pathname.startsWith(`/${l}`))) {
    const response = NextResponse.next();
    response.headers.set("x-locale", defaultLocale);
    setCsp(response);
    return response;
  }

  // Non-default locale: set header
  if (pathnameLocale) {
    const response = NextResponse.next();
    response.headers.set("x-locale", pathnameLocale);
    setCsp(response);
    return response;
  }

  return NextResponse.next();
}

function setCsp(res: NextResponse) {
  const site = loadSiteConfig();
  const apiHosts = [...new Set((site.content_repos ?? []).map((r) => {
    const ref = parseRepoUrl(r);
    return ref.provider === "github" ? "https://api.github.com" : `https://${ref.host}`;
  }))];
  const analyticsHosts = [];
  const p = site.features?.analytics?.provider;
  if (p === "plausible") analyticsHosts.push("https://plausible.io");
  else if (p === "matomo" && site.features?.analytics?.url) analyticsHosts.push(site.features.analytics.url);
  else if (p === "umami" && site.features?.analytics?.url) analyticsHosts.push(site.features.analytics.url);
  else if (p === "goatcounter" && site.features?.analytics?.url) analyticsHosts.push(site.features.analytics.url);
  else if (p === "vercel") analyticsHosts.push("https://vitals.vercel-insights.com");

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${analyticsHosts.join(" ")}`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src 'self' ${[...apiHosts, "https://*.upstash.io", ...analyticsHosts].join(" ")}`.trim(),
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join("; ");
  res.headers.set("Content-Security-Policy", csp);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
