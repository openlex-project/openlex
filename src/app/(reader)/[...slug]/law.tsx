import { notFound } from "next/navigation";
import { getLawContent, getLawProvisions, findByProvision, findLawBreadcrumb, type ContentRegistry, type LawMeta } from "@/lib/registry";
import { SetLicense } from "@/components/license-context";
import { SidebarLaw } from "@/components/sidebar-law";

interface Props {
  registry: ContentRegistry;
  entry: LawMeta;
  rest: string[];
}

export default async function LawPage({ registry, entry: meta, rest }: Props) {
  const nr = rest[0];
  if (!nr) notFound();

  const [text, provisions] = await Promise.all([
    getLawContent(meta.repo, meta.slug, nr),
    getLawProvisions(meta.repo, meta.slug),
  ]);
  if (!text) notFound();

  const unitLabel = meta.unit_type === "article" ? "Art." : "§";
  const provisionNr = parseInt(nr, 10);

  const commentaryLinks: { slug: string; name: string; fileSlug: string }[] = [];
  for (const book of registry.books.values()) {
    if (book.comments_on !== meta.slug) continue;
    const entries = findByProvision(book.toc, provisionNr);
    for (const entry of entries) {
      commentaryLinks.push({ slug: book.slug, name: book.title_short ?? book.title, fileSlug: entry.file.replace(/\.md$/, "") });
    }
  }

  const breadcrumb = findLawBreadcrumb(meta.toc, nr);
  const prevNr = provisions[provisions.indexOf(provisionNr) - 1];
  const nextNr = provisions[provisions.indexOf(provisionNr) + 1];

  const navLink = (href: string, label: string, align?: "right") => (
    <a href={href} className={`hover:underline shrink-0 ${align === "right" ? "text-right" : ""}`} style={{ color: "var(--active-text)" }}>{label}</a>
  );

  return (
    <div className="flex">
      <SidebarLaw law={meta.slug} title={meta.title_short ?? meta.title} unitLabel={unitLabel} toc={meta.toc} provisions={provisions} activeNr={nr} />
      <article className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
        {breadcrumb.length > 1 && (
          <nav className="text-xs mb-4 flex flex-wrap gap-1" style={{ color: "var(--text-tertiary)" }} aria-label="Breadcrumb">
            <span>{meta.title_short ?? meta.title}</span>
            {breadcrumb.slice(0, -1).map((node, i) => (
              <span key={i}><span className="mx-1">›</span>{node.label}{node.title ? ` ${node.title}` : ""}</span>
            ))}
          </nav>
        )}
        <nav className="flex flex-wrap items-center justify-between gap-2 text-sm mb-6 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
          {prevNr !== undefined ? navLink(`/${meta.slug}/${prevNr}`, `← ${unitLabel} ${prevNr}`) : <span />}
          {commentaryLinks.length > 0 && (
            <span className="hidden sm:block mx-4 truncate" style={{ color: "var(--text-secondary)" }}>
              {commentaryLinks.map((c, i) => (
                <span key={`${c.slug}-${c.fileSlug}`}>
                  {i > 0 && ", "}
                  <a href={`/${c.slug}/${c.fileSlug}`} className="hover:underline">{c.name}</a>
                </span>
              ))}
            </span>
          )}
          {nextNr !== undefined ? navLink(`/${meta.slug}/${nextNr}`, `${unitLabel} ${nextNr} →`, "right") : <span />}
        </nav>
        <h1 className="text-xl sm:text-2xl font-bold mb-6">{unitLabel} {nr} {meta.title_short ?? meta.title}</h1>
        <div className="prose prose-gray dark:prose-invert max-w-none whitespace-pre-line">{text}</div>
        <nav className="flex justify-between text-sm mt-12 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
          {prevNr !== undefined ? navLink(`/${meta.slug}/${prevNr}`, `← ${unitLabel} ${prevNr}`) : <span />}
          {nextNr !== undefined ? navLink(`/${meta.slug}/${nextNr}`, `${unitLabel} ${nextNr} →`, "right") : <span />}
        </nav>
        {meta.license && <SetLicense value={meta.license} />}
      </article>
    </div>
  );
}
