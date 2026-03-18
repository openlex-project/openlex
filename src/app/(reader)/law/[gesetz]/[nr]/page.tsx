import { notFound } from "next/navigation";
import { buildRegistry, getLawContent, findByProvision } from "@/lib/registry";

interface Props {
  params: Promise<{ gesetz: string; nr: string }>;
}

export default async function LawPage({ params }: Props) {
  const { gesetz, nr } = await params;
  const registry = await buildRegistry();
  const meta = registry.laws.get(gesetz);
  if (!meta) notFound();

  const text = await getLawContent(meta.repo, gesetz, nr);
  if (!text) notFound();

  const unitLabel = meta.unit_type === "article" ? "Art." : "§";
  const provisionNr = parseInt(nr, 10);

  // Find commentaries with toc entries covering this provision
  const commentaryLinks: { slug: string; name: string; fileSlug: string; title: string }[] = [];
  for (const book of registry.books.values()) {
    if (book.comments_on !== gesetz) continue;
    const entries = findByProvision(book.toc, provisionNr);
    for (const entry of entries) {
      commentaryLinks.push({
        slug: book.slug,
        name: book.title_short ?? book.title,
        fileSlug: entry.file.replace(/\.md$/, ""),
        title: entry.title,
      });
    }
  }

  return (
    <article className="max-w-prose mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-1">
        {unitLabel} {nr} {meta.title_short ?? meta.title}
      </h1>
      <div className="text-sm text-gray-500 mb-6">
        {meta.title}
        {commentaryLinks.length > 0 && (
          <span className="ml-2">
            · Kommentare:{" "}
            {commentaryLinks.map((c, i) => (
              <span key={`${c.slug}-${c.fileSlug}`}>
                {i > 0 && ", "}
                <a href={`/book/${c.slug}/${c.fileSlug}`} className="text-blue-600 hover:underline">
                  {c.name}
                </a>
              </span>
            ))}
          </span>
        )}
      </div>
      <div className="prose prose-gray dark:prose-invert max-w-none whitespace-pre-line">
        {text}
      </div>
    </article>
  );
}
