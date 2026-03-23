import { notFound } from "next/navigation";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { Metadata } from "next";
import { buildRegistry } from "@/lib/registry";
import { loadSiteConfig } from "@/lib/site";
import { renderMarkdown } from "@/lib/markdown";
import BookPage, { bookMetadata } from "./book";
import LawPage, { lawMetadata } from "./law";
import JournalPage, { journalMetadata } from "./journal";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!slug?.length) return {};
  const site = loadSiteConfig();

  // Footer page
  const fp = site.footer?.find((p) => p.slug === slug[0] && slug.length === 1);
  if (fp) {
    const label = fp.label?.[site.default_locale] ?? fp.slug ?? "";
    return { title: `${label} – ${site.name}`, openGraph: { title: label, images: [`/api/og?title=${encodeURIComponent(label)}`] } };
  }

  const registry = await buildRegistry();
  const content = registry.slugMap.get(slug[0]!);
  if (!content) return {};
  const rest = slug.slice(1);

  switch (content.type) {
    case "book": return bookMetadata(content.entry, rest, site.name);
    case "law": return lawMetadata(content.entry, rest, site.name);
    case "journal": return journalMetadata(content.entry, rest, site.name);
  }
}

export default async function CatchAllPage({ params }: Props) {
  const { slug } = await params;
  if (!slug?.length) notFound();

  // Footer pages: single slug, matches site.yaml footer_pages with slug
  const site = loadSiteConfig();
  const footerPage = site.footer?.find((p) => p.slug === slug[0] && slug.length === 1);
  if (footerPage) {
    const file = join(process.cwd(), "footer", `${footerPage.slug}.md`);
    if (!existsSync(file)) notFound();
    const md = readFileSync(file, "utf-8");
    const html = await renderMarkdown(md);
    return (
      <article className="max-w-3xl mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
        <div className="content-prose" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    );
  }

  const registry = await buildRegistry();
  const content = registry.slugMap.get(slug[0]!);
  if (!content) notFound();

  const rest = slug.slice(1);

  switch (content.type) {
    case "book":
      return BookPage({ registry, entry: content.entry, rest });
    case "law":
      return LawPage({ registry, entry: content.entry, rest });
    case "journal":
      return JournalPage({ registry, entry: content.entry, rest });
  }
}
