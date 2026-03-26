import Link from "next/link";
import { headers } from "next/headers";
import { buildRegistry } from "@/lib/registry";
import { getLawProvisions } from "@/lib/content";
import { loadSiteConfig } from "@/lib/site";
import { loadTemplate, type HomeSection } from "@/lib/template";
import { t, defaultLocale, type Locale } from "@/lib/i18n";
import { Logo } from "@/components/logo";

function websiteJsonLd(url: string): string {
  const site = loadSiteConfig();
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url,
    description: site.branding?.tagline?.[site.default_locale] ?? "",
  });
}

export default async function Home() {
  const { books, laws, journals, slugMap } = await buildRegistry();
  const h = await headers();
  const locale = (h.get("x-locale") ?? defaultLocale) as Locale;
  const site = loadSiteConfig();
  const template = await loadTemplate(site.template);

  const sections: HomeSection[] = template.home ?? site.home ?? [
    { type: "hero" },
    { type: "categories" },
  ];

  const categories = site.categories ?? [
    { key: "book", label: { de: "Kommentare & Bücher", en: "Commentaries & Books" } },
    { key: "journal", label: { de: "Zeitschriften", en: "Journals" } },
    { key: "law", label: { de: "Gesetze", en: "Laws" } },
  ];

  // Count items per category
  const counts = new Map<string, number>();
  for (const b of books.values()) counts.set(b.category ?? b.type, (counts.get(b.category ?? b.type) ?? 0) + 1);
  for (const j of journals.values()) counts.set(j.category ?? "journal", (counts.get(j.category ?? "journal") ?? 0) + 1);
  for (const l of laws.values()) counts.set(l.category ?? "law", (counts.get(l.category ?? "law") ?? 0) + 1);

  async function renderSection(section: HomeSection, i: number) {
    switch (section.type) {
      case "hero":
        return (
          <section key={i} className="text-center mb-12 sm:mb-16">
            <Logo size={56} className="mx-auto mb-4 text-[var(--color-brand-600)] dark:text-[var(--color-brand-300)]" />
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>{t(locale, "site.title")}</h1>
            <p className="text-base sm:text-lg max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>{t(locale, "site.tagline")}</p>
          </section>
        );

      case "categories":
        return (
          <section key={i} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
            {categories.map((cat) => {
              const count = counts.get(cat.key) ?? 0;
              if (count === 0) return null;
              const label = cat.label[locale] ?? cat.label[defaultLocale] ?? cat.key;
              return (
                <Link key={cat.key} href={`/category/${cat.key}`} className="card group block relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <div className="text-xl font-bold group-hover:text-[var(--active-text)] transition-colors">{label}</div>
                    <div className="text-sm mt-2" style={{ color: "var(--text-tertiary)" }}>{count} {count === 1 ? "item" : "items"}</div>
                  </div>
                </Link>
              );
            })}
          </section>
        );

      case "featured": {
        if (!section.items?.length) return null;
        const cards: { href: string; title: string; subtitle?: string }[] = [];
        for (const slug of section.items) {
          const entry = slugMap.get(slug);
          if (!entry) continue;
          if (entry.type === "book") {
            const b = entry.entry;
            const first = b.toc[0]?.file.replace(/\.md$/, "") ?? "";
            cards.push({ href: `/${b.slug}/${first}`, title: b.title_short ?? b.title, subtitle: b.editors.map((e) => e.name).join(", ") });
          } else if (entry.type === "law") {
            const l = entry.entry;
            const provisions = await getLawProvisions(l.repo, l.slug);
            cards.push({ href: `/${l.slug}/${provisions[0] ?? 1}`, title: l.title_short ?? l.title });
          } else if (entry.type === "journal") {
            const j = entry.entry;
            cards.push({ href: `/${j.slug}`, title: j.title_short ?? j.title });
          }
        }
        if (cards.length === 0) return null;
        return (
          <section key={i} className="mb-12">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{t(locale, "home.featured")}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((c) => (
                <Link key={c.href} href={c.href} className="card group block">
                  <div className="font-semibold group-hover:text-[var(--active-text)] transition-colors">{c.title}</div>
                  {c.subtitle && <div className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{c.subtitle}</div>}
                </Link>
              ))}
            </div>
          </section>
        );
      }

      case "recent": {
        const limit = section.limit ?? 5;
        const all = [
          ...[...books.values()].map((b) => ({ title: b.title_short ?? b.title, href: `/${b.slug}/${b.toc[0]?.file.replace(/\.md$/, "") ?? ""}` })),
          ...[...journals.values()].map((j) => ({ title: j.title_short ?? j.title, href: `/${j.slug}` })),
          ...[...laws.values()].map((l) => ({ title: l.title_short ?? l.title, href: `/${l.slug}` })),
        ].slice(0, limit);
        if (all.length === 0) return null;
        return (
          <section key={i} className="mb-12">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{t(locale, "home.recent")}</h2>
            <ul className="space-y-2">
              {all.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:underline" style={{ color: "var(--active-text)" }}>{item.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        );
      }

      default:
        return null;
    }
  }

  return (
    <div className="px-4 sm:px-6 py-8 sm:py-12 max-w-5xl mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: websiteJsonLd(h.get("x-url") ?? "/") }} />
      {await Promise.all(sections.map(renderSection))}
    </div>
  );
}
