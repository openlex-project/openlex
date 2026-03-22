import { loadSiteConfig } from "../site";
import de from "./de";
import en from "./en";

export const defaultLocale = loadSiteConfig().default_locale;
export const locales = ["de", "en"] as const;
export type Locale = (typeof locales)[number];

const dictionaries: Record<Locale, Record<string, string>> = { de, en };

export function t(locale: Locale, key: string, params?: Record<string, string>): string {
  const site = loadSiteConfig();
  if (key === "site.title") return site.name;
  if (key === "site.tagline") return site.tagline[locale] ?? site.tagline[defaultLocale] ?? "";
  if (key === "footer.copy") return `© ${site.copyright}`;

  let str = dictionaries[locale]?.[key] ?? dictionaries[defaultLocale as Locale][key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, v);
    }
  }
  return str;
}
