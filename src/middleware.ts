import { NextRequest, NextResponse } from "next/server";

const locales = (process.env.NEXT_PUBLIC_LOCALES ?? "en").split(",");
const defaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? "en";

function parseAcceptLanguage(header: string | null): string {
  if (!header) return defaultLocale;
  for (const part of header.split(",")) {
    const lang = part.trim().split(";")[0]!.split("-")[0]!.toLowerCase();
    if (locales.includes(lang)) return lang;
  }
  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/") || pathname.startsWith("/pagefind/") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const pathnameLocale = locales.find((l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`);
  const uiLocale = parseAcceptLanguage(request.headers.get("accept-language"));
  const contentLocale = pathnameLocale ?? defaultLocale;

  // Redirect default locale prefix: /de/... → /...
  if (pathnameLocale === defaultLocale) {
    const stripped = pathname.slice(`/${defaultLocale}`.length) || "/";
    return NextResponse.redirect(new URL(stripped, request.url), 301);
  }

  // Rewrite non-default locale: /en/... → /... (strip prefix, keep header)
  if (pathnameLocale && pathnameLocale !== defaultLocale) {
    const stripped = pathname.slice(`/${pathnameLocale}`.length) || "/";
    const response = NextResponse.rewrite(new URL(stripped, request.url));
    response.headers.set("x-ui-locale", uiLocale);
    response.headers.set("x-content-locale", contentLocale);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("x-ui-locale", uiLocale);
  response.headers.set("x-content-locale", contentLocale);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
