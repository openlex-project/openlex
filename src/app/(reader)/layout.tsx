import { headers } from "next/headers";
import UserButton from "@/components/user-button";
import { SearchBox } from "@/components/search-box";
import { LogoFull } from "@/components/logo";
import { t, type Locale } from "@/lib/i18n";

export default async function ReaderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const locale = (h.get("x-locale") ?? "de") as Locale;

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="skip-link">
        Zum Inhalt springen
      </a>
      <header className="glass-header sticky top-0 z-50 px-6 py-3 flex items-center justify-between gap-4">
        <a href="/" className="shrink-0" aria-label="OpenLex Startseite">
          <LogoFull className="text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)]" />
        </a>
        <div className="flex-1 max-w-lg mx-auto">
          <SearchBox />
        </div>
        <div className="shrink-0">
          <UserButton />
        </div>
      </header>
      <main id="main-content" className="flex-1">{children}</main>
      <footer className="border-t px-6 py-4 text-sm flex items-center justify-between" style={{ borderColor: "var(--border-subtle)", color: "var(--text-tertiary)" }}>
        <span>{t(locale, "footer.copy")}</span>
        <span className="text-xs">Open Access</span>
      </footer>
    </div>
  );
}
