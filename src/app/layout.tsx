import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/providers";
import { LocaleProvider } from "@/components/locale-provider";
import { SiteAnalytics } from "@/components/site-analytics";
import { loadSiteConfig } from "@/lib/site";
import { loadTemplate } from "@/lib/template";
import { defaultLocale, type Locale } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const site = loadSiteConfig();

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  title: site.name,
  description: site.branding?.tagline?.[site.default_locale] ?? "",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    siteName: site.name,
    type: "website",
    images: ["/api/og"],
  },
  twitter: { card: "summary_large_image" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const locale = (h.get("x-locale") ?? defaultLocale) as Locale;
  const template = await loadTemplate(site.template);

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable}`} style={{ "--brand-hue": site.branding?.brand_hue ?? 265 } as React.CSSProperties} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.github.com" />
        <link rel="dns-prefetch" href="https://api.github.com" />
        {template.css && <style dangerouslySetInnerHTML={{ __html: template.css }} />}
      </head>
      <body className="antialiased">
        <Providers>
          <LocaleProvider locale={locale}>{children}</LocaleProvider>
        </Providers>
        <SiteAnalytics config={site.features?.analytics} />
      </body>
    </html>
  );
}
