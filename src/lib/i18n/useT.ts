"use client";

import { useLocale } from "@/components/locale-provider";
import de from "@/lib/i18n/de";
import en from "@/lib/i18n/en";
import type { Locale } from "@/lib/i18n";

const dictionaries: Record<Locale, Record<string, string>> = { de, en };

export function useT() {
  const locale = useLocale();
  return (key: string, params?: Record<string, string>) => {
    let str = dictionaries[locale]?.[key] ?? (dictionaries["en"] ?? {})[key] ?? key;
    if (params) for (const [k, v] of Object.entries(params)) str = str.replace(`{${k}}`, v);
    return str;
  };
}
