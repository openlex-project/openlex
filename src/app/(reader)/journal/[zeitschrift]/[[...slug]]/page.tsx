import { notFound } from "next/navigation";
import { buildRegistry, getJournalArticleContent } from "@/lib/registry";
import { renderMarkdown } from "@/lib/markdown";
import { JournalSidebar } from "@/components/journal-sidebar";
import Link from "next/link";

interface Props {
  params: Promise<{ zeitschrift: string; slug?: string[] }>;
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
          {journal.issn && <p className="text-sm text-gray-500 mb-6">ISSN {journal.issn}</p>}
          <div className="space-y-6">
            {journal.issues.map((iss) => (
              <section key={`${iss.year}-${iss.issue}`}>
                <h2 className="text-lg font-semibold mb-2">
                  <Link href={`${base}/${iss.year}/${iss.issue}`} className="hover:underline">
                    Heft {iss.issue}/{iss.year}
                  </Link>
                </h2>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  {iss.articles.map((a) => (
                    <li key={a.slug}>
                      <Link href={`${base}/${iss.year}/${iss.issue}/${a.slug}`} className="hover:underline">
                        {a.author}, {a.title}
                      </Link>
                      {a.pages && <span className="text-gray-400 ml-1">S. {a.pages}</span>}
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
    if (!issue) notFound();

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
                <h2 className="text-lg font-semibold text-gray-500 mb-2">{rubrik}</h2>
                <ul className="space-y-3">
                  {articles.map((a) => (
                    <li key={a.slug}>
                      <Link href={`${base}/${year}/${issueNr}/${a.slug}`} className="group block">
                        <span className="font-medium group-hover:underline">{a.title}</span>
                        <br />
                        <span className="text-sm text-gray-500">{a.author}{a.pages && `, S. ${a.pages}`}</span>
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
    const html = await renderMarkdown(md);

    // prev/next within issue
    const idx = issue.articles.indexOf(article);
    const prev = issue.articles[idx - 1];
    const next = issue.articles[idx + 1];
    const articleBase = `${base}/${year}/${issueNr}`;

    return (
      <div className="flex">
        <JournalSidebar zeitschrift={zeitschrift} title={journal.title_short ?? journal.title} issues={journal.issues} activeYear={year} activeIssue={issueNr} activeArticle={articleSlug} />
        <article className="flex-1 min-w-0 px-8 lg:px-12 py-8">
          <nav className="flex items-center justify-between text-sm mb-6 pb-3 border-b border-gray-200 dark:border-gray-700">
            {prev ? <Link href={`${articleBase}/${prev.slug}`} className="text-blue-600 hover:underline dark:text-blue-400">← {prev.author.split(" ").pop()}</Link> : <span />}
            <span className="text-gray-500 dark:text-gray-400 truncate mx-4">{article.author}</span>
            {next ? <Link href={`${articleBase}/${next.slug}`} className="text-blue-600 hover:underline dark:text-blue-400 text-right">{next.author.split(" ").pop()} →</Link> : <span />}
          </nav>
          <h1 className="text-2xl font-bold mb-1">{article.title}</h1>
          <p className="text-sm text-gray-500 mb-6">{article.author}{article.pages && ` · S. ${article.pages}`} · {journal.title_short ?? journal.title} {issueNr}/{year}</p>
          <div className="prose prose-gray dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
          <nav className="flex justify-between text-sm mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
            {prev ? <Link href={`${articleBase}/${prev.slug}`} className="text-blue-600 hover:underline dark:text-blue-400">← {prev.title}</Link> : <span />}
            {next ? <Link href={`${articleBase}/${next.slug}`} className="text-blue-600 hover:underline dark:text-blue-400 text-right">{next.title} →</Link> : <span />}
          </nav>
        </article>
      </div>
    );
  }

  notFound();
}
