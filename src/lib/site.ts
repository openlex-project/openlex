import { readFileSync } from "fs";
import { join } from "path";
import { parse } from "yaml";

export interface SiteConfig {
  name: string;
  tagline: Record<string, string>;
  copyright: string;
  default_locale: string;
  brand_hue: number;
  content: { books: boolean; journals: boolean; laws: boolean };
}

let cached: SiteConfig | null = null;

export function loadSiteConfig(): SiteConfig {
  if (cached) return cached;
  const raw = readFileSync(join(process.cwd(), "site.yaml"), "utf-8");
  cached = parse(raw) as SiteConfig;
  return cached;
}
