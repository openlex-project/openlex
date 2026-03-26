import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, locales } from "@/lib/i18n";

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
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://plausible.io https://gc.zgo.at",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.github.com https://*.upstash.io https://plausible.io https://vitals.vercel-insights.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join("; ");
  res.headers.set("Content-Security-Policy", csp);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
