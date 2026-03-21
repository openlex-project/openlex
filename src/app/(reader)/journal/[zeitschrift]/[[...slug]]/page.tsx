import { notFound, redirect } from "next/navigation";
import { buildRegistry, getJournalArticleContent, type JournalArticle } from "@/lib/registry";
import { SetLicense } from "@/components/license-context";
import { renderMarkdown } from "@/lib/markdown";
import { JournalSidebar } from "@/components/journal-sidebar";
import Link from "next/link";

interface Props {
  params: Promise<{ zeitschrift: string; slug?: string[] }>;
}

/** Format authors: "Mustermann/Beispiel" or linked with ORCID */
function authorNames(a: JournalArticle) {
  return a.authors.map((au) => au.name).join(" / ");
}

function authorLastNames(a: JournalArticle) {
  return a.authors.map((au) => au.name.split(" ").pop()).join("/");
}

function AuthorLine({ article }: { article: JournalArticle }) {
  return (
    <span>
      {article.authors.map((au, i) => (
        <span key={au.name}>
          {i > 0 && " / "}
          {au.orcid ? (
            <a href={`https://orcid.org/${au.orcid}`} target="_blank" rel="noopener" className="hover:underline">{au.name}</a>
          ) : au.name}
        </span>
      ))}
    </span>
  );
}

export default async function JournalPage({ params }: Props) {
  const { zeitschrift, slug = [] } = await params;
  const registry = await buildRegistry();
  const journal = registry.journals.get(zeitschrift);
  if (!journal) notFound();

  const base = `/journal/${zeitschrift}`;

  // /journal/{zeitschrift} — overview
  if (slug.length === 0) {
    return (
      <div className="flex">
        <JournalSidebar zeitschrift={zeitschrift} title={journal.title_short ?? journal.title} issues={journal.issues} />
        <article className="flex-1 min-w-0 px-8 lg:px-12 py-8">
          <h1 className="text-2xl font-bold mb-1">{journal.title}</h1>
          {journal.issn && <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>ISSN {journal.issn}</p>}
          <div className="space-y-6">
            {journal.issues.map((iss) => (
              <section key={`${iss.year}-${iss.issue}`}>
                <h2 className="text-lg font-semibold mb-2">
                  <Link href={`${base}/${iss.year}/${iss.issue}`} className="hover:underline">Heft {iss.issue}/{iss.year}</Link>
                </h2>
                <ul className="text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
                  {iss.articles.map((a) => (
                    <li key={a.slug}>
                      <Link href={`${base}/${iss.year}/${iss.issue}/${a.slug}`} className="hover:underline">{authorNames(a)}, {a.title}</Link>
                      {a.pages && <span className="ml-1" style={{ color: "var(--text-tertiary)" }}>S. {a.pages}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </article>
      </div>
    );
  }

  // /journal/{zeitschrift}/{year}/{issue}
  if (slug.length === 2) {
    const [year, issueNr] = slug;
    const issue = journal.issues.find((i) => i.year === year && i.issue === issueNr);

    if (!issue) {
      const page = parseInt(issueNr!, 10);
      if (isNaN(page)) notFound();
      for (const iss of journal.issues.filter((i) => i.year === year)) {
        for (const a of iss.articles) {
          if (!a.pages) continue;
          const [start, end] = a.pages.split("-").map(Number);
          if (page >= start! && page <= (end ?? start!)) redirect(`${base}/${iss.year}/${iss.issue}/${a.slug}`);
        }
      }
      notFound();
    }

    const rubriken = new Map<string, typeof issue.articles>();
    for (const a of issue.articles) {
      const list = rubriken.get(a.rubrik) ?? [];
      list.push(a);
      rubriken.set(a.rubrik, list);
    }

    return (
      <div className="flex">
        <JournalSidebar zeitschrift={zeitschrift} title={journal.title_short ?? journal.title} issues={journal.issues} activeYear={year} activeIssue={issueNr} />
        <article className="flex-1 min-w-0 px-8 lg:px-12 py-8">
          <h1 className="text-2xl font-bold mb-1">{journal.title_short ?? journal.title} Heft {issueNr}/{year}</h1>
          <div className="space-y-6 mt-6">
            {[...rubriken.entries()].map(([rubrik, articles]) => (
              <section key={rubrik}>
                <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>{rubrik}</h2>
                <ul className="space-y-3">
                  {articles.map((a) => (
                    <li key={a.slug}>
                      <Link href={`${base}/${year}/${issueNr}/${a.slug}`} className="group block">
                        <span className="font-medium group-hover:underline">{a.title}</span>
                        <br />
                        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{authorNames(a)}{a.pages && `, S. ${a.pages}`}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </article>
      </div>
    );
  }

  // /journal/{zeitschrift}/{year}/{issue}/{article}
  if (slug.length === 3) {
    const [year, issueNr, articleSlug] = slug;
    const issue = journal.issues.find((i) => i.year === year && i.issue === issueNr);
    if (!issue) notFound();
    const article = issue.articles.find((a) => a.slug === articleSlug);
    if (!article) notFound();

    const md = await getJournalArticleContent(journal.repo, year!, issueNr!, articleSlug!);
    if (!md) notFound();
    const html = await renderMarkdown(md, article.numbering ? { numbering: { schema: article.numbering } } : undefined);

    const idx = issue.articles.indexOf(article);
    const prev = issue.articles[idx - 1];
    const next = issue.articles[idx + 1];
    const articleBase = `${base}/${year}/${issueNr}`;

    return (
      <div className="flex">
        <JournalSidebar zeitschrift={zeitschrift} title={journal.title_short ?? journal.title} issues={journal.issues} activeYear={year} activeIssue={issueNr} activeArticle={articleSlug} />
        <article className="flex-1 min-w-0 px-8 lg:px-12 py-8">
          <nav className="flex items-center justify-between text-sm mb-6 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
            {prev ? <Link href={`${articleBase}/${prev.slug}`} className="hover:underline" style={{ color: "var(--active-text)" }}>← {authorLastNames(prev)}</Link> : <span />}
            <span className="truncate mx-4" style={{ color: "var(--text-secondary)" }}><AuthorLine article={article} /></span>
            {next ? <Link href={`${articleBase}/${next.slug}`} className="hover:underline text-right" style={{ color: "var(--active-text)" }}>{authorLastNames(next)} →</Link> : <span />}
          </nav>
          <h1 className="text-2xl font-bold mb-1">{article.title}</h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            <AuthorLine article={article} />
            {article.pages && ` · S. ${article.pages}`}
            {` · ${journal.title_short ?? journal.title} ${issueNr}/${year}`}
            {article.doi && (
              <> · <a href={`https://doi.org/${article.doi}`} target="_blank" rel="noopener" className="hover:underline" style={{ color: "var(--active-text)" }}>DOI: {article.doi}</a></>
            )}
          </p>
          <div className="prose prose-gray dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
          <nav className="flex justify-between text-sm mt-12 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
            {prev ? <Link href={`${articleBase}/${prev.slug}`} className="hover:underline" style={{ color: "var(--active-text)" }}>← {prev.title}</Link> : <span />}
            {next ? <Link href={`${articleBase}/${next.slug}`} className="hover:underline text-right" style={{ color: "var(--active-text)" }}>{next.title} →</Link> : <span />}
          </nav>
          <SetLicense value={journal.license} />
        </article>
      </div>
    );
  }

  notFound();
}
