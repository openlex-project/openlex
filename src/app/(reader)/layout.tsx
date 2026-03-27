import Link from "next/link";
import { headers } from "next/headers";
import dynamic from "next/dynamic";
import UserButton from "@/components/user-button";
import { LogoFull } from "@/components/logo";
import { ContentNav } from "@/components/content-nav";
import { LicenseProvider, LicenseDisplay } from "@/components/license-context";
import { loadSiteConfig } from "@/lib/site";
import { loadTemplate } from "@/lib/template";
import { buildRegistry } from "@/lib/registry";
import { t, defaultLocale, type Locale } from "@/lib/i18n";

const SearchBox = dynamic(() => import("@/components/search-box").then((m) => m.SearchBox));

export default async function ReaderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const locale = (h.get("x-locale") ?? defaultLocale) as Locale;
  const site = loadSiteConfig();
  const template = await loadTemplate(site.template);
  const minimal = template.variants.header === "minimal";
  const registry = await buildRegistry();
  const hasFeedback = [...registry.books.values()].some((b) => b.feedbackEnabled)
    || [...registry.laws.values()].some((l) => l.feedbackEnabled)
    || [...registry.journals.values()].some((j) => j.feedbackEnabled);

  return (
    <LicenseProvider>
      <div className="min-h-screen flex flex-col">
        <a href="#main-content" className="skip-link">
          {t(locale, "skip")}
        </a>
        <header className="glass-header sticky top-0 z-50 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          <Link href="/" className="shrink-0" aria-label={t(locale, "home.aria")}>
            <LogoFull name={site.logo_text !== false ? site.name : undefined} className="text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)]" />
          </Link>
          <ContentNav locale={locale} />
          {!minimal && (
            <div className="flex-1 max-w-lg mx-auto">
              <SearchBox />
            </div>
          )}
          <div className="shrink-0">
            <UserButton hasFeedback={hasFeedback} />
          </div>
        </header>
        <main id="main-content" className="flex-1">{children}</main>
        <footer className="border-t px-6 py-4 text-sm flex items-center justify-center gap-1 flex-wrap" style={{ borderColor: "var(--border-subtle)", color: "var(--text-tertiary)" }}>
          {site.branding?.footer?.map((item, i) => {
            const sep = i > 0 ? " · " : "";
            if (item.text) return <span key={i}>{sep}{item.text}</span>;
            if ("license" in item) return <span key={i}>{sep}<LicenseDisplay /></span>;
            if (item.slug) return <span key={i}>{sep}<Link href={`/${item.slug}`} className="hover:underline" style={{ color: "var(--text-secondary)" }}>{item.label?.[locale] ?? item.label?.[site.default_locale] ?? item.slug}</Link></span>;
            if (item.href) return <span key={i}>{sep}<a href={item.href} target="_blank" rel="noopener" className="hover:underline" style={{ color: "var(--text-secondary)" }}>{item.label?.[locale] ?? item.label?.[site.default_locale] ?? item.href}</a></span>;
            return null;
          })}
        </footer>
      </div>
    </LicenseProvider>
  );
}
