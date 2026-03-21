import { notFound } from "next/navigation";
import { buildRegistry, getLawContent, getLawProvisions, findByProvision } from "@/lib/registry";
import { LawSidebar } from "@/components/law-sidebar";

interface Props {
  params: Promise<{ gesetz: string; nr: string }>;
}

export default async function LawPage({ params }: Props) {
  const { gesetz, nr } = await params;
  const registry = await buildRegistry();
  const meta = registry.laws.get(gesetz);
  if (!meta) notFound();

  const [text, provisions] = await Promise.all([
    getLawContent(meta.repo, gesetz, nr),
    getLawProvisions(meta.repo, gesetz),
  ]);
  if (!text) notFound();

  const unitLabel = meta.unit_type === "article" ? "Art." : "§";
  const provisionNr = parseInt(nr, 10);

  const commentaryLinks: { slug: string; name: string; fileSlug: string }[] = [];
  for (const book of registry.books.values()) {
    if (book.comments_on !== gesetz) continue;
    const entries = findByProvision(book.toc, provisionNr);
    for (const entry of entries) {
      commentaryLinks.push({ slug: book.slug, name: book.title_short ?? book.title, fileSlug: entry.file.replace(/\.md$/, "") });
    }
  }

  const prevNr = provisions[provisions.indexOf(provisionNr) - 1];
  const nextNr = provisions[provisions.indexOf(provisionNr) + 1];

  const navLink = (href: string, label: string, align?: "right") => (
    <a href={href} className={`hover:underline shrink-0 ${align === "right" ? "text-right" : ""}`} style={{ color: "var(--active-text)" }}>{label}</a>
  );

  return (
    <div className="flex">
      <LawSidebar gesetz={gesetz} title={meta.title_short ?? meta.title} unitLabel={unitLabel} provisions={provisions} />
      <article className="flex-1 min-w-0 px-8 lg:px-12 py-8">
        <nav className="flex items-center justify-between text-sm mb-6 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
          {prevNr !== undefined ? navLink(`/law/${gesetz}/${prevNr}`, `← ${unitLabel} ${prevNr}`) : <span />}
          {commentaryLinks.length > 0 && (
            <span className="mx-4 truncate" style={{ color: "var(--text-secondary)" }}>
              {commentaryLinks.map((c, i) => (
                <span key={`${c.slug}-${c.fileSlug}`}>
                  {i > 0 && ", "}
                  <a href={`/book/${c.slug}/${c.fileSlug}`} className="hover:underline">{c.name}</a>
                </span>
              ))}
            </span>
          )}
          {nextNr !== undefined ? navLink(`/law/${gesetz}/${nextNr}`, `${unitLabel} ${nextNr} →`, "right") : <span />}
        </nav>
        <h1 className="text-2xl font-bold mb-6">{unitLabel} {nr} {meta.title_short ?? meta.title}</h1>
        <div className="prose prose-gray dark:prose-invert max-w-none whitespace-pre-line">{text}</div>
        <nav className="flex justify-between text-sm mt-12 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
          {prevNr !== undefined ? navLink(`/law/${gesetz}/${prevNr}`, `← ${unitLabel} ${prevNr}`) : <span />}
          {nextNr !== undefined ? navLink(`/law/${gesetz}/${nextNr}`, `${unitLabel} ${nextNr} →`, "right") : <span />}
        </nav>
      </article>
    </div>
  );
}
