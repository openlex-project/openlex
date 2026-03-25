import { loadSiteConfig } from "@/lib/site";

export function GET() {
  const brand_hue = loadSiteConfig().branding?.brand_hue ?? 265;
  const svg = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 38 C6.3 34.2 2 27 2 20 2 10 10 2 22 2 34 2 42 10 42 20 42 30 34 38 22 38" stroke="oklch(0.48 0.21 ${brand_hue})" stroke-width="5" stroke-linecap="round" fill="none"/>
  <path d="M14 26 L14 44 L36 44" stroke="oklch(0.48 0.21 ${brand_hue})" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" } });
}
