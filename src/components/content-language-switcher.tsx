import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";

const locales = (process.env.NEXT_PUBLIC_LOCALES ?? "en").split(",");
const defaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? "en";

/**
 * Contextual content language switcher — shown on content pages when translations exist.
 * Displays "Also available in: EN · FR" below the content meta line.
 */
export function ContentLanguageSwitcher({ translations, currentPath, locale }: {
  translations?: string[];
  currentPath: string;
  locale: Locale;
}) {
  if (!translations?.length) return null;

  // Build list of other available locales (exclude current content locale)
  const contentLocale = locales.find((l) => currentPath.startsWith(`/${l}/`)) ?? defaultLocale;
  const others = [defaultLocale, ...translations].filter((l) => l !== contentLocale);
  if (!others.length) return null;

  const buildHref = (l: string) => {
    const clean = locales.reduce((p, loc) => p.replace(new RegExp(`^/${loc}(/|$)`), "$1"), currentPath) || "/";
    return l === defaultLocale ? clean : `/${l}${clean}`;
  };

  return (
    <div className="text-xs mb-4" style={{ color: "var(--text-tertiary)" }}>
      {t(locale, "content.availableIn")}{" "}
      {others.map((l, i) => (
        <span key={l}>
          {i > 0 && " · "}
          <Link href={buildHref(l)} className="uppercase hover:underline" style={{ color: "var(--active-text)" }}>{l}</Link>
        </span>
      ))}
    </div>
  );
}
