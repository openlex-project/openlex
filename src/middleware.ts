import { NextRequest, NextResponse } from "next/server";

const locales = ["de", "en"];
const defaultLocale = "de";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/") || pathname.startsWith("/pagefind/") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const pathnameLocale = locales.find((l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`);

  if (!pathnameLocale && !locales.some((l) => pathname.startsWith(`/${l}`))) {
    const response = NextResponse.next();
    response.headers.set("x-locale", defaultLocale);
    return response;
  }

  if (pathnameLocale) {
    const response = NextResponse.next();
    response.headers.set("x-locale", pathnameLocale);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
