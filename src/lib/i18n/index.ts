import { loadSiteConfig } from "../site";
import de from "./de";
import en from "./en";

export const defaultLocale = loadSiteConfig().default_locale ?? "en";
export const locales = (process.env.NEXT_PUBLIC_LOCALES ?? "en").split(",");
export type Locale = string;

const dictionaries: Record<string, Record<string, string>> = { de, en };

export function t(locale: Locale, key: string, params?: Record<string, string>): string {
  const site = loadSiteConfig();
  if (key === "site.title") return site.name;
  if (key === "site.tagline") return site.branding?.tagline?.[locale] ?? site.branding?.tagline?.[defaultLocale] ?? "";

  let str = dictionaries[locale]?.[key] ?? dictionaries[defaultLocale]?.[key] ?? dictionaries.en?.[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, v);
    }
  }
  return str;
}
