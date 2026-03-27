"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "./locale-provider";

const locales = (process.env.NEXT_PUBLIC_LOCALES ?? "en").split(",");
const defaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? "en";

export function LanguageSwitcher() {
  if (locales.length <= 1) return null;
  const pathname = usePathname();
  const currentLocale = useLocale();

  const buildHref = (locale: string) => {
    // Strip current locale prefix if present
    const clean = locales.reduce((p, l) => p.replace(new RegExp(`^/${l}(/|$)`), "$1"), pathname) || "/";
    return locale === defaultLocale ? clean : `/${locale}${clean}`;
  };

  return (
    <div className="flex items-center gap-1 text-xs">
      {locales.map((l) => (
        <a key={l} href={buildHref(l)} className={`px-1.5 py-0.5 rounded uppercase ${currentLocale === l ? "font-semibold" : ""}`}
          style={{ color: currentLocale === l ? "var(--active-text)" : "var(--text-tertiary)", background: currentLocale === l ? "var(--active-bg)" : undefined }}>
          {l}
        </a>
      ))}
    </div>
  );
}
