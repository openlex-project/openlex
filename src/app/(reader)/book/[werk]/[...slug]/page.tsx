import { notFound } from "next/navigation";
import { buildRegistry, getBookContent, findTocEntry } from "@/lib/registry";
import { fetchFile } from "@/lib/github";
import { renderMarkdown } from "@/lib/markdown";
import { FeedbackButton } from "@/components/feedback-button";

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

  const [markdown, cslXml, referencesYaml] = await Promise.all([
    getBookContent(meta.repo, fileSlug, ref),
    meta.csl ? fetchFile(meta.repo, meta.csl, ref) : null,
    meta.bibliography ? fetchFile(meta.repo, meta.bibliography, ref) : null,
  ]);
  if (!markdown) notFound();

  const html = await renderMarkdown(markdown, {
    numbering: { schema: meta.numbering },
    ...(cslXml && referencesYaml ? { cslXml, referencesYaml } : {}),
    tocAuthor: tocEntry?.author,
    editors: meta.editors,
  });

  const displayName = meta.title_short ?? meta.title;
  const edition = ref === "main" ? null : ref.replace("ed", ". Auflage");

  return (
    <article className="max-w-prose mx-auto px-6 py-8">
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
      <FeedbackButton repo={meta.repo} />
    </article>
  );
}
