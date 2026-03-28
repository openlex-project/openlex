import { buildRegistry, resolveDisplay } from "@/lib/registry";
import { resolveI18n } from "@/lib/i18n-utils";
import { getLawProvisions } from "@/lib/content";
import { loadSiteConfig } from "@/lib/site";
import { t, defaultLocale, type Locale } from "@/lib/i18n";
import { ContentNavDropdown } from "./content-nav-dropdown";

export async function ContentNav({ locale }: { locale: Locale }) {
  const site = loadSiteConfig();
  const categories = site.categories ?? [];
  const registry = await buildRegistry();

  const groups: { label: string; items: { href: string; label: string }[] }[] = [];

  for (const cat of categories) {
    const items: { href: string; label: string }[] = [];
    for (const [slug, entry] of registry.slugMap) {
      const entryCat = ("category" in entry.entry ? entry.entry.category : null) ?? entry.type;
      if (entryCat !== cat.key) continue;
      if (entry.type === "book") {
        const first = entry.entry.toc[0]?.file.replace(/\.md$/, "");
        items.push({ href: `/${slug}/${first ?? ""}`, label: resolveDisplay(entry.entry).display });
      } else if (entry.type === "law") {
        const provisions = await getLawProvisions(entry.entry.repo, slug);
        items.push({ href: `/${slug}/${provisions[0] ?? 1}`, label: resolveDisplay(entry.entry).display });
      } else if (entry.type === "journal") {
        items.push({ href: `/${slug}`, label: resolveDisplay(entry.entry).display });
      }
    }
    if (items.length) groups.push({ label: cat.label[locale] ?? cat.label[defaultLocale] ?? cat.key, items });
  }

  if (!groups.length) return null;

  return <ContentNavDropdown groups={groups} label={t(locale, "nav.content")} />;
}
