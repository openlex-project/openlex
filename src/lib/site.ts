import { readFileSync } from "node:fs";
import { join } from "node:path";
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

export interface AnalyticsConfig {
  provider: "vercel" | "plausible" | "matomo" | "umami" | "goatcounter";
  domain?: string;
  url?: string;
  site_id?: string;
}

export interface BrandingConfig {
  tagline?: Record<string, string>;
  brand_hue?: number;
  footer?: FooterItem[];
}

export interface FeaturesConfig {
  sharing?: string[];
  export?: { formats: string[]; require_auth?: boolean };
  related_content_display?: "badge" | "sidebar";
  analytics?: AnalyticsConfig;
  revalidate?: number | false;
  rate_limit?: number;
  error_tracking?: { provider: "sentry"; dsn_env?: string };
}

export interface SiteConfig {
  name: string;
  default_locale: string;
  base_url?: string;
  branding?: BrandingConfig;
  content_repos?: string[];
  categories?: CategoryConfig[];
  features?: FeaturesConfig;
  logo_text?: boolean;
  template?: string;
  home?: import("@/lib/template").HomeSection[];
}

let cached: { data: SiteConfig; ts: number } | null = null;
const SITE_TTL = 5 * 60_000;

export function loadSiteConfig(): SiteConfig {
  if (cached && Date.now() - cached.ts < SITE_TTL) return cached.data;
  try {
    const raw = readFileSync(join(process.cwd(), "site.yaml"), "utf-8");
    cached = { data: parse(raw) as SiteConfig, ts: Date.now() };
  } catch (err) {
    throw new Error(`Failed to load site.yaml: ${err instanceof Error ? err.message : err}. Ensure site.yaml exists in the project root.`);
  }
  return cached.data;
}
