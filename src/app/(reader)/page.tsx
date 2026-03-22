import Link from "next/link";
import { headers } from "next/headers";
import { buildRegistry } from "@/lib/registry";
import { loadSiteConfig } from "@/lib/site";
import { t, type Locale } from "@/lib/i18n";
import { Logo } from "@/components/logo";

export default async function Home() {
  const { books, laws, journals } = await buildRegistry();
  const h = await headers();
  const locale = (h.get("x-locale") ?? "de") as Locale;
  const site = loadSiteConfig();

  return (
    <div className="px-6 py-12 max-w-5xl mx-auto">
      {/* Hero */}
      <section className="text-center mb-16">
        <Logo size={56} className="mx-auto mb-4 text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)]" />
        <h1 className="text-4xl font-bold tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>
          {t(locale, "site.title")}
        </h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          {t(locale, "site.tagline")}
        </p>
      </section>

      {/* Books */}
      {site.content.books && books.size > 0 && (
        <section className="mb-12">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-tertiary)" }}>
            {t(locale, "section.books")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[...books.values()].map((b) => {
              const firstSlug = b.toc[0]?.file.replace(/\.md$/, "") ?? "";
              return (
                <Link key={b.slug} href={`/book/${b.slug}/${firstSlug}`} className="card group block">
                  <div className="font-semibold group-hover:text-[var(--active-text)] transition-colors">
                    {b.title_short ?? b.title}
                  </div>
                  {b.title_short && (
                    <div className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{b.title}</div>
                  )}
                  <div className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
                    {b.editors.map((e) => e.name).join(", ")}
                    {b.comments_on && <span className="ml-2">· {t(locale, "commentary.on", { slug: b.comments_on.toUpperCase() })}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Journals */}
      {site.content.journals && journals.size > 0 && (
        <section className="mb-12">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-tertiary)" }}>
            {t(locale, "section.journals")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[...journals.values()].map((j) => (
              <Link key={j.slug} href={`/journal/${j.slug}`} className="card group block">
                <div className="font-semibold group-hover:text-[var(--active-text)] transition-colors">
                  {j.title_short ?? j.title}
                </div>
                {j.title_short && (
                  <div className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{j.title}</div>
                )}
                <div className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
                  {j.issn && `ISSN ${j.issn}`}
                  {j.issues.length > 0 && ` · ${t(locale, "issues.count", { n: String(j.issues.length) })}`}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Laws */}
      {site.content.laws && laws.size > 0 && (
        <section className="mb-12">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-tertiary)" }}>
            {t(locale, "section.laws")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...laws.values()].map((l) => (
              <Link key={l.slug} href={`/law/${l.slug}/1`} className="card group block">
                <div className="font-semibold group-hover:text-[var(--active-text)] transition-colors">
                  {l.title_short ?? l.title}
                </div>
                {l.title_short && (
                  <div className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{l.title}</div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
