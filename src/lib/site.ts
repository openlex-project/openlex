import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { z } from "zod";

const categorySchema = z.object({
  key: z.string(),
  label: z.record(z.string(), z.string()),
});

const footerItemSchema = z.union([
  z.string(),
  z.object({
    text: z.string().optional(),
    slug: z.string().optional(),
    href: z.string().optional(),
    label: z.record(z.string(), z.string()).optional(),
  }),
]);

const analyticsSchema = z.object({
  provider: z.enum(["vercel", "plausible", "matomo", "umami", "goatcounter"]),
  domain: z.string().optional(),
  url: z.string().url().optional(),
  site_id: z.string().optional(),
});

const brandingSchema = z.object({
  tagline: z.record(z.string(), z.string()).optional(),
  brand_hue: z.number().min(0).max(360).optional(),
  footer: z.array(footerItemSchema).optional(),
});

const featuresSchema = z.object({
  sharing: z.array(z.string()).optional(),
  export: z.object({ formats: z.array(z.string()), require_auth: z.boolean().optional() }).optional(),
  related_content_display: z.enum(["badge", "sidebar"]).optional(),
  analytics: analyticsSchema.optional(),
  revalidate: z.union([z.number(), z.literal(false)]).optional(),
  rate_limit: z.number().optional(),
  error_tracking: z.object({ provider: z.literal("sentry"), dsn_env: z.string().optional() }).optional(),
});

const siteConfigSchema = z.object({
  name: z.string({ message: "site.yaml: 'name' is required" }),
  default_locale: z.string({ message: "site.yaml: 'default_locale' is required" }),
  base_url: z.string().url("site.yaml: 'base_url' must be a valid URL").optional(),
  branding: brandingSchema.optional(),
  content_repos: z.array(z.string().regex(/^(github|gitlab):\/\//, "content_repos entries must start with github:// or gitlab://")).optional(),
  categories: z.array(categorySchema).optional(),
  features: featuresSchema.optional(),
  logo_text: z.boolean().optional(),
  template: z.string().optional(),
  home: z.array(z.record(z.string(), z.unknown())).optional(),
});

export type CategoryConfig = z.infer<typeof categorySchema>;
export type FooterItem = z.infer<typeof footerItemSchema>;
export type AnalyticsConfig = z.infer<typeof analyticsSchema>;
export type BrandingConfig = z.infer<typeof brandingSchema>;
export type FeaturesConfig = z.infer<typeof featuresSchema>;
export type SiteConfig = z.infer<typeof siteConfigSchema> & {
  home?: import("@/lib/template").HomeSection[];
};

let cached: { data: SiteConfig; ts: number } | null = null;
const SITE_TTL = 5 * 60_000;

export function loadSiteConfig(): SiteConfig {
  if (cached && Date.now() - cached.ts < SITE_TTL) return cached.data;
  try {
    const raw = readFileSync(join(process.cwd(), "site.yaml"), "utf-8");
    const parsed = siteConfigSchema.parse(parse(raw));
    cached = { data: parsed as SiteConfig, ts: Date.now() };
  } catch (err) {
    if (err instanceof z.ZodError) {
      const issues = err.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
      throw new Error(`Invalid site.yaml:\n${issues}`);
    }
    throw new Error(`Failed to load site.yaml: ${err instanceof Error ? err.message : err}`);
  }
  return cached.data;
}
