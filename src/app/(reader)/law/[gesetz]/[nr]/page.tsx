import { notFound } from "next/navigation";
import { buildRegistry, getLawContent } from "@/lib/registry";

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

  // Find commentaries that comment on this law
  const commentaries = [...registry.books.values()].filter(
    (b) => b.comments_on === gesetz,
  );

  return (
    <article className="max-w-prose mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-1">
        {unitLabel} {nr} {meta.abbreviation}
      </h1>
      <div className="text-sm text-gray-500 mb-6">
        {meta.title}
        {commentaries.length > 0 && (
          <span className="ml-2">
            · Kommentare:{" "}
            {commentaries.map((c, i) => (
              <span key={c.slug}>
                {i > 0 && ", "}
                <a href={`/book/${c.slug}/${nr}`} className="text-blue-600 hover:underline">
                  {c.abbreviation}
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
