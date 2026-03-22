import Link from "next/link";
import { headers } from "next/headers";
import { buildRegistry } from "@/lib/registry";
import { loadSiteConfig } from "@/lib/site";
import { t, defaultLocale, type Locale } from "@/lib/i18n";
import { Logo } from "@/components/logo";

export default async function Home() {
  const { books, laws, journals } = await buildRegistry();
  const h = await headers();
  const locale = (h.get("x-locale") ?? defaultLocale) as Locale;
  const site = loadSiteConfig();

  // Count items per category
  const counts = new Map<string, number>();
  for (const b of books.values()) counts.set(b.category ?? b.type, (counts.get(b.category ?? b.type) ?? 0) + 1);
  for (const j of journals.values()) counts.set(j.category ?? "journal", (counts.get(j.category ?? "journal") ?? 0) + 1);
  for (const l of laws.values()) counts.set(l.category ?? "law", (counts.get(l.category ?? "law") ?? 0) + 1);

  const categories = site.categories ?? [
    { key: "book", label: { de: "Kommentare & Bücher", en: "Commentaries & Books" } },
    { key: "journal", label: { de: "Zeitschriften", en: "Journals" } },
    { key: "law", label: { de: "Gesetze", en: "Laws" } },
  ];

  return (
    <div className="px-6 py-12 max-w-5xl mx-auto">
      <section className="text-center mb-16">
        <Logo size={56} className="mx-auto mb-4 text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)]" />
        <h1 className="text-4xl font-bold tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>
          {t(locale, "site.title")}
        </h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          {t(locale, "site.tagline")}
        </p>
      </section>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const count = counts.get(cat.key) ?? 0;
          if (count === 0) return null;
          const label = cat.label[locale] ?? cat.label[defaultLocale] ?? cat.key;
          return (
            <Link
              key={cat.key}
              href={`/category/${cat.key}`}
              className="card group block relative overflow-hidden"
              style={{ aspectRatio: "16/9" }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <div className="text-xl font-bold group-hover:text-[var(--active-text)] transition-colors">
                  {label}
                </div>
                <div className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>
                  {count} {count === 1 ? "item" : "items"}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
