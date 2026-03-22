import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/providers";
import { LocaleProvider } from "@/components/locale-provider";
import { loadSiteConfig } from "@/lib/site";
import type { Locale } from "@/lib/i18n";
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
  title: site.name,
  description: site.tagline[site.default_locale] ?? "",
  icons: { icon: "/favicon.svg" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const locale = (h.get("x-locale") ?? "de") as Locale;

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable}`} style={{ "--brand-hue": site.brand_hue } as React.CSSProperties} suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <LocaleProvider locale={locale}>{children}</LocaleProvider>
        </Providers>
      </body>
    </html>
  );
}
