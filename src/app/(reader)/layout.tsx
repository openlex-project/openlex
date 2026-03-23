import { headers } from "next/headers";
import UserButton from "@/components/user-button";
import { SearchBox } from "@/components/search-box";
import { LogoFull } from "@/components/logo";
import { LicenseProvider, LicenseDisplay } from "@/components/license-context";
import { loadSiteConfig } from "@/lib/site";
import { loadTemplate } from "@/lib/template";
import { t, defaultLocale, type Locale } from "@/lib/i18n";

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

  return (
    <LicenseProvider>
      <div className="min-h-screen flex flex-col">
        <a href="#main-content" className="skip-link">
          {t(locale, "skip")}
        </a>
        <header className="glass-header sticky top-0 z-50 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          <a href="/" className="shrink-0" aria-label={t(locale, "home.aria")}>
            <LogoFull name={site.logo_text !== false ? site.name : undefined} className="text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)]" />
          </a>
          {!minimal && (
            <div className="flex-1 max-w-lg mx-auto">
              <SearchBox />
            </div>
          )}
          <div className="shrink-0">
            <UserButton />
          </div>
        </header>
        <main id="main-content" className="flex-1">{children}</main>
        <footer className="border-t px-6 py-4 text-sm flex items-center justify-center gap-1 flex-wrap" style={{ borderColor: "var(--border-subtle)", color: "var(--text-tertiary)" }}>
          <span>{t(locale, "footer.copy")}</span><LicenseDisplay />
          {site.footer_pages?.map((p) => (
            <span key={p.slug ?? p.href}> · <a href={p.slug ? `/${p.slug}` : p.href!} {...(p.href ? { target: "_blank", rel: "noopener" } : {})} className="hover:underline">{p.label[locale] ?? p.label[site.default_locale] ?? Object.values(p.label)[0]}</a></span>
          ))}
        </footer>
      </div>
    </LicenseProvider>
  );
}
