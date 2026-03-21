import { notFound } from "next/navigation";
import { buildRegistry, getBookContent, findTocEntry, findTocNeighbors, extractHeadings, getBackmatterSections } from "@/lib/registry";
import { fetchFile } from "@/lib/github";
import { renderMarkdown } from "@/lib/markdown";
import { FeedbackButton } from "@/components/feedback-button";
import { BookSidebar } from "@/components/book-sidebar";
import { FootnoteTooltips } from "@/components/footnote-tooltips";

interface Props {
  params: Promise<{ werk: string; slug: string[] }>;
}

/** Parse slug: ["art-5"] → fileSlug=art-5, ref=main; ["1ed", "art-5"] → fileSlug=art-5, ref=1ed */
function parseSlug(slug: string[]): { fileSlug: string; ref: string } | null {
  if (slug.length === 1) return { fileSlug: slug[0]!, ref: "main" };
  if (slug.length === 2 && /^\d+ed$/.test(slug[0]!)) return { fileSlug: slug[1]!, ref: slug[0]! };
  return null;
}

export default async function BookPage({ params }: Props) {
  const { werk, slug } = await params;
  const parsed = parseSlug(slug);
  if (!parsed) notFound();
  const { fileSlug, ref } = parsed;

  const registry = await buildRegistry();
  const meta = registry.books.get(werk);
  if (!meta) notFound();

  const tocEntry = findTocEntry(meta.toc, fileSlug);
  const { prev, next } = findTocNeighbors(meta.toc, fileSlug);

  const [markdown, cslXml, referencesYaml] = await Promise.all([
    getBookContent(meta.repo, fileSlug, ref),
    meta.csl ? fetchFile(meta.repo, meta.csl, ref) : null,
    meta.bibliography ? fetchFile(meta.repo, meta.bibliography, ref) : null,
  ]);
  if (!markdown) notFound();

  const headings = extractHeadings(markdown);

  const html = await renderMarkdown(markdown, {
    numbering: { schema: meta.numbering },
    ...(cslXml && referencesYaml ? { cslXml, referencesYaml } : {}),
    tocAuthor: tocEntry?.author,
    editors: meta.editors,
  });

  const displayName = meta.title_short ?? meta.title;
  const edition = ref === "main" ? null : ref.replace("ed", ". Auflage");

  const slugPrefix = ref === "main" ? `/book/${werk}` : `/book/${werk}/${ref}`;
  const prevHref = prev ? `${slugPrefix}/${prev.file.replace(/\.md$/, "")}` : null;
  const nextHref = next ? `${slugPrefix}/${next.file.replace(/\.md$/, "")}` : null;

  const navBar = (pos: "top" | "bottom") => (
    <nav className={`flex justify-between text-sm ${
      pos === "top" ? "mb-6 pb-3 border-b" : "mt-12 pt-6 border-t"
    } border-gray-200 dark:border-gray-700`}>
      {prev ? (
        <a href={prevHref!} className="text-blue-600 hover:underline dark:text-blue-400">← {prev.title}</a>
      ) : <span />}
      {next ? (
        <a href={nextHref!} className="text-blue-600 hover:underline dark:text-blue-400 text-right">{next.title} →</a>
      ) : <span />}
    </nav>
  );

  return (
    <div className="flex">
      <BookSidebar werk={werk} toc={meta.toc} edition={ref} activeSlug={fileSlug} headings={headings} backmatter={getBackmatterSections(meta)} />
      <article className="flex-1 min-w-0 px-8 lg:px-12 py-8">
        {navBar("top")}
        <div className="mb-6 text-sm text-gray-500">
          {displayName} – {tocEntry?.title ?? fileSlug}
          {edition && <span className="ml-2 text-amber-600 dark:text-amber-400">({edition})</span>}
          {meta.comments_on && tocEntry?.provisions?.[0] && (
            <> · <a href={`/law/${meta.comments_on}/${tocEntry.provisions[0]}`} className="text-blue-600 hover:underline">Gesetzestext →</a></>
          )}
        </div>
        <div
          className="prose prose-gray prose-rn dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {navBar("bottom")}
        <FeedbackButton repo={meta.repo} />
        <FootnoteTooltips />
      </article>
    </div>
  );
}
