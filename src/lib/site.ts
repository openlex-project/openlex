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

export interface HostingConfig {
  provider: "vercel";
  analytics?: boolean;
  speed_insights?: boolean;
}

export interface SiteConfig {
  name: string;
  tagline: Record<string, string>;
  default_locale: string;
  brand_hue: number;
  logo_text?: boolean;
  content_repos?: string[];
  hosting?: HostingConfig;
  footer?: FooterItem[];
  categories?: CategoryConfig[];
  template?: string;
  home?: import("@/lib/template").HomeSection[];
  revalidate?: number | false;
  sharing?: string[];
  export?: { formats: string[]; require_auth?: boolean };
  commentary_display?: "badge" | "sidebar";
}

let cached: SiteConfig | null = null;

export function loadSiteConfig(): SiteConfig {
  if (cached) return cached;
  const raw = readFileSync(join(process.cwd(), "site.yaml"), "utf-8");
  cached = parse(raw) as SiteConfig;
  return cached;
}
