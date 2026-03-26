import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { buildRegistry } from "@/lib/registry";
import { getLawProvisions } from "@/lib/content";
import { loadSiteConfig } from "@/lib/site";
import { defaultLocale, type Locale } from "@/lib/i18n";

interface Props {
  params: Promise<{ key: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { key } = await params;
  const h = await headers();
  const locale = (h.get("x-locale") ?? defaultLocale) as Locale;
  const site = loadSiteConfig();
  const cat = site.categories?.find((c) => c.key === key);
  if (!cat) notFound();

  const { books, journals, laws } = await buildRegistry();

  // Collect items matching this category
  const items: { href: string; title: string; subtitle?: string; detail?: string }[] = [];

  for (const b of books.values()) {
    if ((b.category ?? b.type) !== key) continue;
    const firstSlug = b.toc[0]?.file.replace(/\.md$/, "") ?? "";
    items.push({
      href: `/${b.slug}/${firstSlug}`,
      title: b.title_short ?? b.title,
      subtitle: b.title_short ? b.title : undefined,
      detail: b.editors.map((e) => e.name).join(", "),
    });
  }

  for (const j of journals.values()) {
    if ((j.category ?? "journal") !== key) continue;
    items.push({
      href: `/${j.slug}`,
      title: j.title_short ?? j.title,
      subtitle: j.title_short ? j.title : undefined,
      detail: [j.issn && `ISSN ${j.issn}`, j.issues.length > 0 && `${j.issues.length} issues`].filter(Boolean).join(" · ") || undefined,
    });
  }

  for (const l of laws.values()) {
    if ((l.category ?? "law") !== key) continue;
    const provisions = await getLawProvisions(l.repo, l.slug);
    const first = provisions[0] ?? 1;
    items.push({
      href: `/${l.slug}/${first}`,
      title: l.title_short ?? l.title,
      subtitle: l.title_short ? l.title : undefined,
    });
  }

  const label = cat.label[locale] ?? cat.label[defaultLocale] ?? key;

  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold mb-8">{label}</h1>
      {items.length === 0 ? (
        <p style={{ color: "var(--text-tertiary)" }}>—</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="group block p-4 rounded-lg transition-colors" style={{ background: "var(--surface-secondary)" }}>
                <div className="font-semibold group-hover:text-[var(--active-text)] transition-colors">{item.title}</div>
                {item.subtitle && <div className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{item.subtitle}</div>}
                {item.detail && <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>{item.detail}</div>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
