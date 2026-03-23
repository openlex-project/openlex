import { notFound } from "next/navigation";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { buildRegistry } from "@/lib/registry";
import { loadSiteConfig } from "@/lib/site";
import { renderMarkdown } from "@/lib/markdown";
import BookPage from "./book";
import LawPage from "./law";
import JournalPage from "./journal";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export default async function CatchAllPage({ params }: Props) {
  const { slug } = await params;
  if (!slug?.length) notFound();

  // Footer pages: single slug, matches site.yaml footer_pages with slug
  const site = loadSiteConfig();
  const footerPage = site.footer_pages?.find((p) => p.slug === slug[0] && slug.length === 1);
  if (footerPage) {
    const file = join(process.cwd(), "footer", `${footerPage.slug}.md`);
    if (!existsSync(file)) notFound();
    const md = readFileSync(file, "utf-8");
    const html = await renderMarkdown(md);
    return (
      <article className="max-w-3xl mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
        <div className="prose prose-gray dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
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
