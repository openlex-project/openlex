import { notFound } from "next/navigation";
import { getRegistry, getBookContent } from "@/lib/registry";
import { renderMarkdown } from "@/lib/markdown";

interface Props {
  params: Promise<{ werk: string; nr: string }>;
}

export default async function BookPage({ params }: Props) {
  const { werk, nr } = await params;
  const registry = getRegistry();
  const meta = registry.books.get(werk);
  if (!meta) notFound();

  const markdown = getBookContent(werk, nr);
  if (!markdown) notFound();

  const html = await renderMarkdown(markdown);

  return (
    <article className="max-w-prose mx-auto px-6 py-8">
      <div className="mb-6 text-sm text-gray-500">
        {meta.abbreviation} – {meta.unit_type === "article" ? "Art." : "§"} {nr}
      </div>
      <div
        className="prose prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
