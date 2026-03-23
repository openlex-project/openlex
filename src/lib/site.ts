import { readFileSync } from "fs";
import { join } from "path";
import { parse } from "yaml";

export interface CategoryConfig {
  key: string;
  label: Record<string, string>;
}

export interface FooterPage {
  slug?: string;
  href?: string;
  label: Record<string, string>;
}

export interface FooterConfig {
  text: string;
  pages?: FooterPage[];
}

export interface SiteConfig {
  name: string;
  tagline: Record<string, string>;
  default_locale: string;
  brand_hue: number;
  logo_text?: boolean;
  content_repos?: string[];
  footer?: FooterConfig;
  categories?: CategoryConfig[];
  template?: string;
  home?: import("@/lib/template").HomeSection[];
}

let cached: SiteConfig | null = null;

export function loadSiteConfig(): SiteConfig {
  if (cached) return cached;
  const raw = readFileSync(join(process.cwd(), "site.yaml"), "utf-8");
  cached = parse(raw) as SiteConfig;
  return cached;
}
