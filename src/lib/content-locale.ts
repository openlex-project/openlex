import { headers } from "next/headers";
import { defaultLocale, type Locale } from "@/lib/i18n";

/** Shared locale extraction for all content pages. Reads x-ui-locale and x-content-locale from headers. */
export async function getContentLocale() {
  const h = await headers();
  const locale = (h.get("x-ui-locale") ?? defaultLocale) as Locale;
  const contentLocale = h.get("x-content-locale") ?? undefined;
  const localePrefix = contentLocale && contentLocale !== defaultLocale ? `/${contentLocale}` : "";
  return { locale, contentLocale, localePrefix };
}
