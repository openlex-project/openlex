import { notFound } from "next/navigation";
import { buildRegistry, getBookContent } from "@/lib/registry";
import { fetchFile } from "@/lib/github";
import { renderMarkdown } from "@/lib/markdown";
import { FeedbackButton } from "@/components/feedback-button";

interface Props {
  params: Promise<{ werk: string; nr: string }>;
}

export default async function BookPage({ params }: Props) {
  const { werk, nr } = await params;
  const registry = await buildRegistry();
  const meta = registry.books.get(werk);
  if (!meta) notFound();

  const [markdown, cslXml, referencesYaml] = await Promise.all([
    getBookContent(meta.repo, werk, nr),
    meta.csl ? fetchFile(meta.repo, meta.csl) : null,
    meta.bibliography ? fetchFile(meta.repo, meta.bibliography) : null,
  ]);
  if (!markdown) notFound();

  const html = await renderMarkdown(markdown, {
    numbering: { schema: meta.numbering },
    ...(cslXml && referencesYaml ? { cslXml, referencesYaml } : {}),
  });

  return (
    <article className="max-w-prose mx-auto px-6 py-8">
      <div className="mb-6 text-sm text-gray-500">
        {meta.abbreviation} – {meta.unit_type === "article" ? "Art." : "§"} {nr}
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
