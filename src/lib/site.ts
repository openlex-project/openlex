import { readFileSync } from "fs";
import { join } from "path";
import { parse } from "yaml";

export interface CategoryConfig {
  key: string;
  label: Record<string, string>;
}

export interface FooterItem {
  text?: string;
  license?: boolean;
  slug?: string;
  href?: string;
  label?: Record<string, string>;
}

export interface SiteConfig {
  name: string;
  tagline: Record<string, string>;
  default_locale: string;
  brand_hue: number;
  logo_text?: boolean;
  content_repos?: string[];
  analytics?: false | "vercel";
  footer?: FooterItem[];
  categories?: CategoryConfig[];
  template?: string;
  home?: import("@/lib/template").HomeSection[];
  revalidate?: number | false;
}

let cached: SiteConfig | null = null;

export function loadSiteConfig(): SiteConfig {
  if (cached) return cached;
  const raw = readFileSync(join(process.cwd(), "site.yaml"), "utf-8");
  cached = parse(raw) as SiteConfig;
  return cached;
}
