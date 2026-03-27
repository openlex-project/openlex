import Link from "next/link";
import { buildRegistry } from "@/lib/registry";
import { getLawProvisions } from "@/lib/content";
import { loadSiteConfig, type CategoryConfig } from "@/lib/site";
import { t, defaultLocale, type Locale } from "@/lib/i18n";
import { ContentNavDropdown } from "./content-nav-dropdown";

interface NavItem { href: string; label: string; category: string }

const INLINE_THRESHOLD = 5;

export async function ContentNav({ locale }: { locale: Locale }) {
  const site = loadSiteConfig();
  const categories = site.categories ?? [];
  const registry = await buildRegistry();
  const items: NavItem[] = [];

  for (const [slug, entry] of registry.slugMap) {
    const cat = categories.find((c) => c.key === (("category" in entry.entry ? entry.entry.category : null) ?? entry.type))?.key ?? entry.type;
    if (entry.type === "book") {
      const first = entry.entry.toc[0]?.file.replace(/\.md$/, "");
      items.push({ href: `/${slug}/${first ?? ""}`, label: entry.entry.title_short ?? entry.entry.title, category: cat });
    } else if (entry.type === "law") {
      const provisions = await getLawProvisions(entry.entry.repo, slug);
      items.push({ href: `/${slug}/${provisions[0] ?? 1}`, label: entry.entry.title_short ?? entry.entry.title, category: cat });
    } else if (entry.type === "journal") {
      items.push({ href: `/${slug}`, label: entry.entry.title_short ?? entry.entry.title, category: cat });
    }
  }

  if (!items.length) return null;

  // Group by category for dropdown
  const groups = categories
    .map((cat) => ({ label: cat.label[locale] ?? cat.label[defaultLocale] ?? cat.key, items: items.filter((i) => i.category === cat.key) }))
    .filter((g) => g.items.length > 0);

  // Inline links for few items, dropdown for many
  if (items.length <= INLINE_THRESHOLD) {
    return (
      <nav className="hidden lg:flex items-center gap-1" aria-label={t(locale, "nav.content")}>
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="px-2 py-1 text-sm rounded-md hover:bg-[var(--surface-secondary)] transition-colors" style={{ color: "var(--text-secondary)" }}>
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }

  return <ContentNavDropdown groups={groups} label={t(locale, "nav.content")} />;
}
