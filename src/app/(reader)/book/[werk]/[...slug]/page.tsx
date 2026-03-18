import { notFound } from "next/navigation";
import { buildRegistry, getBookContent } from "@/lib/registry";
import { fetchFile } from "@/lib/github";
import { renderMarkdown } from "@/lib/markdown";
import { FeedbackButton } from "@/components/feedback-button";

interface Props {
  params: Promise<{ werk: string; slug: string[] }>;
}

/** Parse slug: ["5"] → nr=5, ref=main; ["1ed", "5"] → nr=5, ref=1ed */
function parseSlug(slug: string[]): { nr: string; ref: string } | null {
  if (slug.length === 1) return { nr: slug[0]!, ref: "main" };
  if (slug.length === 2 && /^\d+ed$/.test(slug[0]!)) return { nr: slug[1]!, ref: slug[0]! };
  return null;
}

export default async function BookPage({ params }: Props) {
  const { werk, slug } = await params;
  const parsed = parseSlug(slug);
  if (!parsed) notFound();
  const { nr, ref } = parsed;

  const registry = await buildRegistry();
  const meta = registry.books.get(werk);
  if (!meta) notFound();

  const [markdown, cslXml, referencesYaml] = await Promise.all([
    getBookContent(meta.repo, werk, nr, ref),
    meta.csl ? fetchFile(meta.repo, meta.csl, ref) : null,
    meta.bibliography ? fetchFile(meta.repo, meta.bibliography, ref) : null,
  ]);
  if (!markdown) notFound();

  const html = await renderMarkdown(markdown, {
    numbering: { schema: meta.numbering },
    ...(cslXml && referencesYaml ? { cslXml, referencesYaml } : {}),
  });

  const edition = ref === "main" ? null : ref.replace("ed", ". Auflage");

  return (
    <article className="max-w-prose mx-auto px-6 py-8">
      <div className="mb-6 text-sm text-gray-500">
        {meta.abbreviation} – {meta.unit_type === "article" ? "Art." : "§"} {nr}
        {edition && <span className="ml-2 text-amber-600 dark:text-amber-400">({edition})</span>}
        {meta.comments_on && (
          <> · <a href={`/law/${meta.comments_on}/${nr}`} className="text-blue-600 hover:underline">Gesetzestext →</a></>
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
